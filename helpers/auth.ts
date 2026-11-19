// OAuth 2.0 authorization code flow with PKCE (RFC 7636) and `state`, run by
// the background: the auth window takes focus and closes the popup, which
// would take the flow down with it.

import { OAUTH_CLIENT_ID, OAUTH_HOST } from "./config"
import { AppError } from "./errors"
import { createApi } from "./octa"
import {
  generateCodeChallenge,
  generateCodeVerifier,
  randomString
} from "./pkce"
import { ext } from "./platform"
import { clearData, setToken } from "./storage"

export function authorizeUrl(
  redirectUri: string,
  challenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "",
    state
  })
  return `${OAUTH_HOST}/oauth/authorize?${params}`
}

async function requestJson(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init)
  if (!res.ok) throw new AppError("auth_failed")
  return res.json()
}

// Authorization codes are single-use: no retries here.
async function exchangeCode(
  code: string,
  verifier: string,
  redirectUri: string
): Promise<string> {
  const data = await requestJson(`${OAUTH_HOST}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    })
  })
  if (typeof data?.access_token !== "string") throw new AppError("auth_failed")
  return data.access_token
}

async function fetchApiKey(accessToken: string): Promise<string> {
  const data = await requestJson(`${OAUTH_HOST}/api/v1/profiles/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (typeof data?.token !== "string") throw new AppError("auth_failed")
  return data.token
}

/** Signs the user in; resolves once the API key is stored. */
export async function login(): Promise<void> {
  const verifier = generateCodeVerifier()
  const state = randomString()
  const redirectUri = ext.identity.getRedirectURL()

  const responseUrl = await ext.identity
    .launchWebAuthFlow({
      url: authorizeUrl(
        redirectUri,
        await generateCodeChallenge(verifier),
        state
      ),
      interactive: true
    })
    .catch(() => undefined)
  if (!responseUrl) throw new AppError("cancelled")

  const params = new URL(responseUrl).searchParams
  const code = params.get("code")
  if (!code || params.get("state") !== state) throw new AppError("auth_failed")

  const apiKey = await fetchApiKey(
    await exchangeCode(code, verifier, redirectUri)
  )
  await createApi(apiKey).balance() // the key works
  await clearData()
  await setToken(apiKey)
}
