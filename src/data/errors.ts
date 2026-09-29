/**
 * Database errors → short, human messages.
 *
 * PostgREST (Supabase's database API) returns the PostgreSQL error code, so the UI can react
 * to *why* something failed instead of just "error":
 *   23505 unique_violation       → duplicate (e.g. already favourited / already registered)
 *   23514 check_violation        → a CHECK constraint rejected the value
 *   23503 foreign_key_violation  → referenced row doesn't exist (e.g. unknown hero)
 *   42501 insufficient_privilege → RLS/permissions said no (usually: not logged in)
 */
export class DbError extends Error {
  readonly code: string

  constructor(message: string, code = '') {
    super(message)
    this.name = 'DbError'
    this.code = code
  }
}

export const isDuplicate = (err: unknown): boolean => err instanceof DbError && err.code === '23505'

export function describeDbError(err: unknown): string {
  const code = err instanceof DbError ? err.code : ''
  const message = err instanceof Error ? err.message : ''
  switch (code) {
    case '23505':
      return 'already saved'
    case '23514':
      return 'details rejected by the server'
    case '23503':
      return 'unknown hero'
    case '42501':
      return 'not allowed — please log in again'
  }
  if (/timed out|fetch|network|unavailable/i.test(message)) return 'signal lost — check your connection'
  return message || 'unknown error'
}
