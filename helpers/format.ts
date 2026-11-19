// Display formats: USD as the account shows it, prices fine enough to compare.

export const usd = (v: number) =>
  `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(2)}`

/** A price per GB is a fraction of a cent: keep its significant digits. */
export const perGb = (v: number) =>
  `$${v < 0.01 ? v.toFixed(4) : v.toFixed(2)}/GB`

/** Spent so far: "under 1¢" reads better than $0.00002. */
export const spent = (v: number) => (v > 0 && v < 0.01 ? "under 1¢" : usd(v))

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ["KB", "MB", "GB", "TB"]
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`
}

export function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const pad = (x: number) => String(x).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}

export const km = (v: number | null) =>
  v == null ? "" : `${v < 100 ? Math.round(v) : Math.round(v / 100) * 100} km`

export const mbps = (v: number) => (v > 0 ? `${v} Mbps` : "speed unknown")
