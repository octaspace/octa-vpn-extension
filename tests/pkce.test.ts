import { describe, expect, it } from "vitest"

import { authorizeUrl } from "~helpers/auth"
import {
  generateCodeChallenge,
  generateCodeVerifier,
  randomString
} from "~helpers/pkce"

describe("PKCE", () => {
  it("verifier is 43 base64url characters", () => {
    const v = generateCodeVerifier()
    expect(v).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(randomString()).not.toBe(randomString())
  })

  it("challenge is S256 of the verifier (RFC 7636 appendix B)", async () => {
    expect(
      await generateCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
    ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
  })

  it("authorize URL carries challenge, method and state", () => {
    const url = new URL(
      authorizeUrl("https://x.chromiumapp.org/", "chal", "st")
    )
    expect(url.searchParams.get("code_challenge")).toBe("chal")
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("state")).toBe("st")
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://x.chromiumapp.org/"
    )
  })
})
