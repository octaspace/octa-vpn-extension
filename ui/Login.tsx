import { useState } from "react"
import logo from "url:~assets/icon.png"

import { send } from "~helpers/messages"

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

  // The same frame as every other screen: header, body, the one action at
  // the bottom, so signing out does not look like the layout broke.
  return (
    <>
      <header className="header">
        <h1>Octa VPN</h1>
      </header>

      <main
        className="body"
        style={{
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "16px 24px",
          textAlign: "center"
        }}>
        <img src={logo} alt="" width={56} height={56} />
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            lineHeight: "28px",
            fontWeight: 500
          }}>
          Sign in
        </h2>
        <p className="muted" style={{ margin: 0, maxWidth: 260 }}>
          A private exit for this browser through an OctaSpace node. Billed per
          GB of traffic.
        </p>
        {error && (
          <p role="alert" className="error" style={{ margin: 0, fontSize: 12 }}>
            {error}
          </p>
        )}
      </main>

      <footer className="pad">
        <button className="btn btn-ink" disabled={busy} onClick={signIn}>
          {busy ? (
            <span className="spinner" aria-label="Signing in" />
          ) : (
            "Sign in with OctaSpace"
          )}
        </button>
      </footer>
    </>
  )
}
