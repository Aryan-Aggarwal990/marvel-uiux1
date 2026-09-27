/** Minimal 64×64 hero emblems drawn in currentColor — used in the lineup, nav badge and roster ring. */
import type { ReactElement } from 'react'
import type { HeroId } from '../../config/characters'

const star = (cx: number, cy: number, r: number, points = 5, inner = 0.42) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = (i * Math.PI) / points - Math.PI / 2
    const rr = i % 2 ? r * inner : r
    return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`
  }).join('') + 'Z'

const spider = (
  <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <ellipse cx="32" cy="24" rx="4" ry="5" fill="currentColor" stroke="none" />
    <ellipse cx="32" cy="36" rx="5.5" ry="8" fill="currentColor" stroke="none" />
    <path d="M28 28L16 16L14 6M36 28L48 16L50 6M28 32L12 28L6 20M36 32L52 28L58 20M28 38L12 44L6 54M36 38L52 44L58 54M29 42L20 52L18 60M35 42L44 52L46 60" />
  </g>
)

const EMBLEMS: Record<HeroId, ReactElement> = {
  spiderman: spider,
  miles: (
    <g>
      <g transform="translate(-2 1)" opacity=".5" color="#3df0ff">
        {spider}
      </g>
      {spider}
    </g>
  ),
  ironman: (
    <g fill="none" stroke="currentColor" strokeWidth="3">
      <circle cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="14" />
      <path d="M32 20L44 40H20Z" fill="currentColor" fillOpacity=".25" />
    </g>
  ),
  strange: (
    <g fill="none" stroke="currentColor" strokeWidth="3">
      <circle cx="32" cy="32" r="26" strokeDasharray="4 4" />
      <path d="M12 32Q32 14 52 32Q32 50 12 32Z" />
      <circle cx="32" cy="32" r="6" fill="currentColor" />
    </g>
  ),
  panther: (
    <g fill="currentColor">
      <path d="M14 10L24 10L36 54L28 54Z" />
      <path d="M28 8L36 8L48 52L40 52Z" opacity=".75" />
      <path d="M42 12L50 12L58 44L52 44Z" opacity=".5" />
    </g>
  ),
  thor: (
    <g fill="currentColor">
      <rect x="12" y="10" width="40" height="22" rx="3" />
      <rect x="29" y="32" width="6" height="26" rx="2" />
    </g>
  ),
  hulk: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
      <path d="M32 6L36 24L54 14L42 30L60 34L40 38L50 56L32 42L14 56L24 38L4 34L22 30L10 14L28 24Z" fill="currentColor" fillOpacity=".25" />
    </g>
  ),
  cap: (
    <g>
      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" strokeWidth="3" opacity=".6" />
      <path d={star(32, 32, 12)} fill="currentColor" />
    </g>
  ),
  marvel: (
    <g>
      <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d={star(32, 32, 20, 8, 0.4)} fill="currentColor" />
    </g>
  ),
  wanda: <path d="M6 44L14 12L24 30L32 34L40 30L50 12L58 44L46 40L38 46L32 56L26 46L18 40Z" fill="currentColor" />,
  loki: (
    <g fill="currentColor">
      <path d="M26 30C20 20 12 8 2 4C10 12 16 22 20 34Z" />
      <path d="M38 30C44 20 52 8 62 4C54 12 48 22 44 34Z" />
      <path d="M18 36C18 26 24 22 32 22C40 22 46 26 46 36L42 58H22Z" />
    </g>
  ),
  deadpool: (
    <g>
      <circle cx="32" cy="32" r="27" fill="currentColor" />
      <rect x="29" y="5" width="6" height="54" fill="#0a0a0a" />
      <path d="M27 30C24 22 18 19 12 21C12 30 18 35 26 34Z M37 30C40 22 46 19 52 21C52 30 46 35 38 34Z" fill="#0a0a0a" />
    </g>
  ),
}

export function HeroEmblem({ id, className }: { id: HeroId; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      {EMBLEMS[id]}
    </svg>
  )
}
