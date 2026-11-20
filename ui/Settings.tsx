import { useEffect, useState } from "react"

import { usd } from "~helpers/format"
import { send } from "~helpers/messages"
import { SPEND_LIMITS, type Settings as SettingsT } from "~helpers/model"
import { notificationAccess } from "~helpers/permissions"
import { ext } from "~helpers/platform"
import { isProbeBypass, normalizeSite } from "~helpers/proxy"

import { BackIcon, CloseIcon, ShieldIcon } from "./icons"
import { ERROR_TEXT, useSettings, useStatus } from "./state"

const THEMES: [SettingsT["theme"], string][] = [
  ["system", "System"],
  ["dark", "Dark"],
  ["light", "Light"]
]

type Props = { onBack: () => void; onSignedOut: () => void }

export function Settings({ onBack, onSignedOut }: Props) {
  const [settings, setSettings] = useSettings()
  const status = useStatus()
  const [notifications, setNotifications] = useState(false)
  const [settingsError, setSettingsError] = useState("")
  useEffect(() => {
    ext.permissions.contains(notificationAccess).then(setNotifications)
  }, [])
  async function toggleNotifications() {
    if (notifications) {
      if (await ext.permissions.remove(notificationAccess))
        setNotifications(false)
    } else {
      setNotifications(await ext.permissions.request(notificationAccess))
    }
  }

  const [site, setSite] = useState("")
  const [siteError, setSiteError] = useState("")
  const update = (patch: Partial<SettingsT>) =>
    setSettings({ ...settings, ...patch })
  const connected = status !== "Disconnected"

  function addSite(e: React.FormEvent) {
    e.preventDefault()
    const host = normalizeSite(site)
    if (!host) return setSiteError("Enter a site like bank.example")
    if (isProbeBypass(host))
      return setSiteError("This host is used to check the connection.")
    if (!settings.bypassSites.includes(host))
      update({ bypassSites: [...settings.bypassSites, host] })
    setSite("")
    setSiteError("")
  }

  return (
    <>
      <header className="header back popup-header">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h1>Settings</h1>
      </header>

      <main className="body">
        <div className="pad settings-sections">
          <section className="settings-section">
            <h2 className="label">Spending</h2>
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
                <span className="grow title" id="notification-label">
                  System notifications
                </span>
                <button
                  className="switch"
                  type="button"
                  role="switch"
                  aria-checked={notifications}
                  aria-labelledby="notification-label"
                  onClick={() =>
                    void toggleNotifications().catch(() =>
                      setSettingsError(
                        "Notification permission couldn’t be changed."
                      )
                    )
                  }>
                  <span />
                </button>
              </div>
              <div className="row">
                <span className="grow title" id="warn-label">
                  Low-balance alert
                </span>
                <button
                  className="switch"
                  role="switch"
                  disabled={!notifications}
                  aria-checked={notifications && settings.lowBalanceWarning}
                  aria-labelledby="warn-label"
                  onClick={() =>
                    update({ lowBalanceWarning: !settings.lowBalanceWarning })
                  }>
                  <span />
                </button>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="label">Sites that skip the VPN</h2>
            <form onSubmit={addSite} className="site-form">
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
              <div className="site-chips">
                {settings.bypassSites.map((s) => (
                  <span className="chip" key={s}>
                    <span>{s}</span>
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

          <section className="settings-section">
            <h2 className="label">Privacy</h2>
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

          <section className="settings-section">
            <h2 className="label">Theme</h2>
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

      <footer className="pad settings-footer">
        {settingsError && (
          <p className="popup-error" role="alert">
            {settingsError}
          </p>
        )}
        <div className="settings-footer-actions">
          <span className="mono muted">
            v{ext.runtime.getManifest().version}
          </span>
          <button
            className="btn btn-danger"
            onClick={async () => {
              setSettingsError("")
              const result = await send({ type: "signOut" })
              if (result.ok) onSignedOut()
              else setSettingsError(ERROR_TEXT[result.error ?? "unknown"])
            }}>
            Sign out
          </button>
        </div>
      </footer>
    </>
  )
}
