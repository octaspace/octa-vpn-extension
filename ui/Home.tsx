import { useEffect, useState } from "react"

import { bytes, duration, mbps, perGb, spent, usd } from "~helpers/format"
import { send } from "~helpers/messages"
import type { Selection, VpnNode } from "~helpers/model"
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
          <div
            className="card card-pad"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 12px"
            }}>
            <span className="label">
              {connected ? "You" : "Sites see you in"}
            </span>
            <span className="label">{connected ? "Exit" : ""}</span>
            <span>
              {geo
                ? [geo.city, geo.country_iso].filter(Boolean).join(", ") ||
                  geo.country
                : "…"}
            </span>
            <span>
              {connected && session
                ? [session.city, session.country_iso].filter(Boolean).join(", ")
                : ""}
            </span>
            <span className="mono muted">
              {connected ? "hidden" : geo?.ip ?? ""}
            </span>
            <span className="mono muted">{connected ? session?.ip : ""}</span>
          </div>

          <div className="card">
            <button className="row" onClick={onLocations}>
              <span className="iso">
                {(connected ? session?.country_iso : node?.country_iso) || "—"}
              </span>
              <span className="grow">
                <span className="title">{location}</span>
                <span className="sub">
                  {node
                    ? nodeLine(node, selection.kind)
                    : "Choose where to exit"}
                </span>
              </span>
              <ChevronIcon size={16} />
            </button>
            <button className="row" onClick={onSettings}>
              <span className="grow">
                <span className="title">
                  {sitesLabel(settings.bypassSites.length)}
                </span>
                <span className="sub">
                  {settings.spendLimit
                    ? `Limit ${usd(settings.spendLimit)} per session`
                    : "No spending limit"}
                </span>
              </span>
              <ChevronIcon size={16} />
            </button>
          </div>
        </div>
      </main>

      <footer className="pad" style={{ borderTop: "1px solid var(--border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}>
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
            <span className="mono muted">
              {duration(now - session.started_at)} ·{" "}
              {bytes(session.rx + session.tx)} · {spent(session.charged)}
            </span>
          )}
        </div>
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

const sitesLabel = (n: number) =>
  n === 0
    ? "All sites through the VPN"
    : n === 1
    ? "1 site skips the VPN"
    : `${n} sites skip the VPN`

/** The country under "Best", the city under a chosen country. */
const nodeLine = (node: VpnNode, kind: Selection["kind"]) =>
  `${kind === "country" ? node.city || node.country : node.country} · ${mbps(
    node.down
  )} · ${perGb(node.price)}`

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
