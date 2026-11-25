import { Storage } from "@plasmohq/storage"
import { SecureStorage } from "@plasmohq/storage/secure"

import type { ErrorCode } from "./errors"
import { ext } from "./platform"

// storage.local only: readable by this extension, by the popup and the
// background alike (both read and watch the same keys).
export const storage = new Storage({ area: "local" })
const secureStorage = new SecureStorage({ area: "local" })

/** Every key the extension keeps; the token lives apart, in secureStorage. */
export const KEYS = {
  // account
  balance: "balance", // USD, number
  authExpired: "authExpired",
  signInError: "signInError",
  geo: "geo", // Geo | null: the real address, from /geo
  nodes: "nodes", // VpnNode[]
  nodesAt: "nodesAt", // ms
  // session (written by the background)
  proxyStatus: "proxyStatus",
  session: "session", // SessionView | null
  uuid: "uuid",
  openSessions: "openSessions",
  lastError: "lastError",
  // the user's choices: kept on sign-out
  selection: "selection",
  settings: "settings"
} as const

const ACCOUNT_KEYS = [
  KEYS.balance,
  KEYS.authExpired,
  KEYS.geo,
  KEYS.nodes,
  KEYS.nodesAt,
  KEYS.session,
  KEYS.uuid,
  KEYS.lastError
]

// Obfuscation, not protection: the password ships with the code. The key is
// readable by this extension only either way (storage.local).
let passwordSet: Promise<void> | undefined
const TOKEN_KEY = "token"
function ready() {
  passwordSet ??= secureStorage.setPassword("Ba7_9/bW8{7**T")
  return passwordSet
}

export async function setToken(token: string) {
  await ready()
  await secureStorage.set(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | undefined> {
  await ready()
  return await secureStorage.get(TOKEN_KEY)
}

export async function watchToken(onChange: () => void) {
  await ready()
  const key = secureStorage.getNamespacedKey(TOKEN_KEY)
  const listener: Parameters<typeof ext.storage.onChanged.addListener>[0] = (
    changes,
    area
  ) => {
    if (area === "local" && Object.hasOwn(changes, key)) onChange()
  }
  ext.storage.onChanged.addListener(listener)
  return () => ext.storage.onChanged.removeListener(listener)
}

export const API_KEY_PATTERN = /^octa_ak_[A-Za-z0-9_-]{32}$/

// Only `octa_ak_` keys are valid: anything else means signing in again.
export async function tokenExists() {
  return API_KEY_PATTERN.test((await getToken()) ?? "")
}

/** Persist feedback for the next popup without affecting account operations. */
export async function storeSignInError(error?: ErrorCode): Promise<void> {
  try {
    if (error) await storage.set(KEYS.signInError, error)
    else await storage.remove(KEYS.signInError)
  } catch {
    console.warn("Could not update stored sign-in feedback.")
  }
}

/** Signed out: nothing of the account stays; the user's settings do. */
export async function clearData() {
  await Promise.all([
    setToken(""),
    storeSignInError(),
    ...ACCOUNT_KEYS.map((k) => storage.remove(k))
  ])
  await storage.set(KEYS.proxyStatus, "Disconnected")
}
