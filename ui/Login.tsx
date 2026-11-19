import { useState } from "react"
import logo from "url:~assets/icon.png"

import { CONSOLE_API_KEYS_URL } from "~helpers/config"
import { send, type Request } from "~helpers/messages"

import { ERROR_TEXT } from "./state"

/** Sign-in: OAuth through the console, or an API key made there by hand. */
export function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [withKey, setWithKey] = useState(false)
  const [key, setKey] = useState("")

  // The background runs the flow: this popup may not survive the auth window.
  async function signIn(request: Request) {
    setBusy(true)
    setError("")
    const res = await send(request)
    setBusy(false)
    if (res.ok) onSignedIn()
    else if (res.error !== "cancelled")
      setError(ERROR_TEXT[res.error ?? "unknown"])
  }

  return (
    <main
      className="body"
      style={{ justifyContent: "center", padding: 24, gap: 16 }}>
      <img src={logo} alt="" width={40} height={40} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            lineHeight: "28px",
            fontWeight: 500
          }}>
          Octa VPN
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          A private exit for this browser through an OctaSpace node. Billed per
          GB.
        </p>
      </div>

      <button
        className="btn btn-ink"
        disabled={busy}
        onClick={() => signIn({ type: "login" })}>
        {busy && !withKey ? (
          <span className="spinner" aria-label="Signing in" />
        ) : (
          "Sign in with OctaSpace"
        )}
      </button>

      {withKey ? (
        <form
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault()
            signIn({ type: "loginWithKey", key })
          }}>
          <label className="label" htmlFor="api-key">
            API key
          </label>
          <input
            id="api-key"
            className="input"
            type="password"
            placeholder="octa_ak_…"
            autoComplete="off"
            autoFocus
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button className="btn" type="submit" disabled={busy || !key.trim()}>
            Use this key
          </button>
          <a
            className="label"
            href={CONSOLE_API_KEYS_URL}
            target="_blank"
            rel="noreferrer">
            Create a key in the console → Credentials
          </a>
        </form>
      ) : (
        <button className="link-btn" onClick={() => setWithKey(true)}>
          Sign in with an API key instead
        </button>
      )}

      {error && (
        <p role="alert" className="error" style={{ margin: 0, fontSize: 12 }}>
          {error}
        </p>
      )}
    </main>
  )
}
