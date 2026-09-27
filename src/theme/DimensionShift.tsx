import { useMemo, useRef } from 'react'
import { gsap, useGSAP } from '../lib/motion'
import type { Hero, HeroTheme, ShiftStyle } from '../config/characters'
import { jagged, rng, webPaths } from '../components/art/geometry'
import type { ShiftOrigin } from './heroContext'
import './DimensionShift.css'

export interface ShiftRequest {
  key: number
  hero: Hero | null
  theme: HeroTheme
  origin: ShiftOrigin
}

interface Props {
  request: ShiftRequest | null
  /** Called when the screen is fully covered — the moment to swap the world underneath. */
  onPeak: () => void
  onDone: () => void
}

type WashShape = 'circle' | 'top' | 'left' | 'diamond' | 'hex' | 'fade'

const WASH: Record<ShiftStyle, WashShape> = {
  web: 'circle',
  scan: 'top',
  portal: 'circle',
  geometric: 'diamond',
  lightning: 'fade',
  shockwave: 'circle',
  shield: 'circle',
  photon: 'circle',
  hex: 'hex',
  branch: 'left',
  glitch: 'fade',
  comic: 'circle',
}

/** Polygon clip-path of an n-gon of radius r around (x, y) */
function polygon(n: number, x: number, y: number, r: number, rot = 0): string {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2
    return `${(x + Math.cos(a) * r).toFixed(1)}px ${(y + Math.sin(a) * r).toFixed(1)}px`
  })
  return `polygon(${pts.join(',')})`
}

function washFrames(shape: WashShape, x: number, y: number, w: number, h: number): [string, string] | null {
  const far = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) * 1.05
  switch (shape) {
    case 'circle':
      return [`circle(0px at ${x}px ${y}px)`, `circle(${far}px at ${x}px ${y}px)`]
    case 'top':
      return ['inset(0 0 100% 0)', 'inset(0 0 0% 0)']
    case 'left':
      return ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
    case 'diamond':
      return [polygon(4, x, y, 0), polygon(4, x, y, far * 1.45)]
    case 'hex':
      return [polygon(6, x, y, 0, Math.PI / 6), polygon(6, x, y, far * 1.2, Math.PI / 6)]
    default:
      return null
  }
}

