/** Thin, typed wrappers around the Supabase tables (see supabase/migrations/0001_multiverse.sql). */
import type { SupabaseClient } from '@supabase/supabase-js'
import { heroes, type HeroId } from '../config/characters'

export type InteractionType = 'select' | 'favorite' | 'unfavorite'

export interface HeroStats {
  /** Selections by everyone */
  selections: number
  /** Users who favourited this hero */
  favorites: number
  /** Selections by this browser's anonymous user */
  mine: number
}

export interface RegistrationRow {
  name: string
  email: string
  phone: string
  branch: string
  character_id: HeroId | null
  track: string | null
  badge_id: string
}

const HERO_IDS = new Set<string>(heroes.map((h) => h.id))
export const isHeroId = (value: unknown): value is HeroId => typeof value === 'string' && HERO_IDS.has(value)

function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

let session: Promise<string> | null = null

/** Reuses the stored session or silently signs in anonymously. Returns the anonymous user id. */
export function ensureSession(sb: SupabaseClient): Promise<string> {
  session ??= (async () => {
    const { data, error } = await sb.auth.getSession()
    check(error)
    if (data.session) return data.session.user.id
    const signIn = await sb.auth.signInAnonymously()
    check(signIn.error)
    if (!signIn.data.user) throw new Error('anonymous sign-in returned no user')
    return signIn.data.user.id
  })().catch((err: unknown) => {
    session = null // allow a later retry
    throw err
  })
  return session
}

export async function fetchFavorites(sb: SupabaseClient): Promise<HeroId[]> {
  const { data, error } = await sb.from('favorites').select('character_id')
  check(error)
  return (data ?? []).map((row: { character_id: unknown }) => row.character_id).filter(isHeroId)
}

export async function addFavorite(sb: SupabaseClient, id: HeroId): Promise<void> {
  // ignoreDuplicates: favouriting twice is a no-op rather than an error
  const { error } = await sb.from('favorites').upsert({ character_id: id }, { onConflict: 'user_id,character_id', ignoreDuplicates: true })
  check(error)
}

export async function removeFavorite(sb: SupabaseClient, id: HeroId): Promise<void> {
  const { error } = await sb.from('favorites').delete().eq('character_id', id)
  check(error)
}

export async function logInteraction(sb: SupabaseClient, id: HeroId, type: InteractionType): Promise<void> {
  const { error } = await sb.from('interactions').insert({ character_id: id, interaction_type: type })
  check(error)
}

export async function saveActiveHero(sb: SupabaseClient, id: HeroId | null): Promise<void> {
  const { error } = await sb.from('user_state').upsert({ active_character_id: id }, { onConflict: 'user_id' })
  check(error)
}

export async function fetchStats(sb: SupabaseClient): Promise<Partial<Record<HeroId, HeroStats>>> {
  const { data, error } = await sb.rpc('character_stats')
  check(error)
  const stats: Partial<Record<HeroId, HeroStats>> = {}
  for (const row of (data ?? []) as { character_id: unknown; selections: unknown; favorites: unknown; my_selections: unknown }[]) {
    if (!isHeroId(row.character_id)) continue
    stats[row.character_id] = {
      selections: Number(row.selections) || 0,
      favorites: Number(row.favorites) || 0,
      mine: Number(row.my_selections) || 0,
    }
  }
  return stats
}

export async function insertRegistration(sb: SupabaseClient, row: RegistrationRow): Promise<void> {
  // No .select() afterwards: the insert alone is enough and needs no read-back.
  const { error } = await sb.from('registrations').insert(row)
  check(error)
}
