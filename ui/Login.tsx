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

        {withKey && (
          <form
            id="key-form"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
              marginTop: 8,
              textAlign: "left"
            }}
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
            <a
              className="label"
              href={CONSOLE_API_KEYS_URL}
              target="_blank"
              rel="noreferrer">
              Create a key in the console → Credentials
            </a>
          </form>
        )}

        {error && (
          <p role="alert" className="error" style={{ margin: 0, fontSize: 12 }}>
            {error}
          </p>
        )}
      </main>

      <footer
        className="pad"
        style={{ borderTop: "1px solid var(--border)", gap: 8 }}>
        {withKey ? (
          <>
            <button
              className="btn btn-ink"
              type="submit"
              form="key-form"
              disabled={busy || !key.trim()}>
              {busy ? (
                <span className="spinner" aria-label="Signing in" />
              ) : (
                "Use this key"
              )}
            </button>
            <button className="link-btn" onClick={() => setWithKey(false)}>
              Sign in with OctaSpace instead
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-ink"
              disabled={busy}
              onClick={() => signIn({ type: "login" })}>
              {busy ? (
                <span className="spinner" aria-label="Signing in" />
              ) : (
                "Sign in with OctaSpace"
              )}
            </button>
            <button className="link-btn" onClick={() => setWithKey(true)}>
              Sign in with an API key instead
            </button>
          </>
        )}
      </footer>
    </>
  )
}
