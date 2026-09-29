/**
 * Database access layer: one small function per Supabase call.
 * See supabase/migrations/0001_multiverse.sql for the tables and RLS policies.
 *
 * None of these functions pass a user_id: the database fills it from auth.uid()
 * (the logged-in user's JWT) and RLS rejects rows that belong to someone else.
 */
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { heroes, type HeroId } from '../config/characters'
import { DbError } from './errors'

export type InteractionType = 'select' | 'favorite' | 'unfavorite'

export interface HeroStats {
  /** Selections by everyone */
  selections: number
  /** Users who favourited this hero */
  favorites: number
  /** Selections by the logged-in user (0 when logged out) */
  mine: number
}

/** Event registration details (NOT the login account — no password here). */
export interface RegistrationRow {
  name: string
  email: string
  phone: string
  branch: string
  character_id: HeroId | null
  track: string | null
  badge_id: string
}

export interface SavedRegistration extends RegistrationRow {
  created_at: string
}

const HERO_IDS = new Set<string>(heroes.map((h) => h.id))
/** Only accept hero ids that exist in src/config/characters.ts. */
export const isHeroId = (value: unknown): value is HeroId => typeof value === 'string' && HERO_IDS.has(value)

/** Throws a DbError (keeping the PostgreSQL error code) if the request failed. */
function check(error: PostgrestError | null): void {
  if (error) throw new DbError(error.message, error.code)
}

// ── Favourites ────────────────────────────────────────────────────────────────
export async function fetchFavorites(sb: SupabaseClient): Promise<HeroId[]> {
  const { data, error } = await sb.from('favorites').select('character_id').order('created_at')
  check(error)
  return (data ?? []).map((row: { character_id: unknown }) => row.character_id).filter(isHeroId)
}

/** Plain insert: favouriting twice makes PostgreSQL raise 23505 (primary key). */
export async function insertFavorite(sb: SupabaseClient, id: HeroId): Promise<void> {
  const { error } = await sb.from('favorites').insert({ character_id: id })
  check(error)
}

export async function deleteFavorite(sb: SupabaseClient, id: HeroId): Promise<void> {
  // RLS limits the delete to the caller's own rows, so no user_id filter is needed.
  const { error } = await sb.from('favorites').delete().eq('character_id', id)
  check(error)
}

// ── Interactions (append-only history) ────────────────────────────────────────
export async function logInteraction(sb: SupabaseClient, id: HeroId, type: InteractionType): Promise<void> {
  const { error } = await sb.from('interactions').insert({ character_id: id, interaction_type: type })
  check(error)
}

// ── User state (current hero world) ───────────────────────────────────────────
export async function fetchUserState(sb: SupabaseClient): Promise<HeroId | null> {
  const { data, error } = await sb.from('user_state').select('active_character_id').maybeSingle()
  check(error)
  return isHeroId(data?.active_character_id) ? data.active_character_id : null
}

export async function saveUserState(sb: SupabaseClient, id: HeroId | null): Promise<void> {
  // upsert = insert the row the first time, update it afterwards (one row per user).
  const { error } = await sb.from('user_state').upsert({ active_character_id: id }, { onConflict: 'user_id' })
  check(error)
}

// ── Aggregate statistics (counts only; works logged in or out) ────────────────
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

// ── Event registration (one per account: UNIQUE (user_id)) ────────────────────
export async function fetchMyRegistration(sb: SupabaseClient): Promise<SavedRegistration | null> {
  const { data, error } = await sb
    .from('event_registrations')
    .select('name, email, phone, branch, character_id, track, badge_id, created_at')
    .maybeSingle()
  check(error)
  return data ? { ...data, character_id: isHeroId(data.character_id) ? data.character_id : null } : null
}

/** A second registration by the same account makes PostgreSQL raise 23505. */
export async function insertRegistration(sb: SupabaseClient, row: RegistrationRow): Promise<void> {
  const { error } = await sb.from('event_registrations').insert(row)
  check(error)
}
