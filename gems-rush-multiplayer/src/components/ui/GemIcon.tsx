'use client'

import { useId } from 'react'
import { Gem, GemType } from '@/types/game'

type Pt = readonly [number, number]

interface Facet {
  pts: Pt[]
  // Direction the facet tilts toward, used for lighting.
  angle: number
  // How steeply it tilts: 0 = flat table, 1 = outermost facets.
  tilt: number
  // Star facets sit just off the table and catch extra light.
  lift?: number
}

interface Cut {
  outline: string
  table: Pt[]
  facets: Facet[]
  spark: Pt
}

const TAU = Math.PI * 2
// Key light from the upper left.
const LIGHT = (-130 * Math.PI) / 180

const polar = (cx: number, cy: number, a: number, r: number): Pt => [
  cx + Math.cos(a) * r,
  cy + Math.sin(a) * r
]

const centroid = (pts: Pt[]): Pt => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length
]

const toPath = (pts: Pt[]) =>
  'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z'

/**
 * Crown of a brilliant-style cut seen from above: table, star, kite and
 * upper-girdle facets. `r(a)` is the girdle radius in direction `a`, so one
 * generator serves round, hexagonal, marquise and trillion outlines.
 */
function brilliant(
  n: number,
  phase: number,
  cx: number,
  cy: number,
  r: (a: number) => number,
  tableK: number,
  starK: number
) {
  const step = TAU / n
  const theta = (k: number) => phase + k * step
  const phi = (k: number) => theta(k) + step / 2
  const T = (k: number) => polar(cx, cy, theta(k), tableK * r(theta(k)))
  const S = (k: number) => polar(cx, cy, phi(k), starK * r(phi(k)))
  const O = (k: number) => polar(cx, cy, theta(k), r(theta(k)))
  const M = (k: number) => polar(cx, cy, phi(k), r(phi(k)))

  const facets: Facet[] = []
  const table: Pt[] = []
  for (let k = 0; k < n; k++) {
    table.push(T(k))
    facets.push({ pts: [T(k), T(k + 1), S(k)], angle: phi(k), tilt: 0.45, lift: 0.12 })
    facets.push({ pts: [T(k), S(k - 1), O(k), S(k)], angle: theta(k), tilt: 0.75 })
    facets.push({ pts: [S(k), O(k), M(k)], angle: phi(k) - step / 4, tilt: 1 })
    facets.push({ pts: [S(k), M(k), O(k + 1)], angle: phi(k) + step / 4, tilt: 1 })
  }
  return { table, facets }
}

/** Girdle radius of a regular polygon whose first vertex points at `phase`. */
const polygonRadius = (sides: number, circumR: number, phase: number) => {
  const apothem = circumR * Math.cos(Math.PI / sides)
  const step = TAU / sides
  return (a: number) => {
    const rel = (((a - phase) % step) + step) % step
    return apothem / Math.cos(rel - step / 2)
  }
}

function roundBrilliant(): Cut {
  const { table, facets } = brilliant(8, -Math.PI / 2 + Math.PI / 8, 50, 50, () => 44, 0.5, 0.74)
  return {
    outline: 'M50 6A44 44 0 1 1 49.99 6Z',
    table,
    facets,
    spark: [36, 34]
  }
}

function hexagonal(): Cut {
  const r = polygonRadius(6, 46, 0)
  const { table, facets } = brilliant(6, 0, 50, 50, r, 0.5, 0.76)
  return {
    outline: toPath([0, 1, 2, 3, 4, 5].map(k => polar(50, 50, (k * TAU) / 6, 46))),
    table,
    facets,
    spark: [37, 37]
  }
}

function marquise(): Cut {
  // Vesica: two circles through the tips (50,4) and (50,96), half-width 31.
  const c = 18.6
  const R = 49.6
  const r = (a: number) => {
    const cos = Math.abs(Math.cos(a))
    return -c * cos + Math.sqrt(c * c * cos * cos + R * R - c * c)
  }
  const { table, facets } = brilliant(8, -Math.PI / 2, 50, 50, r, 0.5, 0.74)
  return {
    outline: `M50 4A${R} ${R} 0 0 1 50 96A${R} ${R} 0 0 1 50 4Z`,
    table,
    facets,
    spark: [42, 32]
  }
}

