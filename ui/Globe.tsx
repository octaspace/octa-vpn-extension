import {
  geoContains,
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath
} from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import { useEffect, useMemo, useRef, useState } from "react"
import { feature } from "topojson-client"
import world from "world-atlas/countries-110m.json"

// The route from the user to the exit node on a globe with the countries
// drawn, in the Earth View palette of the console: the user's country and the
// exit's country are filled, the globe turns to keep both in view.
// Decorative: the text beside it says the same.

type Point = { lat: number | null; lon: number | null }
type LonLat = [number, number]

// before the popup has any place to show
const DEFAULT_CENTRE: LonLat = [15, 30]
const SIZE = 200
const R = 94

const countries = (
  feature(
    world as any,
    (world as any).objects.countries
  ) as unknown as FeatureCollection<Geometry>
).features
const graticule = geoGraticule10()

const has = (p?: Point | null): p is { lat: number; lon: number } =>
  p?.lat != null && p?.lon != null
const lonLat = (p: { lat: number; lon: number }): LonLat => [p.lon, p.lat]

/** The globe's centre: between the two points, or the one there is. */
function centreOf(a?: Point | null, b?: Point | null): LonLat {
  if (has(a) && has(b))
    return geoInterpolate(lonLat(a), lonLat(b))(0.5) as LonLat
  if (has(a)) return lonLat(a)
  if (has(b)) return lonLat(b)
  return DEFAULT_CENTRE
}

const countryAt = (p?: Point | null) =>
  has(p) ? countries.find((c) => geoContains(c, lonLat(p))) : undefined

/** Turns the globe to a new centre over 600 ms; at once with reduced motion. */
function useTurn(target: LonLat): LonLat {
  const [centre, setCentre] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    if (start[0] === target[0] && start[1] === target[1]) return
    // the first place after the popup's data loads, a hidden page, reduced
    // motion: there at once; only a change of location turns the globe
    if (
      start === DEFAULT_CENTRE ||
      document.hidden ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      from.current = target
      return setCentre(target)
    }
    const turn = geoInterpolate(start, target)
    const t0 = performance.now()
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 600)
      const eased = 1 - (1 - t) ** 3
      const c = turn(eased) as LonLat
      from.current = c
      setCentre(c)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target[0], target[1]])
  return centre
}

export function Globe({
  you,
  exit
}: {
  you?: Point | null
  exit?: Point | null
}) {
  const centre = useTurn(centreOf(you, exit))
  const home = useMemo(() => countryAt(you), [you?.lat, you?.lon])
  const away = useMemo(() => countryAt(exit), [exit?.lat, exit?.lon])

  const projection = geoOrthographic()
    .scale(R)
    .translate([SIZE / 2, SIZE / 2])
    .rotate([-centre[0], -centre[1]])
    .clipAngle(90)
  const path = geoPath(projection)
  const dot = (p: Point) => (has(p) ? projection(lonLat(p)) : null)
  // only points on the near side: the clip hides the far one from paths, not from dots
  const visible = (p?: Point | null) =>
    has(p) && path({ type: "Point", coordinates: lonLat(p) }) != null
  const route =
    has(you) && has(exit)
      ? path({ type: "LineString", coordinates: [lonLat(you), lonLat(exit)] })
      : null
  const a = visible(you) ? dot(you!) : null
  const b = visible(exit) ? dot(exit!) : null

  return (
    <svg
      className="globe"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      aria-hidden="true">
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="var(--globe)" />
      <path
        d={path(graticule) ?? ""}
        stroke="var(--globe-grid)"
        strokeWidth="0.5"
      />
      {countries.map((c, i) => (
        <path
          key={i}
          d={path(c) ?? ""}
          fill={
            c === away
              ? "var(--exit-land)"
              : c === home
              ? "var(--home-land)"
              : "var(--land)"
          }
          stroke="var(--globe-edge)"
          strokeWidth="0.35"
        />
      ))}
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="var(--globe-edge)" />
      {route && (
        <path
          d={route}
          stroke="var(--selected)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      )}
      {a && (
        <circle
          cx={a[0]}
          cy={a[1]}
          r="3.5"
          fill="var(--marker)"
          stroke="var(--globe)"
        />
      )}
      {b && (
        <>
          <circle
            cx={b[0]}
            cy={b[1]}
            r="9"
            fill="var(--selected)"
            fillOpacity="0.18"
          />
          <circle
            cx={b[0]}
            cy={b[1]}
            r="4"
            fill="var(--selected)"
            stroke="var(--globe)"
          />
        </>
      )}
    </svg>
  )
}
