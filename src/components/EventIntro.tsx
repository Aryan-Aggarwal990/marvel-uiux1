import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import './EventIntro.css'

export default function EventIntro() {
  const root = useRef<HTMLElement>(null)
  const { university, city, date, time, venue, stats } = eventConfig

  const details = [
    { label: 'Location', value: university, sub: city },
    { label: 'Date', value: date, sub: 'Mark the timeline' },
    { label: 'Time', value: time, sub: 'IST // UTC+5:30' },
    { label: 'Venue', value: venue, sub: `${university} campus` },
  ]

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.intro-title .mask-inner', {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.intro-title', start: 'top 80%' },
      })
      gsap.from('.intro-cell', {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1,
        ease: 'expo.inOut',
        stagger: 0.1,
        scrollTrigger: { trigger: '.intro-grid', start: 'top 85%' },
      })
      gsap.from('.intro-line', {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 1.4,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '.intro-grid', start: 'top 85%' },
      })
      gsap.to('.intro-ghost', {
        xPercent: -25,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
      // Number counting
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count)
        const pad = Number(el.dataset.pad || 0)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v)).padStart(pad, '0')
          },
        })
      })
    },
    { scope: root },
  )

  return (
    <section className="intro section" id="event" ref={root}>
      <div className="intro-ghost display" aria-hidden="true">
        EARTH-616 EARTH-616
      </div>
      <div className="container">
        <div className="intro-head">
          <p className="eyebrow">Transmission received // 001</p>
          <span className="hud-tag">
            <span className="pulse-dot" /> Access // <b>Granted</b>
          </span>
        </div>

        <h2 className="intro-title display display-lg">
          <span className="mask">
            <span className="mask-inner">One event.</span>
          </span>
          <span className="mask">
            <span className="mask-inner outline-text">Infinite</span>
          </span>
          <span className="mask">
            <span className="mask-inner">
              Possibilities<span className="accent">.</span>
            </span>
          </span>
        </h2>

        <div className="intro-grid">
          <span className="intro-line" aria-hidden="true" />
          {details.map((d, i) => (
            <div className="intro-cell" key={d.label}>
              <span className="mono intro-label">
                <span className="accent">0{i + 1}</span> {d.label}
              </span>
              <strong className="intro-value">{d.value}</strong>
              <span className="mono intro-sub">{d.sub}</span>
            </div>
          ))}
        </div>

        <div className="intro-stats">
          {stats.map((s) => (
            <div className="intro-stat" key={s.label}>
              <span className="intro-num display">
                {s.value === null ? (
                  <span className="intro-inf">{s.display}</span>
                ) : (
                  <>
                    <span data-count={s.value} data-pad={s.pad}>
                      {String(s.value).padStart(s.pad, '0')}
                    </span>
                    {s.suffix && <span className="accent">{s.suffix}</span>}
                  </>
                )}
              </span>
              <span className="mono intro-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