function trillion(): Cut {
  const cx = 50
  const cy = 59
  const R = 55
  const r = polygonRadius(3, R, -Math.PI / 2)
  const { table, facets } = brilliant(6, -Math.PI / 2, cx, cy, r, 0.48, 0.72)
  return {
    outline: toPath([0, 1, 2].map(k => polar(cx, cy, -Math.PI / 2 + (k * TAU) / 3, R))),
    table,
    facets,
    spark: [42, 46]
  }
}

/** Step cut: concentric octagonal rings stepping down to a long table. */
function emeraldCut(): Cut {
  const ring = (inset: number, corner: number): Pt[] => {
    const [x0, y0, x1, y1] = [17 + inset, 5 + inset, 83 - inset, 95 - inset]
    return [
      [x0 + corner, y0],
      [x1 - corner, y0],
      [x1, y0 + corner],
      [x1, y1 - corner],
      [x1 - corner, y1],
      [x0 + corner, y1],
      [x0, y1 - corner],
      [x0, y0 + corner]
    ]
  }
  const rings = [ring(0, 15), ring(6, 12), ring(12, 9), ring(18, 6)]
  const facets: Facet[] = []
  rings.slice(0, -1).forEach((outer, i) => {
    const inner = rings[i + 1]
    for (let j = 0; j < 8; j++) {
      const pts = [outer[j], outer[(j + 1) % 8], inner[(j + 1) % 8], inner[j]]
      const [mx, my] = centroid(pts)
      facets.push({ pts, angle: Math.atan2(my - 50, mx - 50), tilt: 1 - i * 0.25 })
    }
  })
  return { outline: toPath(rings[0]), table: rings[3], facets, spark: [40, 30] }
}

const CUTS: Record<GemType, Cut> = {
  fire: roundBrilliant(),
  water: emeraldCut(),
  earth: hexagonal(),
  nature: marquise(),
  lightning: trillion()
}

interface Palette {
  core: string
  mid: string
  edge: string
  light: string
  deep: string
}

const PALETTES: Record<GemType, Palette> = {
  // Ruby
  fire: { core: '#ff7080', mid: '#e01a3a', edge: '#4c0010', light: '#ffc9cf', deep: '#2a0008' },
  // Sapphire
  water: { core: '#6cc8ff', mid: '#1e6ee6', edge: '#0a2470', light: '#d6efff', deep: '#04133f' },
  // Topaz
  earth: { core: '#ffe08a', mid: '#f0a02a', edge: '#8a4608', light: '#fff4cf', deep: '#3d1c02' },
  // Emerald
  nature: { core: '#7dffb6', mid: '#14b866', edge: '#05552e', light: '#d9ffea', deep: '#012b16' },
  // Amethyst
  lightning: { core: '#dcb6ff', mid: '#9a55f5', edge: '#3f1180', light: '#f3e6ff', deep: '#1f0646' }
}

// Facet shading quantized into a few overlay levels so each gem draws a
// handful of merged paths instead of one node per facet.
const LEVELS = [-0.7, -0.45, -0.2, 0.15, 0.32, 0.5] as const

function shade(f: Facet) {
  const facing = Math.cos(f.angle - LIGHT)
  // Internal reflection throws light back out of the facets opposite the key light.
  const bounce = Math.pow(Math.max(0, -facing), 5) * 1.3
  return f.tilt * (facing * 0.8 + bounce) + (f.lift ?? 0)
}

function nearestLevel(v: number) {
  if (Math.abs(v) < 0.1) return null
  return LEVELS.reduce((best, l) => (Math.abs(l - v) < Math.abs(best - v) ? l : best))
}

const SHADED = Object.fromEntries(
  (Object.keys(CUTS) as GemType[]).map(type => {
    const cut = CUTS[type]
    const byLevel = new Map<number, string>()
    cut.facets.forEach(f => {
      const level = nearestLevel(shade(f))
      if (level === null) return
      byLevel.set(level, (byLevel.get(level) ?? '') + toPath(f.pts))
    })
    return [
      type,
      {
        layers: [...byLevel.entries()],
        edges: cut.facets.map(f => toPath(f.pts)).join('') + toPath(cut.table),
        table: toPath(cut.table)
      }
    ]
  })
) as Record<GemType, { layers: [number, string][]; edges: string; table: string }>

const hue = (angle: number) => Math.round(((angle * 180) / Math.PI + 450) % 360)

