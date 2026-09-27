import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowDown, Check } from 'lucide-react'
import { gsap, isTouch, prefersReducedMotion, scrollToTarget } from '../lib/motion'
import { useGsap } from '../hooks/useGsap'
import { useScramble } from '../hooks/useScramble'
import { eventConfig } from '../config/eventConfig'
import { CharacterVisual, WebBackdrop } from './art/CharacterArt'
import Particles from './ui/Particles'
import Magnetic from './ui/Magnetic'
import './Hero.css'

export default function Hero({ ready }) {
  const root = useRef(null)
  const [granted, setGranted] = useState(false)
  const [cta, scrambleCta] = useScramble('ENTER THE EVENT')
  const intro = useRef(null)

  // Build intro + scroll timelines once; play the intro when the loader finishes.
  useGsap(() => {
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
      .to('.hero-web', { scale: 1.2, opacity: 0, ease: 'none' }, 0)
      .to('.hero-hud', { opacity: 0, ease: 'none' }, 0)
  }, root)

  useEffect(() => {
    if (ready) intro.current?.play()
  }, [ready])

  // Mouse parallax: background, character and text move at different depths.
  useEffect(() => {
    if (isTouch() || prefersReducedMotion()) return
    const el = root.current
    const layers = [
      ['.hero-bg-move', 14],
      ['.hero-char-move', 28],
      ['.hero-reticle-move', 40],
      ['.hero-text-move', -14],
    ].map(([sel, depth]) => {
      const node = el.querySelector(sel)
      return {
        depth,
        x: gsap.quickTo(node, 'x', { duration: 1.2, ease: 'power3' }),
        y: gsap.quickTo(node, 'y', { duration: 1.2, ease: 'power3' }),
      }
    })
    const rot = gsap.quickTo(el.querySelector('.hero-char-move'), 'rotationY', { duration: 1.2, ease: 'power3' })
    const onMove = (e) => {
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
    gsap.fromTo('.hero-cta-flash', { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'expo.out', transformOrigin: 'left' })
    setTimeout(() => scrollToTarget('#event', { duration: 1.6 }), 650)
    setTimeout(() => {
      setGranted(false)
      scrambleCta('ENTER THE EVENT')
      gsap.set('.hero-cta-flash', { scaleX: 0 })
    }, 3200)
  }

  return (
    <section className="hero" id="top" ref={root} aria-label="The Multiverse Is Open">
      {/* ── Background layers ── */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg-move">
          <div className="hero-grid" />
          <WebBackdrop className="hero-web" />
        </div>
        <div className="hero-streak s1" />
        <div className="hero-streak s2" />
        <div className="hero-streak s3" />
        <Particles className="hero-particles" />
      </div>

      {/* ── Character ── */}
      <div className="hero-char-scroll" aria-hidden="true">
        <div className="hero-char-move">
          <div className="hero-glow" />
          <div className="hero-char-wrap">
            <CharacterVisual id="spiderman" image={eventConfig.images.hero} alt="" className="hero-char" />
          </div>
        </div>
        <div className="hero-reticle-move">
          <svg className="hero-reticle" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="96" />
            <circle cx="100" cy="100" r="80" strokeDasharray="2 6" />
            <path d="M100 0v14M100 186v14M0 100h14M186 100h14" />
          </svg>
          <span className="hero-lock mono">
            <span className="pulse-dot" /> TARGET // EARTH-616 · LOCKED
          </span>
        </div>
      </div>

      <div className="hero-vignette" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="hero-content container">
        <div className="hero-text-move">
          <p className="hero-reveal eyebrow">
            {eventConfig.universeCode} <span className="red">//</span> {eventConfig.university}
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
                Is open<span className="red">.</span>
              </span>
            </span>
          </h1>
          <div className="hero-bottom">
            <p className="hero-presents hero-reveal">
              <span>{eventConfig.organiser}</span>
              <span className="muted">Presents</span>
            </p>
            <div className="hero-reveal">
              <Magnetic>
                <button className={`btn btn-bracket hero-cta ${granted ? 'is-granted' : ''}`} onClick={enter} data-cursor="Go">
                  <span className="hero-cta-flash" aria-hidden="true" />
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
          <span className="pulse-dot" /> Multiverse signal detected
        </span>
        <span className="hud-tr mono">
          {eventConfig.coordinates.lat} · {eventConfig.coordinates.lng}
        </span>
        <span className="hud-bl mono">
          <ArrowDown size={14} className="hud-bounce" /> Scroll to enter
        </span>
        <span className="hud-br mono">
          Signal strength // <b>100%</b>
          <br />
          Threat level // <b className="red">Unknown</b>
        </span>
      </div>
    </section>
  )
}
