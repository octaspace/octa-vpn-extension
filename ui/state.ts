import { useMemo } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import type { ErrorCode } from "~helpers/errors"
import {
  DEFAULT_SETTINGS,
  settingsWithDefaults,
  type Geo,
  type Selection,
  type SessionView,
  type Settings,
  type VpnNode
} from "~helpers/model"
import type { ProxyStatus } from "~helpers/session"
import { KEYS, storage } from "~helpers/storage"

// A static fallback keeps hydration read-only. The storage watcher still
// emits undefined when the background removes a key during sign-out.
function useStoredValue<T>(key: string, fallback: T) {
  const [value, setValue] = useStorage<T>({ key, instance: storage }, fallback)
  return [value ?? fallback, setValue] as const
}

const NO_NODES: VpnNode[] = []
const BEST: Selection = { kind: "best" }

export const useBalance = () =>
  useStoredValue<number | null>(KEYS.balance, null)[0]
export const useGeo = () => useStoredValue<Geo | null>(KEYS.geo, null)[0]
export const useNodes = () => useStoredValue(KEYS.nodes, NO_NODES)[0]
export const useStatus = () =>
  useStoredValue<ProxyStatus>(KEYS.proxyStatus, "Disconnected")[0]
export const useSession = () =>
  useStoredValue<SessionView | null>(KEYS.session, null)[0]
export const useLastError = () =>
  useStoredValue<ErrorCode | "">(KEYS.lastError, "")[0]
export const useAuthExpired = () => useStoredValue(KEYS.authExpired, false)[0]
export const useSelection = () =>
  useStoredValue<Selection>(KEYS.selection, BEST)
export function useSettings() {
  const [stored, setSettings] = useStoredValue(KEYS.settings, DEFAULT_SETTINGS)
  const settings = useMemo(() => settingsWithDefaults(stored), [stored])
  return [settings, setSettings] as const
}

export { ERROR_TEXT } from "~helpers/errors"