// Rainbow power-up: the round brilliant with each facet tinted by its direction.
const PRISM = [
  ...CUTS.fire.table.map((t, k, table) => ({
    d: toPath([[50, 50], t, table[(k + 1) % table.length]]),
    fill: `hsl(${hue(Math.atan2(t[1] - 50, t[0] - 50) + Math.PI / 8)} 90% 72%)`
  })),
  ...CUTS.fire.facets.map(f => ({
    d: toPath(f.pts),
    fill: `hsl(${hue(f.angle)} 95% ${Math.round(55 + shade(f) * 22)}%)`
  }))
]

const sparkle = ([x, y]: Pt, s: number) =>
  `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`

interface GemIconProps {
  type: GemType
  size?: number
  powerUp?: Gem['powerUpType']
  className?: string
}

export default function GemIcon({ type, size = 32, powerUp, className }: GemIconProps) {
  const id = useId()
  const cut = CUTS[type]
  const shaded = SHADED[type]
  const p = PALETTES[type]
  const rainbow = powerUp === 'rainbow'

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      overflow="visible"
    >
      <defs>
        <radialGradient id={`${id}b`} cx="50%" cy="56%" r="58%">
          <stop offset="0" stopColor={p.core} />
          <stop offset="0.5" stopColor={p.mid} />
          <stop offset="1" stopColor={p.edge} />
        </radialGradient>
        <linearGradient id={`${id}t`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={p.light} stopOpacity="0.75" />
          <stop offset="0.45" stopColor={p.light} stopOpacity="0.12" />
          <stop offset="1" stopColor={p.core} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.5" stopColor={p.mid} />
          <stop offset="1" stopColor={p.deep} />
        </linearGradient>
      </defs>

      {powerUp === 'bomb' && <BombAura />}
      {powerUp === 'lightning' && <circle cx="50" cy="50" r="50" fill="#5fd4ff" opacity="0.3" />}

      {rainbow ? (
        <g>
          {PRISM.map((f, i) => (
            <path key={i} d={f.d} fill={f.fill} />
          ))}
          <path d={shaded.table} fill="#fff" fillOpacity="0.35" />
          <path d={shaded.edges} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#fff" strokeWidth="2.4" />
        </g>
      ) : (
        <g>
          <path d={cut.outline} fill={`url(#${id}b)`} />
          {shaded.layers.map(([level, d]) => (
            <path
              key={level}
              d={d}
              fill={level > 0 ? p.light : p.deep}
              fillOpacity={Math.abs(level)}
            />
          ))}
          <path
            d={shaded.table}
            fill={`url(#${id}t)`}
            stroke={p.light}
            strokeOpacity="0.6"
            strokeWidth="1"
          />
          <path
            d={shaded.edges}
            fill="none"
            stroke={p.light}
            strokeOpacity="0.32"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          <path
            d={cut.outline}
            fill="none"
            stroke={`url(#${id}r)`}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </g>
      )}

      <path d={sparkle(cut.spark, 9)} fill="#fff" opacity="0.95" />
      <circle cx={cut.spark[0]} cy={cut.spark[1]} r="2.2" fill="#fff" />

      {powerUp === 'lightning' && <LightningBeams />}
    </svg>
  )
}

/** Row and column beams: the lightning gem clears both lines. */
function LightningBeams() {
  return (
    <g>
      <rect x="-4" y="45.5" width="108" height="9" rx="4.5" fill="#5fd4ff" opacity="0.85" />
      <rect x="45.5" y="-4" width="9" height="108" rx="4.5" fill="#5fd4ff" opacity="0.85" />
      <rect x="-4" y="48.25" width="108" height="3.5" rx="1.75" fill="#fff" />
      <rect x="48.25" y="-4" width="3.5" height="108" rx="1.75" fill="#fff" />
      <animate attributeName="opacity" values="1;0.45;1" dur="1.1s" repeatCount="indefinite" />
    </g>
  )
}

/** Burning ring: the bomb gem clears its 3x3 neighbourhood. */
function BombAura() {
  return (
    <g>
      <circle cx="50" cy="50" r="50" fill="#ff8a1f" opacity="0.28">
        <animate attributeName="opacity" values="0.28;0.08;0.28" dur="0.9s" repeatCount="indefinite" />
      </circle>
      <circle
        cx="50"
        cy="50"
        r="49"
        fill="none"
        stroke="#ffb347"
        strokeWidth="3.5"
        strokeDasharray="10 7"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  )
}
