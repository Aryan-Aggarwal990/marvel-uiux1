import { createContext, useContext } from 'react'

/**
 * disabled   → no Supabase env vars: the site runs without accounts (auth UI hidden)
 * loading    → checking for a saved session on page load
 * signed-out → no valid session
 * signed-in  → a user is logged in
 */
export type AuthStatus = 'disabled' | 'loading' | 'signed-out' | 'signed-in'

/** Only the fields the UI needs. Tokens and passwords never enter React state. */
export interface AuthUser {
  id: string
  email: string
}

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; message: string }

export type AuthPanelMode = 'login' | 'signup' | 'account'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  signUp: (email: string, password: string) => Promise<AuthResult>
  logIn: (email: string, password: string) => Promise<AuthResult>
  logOut: () => Promise<void>
  /** Login dialog state lives here so any component (navbar, registration) can open it. */
  panel: { open: boolean; mode: AuthPanelMode; reason: string | null }
  openPanel: (mode?: AuthPanelMode, reason?: string) => void
  closePanel: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
