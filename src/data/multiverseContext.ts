import { createContext, useContext } from 'react'
import type { HeroId } from '../config/characters'
import type { HeroStats, RegistrationRow, SavedRegistration } from './api'

/**
 * disabled → no Supabase env vars (site works exactly as before, local only)
 * guest    → backend available, nobody logged in (guest favourites in localStorage)
 * syncing  → logged in, loading the account's data from PostgreSQL
 * online   → logged in, PostgreSQL is the source of truth
 * offline  → logged in but the database is unreachable (local fallback, synced later)
 */
export type BackendStatus = 'disabled' | 'guest' | 'syncing' | 'online' | 'offline'

export interface Notice {
  tone: 'error' | 'info'
  text: string
}

export interface MultiverseData {
  status: BackendStatus
  /** Account favourites when logged in, guest favourites otherwise */
  favorites: ReadonlySet<HeroId>
  toggleFavorite: (id: HeroId) => void
  /** How many times *you* selected this hero */
  mySelections: (id: HeroId) => number
  /** Worldwide aggregate stats, or undefined while unavailable */
  worldStats: (id: HeroId) => HeroStats | undefined
  /** Your event registration: undefined = unknown (logged out / loading), null = not registered */
  registration: SavedRegistration | null | undefined
  /**
   * Saves the event registration for the logged-in account. Resolves 'skipped' when no backend
   * is configured (simulated, as before). Rejects with a DbError — code 23505 if this account
   * is already registered.
   */
  saveRegistration: (row: RegistrationRow) => Promise<'saved' | 'skipped'>
  /** Small status/error message for the HUD notice */
  notice: Notice | null
  dismissNotice: () => void
}

export const MultiverseContext = createContext<MultiverseData | null>(null)

export function useMultiverse(): MultiverseData {
  const ctx = useContext(MultiverseContext)
  if (!ctx) throw new Error('useMultiverse must be used inside <MultiverseDataProvider>')
  return ctx
}
