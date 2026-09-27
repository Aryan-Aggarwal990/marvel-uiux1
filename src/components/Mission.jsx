import { useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { useGsap } from '../hooks/useGsap'
import { eventConfig } from '../config/eventConfig'
import './Mission.css'

const PARAGRAPHS = [
  "The multiverse doesn't need another spectator.",
  'It needs someone who can *build,* *solve,* *create* and *think* *differently.*',
]
const CLOSER = `Join the ${eventConfig.organiser} for a Marvel-inspired technical experience where creativity meets technology.`

/** Splits a sentence into word spans; words wrapped in *asterisks* get the accent style. */
function Words({ text }) {
  return text.split(' ').map((raw, i) => {
    const accent = raw.startsWith('*')
    const word = raw.replaceAll('*', '')
    return (
      <span key={i} className={`mw ${accent ? 'mw-accent' : ''}`}>
        {word}{' '}
      </span>
    )
  })
}

export default function Mission() {
  const root = useRef(null)

  useGsap(() => {
    if (prefersReducedMotion()) return
    gsap.fromTo(
      '.mw',
      { opacity: 0.12 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: '.mission-copy', start: 'top 75%', end: 'bottom 45%', scrub: true },
      },
    )
    gsap.from('.mission-closer', {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.mission-closer', start: 'top 88%' },
    })
    gsap.from('.mission-title .mask-inner', {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.mission-title', start: 'top 85%' },
    })
    gsap.from('.mission-rule', {
      scaleY: 0,
      transformOrigin: 'top',
      ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top 60%', end: 'bottom 60%', scrub: true },
    })
  }, root)

  return (
    <section className="mission section" id="mission" ref={root}>
      <div className="container mission-grid">
        <aside className="mission-side">
          <p className="eyebrow">Mission initialized</p>
          <h2 className="mission-title display display-md">
            <span className="mask">
              <span className="mask-inner">Your</span>
            </span>
            <span className="mask">
              <span className="mask-inner red">Mission</span>
            </span>
          </h2>
          <dl className="mission-readout mono">
            <div>
              <dt>Protocol</dt>
              <dd>{eventConfig.protocol}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className="pulse-dot green" /> Active
              </dd>
            </div>
            <div>
              <dt>Clearance</dt>
              <dd>All heroes</dd>
            </div>
            <div>
              <dt>Spectators</dt>
              <dd className="red">Denied</dd>
            </div>
          </dl>
        </aside>

        <div className="mission-main">
          <span className="mission-rule" aria-hidden="true" />
          <div className="mission-copy">
            {PARAGRAPHS.map((p, i) => (
              <p key={i}>
                <Words text={p} />
              </p>
            ))}
          </div>
          <p className="mission-closer">
            <span className="mono red">→ Directive</span>
            {CLOSER}
          </p>
        </div>
      </div>
    </section>
  )
}
