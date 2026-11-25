import { afterEach, describe, expect, it, vi } from "vitest"

import { login, verifyKey } from "~helpers/auth"
import { ext } from "~helpers/platform"

vi.mock("~helpers/platform", async (importOriginal) => {
  const original = await importOriginal<typeof import("~helpers/platform")>()
  return {
    ...original,
    ext: {
      ...original.ext,
      identity: {
        getRedirectURL: () => "https://extension.chromiumapp.org/",
        launchWebAuthFlow: vi.fn()
      }
    }
  }
})

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

describe("login", () => {
  it.each([
    "The user did not approve access.",
    "User cancelled or denied access."
  ])(
    "treats a closed authorization window as cancellation (%s)",
    async (message) => {
      vi.mocked(ext.identity.launchWebAuthFlow).mockRejectedValueOnce({
        message
      })
      await expect(login()).rejects.toMatchObject({ code: "cancelled" })
    }
  )

  it("reports browser authorization failures", async () => {
    vi.mocked(ext.identity.launchWebAuthFlow).mockRejectedValueOnce(
      new Error("Authorization page could not be loaded.")
    )
    await expect(login()).rejects.toMatchObject({ code: "auth_failed" })
  })
})
