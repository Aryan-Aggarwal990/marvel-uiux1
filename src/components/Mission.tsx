import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import { tracks } from '../config/characters'
import { useHero } from '../theme/heroContext'
import { HeroEmblem } from './art/emblems'
import './Mission.css'

const PARAGRAPHS = [
  "The multiverse doesn't need another spectator.",
  'It needs someone who can *build,* *solve,* *create* and *think* *differently.*',
]
const CLOSER = `Join the ${eventConfig.organiser} for a Marvel-inspired technical experience where creativity meets technology.`

/** Splits a sentence into word spans; words wrapped in *asterisks* get the accent style. */
function Words({ text }: { text: string }) {
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
  const { active } = useHero()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
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
    },
    { scope: root },
  )

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
              <span className="mask-inner accent">Mission</span>
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
              <dt>Assigned hero</dt>
              <dd className={active ? 'accent' : ''}>{active ? active.name : 'Pending'}</dd>
            </div>
            <div>
              <dt>{active ? 'Track' : 'Spectators'}</dt>
              <dd className="accent">{active ? tracks[active.track].role : 'Denied'}</dd>
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
            <span className="mono accent">→ Directive</span>
            {CLOSER}
          </p>
          <div className="mission-hero" key={active?.id ?? 'none'}>
            {active ? (
              <>
                <HeroEmblem id={active.id} className="mission-hero-emblem" />
                <div>
                  <p className="mono mission-hero-label">
                    {active.name}&apos;s directive // {active.code}
                  </p>
                  <p className="mission-hero-text">{active.directive}</p>
                </div>
              </>
            ) : (
              <p className="mono mission-hero-label">
                No hero assigned //{' '}
                <a href="#heroes" className="u-link accent">
                  Choose your hero ↓
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
