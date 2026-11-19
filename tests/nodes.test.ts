import { describe, expect, it } from "vitest"

import { bestNode } from "~helpers/nodes"

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
