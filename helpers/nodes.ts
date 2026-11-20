import type { Geo, Selection, VpnNode } from "./model"

// Picking a node: what the user can afford, the cheapest first, of those the
// fastest. The API refuses a start below the
// price of 1 GB anyway.

export type Candidate = { node_number: string; price: number; down: number }

export function bestNode<T extends Candidate>(
  nodes: T[],
  balance: number
): T | undefined {
  return nodes
    .filter((n) => n.price <= balance)
    .sort((a, b) => a.price - b.price || b.down - a.down)[0]
}

/** The node a selection stands for now; undefined if none qualifies. */
export function resolveSelection(
  selection: Selection,
  nodes: VpnNode[],
  balance: number
): VpnNode | undefined {
  switch (selection.kind) {
    case "node":
      return nodes.find((n) => n.node_number === selection.node_number)
    case "country":
      return bestNode(
        nodes.filter((n) => n.country === selection.country),
        balance
      )
    default:
      return bestNode(nodes, balance)
  }
}

type Point = { lat: number | null; lon: number | null }

/** Great-circle distance in km; null when a point has no coordinates. */
export function distanceKm(a: Point, b: Point): number | null {
  if (a.lat == null || a.lon == null || b.lat == null || b.lon == null)
    return null
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export type CountryGroup = {
  country: string
  country_iso: string
  nodes: VpnNode[]
  /** The country's cheapest price, USD per GB */
  from: number
  /** km from the user to the nearest node, null if unknown */
  km: number | null
}

export type SortKey = "nearest" | "cheapest" | "fastest"

export function groupByCountry(
  nodes: VpnNode[],
  from: Geo | null
): CountryGroup[] {
  const groups = new Map<string, VpnNode[]>()
  for (const n of nodes)
    groups.set(n.country, [...(groups.get(n.country) ?? []), n])
  return [...groups].map(([country, list]) => {
    const km = from
      ? Math.min(...list.map((n) => distanceKm(from, n) ?? Infinity))
      : Infinity
    return {
      country,
      country_iso: list[0].country_iso,
      nodes: [...list].sort((a, b) => a.price - b.price || b.down - a.down),
      from: Math.min(...list.map((n) => n.price)),
      km: Number.isFinite(km) ? km : null
    }
  })
}

const fastest = (g: CountryGroup) => Math.max(...g.nodes.map((n) => n.down))

export function sortGroups(
  groups: CountryGroup[],
  key: SortKey
): CountryGroup[] {
  const byName = (a: CountryGroup, b: CountryGroup) =>
    a.country.localeCompare(b.country)
  return [...groups].sort((a, b) => {
    if (key === "cheapest") return a.from - b.from || byName(a, b)
    if (key === "fastest") return fastest(b) - fastest(a) || byName(a, b)
    return (a.km ?? Infinity) - (b.km ?? Infinity) || byName(a, b)
  })
}
