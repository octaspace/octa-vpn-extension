// The single place for hosts, OAuth clients and timings.

export const IS_FIREFOX = process.env.PLASMO_BROWSER === "firefox"

// The public API (oas) and the console (Cube) that signs users in and issues
// the API key of this app.
export const API_HOST = "https://api.octa.space"
export const OAUTH_HOST = "https://console.octa.space"
export const CONSOLE_API_KEYS_URL = `${OAUTH_HOST}/account/credentials`
// The OAuth applications must exist on the console with `issues_api_keys`, for
// the redirect URIs https://meklldccaengbfnlbbbgadiijkgcfhbk.chromiumapp.org/
// (Chrome) and https://9d8617723c445f3686b2f57bbf9587fa1e6b0ea3.extensions.allizom.org/
// (Firefox).
export const OAUTH_CLIENT_ID = IS_FIREFOX
  ? "Bv0maVhVPpjbUehutq_frwhKpMYDI9W70P6C1nOGScQ"
  : "AVKl5zoeH1R_OXqWlE2rbAn2JWBXSFflq0lcUnmy3y0"

export const IFCONFIG_URL = "https://ifconfig.octa.computer"

// Our own services never go through the VPN node: the API must see the
// user's real address, and sign-in must work while connected.
export const PROXY_BYPASS = [
  "<local>",
  "localhost",
  "127.0.0.1",
  "api.octa.computer",
  "api.octa.space",
  "cube.octa.computer",
  "console.octa.space",
  "ifconfig.octa.computer"
]

// A node needs a few seconds to provision the proxy.
export const SESSION_READY_TIMEOUT_MS = 30_000
export const SESSION_POLL_MS = 2_000

// While connected: is the session still alive, is there money left.
export const WATCHDOG_ALARM = "session-watchdog"
export const WATCHDOG_PERIOD_MIN = 1

// Below this balance a session is not started and a running one is stopped.
export const MIN_BALANCE = 0.01
