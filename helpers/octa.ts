import { isVpnSession, OctaClient } from "@octaspace/sdk"

import { API_HOST } from "./config"
import type { Geo, VpnNode } from "./model"
import { parseProxyConfig, type ProxyEndpoint } from "./proxy"

// The one seam between the extension and the OctaSpace API: the rest of the
// code never touches the SDK.

export type SessionInfo = {
  ready: boolean
  endpoint: ProxyEndpoint | null
  ip: string
  city: string
  country: string
  country_iso: string
  started_at: number
  rx: number
  tx: number
  /** USD */
  charged: number
}

const PROTOCOL = "http_proxy"
const MICRO_USD = 1_000_000

export function createApi(apiKey: string) {
  const client = new OctaClient({ apiKey, baseUrl: API_HOST })

  return {
    /** Account balance in USD; may be negative. */
    async balance(): Promise<number> {
      const { balance, decimals } = await client.accounts.balance()
      return balance / 10 ** decimals
    },

    async nodes(): Promise<VpnNode[]> {
      return (await client.vpn.list())
        .filter((n) => n.protocols.includes(PROTOCOL))
        .map((n) => ({
          node_number: n.node_number,
          country: n.country ?? "Unknown",
          country_iso: (n.country_iso ?? "").toUpperCase(),
          city: n.city ?? "",
          price: n.traffic_price / MICRO_USD,
          down: n.net_down_mbps ?? 0,
          up: n.net_up_mbps ?? 0,
          lat: n.latitude ?? null,
          lon: n.longitude ?? null
        }))
    },

    /** Starts an HTTP-proxy session on the node; returns its uuid. */
    async start(nodeNumber: string): Promise<string> {
      return (
        await client.vpn.start({ node_number: nodeNumber, subkind: PROTOCOL })
      ).uuid
    },

    async info(uuid: string, signal?: AbortSignal): Promise<SessionInfo> {
      const s = await client.sessions.get(uuid, {
        retries: 0,
        ...(signal && { signal })
      })
      const vpn = isVpnSession(s) ? s : undefined
      return {
        ready: s.status === "ready",
        endpoint: parseProxyConfig(vpn?.config),
        ip: vpn?.public_ip ?? "",
        city: vpn?.city ?? "",
        country: vpn?.country ?? "",
        country_iso: (vpn?.country_iso ?? "").toUpperCase(),
        started_at: s.started_at ?? Date.now(),
        rx: vpn?.rx ?? 0,
        tx: vpn?.tx ?? 0,
        charged: (s.charge_amount ?? 0) / MICRO_USD
      }
    },

    /** The account's VPN sessions running now: their node and protocol. */
    async vpnSessions(): Promise<
      { uuid: string; node_number: string; subkind: string }[]
    > {
      return (await client.sessions.list()).filter(isVpnSession).map((s) => ({
        uuid: s.uuid,
        node_number: s.node_number ?? "",
        subkind: s.subkind ?? ""
      }))
    },

    async stop(uuid: string): Promise<void> {
      await client.sessions.stop(uuid)
    },

    /** Where the caller is, as the API sees it: not in the SDK. */
    async geo(): Promise<Geo> {
      const res = await fetch(`${API_HOST}/geo`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-OCTA-APP": "browser-extension"
        }
      })
      if (!res.ok) throw new Error(`geo ${res.status}`)
      const data = await res.json()
      const num = (v: unknown) => (typeof v === "number" ? v : null)
      return {
        ip: data.ip ?? "",
        city: data.city ?? "",
        country: data.country ?? "",
        country_iso: (data.isocode ?? "").toUpperCase(),
        lat: num(data.latitude),
        lon: num(data.longitude)
      }
    }
  }
}

export type Api = ReturnType<typeof createApi>
