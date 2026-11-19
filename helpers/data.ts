import { NODES_TTL_MS } from "./config"
import { AppError } from "./errors"
import { createApi } from "./octa"
import { getToken, KEYS, storage } from "./storage"

/**
 * What the popup shows on open: the balance and the real location every
 * time, the node list when it is older than its TTL (or `force`). Throws
 * like the API does; an expired key is an `OctaAuthenticationError`.
 */
export async function refreshData(force = false): Promise<void> {
  const token = await getToken()
  if (!token) throw new AppError("auth_expired")
  const api = createApi(token)

  const nodesAt = (await storage.get<number>(KEYS.nodesAt)) ?? 0
  const stale = force || Date.now() - nodesAt > NODES_TTL_MS

  const [balance, geo, nodes] = await Promise.all([
    api.balance(),
    api.geo().catch(() => null), // a location is nice to have, never required
    stale ? api.nodes() : null
  ])
  await storage.set(KEYS.balance, balance)
  if (geo) await storage.set(KEYS.geo, geo)
  if (nodes) {
    await storage.set(KEYS.nodes, nodes)
    await storage.set(KEYS.nodesAt, Date.now())
  }
}
