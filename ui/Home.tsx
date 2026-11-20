import { useEffect, useRef, useState } from "react"
import logo from "url:~assets/icon.png"

import { bytes, duration, mbps, perGb, spent, usd } from "~helpers/format"
import { send } from "~helpers/messages"
import { resolveSelection } from "~helpers/nodes"
import { requestSiteAccess } from "~helpers/permissions"

import { Globe } from "./Globe"
import {
  AlertIcon,
  BackIcon,
  CheckIcon,
  ChevronIcon,
  RingIcon,
  SlidersIcon
} from "./icons"
import {
  ERROR_TEXT,
  useBalance,
  useGeo,
  useLastError,
  useNodes,
  useSelection,
  useSession,
  useSettings,
  useStatus
} from "./state"

const SESSION_REFRESH_MS = 5_000

type Props = {
  onLocations: () => void
  onSettings: () => void
  toast: (text: string) => void
}

export function Home({ onLocations, onSettings, toast }: Props) {
  const balance = useBalance()
  const geo = useGeo()
  const nodes = useNodes()
  const status = useStatus()
  const session = useSession()
  const lastError = useLastError()
  const [selection] = useSelection()
  const [settings] = useSettings()
  const [requesting, setRequesting] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const routeHeading = useRef<HTMLHeadingElement>(null)
  const routeButton = useRef<HTMLButtonElement>(null)
  const returnToRouteButton = useRef(false)

  useEffect(() => {
    if (showRoute) {
      routeHeading.current?.focus()
    } else if (returnToRouteButton.current) {
      returnToRouteButton.current = false
      routeButton.current?.focus()
    }
  }, [showRoute])
  const now = useNow(status === "Connected")

  const connected = status === "Connected"
  const busy = status === "Connecting" || status === "Disconnecting"
  const node = resolveSelection(selection, nodes, balance ?? 0)

  // the meter: the background asks the API, every open popup shows it
  useEffect(() => {
    if (!connected) return
    send({ type: "refresh" })
    const id = setInterval(() => send({ type: "refresh" }), SESSION_REFRESH_MS)
    return () => clearInterval(id)
  }, [connected])

  async function toggle() {
    if (connected || status === "Connecting") {
      await send({ type: "disconnect" }) // also cancels a start
      return
    }
    if (!node)
      return toast(
        nodes.length
          ? ERROR_TEXT.no_node
          : "No nodes offer the browser VPN right now."
      )
    setRequesting(true)
    try {
      if (!(await requestSiteAccess()))
        return toast(ERROR_TEXT.site_access_required)
      const res = await send({ type: "connect", nodeId: node.node_number })
      if (!res.ok && res.error !== "cancelled")
        toast(ERROR_TEXT[res.error ?? "unknown"])
    } catch {
      toast(ERROR_TEXT.site_access_required)
    } finally {
      setRequesting(false)
    }
  }

  const exit = connected ? session : node
  const exitNode = connected
    ? nodes.find((candidate) => candidate.node_number === session?.node_number)
    : node
  const failure = !connected && !busy && lastError && lastError !== "cancelled"
  const stateLabel = connected
    ? "Connected"
    : status === "Connecting"
    ? "Connecting…"
    : busy
    ? "Disconnecting…"
    : failure
    ? "Disconnected"
    : "Not connected"

  if (showRoute) {
    return (
      <>
        <header className="header back popup-header">
          <button
            className="icon-btn"
            type="button"
            aria-label="Back"
            onClick={() => {
              returnToRouteButton.current = true
              setShowRoute(false)
            }}>
            <BackIcon />
          </button>
          <h1 tabIndex={-1} ref={routeHeading}>
            Route details
          </h1>
        </header>
        <main className="body">
          <div className="route-data">
            {exit ? (
              <dl className="card">
                {connected && geo && (
                  <div>
                    <dt className="label">From</dt>
                    <dd>{place(geo)}</dd>
                  </div>
                )}
                <div>
                  <dt className="label">Exit</dt>
                  <dd>{place(exit)}</dd>
                </div>
                {connected && session?.ip && (
                  <div>
                    <dt className="label">Exit IP</dt>
                    <dd className="mono">{session.ip}</dd>
                  </div>
                )}
                <div>
                  <dt className="label">Node</dt>
                  <dd>
                    {exitNode ? `${mbps(exitNode.down)} · ` : ""}
                    {perGb(exit.price)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="muted">No exit is selected.</p>
            )}
            {connected && (
              <p className="label">
                OctaSpace services and configured exclusions can connect
                directly.
              </p>
            )}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="header popup-header">
        <img className="popup-logo" src={logo} alt="" />
        <h1>Octa VPN</h1>
        <span className="balance" aria-label="Balance">
          {balance == null ? "…" : usd(balance)}
        </span>
        <button className="icon-btn" aria-label="Settings" onClick={onSettings}>
          <SlidersIcon />
        </button>
      </header>

      <main className="body">
        <div className="globe-area">
          <Globe
            you={connected ? geo : null}
            exit={connected ? session : null}
          />
        </div>
        <div className="popup-content">
          <div className="popup-intro">
            <div
              role="status"
              className={`status ${
                connected ? "connected" : busy ? "busy" : "idle"
              }`}>
              {connected ? (
                <CheckIcon size={16} />
              ) : busy ? (
                <span className="spinner" />
              ) : (
                <RingIcon size={16} />
              )}
              <h2>{stateLabel}</h2>
            </div>
            <p>
              {connected
                ? "Browser traffic via OctaSpace"
                : busy
                ? "Updating your browser connection."
                : "Browser traffic uses your usual connection."}
            </p>
          </div>

          <button
            className={`btn ${
              connected || busy ? "popup-secondary" : "btn-ink"
            }`}
            onClick={toggle}
            disabled={status === "Disconnecting" || (requesting && !busy)}>
            {connected
              ? "Disconnect"
              : status === "Connecting"
              ? "Cancel"
              : "Connect"}
          </button>

          {failure && (
            <p className="popup-error" role="alert">
              <span aria-hidden="true">
                <AlertIcon size={16} />
              </span>{" "}
              {ERROR_TEXT[lastError]}
            </p>
          )}

          <div className="route-actions">
            <button
              type="button"
              className="card popup-route"
              onClick={onLocations}>
              <span className="dot exit" aria-hidden="true" />
              <span className="grow">
                <span className="label">
                  {connected ? "Exit location" : "Selected exit"}
                </span>
                <span className="title">
                  {exit ? place(exit) : "Choose a location"}
                </span>
              </span>
              <ChevronIcon size={16} />
            </button>
            {exit && (
              <button
                type="button"
                className="route-info"
                ref={routeButton}
                onClick={() => setShowRoute(true)}>
                Route details
              </button>
            )}
          </div>

          {connected && session && (
            <div className="popup-meter">
              <dl className="stats">
                <div>
                  <dt className="label">Time</dt>
                  <dd className="value">
                    {duration(now - session.started_at)}
                  </dd>
                </div>
                <div>
                  <dt className="label">Traffic</dt>
                  <dd className="value">{bytes(session.rx + session.tx)}</dd>
                </div>
                <div>
                  <dt className="label">Spent</dt>
                  <dd className="value">{spent(session.charged)}</dd>
                </div>
              </dl>
              {settings.spendLimit > 0 && (
                <p className="label">
                  Session spend target · {usd(settings.spendLimit)}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

const place = (p: { city?: string; country?: string }) =>
  [p.city, p.country].filter(Boolean).join(", ") || "Unknown"

/** The clock for the session timer: ticks only while it is shown. */
function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}
