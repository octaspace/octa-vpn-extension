import { useStorage } from "@plasmohq/storage/hook"

import type { ErrorCode } from "~helpers/errors"
import {
  DEFAULT_SETTINGS,
  type Geo,
  type Selection,
  type SessionView,
  type Settings,
  type VpnNode
} from "~helpers/model"
import type { ProxyStatus } from "~helpers/session"
import { KEYS, storage } from "~helpers/storage"

// Live views of storage: the background writes, every open popup re-renders.

const use = <T,>(key: string, fallback: T) =>
  useStorage<T>({ key, instance: storage }, (v) => v ?? fallback)

export const useBalance = () => use<number | null>(KEYS.balance, null)[0]
export const useGeo = () => use<Geo | null>(KEYS.geo, null)[0]
export const useNodes = () => use<VpnNode[]>(KEYS.nodes, [])[0]
export const useStatus = () => use<ProxyStatus>(KEYS.proxyStatus, "Disconnected")[0]
export const useSession = () => use<SessionView | null>(KEYS.session, null)[0]
export const useLastError = () => use<ErrorCode | "">(KEYS.lastError, "")[0]
export const useAuthExpired = () => use<boolean>(KEYS.authExpired, false)[0]
export const useSelection = () => use<Selection>(KEYS.selection, { kind: "best" })
export const useSettings = () => use<Settings>(KEYS.settings, DEFAULT_SETTINGS)

export const ERROR_TEXT: Record<ErrorCode, string> = {
  auth_expired: "Your session has expired. Please sign in again.",
  auth_failed: "Sign-in failed. Please try again.",
  cancelled: "Cancelled.",
  incognito_required: "Allow the extension to run in private windows: Firefox requires it to set a proxy.",
  invalid_key: "This API key is not valid. Create one in the console under Credentials.",
  low_balance: "Not enough balance for this node. Top up in the console.",
  network: "Network error. Check your connection and try again.",
  no_node: "No affordable node for this location.",
  node_unavailable: "This node is unavailable. Try another location.",
  proxy_blocked: "Another extension controls the browser's proxy settings.",
  proxy_failed: "The browser refused the proxy settings.",
  session_ended: "The VPN session has ended on the node.",
  unknown: "Something went wrong. Please try again."
}
