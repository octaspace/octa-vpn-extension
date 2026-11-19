import { useMemo, useState } from "react"

import { km, mbps, perGb } from "~helpers/format"
import { send } from "~helpers/messages"
import type { Selection } from "~helpers/model"
import {
  groupByCountry,
  resolveSelection,
  sortGroups,
  type SortKey
} from "~helpers/nodes"

import { BackIcon, BoltIcon, CheckIcon, DownIcon } from "./icons"
import {
  ERROR_TEXT,
  useBalance,
  useGeo,
  useNodes,
  useSelection,
  useStatus
} from "./state"

const SORTS: [SortKey, string][] = [
  ["nearest", "Nearest"],
  ["cheapest", "Cheapest"],
  ["fastest", "Fastest"]
]

type Props = { onBack: () => void; toast: (text: string) => void }

export function Locations({ onBack, toast }: Props) {
  const nodes = useNodes()
  const geo = useGeo()
  const balance = useBalance() ?? 0
  const status = useStatus()
  const [selection, setSelection] = useSelection()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("nearest")
  const [open, setOpen] = useState<string | null>(null)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = groupByCountry(nodes, geo)
    const found = q
      ? all.filter(
          (g) =>
            g.country.toLowerCase().includes(q) ||
            g.nodes.some((n) => n.city.toLowerCase().includes(q))
        )
      : all
    return sortGroups(found, sort)
  }, [nodes, geo, query, sort])

  // A new place while connected moves the session there.
  async function choose(next: Selection) {
    await setSelection(next)
    onBack()
    if (status !== "Connected" && status !== "Connecting") return
    const node = resolveSelection(next, nodes, balance)
    if (!node) return toast(ERROR_TEXT.no_node)
    const res = await send({ type: "connect", nodeId: node.node_number })
    if (!res.ok && res.error !== "cancelled")
      toast(ERROR_TEXT[res.error ?? "unknown"])
  }

  const isSelected = (s: Selection) =>
    JSON.stringify(s) === JSON.stringify(selection)

  return (
    <>
      <header className="header back">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h1>Exit location</h1>
      </header>

      <main className="body">
        <div className="pad">
          <label className="sr-only" htmlFor="search">
            Search locations
          </label>
          <input
            id="search"
            className="input"
            placeholder="Search country or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="segmented" role="radiogroup" aria-label="Sort">
            {SORTS.map(([key, label]) => (
              <button
                key={key}
                role="radio"
                aria-checked={sort === key}
                onClick={() => setSort(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className="card">
            <button className="row" onClick={() => choose({ kind: "best" })}>
              <span className="iso" style={{ color: "var(--selected)" }}>
                <BoltIcon size={14} />
              </span>
              <span className="grow">
                <span className="title">Best available</span>
                <span className="sub">
                  Cheapest, then fastest, within your balance
                </span>
              </span>
              {isSelected({ kind: "best" }) && <CheckIcon size={16} />}
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <p
            className="muted"
            style={{ margin: 0, padding: "8px 16px", textAlign: "center" }}>
            {nodes.length
              ? "Nothing matches your search."
              : "No nodes offer the browser VPN right now. Try again later."}
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: "0 8px 12px" }}>
            {groups.map((g) => (
              <li key={g.country}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    className="row"
                    style={{ flexGrow: 1 }}
                    onClick={() =>
                      choose({ kind: "country", country: g.country })
                    }>
                    <span className="iso">{g.country_iso || "—"}</span>
                    <span className="grow">
                      <span className="title">{g.country}</span>
                      <span className="sub">
                        from {perGb(g.from)} · {g.nodes.length} node
                        {g.nodes.length > 1 ? "s" : ""}
                      </span>
                    </span>
                    {isSelected({ kind: "country", country: g.country }) ? (
                      <CheckIcon size={16} />
                    ) : (
                      <span className="sub">{km(g.km)}</span>
                    )}
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Nodes in ${g.country}`}
                    aria-expanded={open === g.country}
                    onClick={() =>
                      setOpen(open === g.country ? null : g.country)
                    }>
                    <DownIcon size={16} />
                  </button>
                </div>
                {open === g.country &&
                  g.nodes.map((n) => (
                    <button
                      key={n.node_number}
                      className="row"
                      style={{ paddingLeft: 56 }}
                      onClick={() =>
                        choose({ kind: "node", node_number: n.node_number })
                      }>
                      <span className="grow">
                        <span className="title mono">{n.node_number}</span>
                        <span className="sub">
                          {n.city || g.country} · {mbps(n.down)} ·{" "}
                          {perGb(n.price)}
                        </span>
                      </span>
                      {isSelected({
                        kind: "node",
                        node_number: n.node_number
                      }) && <CheckIcon size={16} />}
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
