import { useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import './Loader.css'

const BLOCKS = 20

/** Cinematic boot sequence (~2.4s). Calls onDone when the screen has cleared. */
interface LoaderProps {
  /** Fired as the panels start to clear — the site can begin its intro. */
  onReveal: () => void
  /** Fired once the loader is fully gone and can be unmounted. */
  onDone: () => void
}

export default function Loader({ onReveal, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const status = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      const counter = { v: 0 }
      const render = () => {
        const filled = Math.round((counter.v / 100) * BLOCKS)
        if (!bar.current || !pct.current) return
        bar.current.textContent = '█'.repeat(filled) + '░'.repeat(BLOCKS - filled)
        pct.current.textContent = `${String(Math.round(counter.v)).padStart(3, '0')}%`
      }
      render()

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.ld-line', { yPercent: 110, duration: reduced ? 0.01 : 0.5, stagger: 0.08 })
        .from('.ld-bar-wrap', { opacity: 0, duration: 0.2 }, '-=0.2')
        .to(counter, { v: 100, duration: reduced ? 0.2 : 1.1, ease: 'power2.inOut', onUpdate: render })
        .to('.ld-status', { opacity: 0, duration: 0.12 })
        .add(() => {
          if (status.current) status.current.textContent = 'SYSTEM ONLINE'
        })
        .to('.ld-status', { opacity: 1, color: '#3cff8f', duration: 0.12 })
        .to('.ld-status', { opacity: 0.3, duration: 0.06, repeat: 3, yoyo: true })
        .to('.ld-inner', { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' }, '+=0.15')
        .add(onReveal)
        .to('.ld-panel', { scaleY: 0, duration: reduced ? 0.01 : 0.8, ease: 'expo.inOut', stagger: 0.06 })
        .add(onDone)
    },
    { scope: root },
  )

  return (
    <div className="loader" ref={root} role="status" aria-live="polite">
      <div className="ld-panels" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span className="ld-panel" key={i} />
        ))}
      </div>
      <div className="ld-inner">
        <p className="mask mono ld-top">
          <span className="mask-inner ld-line">
            GFG <span className="accent">//</span> {eventConfig.universeCode}
          </span>
        </p>
        <p className="mask ld-title">
          <span className="mask-inner ld-line ld-status" ref={status}>
            INITIALIZING MULTIVERSE...
          </span>
        </p>
        <div className="ld-bar-wrap mono">
          <span>[</span>
          <span className="ld-bar" ref={bar} />
          <span>]</span>
          <span className="ld-pct" ref={pct} />
        </div>
        <p className="mask mono ld-meta">
          <span className="mask-inner ld-line">PROTOCOL // {eventConfig.protocol} &nbsp;·&nbsp; SIGNAL // LOCKED</span>
        </p>
      </div>
    </div>
  )
}
