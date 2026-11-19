// What the popup and the background share through storage.

/** A node the browser can use: it passed the check of the `http_proxy` VPN. */
export type VpnNode = {
  node_number: string
  country: string
  country_iso: string
  city: string
  /** USD per GB of traffic */
  price: number
  /** Mbit/s, 0 if not measured */
  down: number
  up: number
  lat: number | null
  lon: number | null
}

/** Where the user really is (the API is never proxied). */
export type Geo = {
  ip: string
  city: string
  country: string
  country_iso: string
  lat: number | null
  lon: number | null
}

/** The session up, as the popup shows it. */
export type SessionView = {
  node_number: string
  ip: string
  city: string
  country: string
  country_iso: string
  lat: number | null
  lon: number | null
  /** USD per GB, at start */
  price: number
  started_at: number
  /** bytes */
  rx: number
  tx: number
  /** USD charged so far */
  charged: number
  /** USD, when the session started: the low-balance warning is relative to it */
  start_balance: number
  /** the low-balance warning was shown for this session */
  warned: boolean
}

/** Where to exit: the best node anywhere, in one country, or one node. */
export type Selection =
  | { kind: "best" }
  | { kind: "country"; country: string }
  | { kind: "node"; node_number: string }

export type Settings = {
  /** USD per session, 0 = off */
  spendLimit: number
  lowBalanceWarning: boolean
  /** Sites that go direct, not through the node (a bank that blocks VPNs) */
  bypassSites: string[]
  theme: "system" | "dark" | "light"
}

export const DEFAULT_SETTINGS: Settings = {
  spendLimit: 0,
  lowBalanceWarning: true,
  bypassSites: [],
  theme: "system"
}

export const SPEND_LIMITS = [0, 0.1, 0.5, 1, 5]
