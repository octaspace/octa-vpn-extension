// The route from the user to the exit node on an orthographic globe, in the
// Earth View palette of the console. Decorative: the text beside it says the
// same.

type Point = { lat: number | null; lon: number | null }

const R = 94
const C = 100
const rad = Math.PI / 180

function has(p?: Point | null): p is { lat: number; lon: number } {
  return p?.lat != null && p?.lon != null
}

/** The globe's centre: between the two points, or the one there is. */
function centre(a?: Point | null, b?: Point | null) {
  if (has(a) && has(b)) {
    const x = Math.cos(a.lon * rad) + Math.cos(b.lon * rad)
    const y = Math.sin(a.lon * rad) + Math.sin(b.lon * rad)
    return { lat: (a.lat + b.lat) / 2, lon: Math.atan2(y, x) / rad }
  }
  if (has(a)) return a
  if (has(b)) return b
  return { lat: 30, lon: 15 }
}

function project(
  p: { lat: number; lon: number },
  c: { lat: number; lon: number }
) {
  const [la, lo, la0, lo0] = [
    p.lat * rad,
    p.lon * rad,
    c.lat * rad,
    c.lon * rad
  ]
  const visible =
    Math.sin(la0) * Math.sin(la) +
      Math.cos(la0) * Math.cos(la) * Math.cos(lo - lo0) >=
    0
  return {
    x: C + R * Math.cos(la) * Math.sin(lo - lo0),
    y:
      C -
      R *
        (Math.cos(la0) * Math.sin(la) -
          Math.sin(la0) * Math.cos(la) * Math.cos(lo - lo0)),
    visible
  }
}

export function Globe({
  you,
  exit
}: {
  you?: Point | null
  exit?: Point | null
}) {
  const c = centre(you, exit)
  const a = has(you) ? project(you, c) : null
  const b = has(exit) ? project(exit, c) : null
  // the arc bows away from the centre, like a flight path
  const arc =
    a?.visible && b?.visible
      ? `M${a.x} ${a.y} Q${C + ((a.x + b.x) / 2 - C) * 1.5} ${
          C + ((a.y + b.y) / 2 - C) * 1.5 - 18
        } ${b.x} ${b.y}`
      : null

  return (
    <svg
      width="188"
      height="188"
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true">
      <circle cx={C} cy={C} r={R} fill="var(--globe)" />
      {[34, 66].map((r) => (
        <g key={r} stroke="var(--globe-grid)">
          <ellipse cx={C} cy={C} rx={R} ry={r} />
          <ellipse cx={C} cy={C} rx={r} ry={R} />
        </g>
      ))}
      <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="var(--globe-grid)" />
      <circle cx={C} cy={C} r={R} stroke="var(--globe-edge)" />
      {arc && (
        <path
          d={arc}
          stroke="var(--selected)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
      )}
      {a?.visible && <circle cx={a.x} cy={a.y} r="4" fill="var(--marker)" />}
      {b?.visible && (
        <>
          <circle
            cx={b.x}
            cy={b.y}
            r="11"
            fill="var(--selected)"
            fillOpacity="0.16"
          />
          <circle cx={b.x} cy={b.y} r="4.5" fill="var(--selected)" />
        </>
      )}
    </svg>
  )
}
