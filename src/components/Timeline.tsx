import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import './Timeline.css'

export default function Timeline() {
  const root = useRef<HTMLElement>(null)
  const phase = useRef<HTMLElement>(null)
  const { timeline } = eventConfig

  useGSAP(
    () => {
      const nodes = gsap.utils.toArray<HTMLElement>('.tl-node')
      const setPhase = (i: number) => {
        const item = timeline[i]
        if (phase.current && item) phase.current.textContent = `${item.time} — ${item.title}`
      }

      if (prefersReducedMotion()) {
        nodes.forEach((n) => n.classList.add('is-on'))
        return
      }

      gsap.from('.tl-title .mask-inner', {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.tl-title', start: 'top 85%' },
      })

      const mm = gsap.matchMedia()

      // Desktop: pinned horizontal run, the glowing line sweeps across and lights each stop.
      mm.add('(min-width: 901px)', () => {
        const track = root.current?.querySelector<HTMLElement>('.tl-track')
        const fill = root.current?.querySelector<HTMLElement>('.tl-fill')
        if (!track || !fill || !nodes.length) return
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)

        // Fill starts at the first stop and ends at the viewport's right edge.
        const start = () => (nodes[0].offsetLeft + 10) / track.scrollWidth
        const update = (p: number) => {
          const s0 = start()
          const reach = (s0 + (1 - s0) * p) * track.scrollWidth
          let last = 0
          nodes.forEach((n, i) => {
            const on = n.offsetLeft <= reach
            n.classList.toggle('is-on', on)
            if (on) last = i
          })
          setPhase(last)
        }

        gsap
          .timeline({
            scrollTrigger: {
              trigger: '.tl-pin',
              start: 'top top',
              end: () => `+=${distance() + window.innerHeight * 0.4}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: (self) => update(self.progress),
            },
          })
          .to(track, { x: () => -distance(), ease: 'none' }, 0)
          .fromTo(fill, { scaleX: () => start() }, { scaleX: 1, ease: 'none' }, 0)
        update(0)
      })

      // Mobile / tablet: vertical line that fills with scroll.
      mm.add('(max-width: 900px)', () => {
        gsap.fromTo(
          '.tl-fill',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.tl-track', start: 'top 65%', end: 'bottom 65%', scrub: true },
          },
        )
        nodes.forEach((n, i) =>
          ScrollTrigger.create({
            trigger: n,
            start: 'top 65%',
            onEnter: () => {
              n.classList.add('is-on')
              setPhase(i)
            },
            onLeaveBack: () => {
              n.classList.remove('is-on')
              setPhase(Math.max(0, i - 1))
            },
          }),
        )
      })
    },
    { scope: root },
  )

  return (
    <section className="tl" id="timeline" ref={root}>
      <div className="tl-pin">
        <div className="container tl-head">
          <div>
            <p className="eyebrow">Mission log // Day 01</p>
            <h2 className="tl-title display display-lg">
              <span className="mask">
                <span className="mask-inner">The</span>
              </span>
              <span className="mask">
                <span className="mask-inner">
                  Mission<span className="red">.</span>
                </span>
              </span>
            </h2>
          </div>
          <div className="tl-phase mono">
            <span className="muted">Current phase //</span>
            <b ref={phase}>
              {timeline[0].time} — {timeline[0].title}
            </b>
          </div>
        </div>

        <div className="tl-viewport">
          <div className="tl-track">
            <span className="tl-line" aria-hidden="true">
              <span className="tl-fill" />
            </span>
            <ol className="tl-list">
              {timeline.map((t, i) => (
                <li className="tl-node" key={t.time + t.title}>
                  <span className="tl-dot" aria-hidden="true" />
                  <span className="tl-idx mono">Phase 0{i + 1}</span>
                  <time className="tl-time display">{t.time}</time>
                  <h3 className="tl-name display">{t.title}</h3>
                  <p className="tl-detail">{t.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
