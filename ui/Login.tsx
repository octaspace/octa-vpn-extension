import { useState } from "react"
import logo from "url:~assets/icon.png"

import { send } from "~helpers/messages"

import { Globe } from "./Globe"
import { ERROR_TEXT } from "./state"

/** Sign-in through the OctaSpace dashboard (OAuth); it issues this app its API key. */
export function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  // The background runs the flow: this popup may not survive the auth window.
  async function signIn() {
    setBusy(true)
    setError("")
    const res = await send({ type: "login" })
    setBusy(false)
    if (res.ok) onSignedIn()
    else if (res.error !== "cancelled")
      setError(ERROR_TEXT[res.error ?? "unknown"])
  }

  return (
    <>
      <header className="header popup-header">
        <img className="popup-logo" src={logo} alt="" />
        <h1>Octa VPN</h1>
      </header>
      <main className="body">
        <div className="globe-area globe-idle">
          <Globe />
        </div>
        <div className="popup-content login-content">
          <div className="popup-intro">
            <h2>Sign in</h2>
            <p>
              Choose an OctaSpace node for this browser.
              <br />
              Pay per GB of traffic.
            </p>
          </div>
          <button className="btn btn-ink" disabled={busy} onClick={signIn}>
            {busy ? "Signing in…" : "Sign in with OctaSpace"}
          </button>
          {error && (
            <p role="alert" className="popup-error">
              {error}
            </p>
          )}
        </div>
      </main>
    </>
  )
}
