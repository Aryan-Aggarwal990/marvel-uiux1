import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { HeroId } from '../config/characters'
import { backendConfigured, devWarn, getSupabase, withTimeout } from '../lib/supabase'
import { useHero } from '../theme/heroContext'
import { useAuth } from '../auth/authContext'
import {
  deleteFavorite,
  fetchFavorites,
  fetchMyRegistration,
  fetchStats,
  fetchUserState,
  insertFavorite,
  insertRegistration,
  logInteraction,
  saveUserState,
  type HeroStats,
  type RegistrationRow,
  type SavedRegistration,
} from './api'
import { DbError, describeDbError, isDuplicate } from './errors'
import { loadFavorites, loadSelectionCounts, saveFavorites, saveSelectionCounts } from './localStore'
import { MultiverseContext, type BackendStatus, type MultiverseData, type Notice } from './multiverseContext'

/** Data loaded from PostgreSQL for one logged-in account. */
interface AccountData {
  userId: string
  favorites: Set<HeroId>
  registration: SavedRegistration | null
}

/**
 * Connects the Marvel UI to Supabase.
 *
 * Logged out  → favourites live in localStorage ("guest"), aggregate stats still load.
 * Logged in   → PostgreSQL is the source of truth: favourites, current hero world,
 *               interaction history and the event registration belong to auth.uid().
 * Unreachable → the site keeps working from local state; nothing here blocks rendering.
 */
