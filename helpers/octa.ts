import { OctaClient } from "@octaspace/sdk"

import type { ProxyEndpoint } from "./proxy"

// The one seam between the extension and the OctaSpace API: the rest of the
// code never touches the SDK, so moving to another API version changes only
// this file.

export type SessionInfo = {
  ready: boolean
  endpoint: ProxyEndpoint | null
  ip: string
  city: string
  country: string
}

const WEI = 1e-18

export function createApi(apiKey: string) {
  const client = new OctaClient({ apiKey })

  return {
    /** Account balance in Ø. */
    async balance(): Promise<number> {
      return (await client.accounts.balance()).balance * WEI
    },

    /** Starts an HTTP-proxy session on the node; returns its uuid. */
    async start(nodeId: number): Promise<string> {
      return (
        await client.services.vpn.start({
          node_id: nodeId,
          subkind: "http_proxy"
        })
      ).uuid
    },

    async info(uuid: string, signal?: AbortSignal): Promise<SessionInfo> {
      const data = await client.services
        .session(uuid)
        .info({ retries: 0, signal })
      const cfg = data.config
      const endpoint =
        cfg && typeof cfg === "object" && "ip" in cfg && "port" in cfg
          ? { host: String(cfg.ip), port: Number(cfg.port) }
          : null
      return {
        ready: data.is_ready,
        endpoint,
        ip: data.ip ?? data.public_ip ?? "",
        city: data.city ?? "",
        country: data.country ?? ""
      }
    },

    async stop(uuid: string): Promise<void> {
      await client.services.session(uuid).stop()
    }
  }
}

export type Api = ReturnType<typeof createApi>
