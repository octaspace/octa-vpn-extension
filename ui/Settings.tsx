import { useState } from "react"

import { usd } from "~helpers/format"
import { send } from "~helpers/messages"
import { SPEND_LIMITS, type Settings as SettingsT } from "~helpers/model"
import { normalizeSite } from "~helpers/proxy"

import { BackIcon, CloseIcon, ShieldIcon } from "./icons"
import { useSettings, useStatus } from "./state"

const THEMES: [SettingsT["theme"], string][] = [
  ["system", "System"],
  ["dark", "Dark"],
  ["light", "Light"]
]

type Props = { onBack: () => void; onSignedOut: () => void }

export function Settings({ onBack, onSignedOut }: Props) {
  const [settings, setSettings] = useSettings()
  const status = useStatus()
  const [site, setSite] = useState("")
  const [siteError, setSiteError] = useState("")
  const update = (patch: Partial<SettingsT>) =>
    setSettings({ ...settings, ...patch })
  const connected = status !== "Disconnected"

  function addSite(e: React.FormEvent) {
    e.preventDefault()
    const host = normalizeSite(site)
    if (!host) return setSiteError("Enter a site like bank.example")
    if (!settings.bypassSites.includes(host))
      update({ bypassSites: [...settings.bypassSites, host] })
    setSite("")
    setSiteError("")
  }

  return (
    <>
      <header className="header back">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h1>Settings</h1>
      </header>

      <main className="body">
        <div className="pad" style={{ gap: 16 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 className="label" style={{ margin: 0 }}>
              Spending
            </h2>
            <div className="card">
              <div className="row">
                <label className="grow title" htmlFor="limit">
                  Limit per session
                </label>
                <select
                  id="limit"
                  className="select"
                  value={settings.spendLimit}
                  onChange={(e) =>
                    update({ spendLimit: Number(e.target.value) })
                  }>
                  {SPEND_LIMITS.map((v) => (
                    <option key={v} value={v}>
                      {v ? usd(v) : "Off"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row">
                <span className="grow title" id="warn-label">
                  Warn when the balance runs low
                </span>
                <button
                  className="switch"
                  role="switch"
                  aria-checked={settings.lowBalanceWarning}
                  aria-labelledby="warn-label"
                  onClick={() =>
                    update({ lowBalanceWarning: !settings.lowBalanceWarning })
                  }>
                  <span />
                </button>
              </div>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 className="label" style={{ margin: 0 }}>
              Sites that skip the VPN
            </h2>
            <form onSubmit={addSite} style={{ display: "flex", gap: 8 }}>
              <label className="sr-only" htmlFor="site">
                Site that skips the VPN
              </label>
              <input
                id="site"
                className="input"
                placeholder="bank.example"
                value={site}
                aria-invalid={!!siteError}
                aria-describedby="site-help"
                onChange={(e) => setSite(e.target.value)}
              />
              <button className="btn btn-small" type="submit">
                Add
              </button>
            </form>
            <span
              id="site-help"
              className={siteError ? "error" : "muted"}
              style={{ fontSize: 12 }}>
              {siteError || "Its subdomains go direct too."}
              {connected && !siteError
                ? " Applies from the next connection."
                : ""}
            </span>
            {settings.bypassSites.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {settings.bypassSites.map((s) => (
                  <span className="chip" key={s}>
                    {s}
                    <button
                      aria-label={`Remove ${s}`}
                      onClick={() =>
                        update({
                          bypassSites: settings.bypassSites.filter(
                            (x) => x !== s
                          )
                        })
                      }>
                      <CloseIcon size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 className="label" style={{ margin: 0 }}>
              Privacy
            </h2>
            <div className="card notice">
              <span style={{ color: "var(--success)", flexShrink: 0 }}>
                <ShieldIcon size={16} />
              </span>
              <span>
                <strong>WebRTC leak protection is on</strong> while connected.
                HTTPS sites stay encrypted end to end; plain HTTP sites are
                visible to the node.
              </span>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 className="label" style={{ margin: 0 }}>
              Theme
            </h2>
            <div className="segmented" role="radiogroup" aria-label="Theme">
              {THEMES.map(([value, label]) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={settings.theme === value}
                  onClick={() => update({ theme: value })}>
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer
        className="pad"
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
        <span className="mono muted">
          v{chrome.runtime.getManifest().version}
        </span>
        <button
          className="btn btn-danger"
          onClick={async () => {
            await send({ type: "signOut" })
            onSignedOut()
          }}>
          Sign out
        </button>
      </footer>
    </>
  )
}
