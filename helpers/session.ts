// The VPN session, owned by the background: the popup closes at any click
// outside it, so a start must never depend on the popup staying open. A
// session is billed on the node until it is stopped, whatever happens to the
// browser: every uuid started is remembered until its stop succeeded.

import {
  LOW_BALANCE_USD,
  MIN_BALANCE,
  SESSION_POLL_MS,
  SESSION_READY_TIMEOUT_MS,
  STOP_RETRY_MS,
  STOP_TRIES,
  WATCHDOG_ALARM,
  WATCHDOG_PERIOD_MIN
} from "./config"
import { AppError, ERROR_TEXT, toErrorCode, type ErrorCode } from "./errors"
import {
  DEFAULT_SETTINGS,
  type SessionView,
  type Settings,
  type VpnNode
} from "./model"
import { createApi, type Api } from "./octa"
import { ext } from "./platform"
import {
  applyProxy,
  checkTunnel,
  clearProxy,
  readProxyControl,
  type ProxyEndpoint
} from "./proxy"
import { getToken, KEYS, storage } from "./storage"
import { showState, type IconState } from "./toolbar"

export type ProxyStatus =
  | "Disconnected"
  | "Connecting"
  | "Connected"
  | "Disconnecting"

export type Result = { ok: boolean; error?: ErrorCode }

let starting: AbortController | null = null

// The proxy's login for this session: in memory only, never in storage. A
// worker that restarts asks the API for it again (`proxyLogin`).
type Login = { host: string; username: string; password: string }
let login: Login | null = null

function keepLogin(endpoint: ProxyEndpoint) {
  login =
    endpoint.username && endpoint.password !== undefined
      ? {
          host: endpoint.host,
          username: endpoint.username,
          password: endpoint.password
        }
      : null
}
let queue: Promise<unknown> = Promise.resolve()

/** Runs connect/disconnect one at a time. */
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}

async function setStatus(status: ProxyStatus): Promise<void> {
  await storage.set(KEYS.proxyStatus, status)
  void showState(iconState(status))
}

async function api(): Promise<Api> {
  const token = await getToken()
  if (!token) throw new AppError("auth_expired")
  return createApi(token)
}

async function openSessions(): Promise<string[]> {
  return (await storage.get<string[]>(KEYS.openSessions)) ?? []
}

async function remember(uuid: string) {
  await storage.set(KEYS.openSessions, [
    ...new Set([...(await openSessions()), uuid])
  ])
}

async function forget(uuid: string) {
  await storage.set(
    KEYS.openSessions,
    (await openSessions()).filter((u) => u !== uuid)
  )
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Stops a session, a few tries on network errors. One gone on the node is
 * stopped already; one that keeps failing stays remembered for the next start.
 */
async function stopSession(client: Api, uuid: string): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await client.stop(uuid)
      return forget(uuid)
    } catch (err) {
      const code = toErrorCode(err)
      if (code === "node_unavailable") return forget(uuid)
      if (code === "auth_expired" || attempt >= STOP_TRIES) {
        console.warn("Stopping session deferred:", code)
        return
      }
      await wait(STOP_RETRY_MS)
    }
  }
}

/** Stops every session we started and did not see stopped. */
async function stopOpenSessions(client: Api): Promise<void> {
  for (const uuid of await openSessions()) await stopSession(client, uuid)
  await storage.set(KEYS.uuid, "")
}

/**
 * The API allows one VPN session per account and node. The browser's own one
 * already there (a crash, another profile) is taken over: its login comes
 * with /info. Another app's session on that node is not stopped for it.
 */
async function startOrAdopt(client: Api, nodeId: string): Promise<string> {
  const onNode = (await client.vpnSessions()).filter(
    (s) => s.node_number === nodeId
  )
  const ours = onNode.find((s) => s.subkind === "http_proxy")
  if (ours) return ours.uuid
  if (onNode.length > 0) throw new AppError("session_exists")
  return client.start(nodeId)
}

