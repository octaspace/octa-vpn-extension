// The single place for hosts, OAuth clients and timings.

export const IS_FIREFOX = process.env.PLASMO_BROWSER === "firefox"

// The public API (oas) and the console (Cube) that signs users in and issues
// the API key of this app.
export const API_HOST = "https://api.octa.space"
export const OAUTH_HOST = "https://console.octa.space"
// The OAuth applications must exist on the console with `issues_api_keys`, for
// the redirect URIs https://meklldccaengbfnlbbbgadiijkgcfhbk.chromiumapp.org/
// (Chrome) and https://9d8617723c445f3686b2f57bbf9587fa1e6b0ea3.extensions.allizom.org/
// (Firefox).
export const OAUTH_CLIENT_ID = IS_FIREFOX
  ? "Bv0maVhVPpjbUehutq_frwhKpMYDI9W70P6C1nOGScQ"
  : "AVKl5zoeH1R_OXqWlE2rbAn2JWBXSFflq0lcUnmy3y0"

// Our own services never go through the VPN node: the API must see the
// user's real address, and sign-in must work while connected.
export const PROXY_BYPASS = [
  "<local>",
  "localhost",
  "127.0.0.1",
  "api.octa.space",
  "console.octa.space"
]

// A node needs a few seconds to provision the proxy.
// A node may take a minute to start the proxy, as the Android app allows.
export const SESSION_READY_TIMEOUT_MS = 60_000
export const SESSION_POLL_MS = 2_000

// While connected: is the session still alive, is there money left.
export const WATCHDOG_ALARM = "session-watchdog"
// 30 s: the shortest alarm Chrome allows; the spending limit is checked as often
export const WATCHDOG_PERIOD_MIN = 0.5

// Below this balance a session is not started and a running one is stopped.
export const MIN_BALANCE = 0.01

// Warn once a session when the balance falls below this, or below 10% of what
// it was at the start, whichever is higher (as the Android app does).
export const LOW_BALANCE_USD = 0.25

// Stopping a session: a few tries before it waits for the next start.
export const STOP_TRIES = 3
export const STOP_RETRY_MS = 2_000

// A listing fetched with a key is at most 10 s old on the server.
export const NODES_TTL_MS = 2 * 60_000
