// The VPN session, owned by the background: the popup closes at any click
// outside it, so a start must never depend on the popup staying open. A
// session is billed on the node until it is stopped, whatever happens to the
// browser: every uuid started is remembered until its stop succeeded.

import {
  MIN_BALANCE,
  SESSION_POLL_MS,
  SESSION_READY_TIMEOUT_MS,
  WATCHDOG_ALARM,
  WATCHDOG_PERIOD_MIN
} from "./config"
import { AppError, toErrorCode, type ErrorCode } from "./errors"
import { createApi, type Api } from "./octa"
import { ext, toolbarAction } from "./platform"
import { applyProxy, clearProxy, readProxyControl } from "./proxy"
import { getToken, storage } from "./storage"

export type ProxyStatus =
  | "Disconnected"
  | "Connecting"
  | "Connected"
  | "Disconnecting"

export type Result = { ok: boolean; error?: ErrorCode }

const OPEN_SESSIONS = "openSessions"

let starting: AbortController | null = null
let queue: Promise<unknown> = Promise.resolve()

/** Runs connect/disconnect one at a time. */
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}

async function setStatus(status: ProxyStatus): Promise<void> {
  await storage.set("proxyStatus", status)
  toolbarAction?.setBadgeText({ text: status === "Connected" ? "ON" : "" })
  toolbarAction?.setBadgeBackgroundColor({ color: "#2f9e44" })
}

async function api(): Promise<Api> {
  const token = await getToken()
  if (!token) throw new AppError("auth_expired")
  return createApi(token)
}

async function openSessions(): Promise<string[]> {
  return (await storage.get<string[]>(OPEN_SESSIONS)) ?? []
}

async function remember(uuid: string) {
  await storage.set(OPEN_SESSIONS, [
    ...new Set([...(await openSessions()), uuid])
  ])
}

async function forget(uuid: string) {
  await storage.set(
    OPEN_SESSIONS,
    (await openSessions()).filter((u) => u !== uuid)
  )
}

/** Stops every session we started and did not see stopped. */
async function stopOpenSessions(client: Api): Promise<void> {
  for (const uuid of await openSessions()) {
    try {
      await client.stop(uuid)
      await forget(uuid)
    } catch (err) {
      // already gone on the node: nothing left to bill
      if (toErrorCode(err) === "node_unavailable") await forget(uuid)
      else console.error("Stopping session failed:", toErrorCode(err))
    }
  }
  await storage.set("uuid", "")
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true }
    )
  })

async function balanceOk(client: Api): Promise<boolean> {
  const balance = await client.balance()
  await storage.set("balance", balance.toFixed(2))
  return balance >= MIN_BALANCE
}

async function teardown(error?: ErrorCode): Promise<void> {
  if ((await storage.get<ProxyStatus>("proxyStatus")) !== "Disconnected") {
    await setStatus("Disconnecting")
  }
  await clearProxy()
  // nothing to stop on a fresh install or after sign-out: no API call, no key needed
  if ((await openSessions()).length > 0) {
    try {
      await stopOpenSessions(await api())
    } catch (err) {
      // kept in the list: stopped before the next start
      console.warn("Stopping sessions deferred:", toErrorCode(err))
    }
  }
  await storage.set("uuid", "")
  await storage.set("lastError", error ?? "")
  await setStatus("Disconnected")
  ext.alarms.clear(WATCHDOG_ALARM)
}

async function startSession(
  nodeId: string,
  signal: AbortSignal
): Promise<void> {
  if (!nodeId) throw new AppError("no_node")
  if (
    process.env.PLASMO_BROWSER === "firefox" &&
    !(await ext.extension.isAllowedIncognitoAccess())
  ) {
    // Firefox lets an extension set the proxy only with private-window access
    throw new AppError("incognito_required")
  }
  const client = await api()
  await stopOpenSessions(client)
  if (!(await balanceOk(client))) throw new AppError("low_balance")

  await setStatus("Connecting")
  const uuid = await client.start(nodeId)
  await remember(uuid)
  await storage.set("uuid", uuid)

  const deadline = Date.now() + SESSION_READY_TIMEOUT_MS
  let info = await client.info(uuid, signal)
  while (!info.ready) {
    if (Date.now() > deadline) throw new AppError("node_unavailable")
    await sleep(SESSION_POLL_MS, signal)
    info = await client.info(uuid, signal)
  }
  if (!info.endpoint) throw new AppError("node_unavailable")
  signal.throwIfAborted()

  try {
    await applyProxy(info.endpoint)
  } catch (err) {
    throw err instanceof AppError ? err : new AppError("proxy_failed")
  }
  await Promise.all([
    storage.set("ipConnected", info.ip),
    storage.set("cityConnected", info.city),
    storage.set("countryConnected", info.country),
    storage.set("lastError", "")
  ])
  await setStatus("Connected")
  ext.alarms.create(WATCHDOG_ALARM, { periodInMinutes: WATCHDOG_PERIOD_MIN })
}

/** Connects to the node, replacing any session up. */
export function connect(nodeId: string): Promise<Result> {
  starting?.abort()
  return serial(async () => {
    const ctrl = new AbortController()
    starting = ctrl
    try {
      if ((await storage.get<ProxyStatus>("proxyStatus")) !== "Disconnected")
        await teardown()
      await startSession(nodeId, ctrl.signal)
      return { ok: true } as const
    } catch (err) {
      const error = ctrl.signal.aborted ? "cancelled" : toErrorCode(err)
      await teardown(error === "cancelled" ? undefined : error)
      if (error === "auth_expired") await storage.set("authExpired", true)
      return { ok: false, error } as const
    } finally {
      if (starting === ctrl) starting = null
    }
  })
}

/** Disconnects, cancelling a start under way. */
export function disconnect(): Promise<Result> {
  starting?.abort()
  return serial(async () => {
    await teardown()
    return { ok: true } as const
  })
}

/**
 * Whether the session is still up as the browser and the API see it: on a
 * browser start, a service-worker wake, every watchdog tick and proxy error.
 */
export function check(): Promise<void> {
  return serial(async () => {
    const status = await storage.get<ProxyStatus>("proxyStatus")
    const control = await readProxyControl()
    if (status !== "Connected") {
      // a start or stop cut short when the worker died
      if (
        control === "on" ||
        (await openSessions()).length > 0 ||
        status !== "Disconnected"
      ) {
        await teardown()
      }
      return
    }
    if (control !== "on") return teardown("proxy_blocked")

    const uuid = await storage.get<string>("uuid")
    if (!uuid) return teardown()
    try {
      const client = await api()
      await client.info(uuid)
      if (!(await balanceOk(client))) await teardown("low_balance")
    } catch (err) {
      const code = toErrorCode(err)
      if (code === "node_unavailable") await teardown("session_ended")
      else if (code === "auth_expired") {
        await teardown("auth_expired")
        await storage.set("authExpired", true)
      }
      // a network blip: keep the session, the next tick checks again
    }
  })
}
