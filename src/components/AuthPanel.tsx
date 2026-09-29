import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, LogOut, X } from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { validateCredentials, type CredentialErrors } from '../auth/validation'
import { lockScroll } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import { heroes } from '../config/characters'
import { useMultiverse } from '../data/multiverseContext'
import { useHero } from '../theme/heroContext'
import { HeroEmblem } from './art/emblems'
import './AuthPanel.css'

/**
 * Account dialog: Log in · Sign up · Account.
 * ACCOUNT (email + password → Supabase Auth) is deliberately separate from the
 * EVENT REGISTRATION form further down the page (details → PostgreSQL).
 */
export default function AuthPanel() {
  const { status, user, panel, openPanel, closePanel, logIn, signUp, logOut } = useAuth()
  const { status: dataStatus, favorites } = useMultiverse()
  const { select } = useHero()
  const dialog = useRef<HTMLDialogElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<CredentialErrors>({})
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const mode = status === 'signed-in' ? 'account' : panel.mode === 'account' ? 'login' : panel.mode

  // Keep the native <dialog> in sync with React state (showModal gives focus trapping + Esc).
  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (panel.open && !el.open) {
      el.showModal()
      lockScroll(true)
    } else if (!panel.open && el.open) {
      el.close()
    }
  }, [panel.open])

  const switchMode = (next: 'login' | 'signup') => {
    setErrors({})
    setMessage(null)
    setConfirm('')
    openPanel(next, panel.reason ?? undefined)
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mode === 'account') return
    const found = validateCredentials(mode, email, password, confirm)
    setErrors(found)
    setMessage(null)
    if (Object.keys(found).length) return
    setBusy(true)
    const result = mode === 'signup' ? await signUp(email, password) : await logIn(email, password)
    setBusy(false)
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message })
      return
    }
    setPassword('')
    setConfirm('')
    if (result.needsConfirmation) {
      setMessage({ tone: 'info', text: 'Account created. Check your inbox to confirm your email, then log in.' })
      openPanel('login', panel.reason ?? undefined)
      return
    }
    // Opened from the registration form? Close so the user can finish registering.
    if (panel.reason) closePanel()
  }

  return (
    <dialog
      ref={dialog}
      className="auth-dialog"
      aria-labelledby="auth-title"
      onClose={() => {
        lockScroll(false)
        closePanel()
      }}
      onClick={(e) => e.target === e.currentTarget && closePanel()}
    >
      <div className="auth-panel">
        <div className="auth-head mono">
          <span>
            <span className={`pulse-dot ${status === 'signed-in' ? 'green' : ''}`} /> Access terminal // {eventConfig.protocol}
          </span>
          <button className="auth-close" onClick={closePanel} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="corners" aria-hidden="true">
          <i />
        </div>

        {mode === 'account' && user ? (
          <div className="auth-body">
            <p className="mono auth-kicker is-ok">
              <span className="pulse-dot green" /> Access // Granted
            </p>
            <h2 id="auth-title" className="display auth-title">
              Agent <span className="accent">online</span>
            </h2>
            <p className="auth-email mono">{user.email}</p>
            <div className="auth-saved">
              <p className="auth-label mono">
                <span className="accent">//</span> Saved favourites{' '}
                {dataStatus === 'syncing' ? '— syncing…' : dataStatus === 'offline' ? '— offline (on this device)' : `(${favorites.size})`}
              </p>
              {favorites.size ? (
                <ul className="auth-favs">
                  {heroes
                    .filter((h) => favorites.has(h.id))
                    .map((h) => (
                      <li key={h.id}>
                        <button
                          style={{ '--c1': h.theme.accent }}
                          onClick={(e) => {
                            closePanel()
                            select(h.id, { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 })
                          }}
                          aria-label={`Enter ${h.name}'s world`}
                        >
                          <HeroEmblem id={h.id} className="auth-fav-emblem" />
                          {h.name}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="auth-empty mono">No favourites yet — tap ♥ on a hero in the lineup.</p>
              )}
            </div>
            <button className="btn auth-submit" onClick={() => void logOut()}>
              Log out <LogOut size={16} />
            </button>
          </div>
        ) : (
          <form className="auth-body" onSubmit={onSubmit} noValidate>
            <div className="auth-tabs mono" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'is-on' : ''}
                onClick={() => switchMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? 'is-on' : ''}
                onClick={() => switchMode('signup')}
              >
                Sign up
              </button>
            </div>
            <h2 id="auth-title" className="display auth-title">
              {mode === 'signup' ? (
                <>
                  Create your <span className="accent">agent ID</span>
                </>
              ) : (
                <>
                  Welcome <span className="accent">back</span>
                </>
              )}
            </h2>
            {panel.reason && <p className="auth-reason mono">{panel.reason}</p>}

            <label className={`auth-field ${errors.email ? 'has-error' : ''}`}>
              <span className="auth-label mono">
                <span className="accent">01</span> Email
              </span>
              <input
                type="email"
                name="auth-email"
                autoComplete="email"
                placeholder="you@bennett.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <span className="auth-error mono">
                  {'// '}
                  {errors.email}
                </span>
              )}
            </label>

            <label className={`auth-field ${errors.password ? 'has-error' : ''}`}>
              <span className="auth-label mono">
                <span className="accent">02</span> Password
              </span>
              <span className="auth-password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="auth-password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? '8+ characters, letters and numbers' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-reveal"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
              {errors.password && (
                <span className="auth-error mono">
                  {'// '}
                  {errors.password}
                </span>
              )}
            </label>

            {mode === 'signup' && (
              <label className={`auth-field ${errors.confirm ? 'has-error' : ''}`}>
                <span className="auth-label mono">
                  <span className="accent">03</span> Confirm password
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="auth-confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {errors.confirm && (
                  <span className="auth-error mono">
                    {'// '}
                    {errors.confirm}
                  </span>
                )}
              </label>
            )}

            {message && (
              <p className={`auth-message mono is-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>
                {message.text}
              </p>
            )}

            <button type="submit" className="btn btn-solid auth-submit" disabled={busy} data-cursor="Enter">
              {busy ? 'Authenticating…' : mode === 'signup' ? 'Create account' : 'Log in'} {!busy && <ArrowRight size={16} />}
            </button>
            <p className="auth-note mono">Passwords are handled by Supabase Auth and never stored by this site.</p>
          </form>
        )}
      </div>
    </dialog>
  )
}
