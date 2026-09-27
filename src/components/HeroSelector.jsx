import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { gsap, prefersReducedMotion, scrollToTarget } from '../lib/motion'
import { useGsap } from '../hooks/useGsap'
import { eventConfig } from '../config/eventConfig'
import { CharacterVisual } from './art/CharacterArt'
import './HeroSelector.css'

export default function HeroSelector({ onSelect }) {
  const root = useRef(null)
  const [active, setActive] = useState(0)
  const { characters } = eventConfig
  const current = characters[active]

  // On stacked (mobile) layouts, keep the freshly expanded card in view once it settles.
  const activate = (i, card) => {
    if (i === active) return
    setActive(i)
    if (!window.matchMedia('(max-width: 900px)').matches) return
    setTimeout(() => {
      const top = card.getBoundingClientRect().top
      if (top < 80 || top > window.innerHeight * 0.45) scrollToTarget(card, { offset: -90, duration: 0.9 })
    }, 820)
  }

  useGsap(() => {
    if (prefersReducedMotion()) return
    gsap.from('.hs-title .mask-inner', {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.hs-title', start: 'top 85%' },
    })
    gsap.from('.hs-card', {
      y: 80,
      opacity: 0,
      clipPath: 'inset(100% 0 0 0)',
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.hs-deck', start: 'top 80%' },
      clearProps: 'clipPath,transform,opacity',
    })
  }, root)

  return (
    <section className="hs section" id="heroes" ref={root} style={{ '--glow': current.glow }}>
      {/* Background changes with the active hero */}
      <div className="hs-bgs" aria-hidden="true">
        {characters.map((c, i) => (
          <div key={c.id} className={`hs-bg ${i === active ? 'is-on' : ''}`} style={{ '--c': c.glow }} />
        ))}
      </div>

      <div className="container">
        <header className="hs-head">
          <div>
            <p className="eyebrow">Hero selection // {characters.length} tracks</p>
            <h2 className="hs-title display display-lg">
              <span className="mask">
                <span className="mask-inner">Choose your</span>
              </span>
              <span className="mask">
                <span className="mask-inner red">Hero</span>
              </span>
            </h2>
          </div>
          <div className="hs-readout mono" aria-live="polite">
            <span>Selected //</span>
            <b>
              {current.number} — {current.name}
            </b>
            <span className="hs-hint">
              <span className="hs-hint-desk">Hover</span>
              <span className="hs-hint-touch">Tap</span> a card to inspect
            </span>
          </div>
        </header>

        <div className="hs-deck">
          {characters.map((c, i) => {
            const on = i === active
            return (
              <article
                key={c.id}
                className={`hs-card ${on ? 'is-active' : ''}`}
                style={{ '--c': c.glow }}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                onClick={(e) => activate(i, e.currentTarget)}
                onFocus={(e) => e.target.matches(':focus-visible') && setActive(i)}
                tabIndex={0}
                aria-expanded={on}
                aria-label={`${c.name}, ${c.role}`}
                data-cursor={on ? '' : 'View'}
              >
                <div className="hs-art">
                  <CharacterVisual id={c.id} image={c.image} alt={`${c.name} artwork`} className="hs-art-img" />
                </div>
                <div className="hs-shade" aria-hidden="true" />
                <div className="corners" aria-hidden="true">
                  <i />
                </div>

                <div className="hs-top">
                  <span className="hs-num display">{c.number}</span>
                  <span className="hs-labels mono">
                    <span>Clearance // {c.clearance}</span>
                    <span>
                      Status // <b className="red">Available</b>
                    </span>
                  </span>
                </div>

                <h3 className="hs-vname display" aria-hidden={on}>
                  {c.name}
                </h3>

                <div className="hs-info">
                  <p className="hs-role mono">{c.role}</p>
                  <h3 className="hs-name display">{c.name}</h3>
                  <ul className="hs-traits display">
                    {c.traits.map((t, k) => (
                      <li key={t} style={{ '--k': k }}>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="hs-desc">{c.description}</p>
                  <p className="hs-tags mono">{c.tags}</p>
                  <button
                    className="btn hs-cta"
                    tabIndex={on ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect?.(c.id)
                    }}
                  >
                    Mission profile <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
