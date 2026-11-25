import { afterEach, describe, expect, it, vi } from "vitest"

import { createApi } from "~helpers/octa"

const KEY = "octa_ak_test"

type Fetch = (
  url: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

function mockFetch(body: unknown) {
  return vi.fn<Fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
  )
}

function sentHeaders(fetch: ReturnType<typeof mockFetch>): Headers {
  return new Headers(fetch.mock.calls[0][1]?.headers)
}

afterEach(() => vi.unstubAllGlobals())

describe("API requests", () => {
  it("name the app in requests through the SDK", async () => {
    const fetch = mockFetch({ balance: 0, currency: "USD", decimals: 6 })
    vi.stubGlobal("fetch", fetch)
    await createApi(KEY).balance()
    const headers = sentHeaders(fetch)
    expect(headers.get("X-OCTA-APP")).toBe("browser-extension")
    expect(headers.get("Authorization")).toBe(`Bearer ${KEY}`)
  })

  it("name the app in the location request", async () => {
    const fetch = mockFetch({})
    vi.stubGlobal("fetch", fetch)
    await createApi(KEY).geo()
    expect(fetch.mock.calls[0][0]).toBe("https://api.octa.space/geo")
    const headers = sentHeaders(fetch)
    expect(headers.get("X-OCTA-APP")).toBe("browser-extension")
    expect(headers.get("Authorization")).toBe(`Bearer ${KEY}`)
  })
})
