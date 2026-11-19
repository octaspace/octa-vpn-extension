import { describe, expect, it } from "vitest"

import { PROXY_BYPASS } from "~helpers/config"
import {
  chromeProxyConfig,
  firefoxProxyConfig,
  proxyControl
} from "~helpers/proxy"

const endpoint = { host: "203.0.113.7", port: 3128 }

describe("proxy configs", () => {
  it("Chrome: fixed HTTP proxy with our hosts bypassed", () => {
    expect(chromeProxyConfig(endpoint)).toEqual({
      mode: "fixed_servers",
      rules: {
        singleProxy: { scheme: "http", host: "203.0.113.7", port: 3128 },
        bypassList: PROXY_BYPASS
      }
    })
  })

  it("Firefox: host:port and a comma-separated passthrough string", () => {
    const cfg = firefoxProxyConfig(endpoint)
    expect(cfg.http).toBe("203.0.113.7:3128")
    expect(cfg.httpProxyAll).toBe(true)
    expect(typeof cfg.passthrough).toBe("string")
    expect(cfg.passthrough).toContain("api.octa.space")
    expect(cfg.passthrough).not.toContain("<local>")
  })
})

describe("proxyControl (Chrome)", () => {
  it("on only when this extension set fixed servers", () => {
    expect(
      proxyControl("controlled_by_this_extension", { mode: "fixed_servers" })
    ).toBe("on")
    expect(
      proxyControl("controlled_by_this_extension", { mode: "direct" })
    ).toBe("off")
  })

  it("someone else's fixed servers are not ours", () => {
    expect(
      proxyControl("controllable_by_this_extension", { mode: "fixed_servers" })
    ).toBe("off")
    expect(
      proxyControl("controlled_by_other_extensions", { mode: "fixed_servers" })
    ).toBe("blocked")
    expect(proxyControl("not_controllable", {})).toBe("blocked")
  })
})

describe("parseProxyConfig", () => {
  it("takes host:port, a URL and the node's object", async () => {
    const { parseProxyConfig } = await import("~helpers/proxy")
    expect(parseProxyConfig("203.0.113.7:3128")).toEqual({
      host: "203.0.113.7",
      port: 3128
    })
    expect(parseProxyConfig("http://203.0.113.7:3128/")).toEqual({
      host: "203.0.113.7",
      port: 3128
    })
    expect(parseProxyConfig({ ip: "203.0.113.7", port: 3128 })).toEqual({
      host: "203.0.113.7",
      port: 3128
    })
    expect(parseProxyConfig("[2001:db8::1]:8080")).toEqual({
      host: "2001:db8::1",
      port: 8080
    })
  })

  it("refuses what is not a proxy", async () => {
    const { parseProxyConfig } = await import("~helpers/proxy")
    for (const bad of [
      null,
      undefined,
      "",
      "[Interface]\nPrivateKey = x",
      "vless://x@y:443",
      "host:99999",
      { ip: "h" }
    ]) {
      expect(parseProxyConfig(bad)).toBeNull()
    }
  })
})
