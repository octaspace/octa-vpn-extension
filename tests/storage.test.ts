import { afterEach, describe, expect, it, vi } from "vitest"

import type { ExtensionApi } from "~helpers/platform"
import {
  KEYS,
  setToken,
  storage,
  storeSignInError,
  watchToken
} from "~helpers/storage"

type Listener = Parameters<
  ExtensionApi["storage"]["onChanged"]["addListener"]
>[0]

const { listeners, write } = vi.hoisted(() => {
  const write = vi.fn<(values: Record<string, string>) => Promise<void>>(
    async () => {}
  )
  Object.assign(globalThis.chrome, { storage: { local: { set: write } } })
  return { listeners: new Set<Listener>(), write }
})
vi.mock("~helpers/platform", () => ({
  ext: {
    storage: {
      onChanged: {
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener)
      }
    }
  }
}))

afterEach(() => {
  listeners.clear()
  write.mockClear()
  vi.restoreAllMocks()
})

describe("stored sign-in feedback", () => {
  it("keeps a storage failure from interrupting sign-in or account cleanup", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const remove = vi.spyOn(storage, "remove").mockRejectedValue(new Error())
    const set = vi.spyOn(storage, "set").mockRejectedValue(new Error())

    await expect(storeSignInError()).resolves.toBeUndefined()
    await expect(storeSignInError("auth_failed")).resolves.toBeUndefined()
    expect(remove).toHaveBeenCalledWith(KEYS.signInError)
    expect(set).toHaveBeenCalledWith(KEYS.signInError, "auth_failed")
    expect(warn).toHaveBeenCalledTimes(2)
  })
})

describe("watchToken", () => {
  it("signals changes to the local credential and stops after cleanup", async () => {
    const changed = vi.fn()
    const stop = await watchToken(changed)
    await setToken("octa_ak_" + "x".repeat(32))
    const [[values]] = write.mock.calls
    const tokenChange = Object.fromEntries(
      Object.entries(values).map(([key, newValue]) => [key, { newValue }])
    )

    for (const listener of listeners) {
      listener(tokenChange, "sync")
      listener({ [KEYS.settings]: { newValue: "{}" } }, "local")
    }
    expect(changed).not.toHaveBeenCalled()

    for (const listener of listeners) listener(tokenChange, "local")
    expect(changed).toHaveBeenCalledTimes(1)

    stop()
    expect(listeners.size).toBe(0)
  })
})