/** Style-specific vector effects, drawn in viewport pixels. */
function Fx({ style, x, y, w, h, seed }: { style: ShiftStyle; x: number; y: number; w: number; h: number; seed: number }) {
  const far = Math.hypot(w, h)
  const r = rng(seed)
  switch (style) {
    case 'web':
      return (
        <g className="ds-draw" stroke="var(--ds-c2)" strokeWidth="1.6" fill="none">
          {webPaths(x, y, { spokes: 16, rings: 10, gap: far / 13 }).map((d, i) => (
            <path key={i} d={d} pathLength={1} />
          ))}
        </g>
      )
    case 'scan':
      return (
        <g>
          <g className="ds-draw" stroke="var(--ds-c1)" strokeOpacity=".5" strokeWidth="1">
            {Array.from({ length: Math.ceil(h / 48) }, (_, i) => (
              <path key={i} d={`M0 ${i * 48}H${w}`} pathLength={1} />
            ))}
          </g>
          <rect className="ds-scanbar" x="0" y="-4" width={w} height="4" fill="#fff" />
          <g className="ds-pop" fill="none" stroke="var(--ds-c1)" strokeWidth="2">
            <circle cx={x} cy={y} r="60" />
            <circle cx={x} cy={y} r="110" strokeDasharray="4 10" />
            <path d={`M${x - 150} ${y}H${x - 70}M${x + 70} ${y}H${x + 150}M${x} ${y - 150}V${y - 70}M${x} ${y + 70}V${y + 150}`} />
          </g>
        </g>
      )
    case 'portal':
      return (
        <g className="ds-rings" fill="none" stroke="var(--ds-c1)">
          {[0.12, 0.2, 0.3].map((f, i) => (
            <circle
              key={f}
              cx={x}
              cy={y}
              r={far * f}
              strokeWidth={4 - i}
              strokeDasharray={`${2 + i * 3} ${8 + i * 4}`}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
          <rect
            x={x - far * 0.1}
            y={y - far * 0.1}
            width={far * 0.2}
            height={far * 0.2}
            strokeWidth="2"
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        </g>
      )
    case 'geometric':
    case 'hex':
      return (
        <g className="ds-rings" fill="none" stroke="var(--ds-c2)" strokeWidth="1.5">
          {[0.06, 0.12, 0.2, 0.3].map((f) => (
            <path
              key={f}
              d={polygon(style === 'hex' ? 6 : 3, x, y, far * f, style === 'hex' ? Math.PI / 6 : -Math.PI / 2)
                .replace('polygon(', 'M')
                .replace(/px/g, '')
                .replace(/,/g, 'L')
                .replace(')', 'Z')}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
        </g>
      )
    case 'lightning': {
      const top = x + (r() - 0.5) * w * 0.4
      return (
        <g className="ds-draw" fill="none" stroke="#eaf4ff" strokeWidth="3" strokeLinejoin="round">
          <path d={jagged(top, 0, x, y, 12, 90, r)} pathLength={1} />
          <path d={jagged(x, y, x + w * 0.25, h, 9, 70, r)} pathLength={1} strokeWidth="2" />
          <path d={jagged(x, y, x - w * 0.3, h * 0.9, 9, 70, r)} pathLength={1} strokeWidth="1.5" />
        </g>
      )
    }
    case 'shockwave':
    case 'shield':
      return (
        <g className="ds-rings" fill="none">
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={far * (0.08 + i * 0.07)}
              stroke={style === 'shield' ? (i % 2 ? '#f5f5f5' : 'var(--ds-c2)') : 'var(--ds-c1)'}
              strokeWidth={style === 'shield' ? 26 : 8 - i * 1.5}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
        </g>
      )
    case 'photon':
      return (
        <g className="ds-rays" stroke="var(--ds-c1)" strokeWidth="2">
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2
            const len = far * (0.4 + r() * 0.5)
            return (
              <path
                key={i}
                d={`M${x} ${y}L${x + Math.cos(a) * len} ${y + Math.sin(a) * len}`}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            )
          })}
        </g>
      )
    case 'branch':
      return (
        <g className="ds-draw" fill="none" stroke="var(--ds-c1)" strokeWidth="2">
          {Array.from({ length: 7 }, (_, i) => {
            const y0 = h * (0.2 + i * 0.1)
            const bx = w * (0.25 + r() * 0.4)
            return (
              <g key={i}>
                <path d={`M0 ${y0}C${w * 0.3} ${y0 + 20} ${w * 0.6} ${y0 - 20} ${w} ${y0}`} pathLength={1} />
                <path
                  d={`M${bx} ${y0}C${bx + 80} ${y0} ${bx + 160} ${y0 + (r() - 0.5) * 240} ${w} ${y0 + (r() - 0.5) * 300}`}
                  pathLength={1}
                  stroke="var(--ds-c2)"
                />
              </g>
            )
          })}
        </g>
      )
    case 'glitch':
      return (
        <g className="ds-bars">
          {Array.from({ length: 14 }, (_, i) => (
            <rect
              key={i}
              x="0"
              y={(h / 14) * i}
              width={w}
              height={h / 14 + 1}
              fill={i % 3 === 0 ? 'var(--ds-c2)' : i % 3 === 1 ? 'var(--ds-c1)' : 'var(--ds-bg)'}
            />
          ))}
        </g>
      )
    case 'comic': {
      const pts = Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2
        const rr = i % 2 ? far * 0.07 : far * (0.12 + r() * 0.05)
        return `${i ? 'L' : 'M'}${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`
      })
      return (
        <g className="ds-pop">
          <path d={pts.join('') + 'Z'} fill="#f5f5f5" stroke="#0a0a0a" strokeWidth="6" style={{ transformOrigin: `${x}px ${y}px` }} />
          <text x={x} y={y + 14} textAnchor="middle" className="ds-bang">
            KAPOW!
          </text>
        </g>
      )
    }
  }
}

export default function DimensionShift({ request, onPeak, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const size = useMemo(() => (request ? { w: window.innerWidth, h: window.innerHeight } : { w: 0, h: 0 }), [request])

  useGSAP(
    () => {
      const el = root.current
      if (!request || !el) return
      const { w, h } = size
      const { x, y } = request.origin
      const style = request.theme.shift
      const wash = el.querySelector<HTMLElement>('.ds-wash')
      const frames = washFrames(WASH[style], x, y, w, h)
      const PEAK = 0.55

      const tl = gsap.timeline({ onComplete: onDone })
      tl.set(el, { autoAlpha: 1 })

      // 1. Cover the screen in the new dimension
      if (frames) tl.fromTo(wash, { clipPath: frames[0] }, { clipPath: frames[1], duration: PEAK, ease: 'power3.in' }, 0)
      else tl.fromTo(wash, { opacity: 0 }, { opacity: 1, duration: PEAK * 0.8, ease: 'power2.in' }, 0.12)

      // 2. Style-specific effects (only the ones this style rendered)
      const has = (sel: string) => el.querySelector(sel) !== null
      if (has('.ds-draw path'))
        tl.fromTo(
          '.ds-draw path',
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.6, stagger: 0.012, ease: 'power2.out' },
          0,
        )
      if (has('.ds-rings'))
        tl.fromTo(
          '.ds-rings > *',
          { scale: 0.2, opacity: 0 },
          { scale: 1.6, opacity: 1, rotate: 40, duration: 0.8, stagger: 0.06, ease: 'expo.out' },
          0,
        )
      if (has('.ds-rays')) tl.fromTo('.ds-rays path', { scale: 0 }, { scale: 1, duration: 0.6, stagger: 0.008, ease: 'expo.out' }, 0)
      if (has('.ds-pop'))
        tl.fromTo(
          '.ds-pop',
          { scale: 0.4, opacity: 0, transformOrigin: `${x}px ${y}px` },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' },
          0.05,
        )
      if (has('.ds-scanbar')) tl.fromTo('.ds-scanbar', { y: 0 }, { y: h, duration: PEAK, ease: 'power3.in' }, 0)
      if (has('.ds-bars')) {
        tl.fromTo(
          '.ds-bars rect',
          { xPercent: (i: number) => (i % 2 ? -100 : 100) },
          { xPercent: 0, duration: 0.4, stagger: { each: 0.02, from: 'random' }, ease: 'power3.out' },
          0,
        )
        tl.to(
          '.ds-bars rect',
          { xPercent: (i: number) => (i % 2 ? 100 : -100), duration: 0.4, stagger: { each: 0.02, from: 'random' }, ease: 'power3.in' },
          PEAK + 0.1,
        )
      }
      if (style === 'lightning') {
        tl.fromTo('.ds-flash', { opacity: 0 }, { opacity: 0.9, duration: 0.05, repeat: 3, yoyo: true, ease: 'none' }, 0.08)
      } else {
        tl.fromTo('.ds-flash', { opacity: 0 }, { opacity: 0.35, duration: 0.12, yoyo: true, repeat: 1 }, PEAK - 0.06)
      }
      if (style === 'shockwave') {
        const main = document.querySelector('main')
        if (main)
          tl.fromTo(main, { x: -14, y: 6 }, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.25)', clearProps: 'transform' }, PEAK)
      }

      // 3. Title card
      tl.fromTo('.ds-mask > span', { yPercent: 110 }, { yPercent: 0, duration: 0.45, stagger: 0.06, ease: 'expo.out' }, 0.18)

      // 4. Swap the world underneath, then reveal it
      tl.add(onPeak, PEAK)
      tl.to(wash, { opacity: 0, duration: 0.6, ease: 'power2.out' }, PEAK + 0.08)
      tl.to('.ds-fx', { opacity: 0, duration: 0.5 }, PEAK + 0.12)
      tl.to('.ds-title', { opacity: 0, y: -24, duration: 0.4, ease: 'power2.in' }, PEAK + 0.3)
      tl.set(el, { autoAlpha: 0 })
    },
    { scope: root, dependencies: [request], revertOnUpdate: true },
  )

  if (!request) return null
  const { theme, hero, origin } = request
  return (
    <div
      className="ds"
      ref={root}
      aria-hidden="true"
      style={{ '--ds-c1': theme.accent, '--ds-c2': theme.accent2, '--ds-bg': theme.bg, '--ox': `${origin.x}px`, '--oy': `${origin.y}px` }}
    >
      <div className="ds-wash" />
      <svg className="ds-fx" viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h}>
        <Fx style={theme.shift} x={origin.x} y={origin.y} w={size.w} h={size.h} seed={request.key % 997} />
      </svg>
      <div className="ds-flash" />
      <div className="ds-title">
        <span className="ds-mask ds-code">
          <span>Dimension shift // {hero ? hero.code : 'Multiverse'}</span>
        </span>
        <span className="ds-mask ds-name">
          <span>{hero ? hero.name : 'The Multiverse'}</span>
        </span>
        {hero && (
          <span className="ds-mask ds-tag">
            <span>“{hero.tagline}”</span>
          </span>
        )}
      </div>
    </div>
  )
}
