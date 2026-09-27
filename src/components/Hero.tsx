import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowDown, Check } from 'lucide-react'
import { gsap, useGSAP, isTouch, prefersReducedMotion, scrollToTarget } from '../lib/motion'
import { useScramble } from '../hooks/useScramble'
import { eventConfig } from '../config/eventConfig'
import { heroes } from '../config/characters'
import { useHero } from '../theme/heroContext'
import { HeroPortrait } from './art/CharacterArt'
import { HeroEmblem } from './art/emblems'
import Magnetic from './ui/Magnetic'
import './Hero.css'

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const { active, select } = useHero()
  const [granted, setGranted] = useState(false)
  const [cta, scrambleCta] = useScramble('ENTER THE EVENT')
  const intro = useRef<gsap.core.Timeline | null>(null)
  const flash = useRef<HTMLSpanElement>(null)

  // Build intro + scroll timelines once; play the intro when the loader finishes.
  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      intro.current = gsap
        .timeline({ paused: true, defaults: { ease: 'expo.out', duration: reduced ? 0.01 : 1.4 } })
        .from('.hero-char-wrap', { scale: 1.25, opacity: 0, filter: 'blur(20px)', duration: reduced ? 0.01 : 2 }, 0)
        .from('.hero-glow', { opacity: 0, scale: 0.6, duration: 2 }, 0)
        .from('.hero-title .mask-inner', { yPercent: 110, stagger: 0.1 }, 0.15)
        .from('.hero-reveal', { y: 24, opacity: 0, stagger: 0.07, duration: 1 }, 0.55)
        .from('.hero-hud > *', { opacity: 0, duration: 0.6, stagger: 0.05 }, 0.8)
        .from('.hero-reticle', { opacity: 0, rotate: -90, scale: 0.7, duration: 1.8 }, 0.4)

      if (reduced) return
      // Scroll-out: text lifts quicker than the character → depth
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
        .to('.hero-content', { yPercent: -35, opacity: 0, ease: 'none' }, 0)
        .to('.hero-char-scroll', { yPercent: 18, scale: 1.08, ease: 'none' }, 0)
        .to('.hero-hud', { opacity: 0, ease: 'none' }, 0)
    },
    { scope: root },
  )

  useEffect(() => {
    if (ready) intro.current?.play()
  }, [ready])

  // Mouse parallax: background, character and text move at different depths.
  useEffect(() => {
    if (isTouch() || prefersReducedMotion()) return
    const el = root.current
    if (!el) return
    const depths: [string, number][] = [
      ['.hero-bg-move', 14],
      ['.hero-char-move', 28],
      ['.hero-reticle-move', 40],
      ['.hero-text-move', -14],
    ]
    const layers = depths.map(([sel, depth]) => {
      const node = el.querySelector(sel)
      return {
        depth,
        x: gsap.quickTo(node, 'x', { duration: 1.2, ease: 'power3' }),
        y: gsap.quickTo(node, 'y', { duration: 1.2, ease: 'power3' }),
      }
    })
    const rot = gsap.quickTo(el.querySelector('.hero-char-move'), 'rotationY', { duration: 1.2, ease: 'power3' })
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      layers.forEach((l) => {
        l.x(nx * l.depth)
        l.y(ny * l.depth)
      })
      rot(nx * 8)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const enter = () => {
    if (granted) return
    setGranted(true)
    scrambleCta('ACCESS GRANTED')
    gsap.fromTo(flash.current, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'expo.out', transformOrigin: 'left' })
    setTimeout(() => scrollToTarget('#event', { duration: 1.6 }), 650)
    setTimeout(() => {
      setGranted(false)
      scrambleCta('ENTER THE EVENT')
      gsap.set(flash.current, { scaleX: 0 })
    }, 3200)
  }

  return (
    <section className="hero" id="top" ref={root} aria-label="The Multiverse Is Open">
      {/* ── Background layers ── */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg-move">
          <div className="hero-grid" />
        </div>
        <div className="hero-streak s1" />
        <div className="hero-streak s2" />
        <div className="hero-streak s3" />
      </div>

      {/* ── Character ── */}
      <div className="hero-char-scroll">
        <div className="hero-char-move" aria-hidden="true">
          <div className="hero-glow" />
          {active ? (
            <div className="hero-char-wrap is-hero" key={active.id}>
              <HeroPortrait hero={active} className="hero-char" />
            </div>
          ) : (
            <div className="hero-char-wrap is-core" key="core">
              <MultiverseCore />
            </div>
          )}
        </div>
        <div className="hero-reticle-move">
          <nav className="hero-orbit" aria-label="Jump straight into a hero's world">
            {heroes.map((h, i) => (
              <button
                key={h.id}
                className={`orbit-item ${h.id === active?.id ? 'is-active' : ''}`}
                style={{ '--i': i, '--c1': h.theme.accent }}
                onClick={(e) => select(h.id, { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 })}
                aria-label={`Enter ${h.name}'s world`}
                aria-pressed={h.id === active?.id}
                data-cursor={h.name}
              >
                <span className="orbit-inner">
                  <HeroEmblem id={h.id} className="orbit-emblem" />
                </span>
              </button>
            ))}
          </nav>
          <svg className="hero-reticle" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="96" />
            <circle cx="100" cy="100" r="80" strokeDasharray="2 6" />
            <path d="M100 0v14M100 186v14M0 100h14M186 100h14" />
          </svg>
          <span className="hero-lock mono" aria-hidden="true">
            <span className="pulse-dot" /> {active ? `Active hero // ${active.name}` : 'Target // Earth-616'} · Locked
          </span>
        </div>
      </div>

      <div className="hero-vignette" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="hero-content container">
        <div className="hero-text-move">
          <p className="hero-reveal eyebrow">
            {active ? active.code : eventConfig.universeCode} <span className="accent">//</span>{' '}
            {active ? `Active hero: ${active.name}` : eventConfig.university}
          </p>
          <h1 className="hero-title display display-xl">
            <span className="mask">
              <span className="mask-inner">The</span>
            </span>
            <span className="mask">
              <span className="mask-inner hero-title-outline">Multiverse</span>
            </span>
            <span className="mask">
              <span className="mask-inner">
                Is open<span className="accent">.</span>
              </span>
            </span>
          </h1>
          <div className="hero-bottom">
            <p className="hero-presents hero-reveal">
              <span>{eventConfig.organiser}</span>
              <span className="muted">Presents</span>
              {active && (
                <span className="hero-quote accent" key={active.id}>
                  “{active.tagline}”
                </span>
              )}
            </p>
            <div className="hero-reveal">
              <Magnetic>
                <button className={`btn btn-bracket hero-cta ${granted ? 'is-granted' : ''}`} onClick={enter} data-cursor="Go">
                  <span className="hero-cta-flash" ref={flash} aria-hidden="true" />
                  <span aria-hidden="true">[</span>
                  <span className="hero-cta-text" aria-live="polite">
                    {cta}
                  </span>
                  {granted ? <Check size={18} /> : <ArrowRight size={18} />}
                  <span aria-hidden="true">]</span>
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
      </div>

      {/* ── HUD frame ── */}
      <div className="hero-hud" aria-hidden="true">
        <span className="hud-tl mono">
          <span className="pulse-dot" /> {active ? active.status[0] : 'Multiverse signal detected'}
        </span>
        <span className="hud-tr mono">
          {eventConfig.coordinates.lat} · {eventConfig.coordinates.lng}
        </span>
        <span className="hud-bl mono">
          <ArrowDown size={14} className="hud-bounce" /> Scroll to enter
        </span>
        <span className="hud-br mono">
          {active ? (
            <>
              {active.status[1]}
              <br />
              <b className="accent">{active.status[2]}</b>
            </>
          ) : (
            <>
              Signal strength // <b>100%</b>
              <br />
              Threat level // <b className="accent">Unknown</b>
            </>
          )}
        </span>
      </div>
    </section>
  )
}

/** Default hero visual before any hero is chosen: a portal ringed with every hero's colour. */
function MultiverseCore() {
  const arc = (i: number) => {
    const a0 = (i / heroes.length) * Math.PI * 2 - Math.PI / 2 + 0.04
    const a1 = ((i + 1) / heroes.length) * Math.PI * 2 - Math.PI / 2 - 0.04
    const r = 150
    return `M${200 + Math.cos(a0) * r} ${250 + Math.sin(a0) * r}A${r} ${r} 0 0 1 ${200 + Math.cos(a1) * r} ${250 + Math.sin(a1) * r}`
  }
  return (
    <svg className="hero-char core-svg" viewBox="0 0 400 500">
      <defs>
        <radialGradient id="core-glow">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".25" stopColor="var(--accent)" stopOpacity=".55" />
          <stop offset=".7" stopColor="var(--accent-2)" stopOpacity=".08" />
          <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="250" r="190" fill="url(#core-glow)" className="core-pulse" />
      <g className="spin-slow" style={{ transformOrigin: '200px 250px' }} fill="none" strokeWidth="6" strokeLinecap="round">
        {heroes.map((h, i) => (
          <path key={h.id} d={arc(i)} stroke={h.theme.accent} />
        ))}
      </g>
      <g className="spin-rev" style={{ transformOrigin: '200px 250px' }} fill="none" stroke="#f5f5f5" strokeOpacity=".35">
        <circle cx="200" cy="250" r="120" strokeDasharray="2 8" />
        <circle cx="200" cy="250" r="176" strokeDasharray="1 5" />
        <rect x="115" y="165" width="170" height="170" transform="rotate(45 200 250)" />
      </g>
      <circle cx="200" cy="250" r="70" fill="#050505" stroke="#f5f5f5" strokeOpacity=".6" />
      <text x="200" y="246" textAnchor="middle" className="core-count">
        {heroes.length}
      </text>
      <text x="200" y="272" textAnchor="middle" className="core-label">
        VARIANTS
      </text>
    </svg>
  )
}
