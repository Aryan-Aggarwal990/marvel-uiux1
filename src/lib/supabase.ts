/**
 * Optional Supabase client. The backend is an enhancement: when the env vars are missing or the
 * library fails to load, getSupabase() resolves to null and the site runs exactly as before.
 * Only the public anon key is used here — never put a service-role key in frontend code.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const backendConfigured = Boolean(url && anonKey && /^https?:\/\//.test(url))

let clientPromise: Promise<SupabaseClient | null> | null = null

/** Lazily loads supabase-js (keeps it out of the initial bundle) and creates one shared client. */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!backendConfigured || !url || !anonKey) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'gfg-multiverse-auth' },
      }),
    )
    .catch((err: unknown) => {
      devWarn('could not load the Supabase client', err)
      return null
    })
  return clientPromise
}

/** Logs backend problems during development only; production stays silent. */
export function devWarn(message: string, detail?: unknown): void {
  if (import.meta.env.DEV) console.warn(`[multiverse backend] ${message}`, detail ?? '')
}

/** Rejects if a request takes too long, so a hanging network never leaves the UI waiting. */
export function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}
