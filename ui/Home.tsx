import { useEffect, useState } from "react"

import { bytes, duration, mbps, perGb, spent, usd } from "~helpers/format"
import { send } from "~helpers/messages"
import { resolveSelection } from "~helpers/nodes"

import { Globe } from "./Globe"
import {
  AlertIcon,
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
    const res = await send({ type: "connect", nodeId: node.node_number })
    if (!res.ok && res.error !== "cancelled")
      toast(ERROR_TEXT[res.error ?? "unknown"])
  }

  const location =
    selection.kind === "node"
      ? `Node ${selection.node_number}`
      : selection.kind === "country"
      ? selection.country
      : "Best available"

  return (
    <>
      <header className="header">
        <h1>Octa VPN</h1>
        <span className="balance" aria-label="Balance">
          {balance == null ? "…" : usd(balance)}
        </span>
        <button className="icon-btn" aria-label="Settings" onClick={onSettings}>
          <SlidersIcon />
        </button>
      </header>

      <main className="body">
        <div
          style={{
            height: 196,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
          <Globe you={geo} exit={connected ? session : node} />
        </div>

        <div className="pad" style={{ paddingTop: 0 }}>
          {/* the route: the same dots as on the globe, you to the exit */}
          <div className="card route">
            <div className="stop">
              <span className="dot you" />
              <span className="grow">
                <span className="label">
                  {connected ? "You" : "You are in"}
                </span>
                <span className="title">{place(geo)}</span>
              </span>
              <span className="mono muted end">
                {connected ? "hidden" : geo?.ip ?? ""}
              </span>
            </div>
            <button className="stop" onClick={onLocations}>
              <span className="dot exit" />
              <span className="grow">
                <span className="label">Exit · {location}</span>
                <span className="title">
                  {connected && session
                    ? place(session)
                    : node
                    ? place(node)
                    : "Choose where to exit"}
                </span>
                {node && (
                  <span className="sub">
                    {mbps(node.down)} · {perGb(node.price)}
                  </span>
                )}
              </span>
              <span className="mono end">{connected ? session?.ip : ""}</span>
              <ChevronIcon size={16} />
            </button>
          </div>

          <div className="pills">
            <button className="pill" onClick={onSettings}>
              {sitesLabel(settings.bypassSites.length)}
            </button>
            <button className="pill" onClick={onSettings}>
              {settings.spendLimit
                ? `Limit ${usd(settings.spendLimit)}`
                : "No spending limit"}
            </button>
          </div>
        </div>
      </main>

      <footer className="pad">
        <span
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
          {connected
            ? "Connected"
            : status === "Connecting"
            ? "Connecting…"
            : busy
            ? "Disconnecting…"
            : "Not connected"}
        </span>
        {connected && session && (
          <div className="stats">
            <span>
              <span className="label">Time</span>
              <span className="value">
                {duration(now - session.started_at)}
              </span>
            </span>
            <span>
              <span className="label">Traffic</span>
              <span className="value">{bytes(session.rx + session.tx)}</span>
            </span>
            <span>
              <span className="label">Spent</span>
              <span className="value">{spent(session.charged)}</span>
            </span>
          </div>
        )}
        {!connected && !busy && lastError && lastError !== "cancelled" && (
          <span
            className="error"
            style={{ fontSize: 12, display: "flex", gap: 6 }}>
            <AlertIcon size={16} /> {ERROR_TEXT[lastError]}
          </span>
        )}
        <button
          className="btn btn-ink"
          onClick={toggle}
          disabled={status === "Disconnecting"}>
          {connected
            ? "Disconnect"
            : status === "Connecting"
            ? "Cancel"
            : "Connect"}
        </button>
      </footer>
    </>
  )
}

/** "Beauharnois, Canada": the city when known, the country always. */
const place = (p?: { city?: string; country?: string } | null) =>
  p ? [p.city, p.country].filter(Boolean).join(", ") || "Unknown" : "…"

const sitesLabel = (n: number) =>
  n === 0
    ? "All sites via VPN"
    : n === 1
    ? "1 site direct"
    : `${n} sites direct`

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
