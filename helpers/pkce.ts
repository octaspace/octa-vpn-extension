// PKCE (RFC 7636) helpers. The verifier never leaves the memory of the
// background function that runs the whole flow, so it is never stored.

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/** Cryptographically random base64url string of `bytes` random bytes. */
export function randomString(bytes = 32): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)))
}

/** 43 characters, within RFC 7636's 43–128. */
export function generateCodeVerifier(): string {
  return randomString(32)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  )
  return base64UrlEncode(new Uint8Array(hash))
}
