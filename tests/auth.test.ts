import { afterEach, describe, expect, it, vi } from "vitest"

import { verifyKey } from "~helpers/auth"

const KEY = "octa_ak_" + "A".repeat(32)

afterEach(() => vi.unstubAllGlobals())

describe("verifyKey", () => {
  it("refuses an old 64-hex token without a request", async () => {
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    await expect(verifyKey("a".repeat(64))).rejects.toMatchObject({
      code: "auth_failed"
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("401 is a bad key, other failures are the network", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 401 }))
    )
    await expect(verifyKey(KEY)).rejects.toMatchObject({ code: "auth_failed" })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 }))
    )
    await expect(verifyKey(KEY)).rejects.toMatchObject({ code: "network" })
  })

  it("sends the key as a Bearer token to the balance", async () => {
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetch)
    await verifyKey(KEY)
    expect(fetch).toHaveBeenCalledWith(
      "https://api.octa.space/accounts/balance",
      {
        headers: { Authorization: `Bearer ${KEY}` }
      }
    )
  })
})
