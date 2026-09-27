import { createContext, useContext } from 'react'
import type { Hero, HeroId, HeroTheme } from '../config/characters'

export interface ShiftOrigin {
  x: number
  y: number
}

export interface HeroContextValue {
  /** The hero whose world is currently applied, or null for the neutral multiverse */
  active: Hero | null
  /** The theme currently applied (active hero's theme or the default) */
  theme: HeroTheme
  /** Switch dimensions. `origin` is where the transition radiates from (e.g. the click point). */
  select: (id: HeroId | null, origin?: ShiftOrigin) => void
}

export const HeroContext = createContext<HeroContextValue | null>(null)

export function useHero(): HeroContextValue {
  const ctx = useContext(HeroContext)
  if (!ctx) throw new Error('useHero must be used inside <HeroThemeProvider>')
  return ctx
}
