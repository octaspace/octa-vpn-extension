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

const use = <T>(key: string, fallback: T) =>
  useStorage<T>({ key, instance: storage }, (v) => v ?? fallback)

export const useBalance = () => use<number | null>(KEYS.balance, null)[0]
export const useGeo = () => use<Geo | null>(KEYS.geo, null)[0]
export const useNodes = () => use<VpnNode[]>(KEYS.nodes, [])[0]
export const useStatus = () =>
  use<ProxyStatus>(KEYS.proxyStatus, "Disconnected")[0]
export const useSession = () => use<SessionView | null>(KEYS.session, null)[0]
export const useLastError = () => use<ErrorCode | "">(KEYS.lastError, "")[0]
export const useAuthExpired = () => use<boolean>(KEYS.authExpired, false)[0]
export const useSelection = () =>
  use<Selection>(KEYS.selection, { kind: "best" })
export const useSettings = () => use<Settings>(KEYS.settings, DEFAULT_SETTINGS)

export { ERROR_TEXT } from "~helpers/errors"
