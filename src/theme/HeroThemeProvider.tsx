import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { defaultTheme, heroById, heroes, type HeroId } from '../config/characters'
import { prefersReducedMotion } from '../lib/motion'
import { applyTheme, loadStoredHero, storeHero } from './applyTheme'
import DimensionShift, { type ShiftRequest } from './DimensionShift'
import { HeroContext, type HeroContextValue, type ShiftOrigin } from './heroContext'

interface Pending {
  id: HeroId | null
  origin?: ShiftOrigin
}

const initialHero = (): HeroId | null => heroes.find((h) => h.id === loadStoredHero())?.id ?? null

/** Owns the active hero, persists it, and runs the dimension-shift transition between worlds. */
export default function HeroThemeProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<HeroId | null>(initialHero)
  const [request, setRequest] = useState<ShiftRequest | null>(null)
  const [announce, setAnnounce] = useState('')
  const target = useRef<HeroId | null>(activeId)
  const queued = useRef<Pending | null>(null)
  const firstApply = useRef(true)

  const active = heroById(activeId) ?? null
  const theme = active?.theme ?? defaultTheme

  // Keep the document's tokens in sync with the active hero (instant on first paint).
  useLayoutEffect(() => {
    applyTheme(activeId, theme, firstApply.current || prefersReducedMotion() ? 0 : 0.9)
    firstApply.current = false
  }, [activeId, theme])

  const select = useCallback(
    (id: HeroId | null, origin?: ShiftOrigin) => {
      if (id === target.current) return
      if (request) {
        queued.current = { id, origin }
        return
      }
      target.current = id
      storeHero(id)
      const hero = heroById(id) ?? null
      setAnnounce(hero ? `Active hero: ${hero.name}. ${hero.tagline}` : 'Hero cleared. Back to the multiverse.')
      if (prefersReducedMotion()) {
        setActiveId(id)
        return
      }
      setRequest({
        key: Date.now(),
        hero,
        theme: hero?.theme ?? defaultTheme,
        origin: origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      })
    },
    [request],
  )

  const onPeak = useCallback(() => {
    if (request) setActiveId(request.hero?.id ?? null)
  }, [request])

  const onDone = useCallback(() => setRequest(null), [])

  // Play a selection that arrived mid-transition once the current one finishes.
  useEffect(() => {
    if (request || !queued.current) return
    const next = queued.current
    queued.current = null
    select(next.id, next.origin)
  }, [request, select])

  const value = useMemo<HeroContextValue>(() => ({ active, theme, select }), [active, theme, select])

  return (
    <HeroContext.Provider value={value}>
      {children}
      <DimensionShift request={request} onPeak={onPeak} onDone={onDone} />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </HeroContext.Provider>
  )
}
