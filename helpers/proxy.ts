import { IS_FIREFOX, PROXY_BYPASS } from "./config"
import { AppError } from "./errors"
import { ext } from "./platform"

export type ProxyEndpoint = { host: string; port: number }

/** Who controls the browser's proxy: us (on or off), or someone else. */
export type ProxyControl = "on" | "off" | "blocked"

export function chromeProxyConfig({ host, port }: ProxyEndpoint) {
  return {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: "http", host, port },
      bypassList: PROXY_BYPASS
    }
  }
}

export function firefoxProxyConfig({ host, port }: ProxyEndpoint) {
  return {
    proxyType: "manual",
    http: `${host}:${port}`,
    httpProxyAll: true,
    // Firefox takes a comma-separated string here, not an array
    passthrough: PROXY_BYPASS.filter((h) => h !== "<local>").join(", ")
  }
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
export async function applyProxy(endpoint: ProxyEndpoint): Promise<void> {
  if ((await readProxyControl()) === "blocked") {
    throw new AppError("proxy_blocked")
  }
  if (IS_FIREFOX) {
    await ext.proxy.settings.set({ value: firefoxProxyConfig(endpoint) })
  } else {
    await ext.proxy.settings.set({
      value: chromeProxyConfig(endpoint),
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
