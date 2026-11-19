import { isVpnSession, OctaClient } from "@octaspace/sdk"

import { API_HOST } from "./config"
import { parseProxyConfig, type ProxyEndpoint } from "./proxy"

// The one seam between the extension and the OctaSpace API: the rest of the
// code never touches the SDK.

/** A node the browser can use: it passed the check of the `http_proxy` VPN. */
export type VpnNode = {
  node_number: string
  country: string
  country_iso: string
  city: string
  /** USD per GB of traffic */
  price: number
  /** Mbit/s, 0 if not measured */
  down: number
  up: number
}

export type SessionInfo = {
  ready: boolean
  endpoint: ProxyEndpoint | null
  ip: string
  city: string
  country: string
}

export type Geo = { ip: string; city: string; country: string }

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
          up: n.net_up_mbps ?? 0
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
        country: vpn?.country ?? ""
      }
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
      return {
        ip: data.ip ?? "",
        city: data.city ?? "",
        country: data.country ?? ""
      }
    }
  }
}

export type Api = ReturnType<typeof createApi>
