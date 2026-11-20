import { beforeEach, describe, expect, it, vi } from "vitest"

// In-memory stand-ins for the browser and the API.
const store = new Map<string, unknown>()
const EMPTY = {
  ready: false,
  endpoint: null,
  ip: "",
  city: "",
  country: "",
  country_iso: "",
  started_at: 0,
  rx: 0,
  tx: 0,
  charged: 0
}
const proxy = { on: false }
const api = {
  balance: vi.fn(async () => 1),
  start: vi.fn(async () => "uuid-1"),
  info: vi.fn(async () => ({
    ready: true,
    endpoint: { host: "203.0.113.7", port: 3128 },
    ip: "203.0.113.7",
    city: "Berlin",
    country: "Germany",
    country_iso: "DE",
    started_at: 0,
    rx: 0,
    tx: 0,
    charged: 0
  })),
  stop: vi.fn(async () => {}),
  vpnSessions: vi.fn(
    async (): Promise<
      { uuid: string; node_number: string; subkind: string }[]
    > => []
  )
}

vi.mock("~helpers/storage", async (importOriginal) => ({
  KEYS: ((await importOriginal()) as { KEYS: object }).KEYS,
  storage: {
    get: async (k: string) => store.get(k),
    set: async (k: string, v: unknown) => void store.set(k, v),
    remove: async (k: string) => void store.delete(k)
  },
  getToken: async () => "token"
}))
vi.mock("~helpers/octa", () => ({ createApi: () => api }))
const notify = vi.fn()
vi.mock("~helpers/platform", () => ({
  ext: {
    alarms: { create: vi.fn(), clear: vi.fn() },
    extension: { isAllowedIncognitoAccess: async () => true },
    notifications: { create: (o: { message: string }) => notify(o.message) },
    runtime: { getURL: (p: string) => p, getManifest: () => ({ icons: {} }) }
  },
  toolbarAction: undefined
}))
// no waiting between polls and retries in tests
vi.mock("~helpers/config", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  SESSION_POLL_MS: 1,
  STOP_RETRY_MS: 1
}))
vi.mock("~helpers/proxy", () => ({
  applyProxy: vi.fn(async () => void (proxy.on = true)),
  clearProxy: vi.fn(async () => void (proxy.on = false)),
  readProxyControl: async () => (proxy.on ? "on" : "off")
}))

const { check, connect, disconnect } = await import("~helpers/session")
const { OctaNotFoundError } = await import("@octaspace/sdk")

beforeEach(() => {
  store.clear()
  store.set("proxyStatus", "Disconnected")
  proxy.on = false
  vi.clearAllMocks()
})

describe("session", () => {
  it("connects: session started, proxy on, status Connected", async () => {
    expect(await connect("7KQ4-M2XD-4")).toEqual({ ok: true })
    expect(api.start).toHaveBeenCalledWith("7KQ4-M2XD-4")
    expect(proxy.on).toBe(true)
    expect(store.get("proxyStatus")).toBe("Connected")
    expect(store.get("openSessions")).toEqual(["uuid-1"])
    expect(store.get("session")).toMatchObject({
      node_number: "7KQ4-M2XD-4",
      ip: "203.0.113.7"
    })
  })

  it("refuses a low balance before starting anything", async () => {
    api.balance.mockResolvedValueOnce(0)
    expect(await connect("7KQ4-M2XD-4")).toEqual({
      ok: false,
      error: "low_balance"
    })
    expect(api.start).not.toHaveBeenCalled()
    expect(store.get("proxyStatus")).toBe("Disconnected")
  })

  it("a node that never gets ready: the session is stopped, not left billing", async () => {
    api.info.mockResolvedValueOnce({ ...EMPTY, ready: true })
    expect(await connect("7KQ4-M2XD-4")).toEqual({
      ok: false,
      error: "node_unavailable"
    })
    expect(api.stop).toHaveBeenCalledWith("uuid-1")
    expect(store.get("openSessions")).toEqual([])
    expect(proxy.on).toBe(false)
  })

  it("disconnect during a start cancels it and stops the session", async () => {
    let release!: () => void
    api.info.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ...EMPTY, ready: false })
        })
    )
    const pending = connect("7KQ4-M2XD-4")
    await vi.waitFor(() => expect(api.info).toHaveBeenCalled())
    const stopped = disconnect()
    release()
    expect(await pending).toEqual({ ok: false, error: "cancelled" })
    await stopped
    expect(api.stop).toHaveBeenCalledWith("uuid-1")
    expect(proxy.on).toBe(false)
    expect(store.get("proxyStatus")).toBe("Disconnected")
  })

  it("a stop is retried a few times on network errors", async () => {
    await connect("7KQ4-M2XD-4")
    api.stop.mockRejectedValueOnce(new Error("offline"))
    await disconnect()
    expect(api.stop).toHaveBeenCalledTimes(2)
    expect(store.get("openSessions")).toEqual([])
  })

  it("a stop that keeps failing is retried before the next start", async () => {
    await connect("7KQ4-M2XD-4")
    api.stop
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
    await disconnect()
    expect(store.get("openSessions")).toEqual(["uuid-1"])
    api.start.mockResolvedValueOnce("uuid-2")
    await connect("3HW9-P6TR-8")
    expect(api.stop).toHaveBeenLastCalledWith("uuid-1")
    expect(store.get("openSessions")).toEqual(["uuid-2"])
  })

  it("watchdog: a session gone on the node takes the proxy down", async () => {
    await connect("7KQ4-M2XD-4")
    api.info.mockRejectedValueOnce(
      new OctaNotFoundError("Session not found", 404)
    )
    await check()
    expect(proxy.on).toBe(false)
    expect(store.get("proxyStatus")).toBe("Disconnected")
    expect(store.get("lastError")).toBe("session_ended")
  })

  it("worker restarted mid-connect: the leftover is cleaned up", async () => {
    store.set("proxyStatus", "Connecting")
    store.set("openSessions", ["uuid-9"])
    await check()
    expect(api.stop).toHaveBeenCalledWith("uuid-9")
    expect(store.get("proxyStatus")).toBe("Disconnected")
  })
})

