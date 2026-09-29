import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { HeroId } from '../config/characters'
import { backendConfigured, devWarn, getSupabase, withTimeout } from '../lib/supabase'
import { useHero } from '../theme/heroContext'
import { useAuth } from '../auth/authContext'
import {
  addFavorite,
  fetchFavorites,
  fetchStats,
  insertRegistration,
  logInteraction,
  removeFavorite,
  saveActiveHero,
  type HeroStats,
  type RegistrationRow,
} from './api'
import { loadFavorites, loadSelectionCounts, saveFavorites, saveSelectionCounts } from './localStore'
import { MultiverseContext, type BackendStatus, type MultiverseData } from './multiverseContext'

/**
 * Optional Supabase layer on top of the existing hero system. Nothing here blocks rendering:
 * the site paints immediately from local state, then this connects in the background. Every
 * failure falls back to local storage and is only logged in development.
 */
export default function MultiverseDataProvider({ children }: { children: ReactNode }) {
  const { active } = useHero()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [status, setStatus] = useState<BackendStatus>(backendConfigured ? 'connecting' : 'disabled')
  const [favorites, setFavorites] = useState<Set<HeroId>>(loadFavorites)
  const [localCounts, setLocalCounts] = useState(loadSelectionCounts)
  const [stats, setStats] = useState<Partial<Record<HeroId, HeroStats>>>({})
  const favoritesRef = useRef(favorites)
  // Resolves to a signed-in client, or null when the backend is disabled/unreachable.
  const connection = useRef<Promise<SupabaseClient | null> | null>(null)
  const statsTimer = useRef(0)

  const refreshStats = useCallback((sb: SupabaseClient, delay = 700) => {
    window.clearTimeout(statsTimer.current)
    statsTimer.current = window.setTimeout(() => {
      withTimeout(fetchStats(sb))
        .then(setStats)
        .catch((err: unknown) => devWarn('could not load stats', err))
    }, delay)
  }, [])

  /** Runs a backend write once connected; failures never reach the UI. */
  const run = useCallback(
    (label: string, op: (sb: SupabaseClient) => Promise<void>) => {
      void connection.current
        ?.then((sb) => (sb ? withTimeout(op(sb)).then(() => refreshStats(sb)) : undefined))
        .catch((err: unknown) => devWarn(`${label} failed`, err))
    },
    [refreshStats],
  )

  // Connect when a user is logged in (Supabase Auth session) → reconcile favourites → load stats.
  useEffect(() => {
    if (!backendConfigured) return
    let cancelled = false
    connection.current = (async () => {
      try {
        if (!userId) throw new Error('not logged in')
        const sb = await getSupabase()
        if (!sb) throw new Error('Supabase client unavailable')
        const remote = await withTimeout(fetchFavorites(sb))
        const local = favoritesRef.current
        if (local.size === 0 && remote.length > 0) {
          // Local copy was cleared — restore from the server.
          const restored = new Set(remote)
          favoritesRef.current = restored
          saveFavorites(restored)
          if (!cancelled) setFavorites(restored)
        } else {
          // This browser's list is the source of truth; mirror it to the server.
          await withTimeout(
            Promise.all([
              ...[...local].filter((id) => !remote.includes(id)).map((id) => addFavorite(sb, id)),
              ...remote.filter((id) => !local.has(id)).map((id) => removeFavorite(sb, id)),
            ]),
          )
        }
        return sb
      } catch (err) {
        devWarn('backend unavailable — using local storage only', err)
        return null
      }
    })()
    connection.current.then((sb) => {
      if (cancelled) return
      setStatus(sb ? 'online' : 'offline')
      if (sb) refreshStats(sb, 0)
    })
    return () => {
      cancelled = true
    }
  }, [refreshStats, userId])

  // Record hero selections. The hero restored on page load is not an interaction.
  const lastHero = useRef<HeroId | null>(active?.id ?? null)
  useEffect(() => {
    const id = active?.id ?? null
    if (id === lastHero.current) return
    lastHero.current = id
    run('saving active hero', (sb) => saveActiveHero(sb, id))
    if (!id) return
    run('logging selection', (sb) => logInteraction(sb, id, 'select'))
    void Promise.resolve().then(() =>
      setLocalCounts((counts) => {
        const next = { ...counts, [id]: (counts[id] ?? 0) + 1 }
        saveSelectionCounts(next)
        return next
      }),
    )
  }, [active?.id, run])

  const toggleFavorite = useCallback(
    (id: HeroId) => {
      const next = new Set(favoritesRef.current)
      const adding = !next.has(id)
      if (adding) next.add(id)
      else next.delete(id)
      favoritesRef.current = next
      setFavorites(next)
      saveFavorites(next)
      // Optimistic worldwide count; corrected by the next stats refresh.
      setStats((s) => {
        const cur = s[id]
        return cur ? { ...s, [id]: { ...cur, favorites: Math.max(0, cur.favorites + (adding ? 1 : -1)) } } : s
      })
      run(adding ? 'adding favourite' : 'removing favourite', async (sb) => {
        await (adding ? addFavorite(sb, id) : removeFavorite(sb, id))
        await logInteraction(sb, id, adding ? 'favorite' : 'unfavorite')
      })
    },
    [run],
  )

  const saveRegistration = useCallback(async (row: RegistrationRow): Promise<'saved' | 'skipped'> => {
    if (!backendConfigured) return 'skipped'
    const sb = await connection.current
    if (!sb) throw new Error('registration service unavailable')
    await withTimeout(insertRegistration(sb, row), 10000)
    return 'saved'
  }, [])

  const value = useMemo<MultiverseData>(
    () => ({
      status,
      favorites,
      toggleFavorite,
      mySelections: (id) => Math.max(localCounts[id] ?? 0, stats[id]?.mine ?? 0),
      worldStats: (id) => (status === 'online' ? stats[id] : undefined),
      saveRegistration,
    }),
    [status, favorites, toggleFavorite, localCounts, stats, saveRegistration],
  )

  return <MultiverseContext.Provider value={value}>{children}</MultiverseContext.Provider>
}
