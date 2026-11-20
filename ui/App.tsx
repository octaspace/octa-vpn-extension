import { useCallback, useEffect, useState } from "react"

import { send } from "~helpers/messages"
import { tokenExists } from "~helpers/storage"

import { Home } from "./Home"
import { AlertIcon } from "./icons"
import { Locations } from "./Locations"
import { Login } from "./Login"
import { Settings } from "./Settings"
import { ERROR_TEXT, useAuthExpired, useSettings } from "./state"

type Screen = "loading" | "login" | "home" | "locations" | "settings"

export function App() {
  const [screen, setScreen] = useState<Screen>("loading")
  const [toastText, setToastText] = useState("")
  const authExpired = useAuthExpired()
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
    const dark = matchMedia("(prefers-color-scheme: dark)").matches
    const theme =
      settings.theme === "system" ? (dark ? "dark" : "light") : settings.theme
    document.documentElement.dataset.theme = theme
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
      {screen === "login" && (
        <Login
          onSignedIn={() => {
            setScreen("home")
            void load(true)
          }}
        />
      )}
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
