import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { backendConfigured, devWarn, getSupabase, withTimeout } from '../lib/supabase'
import { AuthContext, type AuthContextValue, type AuthPanelMode, type AuthResult, type AuthStatus, type AuthUser } from './authContext'
import { describeAuthError, validateEmail, validatePassword } from './validation'

/** Keep only what the UI needs from Supabase's session object. */
const toUser = (session: Session | null): AuthUser | null => (session ? { id: session.user.id, email: session.user.email ?? '' } : null)

/**
 * Supabase Auth, email + password.
 *
 * - Passwords go straight to Supabase Auth over HTTPS; Supabase stores only a bcrypt hash.
 * - supabase-js saves the session (a short-lived JWT access token + refresh token) in
 *   localStorage and refreshes it automatically, so a page refresh keeps the user logged in.
 * - onAuthStateChange tells React whenever the user logs in, logs out or the token refreshes.
 * - If Supabase is missing or unreachable, the site still renders — auth just stays signed out.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(backendConfigured ? 'loading' : 'disabled')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [panel, setPanel] = useState<AuthContextValue['panel']>({ open: false, mode: 'login', reason: null })
  const client = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    if (!backendConfigured) return
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    const apply = (session: Session | null) => {
      if (cancelled) return
      setUser((prev) => {
        const next = toUser(session)
        // Keep the same object if nothing changed (token refreshes fire often)
        return prev?.id === next?.id && prev?.email === next?.email ? prev : next
      })
      setStatus(session ? 'signed-in' : 'signed-out')
    }

    void (async () => {
      const sb = await getSupabase()
      if (!sb || cancelled) {
        if (!cancelled) setStatus('signed-out')
        return
      }
      client.current = sb
      // Fires on sign-in, sign-out and token refresh. Only update React state here —
      // calling other Supabase methods inside this callback can deadlock.
      const { data } = sb.auth.onAuthStateChange((_event, session) => apply(session))
      unsubscribe = () => data.subscription.unsubscribe()
      try {
        // Restores a saved session from localStorage (refreshing it if expired).
        const { data: current, error } = await withTimeout(sb.auth.getSession())
        if (error) throw error
        apply(current.session)
      } catch (err) {
        devWarn('could not restore the session — continuing signed out', err)
        apply(null)
      }
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const invalid = validateEmail(email) ?? validatePassword(password)
    if (invalid) return { ok: false, message: invalid }
    const sb = client.current
    if (!sb) return { ok: false, message: 'Accounts are unavailable right now.' }
    try {
      const { data, error } = await withTimeout(sb.auth.signUp({ email: email.trim(), password }), 10000)
      if (error) return { ok: false, message: describeAuthError(error) }
      // With "Confirm email" OFF Supabase returns a session straight away.
      // With it ON there is no session until the user clicks the emailed link.
      return { ok: true, needsConfirmation: !data.session }
    } catch (err) {
      return { ok: false, message: describeAuthError(err) }
    }
  }, [])

  const logIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const invalid = validateEmail(email)
    if (invalid) return { ok: false, message: invalid }
    const sb = client.current
    if (!sb) return { ok: false, message: 'Accounts are unavailable right now.' }
    try {
      const { error } = await withTimeout(sb.auth.signInWithPassword({ email: email.trim(), password }), 10000)
      return error ? { ok: false, message: describeAuthError(error) } : { ok: true }
    } catch (err) {
      return { ok: false, message: describeAuthError(err) }
    }
  }, [])

  const logOut = useCallback(async () => {
    const sb = client.current
    if (!sb) return
    try {
      const { error } = await withTimeout(sb.auth.signOut())
      if (error) throw error
    } catch (err) {
      // Server unreachable: still forget the session on this device.
      devWarn('server sign-out failed — signing out locally', err)
      await sb.auth.signOut({ scope: 'local' }).catch(() => undefined)
      setUser(null)
      setStatus('signed-out')
    }
  }, [])

  const openPanel = useCallback((mode: AuthPanelMode = 'login', reason?: string) => {
    setPanel({ open: true, mode, reason: reason ?? null })
  }, [])
  const closePanel = useCallback(() => setPanel((p) => ({ ...p, open: false, reason: null })), [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signUp, logIn, logOut, panel, openPanel, closePanel }),
    [status, user, signUp, logIn, logOut, panel, openPanel, closePanel],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
