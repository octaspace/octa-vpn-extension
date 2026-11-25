import { useState } from "react"
import logo from "url:~assets/icon.png"

import type { ErrorCode } from "~helpers/errors"
import type { Request } from "~helpers/messages"
import { ext } from "~helpers/platform"

import { Globe } from "./Globe"
import { ERROR_TEXT } from "./state"

/** Sign-in through the OctaSpace dashboard (OAuth); it issues this app its API key. */
export function Login({ signInError }: { signInError: ErrorCode | null }) {
  const [busy, setBusy] = useState(false)
  const [connectionError, setConnectionError] = useState(false)

  // The background runs the flow: this popup may not survive the auth window.
  async function signIn() {
    setBusy(true)
    setConnectionError(false)
    try {
      const reply = await ext.runtime.sendMessage({
        type: "login"
      } satisfies Request)
      setConnectionError(!reply)
    } catch {
      setConnectionError(true)
    } finally {
      setBusy(false)
    }
  }

  const error = signInError ?? (connectionError ? "unknown" : null)

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
              {ERROR_TEXT[error]}
            </p>
          )}
        </div>
      </main>
    </>
  )
}
