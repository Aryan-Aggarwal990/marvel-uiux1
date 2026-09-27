import { useMemo, useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import Magnetic from './ui/Magnetic'
import './Location.css'

/* Deterministic pseudo-random so the "map" is identical every render */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function MapArt() {
  const { streets, blocks } = useMemo(() => {
    const r = rng(616)
    const streets: string[] = []
    for (let x = -200; x < 1400; x += 38 + r() * 40) streets.push(`M${x} -50L${x + 180} 800`)
    for (let y = -100; y < 800; y += 34 + r() * 36) streets.push(`M-50 ${y}L1250 ${y - 160}`)
    const blocks = Array.from({ length: 70 }, () => ({
      x: r() * 1200,
      y: r() * 700,
      w: 14 + r() * 40,
      h: 10 + r() * 30,
      o: 0.03 + r() * 0.06,
    }))
    return { streets, blocks }
  }, [])

  return (
    <svg className="loc-map" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="#f5f5f5">
        {blocks.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} opacity={b.o} transform={`rotate(-8 ${b.x} ${b.y})`} />
        ))}
      </g>
      <g stroke="#f5f5f5" strokeOpacity=".06" strokeWidth="1" fill="none">
        {streets.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* river + arterial roads */}
      <path d="M-40 120C200 200 320 90 520 160S860 330 1240 250" fill="none" stroke="#1b2a3a" strokeWidth="26" strokeOpacity=".7" />
      <path className="loc-road" d="M-20 610L1220 90" fill="none" stroke="#f5f5f5" strokeOpacity=".22" strokeWidth="3" />
      <path className="loc-road" d="M140 -20L420 720" fill="none" stroke="#f5f5f5" strokeOpacity=".14" strokeWidth="2" />
      <path
        className="loc-road"
        d="M600 720C700 520 760 420 1000 380S1220 330 1240 300"
        fill="none"
        stroke="#f5f5f5"
        strokeOpacity=".14"
        strokeWidth="2"
      />
      <path
        className="loc-route"
        d="M140 640C300 560 420 520 560 470S760 390 830 350"
        fill="none"
        stroke="#e62429"
        strokeWidth="2.5"
        strokeDasharray="8 8"
      />
    </svg>
  )
}

export default function Location() {
  const root = useRef<HTMLElement>(null)
  const { university, city, country, coordinates, universeCode } = eventConfig

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.loc-panel', {
        clipPath: 'inset(12% 12% 12% 12%)',
        duration: 1.6,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '.loc-panel', start: 'top 80%' },
      })
      gsap.from('.loc-map', {
        scale: 1.25,
        ease: 'none',
        scrollTrigger: { trigger: '.loc-panel', start: 'top bottom', end: 'bottom top', scrub: true },
      })
      gsap.from('.loc-route', {
        strokeDashoffset: 600,
        duration: 3,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.loc-panel', start: 'top 60%' },
      })
      gsap.from('.loc-reveal', {
        y: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.loc-panel', start: 'top 55%' },
      })
    },
    { scope: root },
  )

  return (
    <section className="loc section" id="location" ref={root}>
      <div className="container">
        <div className="loc-panel">
          <MapArt />
          <div className="loc-grid" aria-hidden="true" />
          <div className="loc-scan" aria-hidden="true" />

          {/* Target marker */}
          <div className="loc-target" aria-hidden="true">
            <span className="loc-cross-h" />
            <span className="loc-cross-v" />
            <span className="loc-radar" />
            <span className="loc-ring r1" />
            <span className="loc-ring r2" />
            <span className="loc-pin" />
            <span className="loc-target-label mono">
              {universeCode} <b>// Event site</b>
            </span>
          </div>

          <div className="loc-content">
            <p className="loc-reveal eyebrow">Target acquired</p>
            <h2 className="loc-reveal loc-title display">Location</h2>
            <div className="loc-reveal loc-place">
              <strong className="display">{university}</strong>
              <span className="mono">
                {city}, {country}
              </span>
            </div>
            <div className="loc-reveal loc-coords">
              <span className="display">{coordinates.lat}</span>
              <span className="display red">{coordinates.lng}</span>
            </div>
            <div className="loc-reveal">
              <Magnetic>
                <a className="btn btn-solid" href={coordinates.mapsUrl} target="_blank" rel="noreferrer" data-cursor="Map">
                  [ Locate event <ArrowUpRight size={18} /> ]
                </a>
              </Magnetic>
            </div>
          </div>

          <dl className="loc-readout mono" aria-label="Coordinates readout">
            <div>
              <dt>Coordinates</dt>
              <dd>{coordinates.decimal}</dd>
            </div>
            <div>
              <dt>Sector</dt>
              <dd>UP-16 // NCR</dd>
            </div>
            <div>
              <dt>Signal</dt>
              <dd className="red">Locked</dd>
            </div>
          </dl>
          <div className="corners" aria-hidden="true">
            <i />
          </div>
        </div>
      </div>
    </section>
  )
}
