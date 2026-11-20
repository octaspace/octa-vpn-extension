import { IS_FIREFOX, PROXY_BYPASS } from "./config"
import { AppError } from "./errors"
import { ext, type AuthDetails, type AuthResponse } from "./platform"

/** Where the node's proxy listens, and the login of this session. */
export type ProxyEndpoint = {
  host: string
  port: number
  username?: string
  password?: string
}

/**
 * The session's `config` for `http_proxy`, in any of the shapes the API may
 * send: `{ip|host, port, username, password}`, the same as a JSON string, or
 * `http://user:pass@host:port` / `host:port`. Anything else is no endpoint.
 * It carries a password: never log it.
 */
export function parseProxyConfig(config: unknown): ProxyEndpoint | null {
  if (typeof config === "string" && config.trim().startsWith("{")) {
    try {
      return parseProxyConfig(JSON.parse(config))
    } catch {
      return null
    }
  }
  let host: unknown
  let port: unknown
  let username: unknown
  let password: unknown
  if (config && typeof config === "object") {
    const c = config as Record<string, unknown>
    host = c.ip ?? c.host
    port = c.port
    username = c.username ?? c.user ?? c.login
    password = c.password ?? c.pass
  } else if (typeof config === "string") {
    const m =
      /^(?:https?:\/\/)?(?:([^:@\s/]+):([^@\s/]*)@)?(\[[0-9a-f:]+\]|[^\s:/@]+):(\d{1,5})\/?$/i.exec(
        config.trim()
      )
    if (m) {
      username = m[1] && decodeURIComponent(m[1])
      password = m[2] && decodeURIComponent(m[2])
      host = m[3]
      port = m[4]
    }
  }
  const p = Number(port)
  if (
    typeof host !== "string" ||
    !host ||
    !Number.isInteger(p) ||
    p < 1 ||
    p > 65535
  ) {
    return null
  }
  const endpoint: ProxyEndpoint = {
    host: host.replace(/^\[|\]$/g, ""),
    port: p
  }
  if (
    typeof username === "string" &&
    username &&
    typeof password === "string"
  ) {
    endpoint.username = username
    endpoint.password = password
  }
  return endpoint
}

/** Who controls the browser's proxy: us (on or off), or someone else. */
export type ProxyControl = "on" | "off" | "blocked"

export function chromeProxyConfig(
  { host, port }: ProxyEndpoint,
  extra: string[] = []
) {
  return {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: "http", host, port },
      bypassList: bypassList(extra)
    }
  }
}

export function firefoxProxyConfig(
  { host, port }: ProxyEndpoint,
  extra: string[] = []
) {
  return {
    proxyType: "manual",
    http: `${host}:${port}`,
    httpProxyAll: true,
    // Firefox takes a comma-separated string here, not an array
    passthrough: bypassList(extra)
      .filter((h) => h !== "<local>")
      .join(", ")
  }
}

/**
 * A site the user sends direct: a host name, without scheme or path, and its
 * subdomains (`bank.example` and `*.bank.example`).
 */