describe("fresh install", () => {
  it("first worker start settles to Disconnected without calling the API", async () => {
    store.clear()
    await check()
    expect(store.get("proxyStatus")).toBe("Disconnected")
    expect(api.stop).not.toHaveBeenCalled()
    expect(api.info).not.toHaveBeenCalled()
  })
})

describe("start and watch", () => {
  const node = {
    node_number: "7KQ4-M2XD-4",
    price: 2,
    country: "Germany",
    city: "",
    country_iso: "DE",
    down: 0,
    up: 0,
    lat: null,
    lon: null
  }

  it("refuses a balance below 1 GB of the node", async () => {
    store.set("nodes", [node])
    api.balance.mockResolvedValueOnce(1)
    expect(await connect("7KQ4-M2XD-4")).toEqual({
      ok: false,
      error: "low_balance"
    })
    expect(api.start).not.toHaveBeenCalled()
  })

  it("a network blip while the node starts does not end the start", async () => {
    api.info
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ...EMPTY, ready: false })
    expect(await connect("7KQ4-M2XD-4")).toEqual({ ok: true })
    expect(api.info).toHaveBeenCalledTimes(3)
  })

  it("the spending limit stops the session and says so", async () => {
    store.set("settings", {
      spendLimit: 0.5,
      lowBalanceWarning: true,
      bypassSites: [],
      theme: "system"
    })
    await connect("7KQ4-M2XD-4")
    api.info.mockResolvedValueOnce({ ...EMPTY, ready: true, charged: 0.5 })
    await check()
    expect(store.get("proxyStatus")).toBe("Disconnected")
    expect(store.get("lastError")).toBe("spend_limit")
    expect(notify).toHaveBeenCalledWith(expect.stringMatching(/spending limit/))
  })

  it("warns once when the balance runs low", async () => {
    await connect("7KQ4-M2XD-4")
    api.balance.mockResolvedValue(0.2)
    await check()
    await check()
    api.balance.mockResolvedValue(1)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith(expect.stringMatching(/running low/))
    expect(store.get("proxyStatus")).toBe("Connected")
  })
})

describe("isLow", () => {
  it("below $0.25 or 10% of the start", async () => {
    const { isLow } = await import("~helpers/session")
    expect(isLow(0.2, 1)).toBe(true)
    expect(isLow(0.3, 1)).toBe(false)
    expect(isLow(4, 50)).toBe(true)
  })
})

describe("proxy login", () => {
  it("is kept in memory for the node that asks, and dropped on disconnect", async () => {
    const { proxyLogin } = await import("~helpers/session")
    api.info.mockResolvedValue({
      ...EMPTY,
      ready: true,
      endpoint: {
        host: "203.0.113.7",
        port: 3128,
        username: "u1",
        password: "secret"
      }
    } as any)
    await connect("7KQ4-M2XD-4")
    expect(await proxyLogin("203.0.113.7")).toMatchObject({
      username: "u1",
      password: "secret"
    })
    expect(await proxyLogin("198.51.100.1")).toBeNull()
    expect(JSON.stringify([...store.values()])).not.toContain("secret")
    await disconnect()
    expect(await proxyLogin("203.0.113.7")).toBeNull()
    api.info.mockReset()
  })
})

describe("one VPN session per node", () => {
  it("takes over the browser's own session already on the node", async () => {
    api.vpnSessions.mockResolvedValueOnce([
      { uuid: "uuid-old", node_number: "7KQ4-M2XD-4", subkind: "http_proxy" }
    ])
    expect(await connect("7KQ4-M2XD-4")).toEqual({ ok: true })
    expect(api.start).not.toHaveBeenCalled()
    expect(store.get("uuid")).toBe("uuid-old")
  })

  it("leaves another app's session alone and says why", async () => {
    api.vpnSessions.mockResolvedValueOnce([
      { uuid: "uuid-wg", node_number: "7KQ4-M2XD-4", subkind: "wg" }
    ])
    expect(await connect("7KQ4-M2XD-4")).toEqual({
      ok: false,
      error: "session_exists"
    })
    expect(api.start).not.toHaveBeenCalled()
    expect(api.stop).not.toHaveBeenCalledWith("uuid-wg")
  })
})