/** A notification of its own: the popup is closed when the background acts. */
function alert(message: string) {
  ext.notifications?.create({
    type: "basic",
    iconUrl: ext.runtime.getURL(ext.runtime.getManifest().icons?.["128"] ?? ""),
    title: "Octa VPN",
    message
  })
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

async function readBalance(client: Api): Promise<number> {
  const balance = await client.balance()
  await storage.set(KEYS.balance, balance)
  return balance
}

/**
 * The session until it is ready. A 404 is a session that stopped (its start
 * failed on the node); any other error is a blip, polled through until the
 * deadline.
 */
async function waitReady(client: Api, uuid: string, signal: AbortSignal) {
  const deadline = Date.now() + SESSION_READY_TIMEOUT_MS
  for (;;) {
    try {
      const info = await client.info(uuid, signal)
      if (info.ready) return info
    } catch (err) {
      signal.throwIfAborted()
      const code = toErrorCode(err)
      if (code === "node_unavailable" || code === "auth_expired") throw err
    }
    if (Date.now() + SESSION_POLL_MS > deadline)
      throw new AppError("node_unavailable")
    await sleep(SESSION_POLL_MS, signal)
  }
}

async function teardown(error?: ErrorCode): Promise<void> {
  if ((await storage.get<ProxyStatus>(KEYS.proxyStatus)) !== "Disconnected") {
    await setStatus("Disconnecting")
  }
  await clearProxy()
  login = null
  // nothing to stop on a fresh install or after sign-out: no API call, no key needed
  if ((await openSessions()).length > 0) {
    try {
      await stopOpenSessions(await api())
    } catch (err) {
      // kept in the list: stopped before the next start
      console.warn("Stopping sessions deferred:", toErrorCode(err))
    }
  }
  await storage.set(KEYS.uuid, "")
  await storage.remove(KEYS.session)
  await storage.set(KEYS.lastError, error ?? "")
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
  // the node as listed: its price and place
  const node = ((await storage.get<VpnNode[]>(KEYS.nodes)) ?? []).find(
    (n) => n.node_number === nodeId
  )
  // the API asks for at least 1 GB of the node's traffic
  const balance = await readBalance(client)
  if (balance < Math.max(MIN_BALANCE, node?.price ?? 0)) {
    throw new AppError("low_balance")
  }

  await setStatus("Connecting")
  const uuid = await startOrAdopt(client, nodeId)
  await remember(uuid)
  await storage.set(KEYS.uuid, uuid)

  const info = await waitReady(client, uuid, signal)
  if (!info.endpoint) throw new AppError("node_unavailable")
  signal.throwIfAborted()

  try {
    const settings =
      (await storage.get<Settings>(KEYS.settings)) ?? DEFAULT_SETTINGS
    keepLogin(info.endpoint)
    await applyProxy(info.endpoint, settings.bypassSites)
  } catch (err) {
    throw err instanceof AppError ? err : new AppError("proxy_failed")
  }
  // Connected means traffic gets through, not only that the node is ready
  // (Chrome checked it before routing the whole browser; check it again).
  if (!(await checkTunnel())) throw new AppError("node_unavailable")
  signal.throwIfAborted()
  const view: SessionView = {
    node_number: nodeId,
    ip: info.ip,
    city: info.city || node?.city || "",
    country: info.country || node?.country || "",
    country_iso: info.country_iso || node?.country_iso || "",
    lat: node?.lat ?? null,
    lon: node?.lon ?? null,
    price: node?.price ?? 0,
    started_at: info.started_at,
    rx: info.rx,
    tx: info.tx,
    charged: info.charged,
    start_balance: balance,
    warned: false
  }
  await storage.set(KEYS.session, view)
  await storage.set(KEYS.lastError, "")
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
      if ((await storage.get<ProxyStatus>(KEYS.proxyStatus)) !== "Disconnected")
        await teardown()
      await startSession(nodeId, ctrl.signal)
      return { ok: true } as const
    } catch (err) {
      const error = ctrl.signal.aborted ? "cancelled" : toErrorCode(err)
      await teardown(error === "cancelled" ? undefined : error)
      if (error === "auth_expired") await storage.set(KEYS.authExpired, true)
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
    const status = await storage.get<ProxyStatus>(KEYS.proxyStatus)
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

    const uuid = await storage.get<string>(KEYS.uuid)
    if (!uuid) return teardown()
    try {
      const client = await api()
      const info = await client.info(uuid)
      const settings =
        (await storage.get<Settings>(KEYS.settings)) ?? DEFAULT_SETTINGS
      const view = await storage.get<SessionView>(KEYS.session)
      if (view) {
        await storage.set(KEYS.session, {
          ...view,
          rx: info.rx,
          tx: info.tx,
          charged: info.charged
        })
      }
      if (settings.spendLimit > 0 && info.charged >= settings.spendLimit) {
        return stopBecause("spend_limit")
      }
      const balance = await readBalance(client)
      // the platform stops it at $0.01 itself: stop first, and say why
      if (balance < MIN_BALANCE) return stopBecause("low_balance")
      if (
        view &&
        !view.warned &&
        settings.lowBalanceWarning &&
        isLow(balance, view.start_balance)
      ) {
        await storage.set(KEYS.session, { ...view, warned: true })
        alert(
          `Balance is running low: $${Math.max(0, balance).toFixed(2)} left.`
        )
      }
    } catch (err) {
      const code = toErrorCode(err)
      if (code === "node_unavailable") await stopBecause("session_ended")
      else if (code === "auth_expired") {
        await teardown("auth_expired")
        await storage.set(KEYS.authExpired, true)
      }
      // a network blip: keep the session, the next tick checks again
    }
  })
}

/** The background ends the session on its own: say why, popup open or not. */
async function stopBecause(code: ErrorCode): Promise<void> {
  await teardown(code)
  alert(ERROR_TEXT[code])
}

/** Below $0.25, or below 10% of the balance at the start, whichever is higher. */
export function isLow(balance: number, startBalance: number): boolean {
  return balance < Math.max(LOW_BALANCE_USD, startBalance * 0.1)
}

/**
 * The login the node's proxy asks for (407), when the session up has one:
 * from memory, or from the API after the worker restarted.
 */
export async function proxyLogin(challenger: string): Promise<Login | null> {
  if (
    !login &&
    (await storage.get<ProxyStatus>(KEYS.proxyStatus)) === "Connected"
  ) {
    const uuid = await storage.get<string>(KEYS.uuid)
    try {
      const info = uuid ? await (await api()).info(uuid) : null
      if (info?.endpoint) keepLogin(info.endpoint)
    } catch (err) {
      console.warn("Proxy login unavailable:", toErrorCode(err))
    }
  }
  return login && login.host === challenger ? login : null
}

export const iconState = (status?: ProxyStatus | null): IconState =>
  status === "Connected"
    ? "on"
    : status === "Connecting" || status === "Disconnecting"
    ? "busy"
    : "off"