export default function MultiverseDataProvider({ children }: { children: ReactNode }) {
  const { active, select } = useHero()
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [guestFavorites, setGuestFavorites] = useState<Set<HeroId>>(loadFavorites)
  const [account, setAccount] = useState<AccountData | null>(null)
  const [syncFailedFor, setSyncFailedFor] = useState<string | null>(null)
  const [localCounts, setLocalCounts] = useState(loadSelectionCounts)
  const [stats, setStats] = useState<Partial<Record<HeroId, HeroStats>> | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  // Refs let async callbacks read the latest values without re-running effects.
  const guestRef = useRef(guestFavorites)
  const activeRef = useRef<HeroId | null>(active?.id ?? null)
  const selectRef = useRef(select)
  const restoring = useRef<HeroId | null>(null)
  const statsTimer = useRef(0)
  useEffect(() => {
    guestRef.current = guestFavorites
    activeRef.current = active?.id ?? null
    selectRef.current = select
  })

  // Only trust account data that belongs to the *current* user (never show a previous user's data).
  const accountData = account && account.userId === userId ? account : null
  const status: BackendStatus = !backendConfigured
    ? 'disabled'
    : !userId
      ? 'guest'
      : accountData
        ? 'online'
        : syncFailedFor === userId
          ? 'offline'
          : 'syncing'

  const updateGuestFavorites = useCallback((next: Set<HeroId>) => {
    guestRef.current = next
    setGuestFavorites(next)
    saveFavorites(next)
  }, [])

  /** Aggregate stats via the character_stats() RPC (debounced after writes). */
  const refreshStats = useCallback((delay = 600) => {
    window.clearTimeout(statsTimer.current)
    statsTimer.current = window.setTimeout(() => {
      void getSupabase()
        .then((sb) => (sb ? withTimeout(fetchStats(sb)) : null))
        .then((next) => next && setStats(next))
        .catch((err: unknown) => devWarn('could not load stats', err))
    }, delay)
  }, [])

  // Stats for everyone (logged in or not); "my selections" depends on who is logged in.
  useEffect(() => {
    if (backendConfigured) refreshStats(0)
  }, [refreshStats, userId])

  // ── Logged in → load the account from PostgreSQL ─────────────────────────────
  useEffect(() => {
    if (!backendConfigured || !userId) return
    let cancelled = false
    void (async () => {
      try {
        const sb = await getSupabase()
        if (!sb) throw new Error('Supabase client unavailable')

        // 1. Move guest favourites into the account. The (user_id, character_id) primary key
        //    rejects ones the account already has (23505) — that's fine, it's already saved.
        const guest = [...guestRef.current]
        for (const id of guest) {
          try {
            await withTimeout(insertFavorite(sb, id))
          } catch (err) {
            if (!isDuplicate(err)) throw err
          }
        }

        // 2. PostgreSQL is now the source of truth.
        const [favorites, savedHero, registration] = await withTimeout(
          Promise.all([fetchFavorites(sb), fetchUserState(sb), fetchMyRegistration(sb)]),
        )
        if (cancelled) return
        if (guest.length) updateGuestFavorites(new Set())
        setAccount({ userId, favorites: new Set(favorites), registration })

        // 3. Restore the saved hero world (plays the dimension shift), or save the current one.
        if (savedHero && savedHero !== activeRef.current) {
          restoring.current = savedHero
          selectRef.current(savedHero)
        } else if (!savedHero && activeRef.current) {
          await withTimeout(saveUserState(sb, activeRef.current))
        }
      } catch (err) {
        devWarn('could not load account data — using local fallback', err)
        if (cancelled) return
        setSyncFailedFor(userId)
        setNotice({ tone: 'error', text: `Couldn’t load your saved data (${describeDbError(err)}). Changes stay on this device for now.` })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, updateGuestFavorites])

  // ── Every hero selection → interaction history + current world ───────────────
  const lastHero = useRef<HeroId | null>(active?.id ?? null)
  useEffect(() => {
    const id = active?.id ?? null
    if (id === lastHero.current) return
    lastHero.current = id
    // A world restored from the database is not a new user action.
    if (restoring.current === id) {
      restoring.current = null
      return
    }
    if (backendConfigured && userId) {
      void getSupabase().then(async (sb) => {
        if (!sb) return
        try {
          await withTimeout(Promise.all([saveUserState(sb, id), id ? logInteraction(sb, id, 'select') : Promise.resolve()]))
          refreshStats()
        } catch (err) {
          devWarn('could not record the selection', err)
        }
      })
    } else if (id) {
      // Guest: count selections on this device only.
      void Promise.resolve().then(() =>
        setLocalCounts((counts) => {
          const next = { ...counts, [id]: (counts[id] ?? 0) + 1 }
          saveSelectionCounts(next)
          return next
        }),
      )
    }
  }, [active?.id, userId, refreshStats])

  // ── Favourites ───────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(
    (id: HeroId) => {
      // Guest, no backend, or database unreachable → favourites on this device.
      if (!backendConfigured || !userId || status === 'offline') {
        const next = new Set(guestRef.current)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        updateGuestFavorites(next)
        if (status === 'offline') setNotice({ tone: 'info', text: 'Offline — saved on this device. It will sync next time you log in.' })
        return
      }
      if (!accountData) {
        setNotice({ tone: 'info', text: 'Still loading your account — try again in a second.' })
        return
      }

      const wasFavourite = accountData.favorites.has(id)
      const flip = () =>
        setAccount((a) => {
          if (!a || a.userId !== userId) return a
          const favorites = new Set(a.favorites)
          if (favorites.has(id)) favorites.delete(id)
          else favorites.add(id)
          return { ...a, favorites }
        })
      flip() // optimistic: update the UI now, confirm with the database next

      void getSupabase().then(async (sb) => {
        try {
          if (!sb) throw new Error('Supabase client unavailable')
          if (wasFavourite) {
            await withTimeout(deleteFavorite(sb, id))
          } else {
            try {
              await withTimeout(insertFavorite(sb, id))
            } catch (err) {
              // 23505: already a favourite in the database (e.g. another tab) — same end result.
              if (!isDuplicate(err)) throw err
            }
          }
          await withTimeout(logInteraction(sb, id, wasFavourite ? 'unfavorite' : 'favorite'))
          refreshStats()
        } catch (err) {
          flip() // roll back the optimistic change
          setNotice({ tone: 'error', text: `Couldn’t ${wasFavourite ? 'remove' : 'save'} favourite (${describeDbError(err)}).` })
        }
      })
    },
    [userId, status, accountData, updateGuestFavorites, refreshStats],
  )

  // ── Event registration ───────────────────────────────────────────────────────
  const saveRegistration = useCallback(
    async (row: RegistrationRow): Promise<'saved' | 'skipped'> => {
      if (!backendConfigured) return 'skipped'
      if (!userId) throw new DbError('not logged in', '42501')
      const sb = await getSupabase()
      if (!sb) throw new DbError('registration service unavailable')
      try {
        await withTimeout(insertRegistration(sb, row), 10000)
        setAccount((a) => (a && a.userId === userId ? { ...a, registration: { ...row, created_at: new Date().toISOString() } } : a))
        return 'saved'
      } catch (err) {
        // UNIQUE (user_id): already registered → load the existing registration so the UI can show it.
        if (isDuplicate(err)) {
          const existing = await fetchMyRegistration(sb).catch(() => null)
          setAccount((a) => (a && a.userId === userId ? { ...a, registration: existing } : a))
        }
        throw err
      }
    },
    [userId],
  )

  const dismissNotice = useCallback(() => setNotice(null), [])

  const favorites = status === 'online' && accountData ? accountData.favorites : guestFavorites
  const value = useMemo<MultiverseData>(
    () => ({
      status,
      favorites,
      toggleFavorite,
      mySelections: (id) => (userId ? (stats?.[id]?.mine ?? 0) : (localCounts[id] ?? 0)),
      worldStats: (id) => stats?.[id],
      registration: accountData ? accountData.registration : undefined,
      saveRegistration,
      notice,
      dismissNotice,
    }),
    [status, favorites, toggleFavorite, userId, stats, localCounts, accountData, saveRegistration, notice, dismissNotice],
  )

  return <MultiverseContext.Provider value={value}>{children}</MultiverseContext.Provider>
}
