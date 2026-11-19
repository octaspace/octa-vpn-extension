import { describe, expect, it } from "vitest"

import { bytes, duration, perGb, spent } from "~helpers/format"
import type { VpnNode } from "~helpers/model"
import {
  bestNode,
  distanceKm,
  groupByCountry,
  resolveSelection,
  sortGroups
} from "~helpers/nodes"

const n = (node_number: string, price: number, down: number) => ({
  node_number,
  price,
  down
})

describe("bestNode", () => {
  it("cheapest first, then fastest", () => {
    expect(
      bestNode(
        [n("A", 0.0002, 900), n("B", 0.0001, 100), n("C", 0.0001, 500)],
        1
      )?.node_number
    ).toBe("C")
  })

  it("skips nodes the balance cannot pay 1 GB of", () => {
    expect(bestNode([n("A", 0.5, 900), n("B", 2, 100)], 1)?.node_number).toBe(
      "A"
    )
    expect(bestNode([n("A", 2, 900)], 1)).toBeUndefined()
  })
})

const node = (p: Partial<VpnNode>): VpnNode => ({
  node_number: "N",
  country: "X",
  country_iso: "XX",
  city: "",
  price: 0.0001,
  down: 100,
  up: 100,
  lat: null,
  lon: null,
  ...p
})
const kyiv = {
  ip: "",
  city: "",
  country: "",
  country_iso: "UA",
  lat: 50.45,
  lon: 30.52
}

describe("locations", () => {
  const nodes = [
    node({
      node_number: "DE1",
      country: "Germany",
      price: 0.0002,
      down: 900,
      lat: 50.11,
      lon: 8.68
    }),
    node({
      node_number: "CA1",
      country: "Canada",
      price: 0.0001,
      down: 489,
      lat: 45.31,
      lon: -73.88
    }),
    node({
      node_number: "DE2",
      country: "Germany",
      price: 0.0001,
      down: 100,
      lat: 52.52,
      lon: 13.4
    })
  ]

  it("distance is the great circle", () => {
    expect(
      Math.round(distanceKm(kyiv, { lat: 52.52, lon: 13.4 })!)
    ).toBeGreaterThan(1150)
    expect(distanceKm(kyiv, { lat: null, lon: null })).toBeNull()
  })

  it("groups by country and sorts three ways", () => {
    const groups = groupByCountry(nodes, kyiv)
    expect(sortGroups(groups, "nearest").map((g) => g.country)).toEqual([
      "Germany",
      "Canada"
    ])
    expect(sortGroups(groups, "fastest")[0].country).toBe("Germany")
    expect(groups.find((g) => g.country === "Germany")!.from).toBe(0.0001)
  })

  it("a selection resolves to a node now", () => {
    expect(resolveSelection({ kind: "best" }, nodes, 1)?.node_number).toBe(
      "CA1"
    )
    expect(
      resolveSelection({ kind: "country", country: "Germany" }, nodes, 1)
        ?.node_number
    ).toBe("DE2")
    expect(
      resolveSelection({ kind: "node", node_number: "DE1" }, nodes, 0)
        ?.node_number
    ).toBe("DE1")
  })
})

describe("formats", () => {
  it("money, traffic, time", () => {
    expect(perGb(0.0001)).toBe("$0.0001/GB")
    expect(spent(0.00002)).toBe("under 1¢")
    expect(bytes(184 * 1024 * 1024)).toBe("184 MB")
    expect(duration(761_000)).toBe("12:41")
  })
})