export function normalizeSite(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^\*\./, "")
    .split(/[/?#:]/)[0]
  return /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(host)
    ? host
    : null
}

function bypassList(extra: string[]): string[] {
  const sites = extra.flatMap((s) => {
    const host = normalizeSite(s)
    return host ? [host, `*.${host}`] : []
  })
  return [...PROXY_BYPASS, ...sites]
}

const OURS = new Set([
  "controlled_by_this_extension",
  "controllable_by_this_extension"
])

export function proxyControl(
  levelOfControl: string,
  value: Record<string, any>
): ProxyControl {
  if (!OURS.has(levelOfControl)) return "blocked"
  if (levelOfControl !== "controlled_by_this_extension") return "off"
  const on = IS_FIREFOX
    ? value?.proxyType === "manual"
    : value?.mode === "fixed_servers"
  return on ? "on" : "off"
}

export async function readProxyControl(): Promise<ProxyControl> {
  const { levelOfControl, value } = await ext.proxy.settings.get({})
  return proxyControl(levelOfControl, value)
}

/** Routes the browser through the node; throws when the browser refuses. */
export async function applyProxy(
  endpoint: ProxyEndpoint,
  extra: string[] = []
): Promise<void> {
  if ((await readProxyControl()) === "blocked") {
    throw new AppError("proxy_blocked")
  }
  if (!IS_FIREFOX && !(await warmUp(endpoint))) {
    await clearProxy()
    throw new AppError("node_unavailable")
  }
  if (IS_FIREFOX) {
    await ext.proxy.settings.set({ value: firefoxProxyConfig(endpoint, extra) })
  } else {
    await ext.proxy.settings.set({
      value: chromeProxyConfig(endpoint, extra),
      scope: "regular"
    })
  }
  await setWebRtcProtection(true)
}

/** Back to a direct connection; never throws. */
export async function clearProxy(): Promise<void> {
  try {
    await ext.proxy.settings.clear(IS_FIREFOX ? {} : { scope: "regular" })
  } catch (err) {
    console.error("Clearing the proxy failed:", (err as Error)?.message)
  }
  await setWebRtcProtection(false)
}

/**
 * An HTTP proxy does not carry WebRTC's UDP: without this policy any site can
 * read the user's real address through WebRTC while the VPN is on.
 */
async function setWebRtcProtection(on: boolean): Promise<void> {
  const policy = ext.privacy?.network?.webRTCIPHandlingPolicy
  if (!policy) return
  try {
    if (on) await policy.set({ value: "disable_non_proxied_udp" })
    else await policy.clear({})
  } catch (err) {
    console.error("WebRTC policy change failed:", (err as Error)?.message)
  }
}

export function onProxyError(cb: () => void): void {
  ext.proxy.onProxyError?.addListener((d) => {
    if (d.fatal) cb()
  })
  ext.proxy.onError?.addListener(() => cb())
}

/**
 * Answers the node's 407 with the session's login. A request asked twice got
 * a wrong login: it is cancelled rather than asked about forever.
 */
export function onProxyAuth(
  loginFor: (
    challenger: string
  ) => Promise<{ username: string; password: string } | null>
): void {
  const asked = new Set<string>()
  const answer = async (d: AuthDetails): Promise<AuthResponse> => {
    if (!d.isProxy || !d.challenger) return {}
    if (asked.has(d.requestId)) return { cancel: true }
    asked.add(d.requestId)
    setTimeout(() => asked.delete(d.requestId), 60_000)
    const login = await loginFor(d.challenger.host)
    return login
      ? {
          authCredentials: {
            username: login.username,
            password: login.password
          }
        }
      : {}
  }
  const filter = { urls: ["<all_urls>"] }
  if (IS_FIREFOX) {
    // Firefox: a blocking listener may return a promise
    ext.webRequest?.onAuthRequired.addListener((d) => answer(d), filter, [
      "blocking"
    ])
  } else {
    // Chrome MV3: the answer goes to a callback (webRequestAuthProvider)
    ext.webRequest?.onAuthRequired.addListener(
      (d, callback) => void answer(d).then(callback),
      filter,
      ["asyncBlocking"]
    )
  }
}

// A tiny response through the node, outside the bypass list.
const TUNNEL_CHECK_HOST = "www.gstatic.com"
const TUNNEL_CHECK_URL = `https://${TUNNEL_CHECK_HOST}/generate_204`

/** Only the check goes through the node; everything else stays direct. */
export function warmUpPac({ host, port }: ProxyEndpoint): string {
  return `function FindProxyForURL(url, host) {
  return host === ${JSON.stringify(TUNNEL_CHECK_HOST)} ? ${JSON.stringify(
    `PROXY ${host}:${port}`
  )} : "DIRECT";
}`
}

/**
 * Chrome: the proxy's login is answered for requests this extension sees,
 * then kept in the browser's cache. A tab already open (the new tab page
 * above all) sends requests the extension cannot see: if one met the proxy
 * before the cache had the login, the browser would ask the user. So the
 * check runs first with only itself routed to the node, and the whole
 * browser follows once the login is cached.
 */
async function warmUp(endpoint: ProxyEndpoint): Promise<boolean> {
  await ext.proxy.settings.set({
    value: { mode: "pac_script", pacScript: { data: warmUpPac(endpoint) } },
    scope: "regular"
  })
  return checkTunnel()
}

/**
 * One request through the node, from the extension itself: it proves the
 * tunnel works, and the proxy's login it answers stays in the browser's
 * cache. Requests the extension cannot see (the new tab page, the browser's
 * own) then get the login from that cache instead of asking the user.
 */
export async function checkTunnel(timeoutMs = 15_000): Promise<boolean> {
  try {
    const res = await fetch(TUNNEL_CHECK_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    })
    return res.status === 204 || res.ok
  } catch {
    return false
  }
}
