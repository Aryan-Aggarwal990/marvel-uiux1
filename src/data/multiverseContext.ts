import { createContext, useContext } from 'react'
import type { HeroId } from '../config/characters'
import type { HeroStats, RegistrationRow } from './api'

/** disabled: no env vars · connecting · online · offline: configured but unreachable (local fallback) */
export type BackendStatus = 'disabled' | 'connecting' | 'online' | 'offline'

export interface MultiverseData {
  status: BackendStatus
  favorites: ReadonlySet<HeroId>
  toggleFavorite: (id: HeroId) => void
  /** Personal selection count (local, merged with the server when online) */
  mySelections: (id: HeroId) => number
  /** Worldwide stats from Supabase, or undefined while unavailable */
  worldStats: (id: HeroId) => HeroStats | undefined
  /**
   * Persists a registration. Resolves 'skipped' when no backend is configured (simulated flow,
   * as before); rejects if the backend is configured but the save fails.
   */
  saveRegistration: (row: RegistrationRow) => Promise<'saved' | 'skipped'>
}

export const MultiverseContext = createContext<MultiverseData | null>(null)

export function useMultiverse(): MultiverseData {
  const ctx = useContext(MultiverseContext)
  if (!ctx) throw new Error('useMultiverse must be used inside <MultiverseDataProvider>')
  return ctx
}
