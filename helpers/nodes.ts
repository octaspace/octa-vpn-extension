// Picking a node: what the user can afford, the cheapest first, of those the
// fastest. The server refuses a start below the price of 1 GB anyway.

export type Candidate = { node_number: string; price: number; down: number }

export function bestNode<T extends Candidate>(
  nodes: T[],
  balance: number
): T | undefined {
  return nodes
    .filter((n) => n.price <= balance)
    .sort((a, b) => a.price - b.price || b.down - a.down)[0]
}
