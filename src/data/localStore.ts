/**
 * Local fallback persistence. Favourites and personal selection counts always live here too,
 * so they survive refreshes even when Supabase is not configured or unreachable.
 */
import type { HeroId } from '../config/characters'
import { isHeroId } from './api'

const FAVORITES_KEY = 'gfg-multiverse-favorites'
const SELECTIONS_KEY = 'gfg-multiverse-selections'

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — keep working in memory only */
  }
}

export function loadFavorites(): Set<HeroId> {
  const value = read(FAVORITES_KEY)
  return new Set(Array.isArray(value) ? value.filter(isHeroId) : [])
}

export function saveFavorites(favorites: ReadonlySet<HeroId>): void {
  write(FAVORITES_KEY, [...favorites])
}

export function loadSelectionCounts(): Partial<Record<HeroId, number>> {
  const value = read(SELECTIONS_KEY)
  const counts: Partial<Record<HeroId, number>> = {}
  if (value && typeof value === 'object') {
    for (const [id, n] of Object.entries(value)) if (isHeroId(id) && Number.isFinite(n)) counts[id] = Math.max(0, Math.floor(Number(n)))
  }
  return counts
}

export function saveSelectionCounts(counts: Partial<Record<HeroId, number>>): void {
  write(SELECTIONS_KEY, counts)
}
