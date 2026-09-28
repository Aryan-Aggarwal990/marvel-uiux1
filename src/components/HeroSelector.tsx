import { useRef, useState, type MouseEvent } from 'react'
import { ArrowDown, ArrowRight, Check, Heart, RotateCcw } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion, scrollToTarget } from '../lib/motion'
import { heroes, tracks, type Hero, type HeroId } from '../config/characters'
import { useHero } from '../theme/heroContext'
import { useMultiverse } from '../data/multiverseContext'
import { HeroPortrait } from './art/CharacterArt'
import { HeroEmblem } from './art/emblems'
import './HeroSelector.css'

/** "You // 3× · World // 128 · ♥ 12" — only the parts we actually know. */
function statsLine(mine: number, world: { selections: number; favorites: number } | undefined): string | null {
  const parts: string[] = []
  if (mine > 0) parts.push(`You // ${mine}×`)
  if (world)
    parts.push(
      `World // ${world.selections.toLocaleString()} ${world.selections === 1 ? 'pick' : 'picks'}`,
      `♥ ${world.favorites.toLocaleString()}`,
    )
  return parts.length ? parts.join(' · ') : null
}

/** Where the dimension shift should radiate from: the pointer, or the element for keyboard clicks. */
function originOf(e: MouseEvent<HTMLElement>) {
  if (e.clientX || e.clientY) return { x: e.clientX, y: e.clientY }
  const r = e.currentTarget.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export default function HeroSelector() {
  const root = useRef<HTMLElement>(null)
  const { active, select } = useHero()
  const { favorites, toggleFavorite, mySelections, worldStats } = useMultiverse()
  const heroStats = (id: HeroId) => statsLine(mySelections(id), worldStats(id))
  const activeIndex = heroes.findIndex((h) => h.id === active?.id)
  const [focus, setFocus] = useState(Math.max(0, activeIndex))
  // Follow the active hero when it changes elsewhere (nav, hero ring, registration)
  const [lastActive, setLastActive] = useState(activeIndex)
  if (lastActive !== activeIndex) {
    setLastActive(activeIndex)
    if (activeIndex >= 0) setFocus(activeIndex)
  }

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.hs-title .mask-inner', {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.hs-title', start: 'top 85%' },
      })
      gsap.from('.hs-panel', {
        y: 90,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.05,
        scrollTrigger: { trigger: '.hs-lineup', start: 'top 85%' },
        clearProps: 'transform,opacity',
      })
    },
    { scope: root },
  )

  const choose = (hero: Hero, e: MouseEvent<HTMLElement>) => select(hero.id, originOf(e))

  return (
    <section className="hs section" id="heroes" ref={root}>
      {/* The active hero dominates the section backdrop */}
      <div className="hs-stage" aria-hidden="true">
        {active && (
          <div className="hs-stage-art" key={active.id}>
            <HeroPortrait hero={active} />
          </div>
        )}
        <div className="hs-giant display" key={`n-${active?.id ?? 'none'}`}>
          {active ? active.name : 'Multiverse'}
        </div>
      </div>

      <div className="container">
        <header className="hs-head">
          <div>
            <p className="eyebrow">Hero selection // {heroes.length} variants detected</p>
            <h2 className="hs-title display display-lg">
              <span className="mask">
                <span className="mask-inner">Choose your</span>
              </span>
              <span className="mask">
                <span className="mask-inner accent">Hero</span>
              </span>
            </h2>
          </div>

          <div className="hs-readout">
            <p className="mono hs-readout-label">
              <span className={`pulse-dot ${active ? '' : 'green'}`} /> Active hero //
            </p>
            <p className="hs-readout-name display" key={active?.id ?? 'none'}>
              {active ? active.name : 'None selected'}
            </p>
            {active ? (
              <>
                <ul className="hs-status mono">
                  {active.status.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {heroStats(active.id) && <p className="hs-readout-stats mono">{heroStats(active.id)}</p>}
                <div className="hs-readout-actions">
                  <button className="btn btn-solid hs-go" onClick={() => scrollToTarget('#register', { duration: 1.6 })}>
                    Register as {active.name} <ArrowRight size={16} />
                  </button>
                  <button className="u-link mono hs-reset" onClick={(e) => select(null, originOf(e))}>
                    <RotateCcw size={12} /> Reset multiverse
                  </button>
                </div>
              </>
            ) : (
              <p className="mono hs-hint">
                <span className="hs-hint-desk">Hover to preview · click to enter their world</span>
                <span className="hs-hint-touch">Swipe · tap a hero to enter their world</span>
              </p>
            )}
          </div>
        </header>
      </div>

      <div className="hs-lineup-wrap">
        <ul className="hs-lineup" onPointerLeave={() => activeIndex >= 0 && setFocus(activeIndex)}>
          {heroes.map((h, i) => {
            const isActive = h.id === active?.id
            const track = tracks[h.track]
            return (
              <li
                key={h.id}
                className={`hs-panel ${i === focus ? 'is-focus' : ''} ${isActive ? 'is-active' : ''}`}
                style={{ '--c1': h.theme.accent, '--c2': h.theme.accent2, '--cbg': h.theme.bg }}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setFocus(i)}
                onClick={(e) => choose(h, e)}
                data-cursor={isActive ? 'Active' : 'Select'}
              >
                <div className="hs-panel-bg" aria-hidden="true" />
                <div className="hs-panel-art" aria-hidden="true">
                  <HeroPortrait hero={h} />
                </div>
                <div className="hs-panel-shade" aria-hidden="true" />

                <div className="hs-top">
                  <span className="hs-num display">{String(i + 1).padStart(2, '0')}</span>
                  <HeroEmblem id={h.id} className="hs-emblem" />
                  {favorites.has(h.id) && <Heart className="hs-fav-mark" size={13} aria-label="Favourite" />}
                </div>
                <span className="hs-vname display" aria-hidden="true">
                  {h.name}
                </span>
                {isActive && (
                  <span className="hs-badge mono">
                    <Check size={11} /> Active
                  </span>
                )}

                <div className="hs-info">
                  <p className="hs-code mono">
                    {h.code} <span>// {track.role}</span>
                  </p>
                  <h3 className="hs-name display">{h.name}</h3>
                  <p className="hs-line">“{h.tagline}”</p>
                  <p className="hs-tags mono">{track.tags}</p>
                  {heroStats(h.id) && <p className="hs-stats mono">{heroStats(h.id)}</p>}
                  <div className="hs-actions">
                    <button
                      className="btn hs-select"
                      onFocus={() => setFocus(i)}
                      onClick={(e) => {
                        e.stopPropagation()
                        choose(h, e)
                      }}
                      aria-pressed={isActive}
                      aria-label={isActive ? `${h.name} is your active hero` : `Select ${h.name}`}
                    >
                      {isActive ? (
                        <>
                          Active hero <Check size={16} />
                        </>
                      ) : (
                        <>
                          Enter their world <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    <button
                      className={`hs-fav ${favorites.has(h.id) ? 'is-on' : ''}`}
                      onFocus={() => setFocus(i)}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(h.id)
                      }}
                      aria-pressed={favorites.has(h.id)}
                      aria-label={favorites.has(h.id) ? `Remove ${h.name} from favourites` : `Add ${h.name} to favourites`}
                      data-cursor={favorites.has(h.id) ? 'Unfave' : 'Fave'}
                    >
                      <Heart size={18} />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="container hs-foot mono">
        <span>
          {active ? (
            <>
              Track // <b>{tracks[active.track].role}</b> — {tracks[active.track].description}
            </>
          ) : (
            'Each hero represents one of the four challenge tracks.'
          )}
        </span>
        <button className="u-link hs-continue" onClick={() => scrollToTarget('#timeline', { duration: 1.4 })}>
          Continue mission <ArrowDown size={13} />
        </button>
      </div>
    </section>
  )
}
