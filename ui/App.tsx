import { useCallback, useEffect, useLayoutEffect, useState } from "react"

import { send } from "~helpers/messages"
import { tokenExists, watchToken } from "~helpers/storage"

import { Home } from "./Home"
import { AlertIcon } from "./icons"
import { Locations } from "./Locations"
import { Login } from "./Login"
import { Settings } from "./Settings"
import {
  ERROR_TEXT,
  useAuthExpired,
  useSettings,
  useSignInError
} from "./state"

type Screen = "loading" | "login" | "home" | "locations" | "settings"

export function App() {
  const [screen, setScreen] = useState<Screen>("loading")
  const [toastText, setToastText] = useState("")
  const authExpired = useAuthExpired()
  const signInError = useSignInError()
  const [settings] = useSettings()

  const toast = useCallback((text: string) => {
    setToastText(text)
    setTimeout(() => setToastText(""), 5000)
  }, [])

  const signedOut = useCallback(
    async (expired: boolean) => {
      setScreen("login")
      if (expired) toast(ERROR_TEXT.auth_expired)
    },
    [toast]
  )

  // The data the screens show: fresh on every open of the popup.
  const load = useCallback(
    async (force = false) => {
      const result = await send({ type: "refreshAccount", force })
      if (!result.ok) toast(ERROR_TEXT[result.error ?? "unknown"])
    },
    [toast]
  )

  useEffect(() => {
    tokenExists().then((yes) => {
      setScreen(yes ? "home" : "login")
      if (yes) load()
    })
  }, [load])

  useEffect(() => {
    if (authExpired && screen !== "login") signedOut(true)
  }, [authExpired, screen, signedOut])

  useEffect(() => {
    if (screen !== "login" || authExpired) return
    let active = true
    let revision = 0
    let stopWatching: (() => void) | undefined

    const checkToken = async () => {
      const current = ++revision
      try {
        const signedIn = await tokenExists()
        if (!active || current !== revision || !signedIn) return
        setScreen("home")
        void load(true)
      } catch {
        if (active && current === revision) toast(ERROR_TEXT.unknown)
      }
    }

    void watchToken(checkToken)
      .then((stop) => {
        if (!active) return stop()
        stopWatching = stop
        // Cover a sign-in that finished before the listener was installed.
        return checkToken()
      })
      .catch(() => {
        if (active) toast(ERROR_TEXT.unknown)
      })

    return () => {
      active = false
      stopWatching?.()
    }
  }, [authExpired, load, screen, toast])

  useLayoutEffect(() => {
    const preference = matchMedia("(prefers-color-scheme: dark)")
    const applyTheme = () => {
      document.documentElement.dataset.theme =
        settings.theme === "system"
          ? preference.matches
            ? "dark"
            : "light"
          : settings.theme
    }

    applyTheme()
    if (settings.theme !== "system") return
    preference.addEventListener("change", applyTheme)
    return () => preference.removeEventListener("change", applyTheme)
  }, [settings.theme])

  return (
    <div
      className={
        screen === "home" || screen === "login" ? "app app-compact" : "app"
      }>
      {screen === "loading" && (
        <main
          className="body"
          style={{ alignItems: "center", justifyContent: "center" }}>
          <span className="spinner muted" aria-label="Loading" />
        </main>
      )}
      {screen === "login" && <Login signInError={signInError} />}
      {screen === "home" && (
        <Home
          onLocations={() => setScreen("locations")}
          onSettings={() => setScreen("settings")}
          toast={toast}
        />
      )}
      {screen === "locations" && (
        <Locations onBack={() => setScreen("home")} toast={toast} />
      )}
      {screen === "settings" && (
        <Settings
          onBack={() => setScreen("home")}
          onSignedOut={() => setScreen("login")}
        />
      )}

      {toastText && (
        <div className="toast" role="alert">
          <span className="error" style={{ flexShrink: 0 }}>
            <AlertIcon size={16} />
          </span>
          {toastText}
        </div>
      )}
    </div>
  )
}
