import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { Menu, X } from 'lucide-react'
import { scrollToTarget, lockScroll, ScrollTrigger } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import ScrambleText from './ui/ScrambleText'
import { useHero } from '../theme/heroContext'
import { HeroEmblem } from './art/emblems'
import { supabase } from '../lib/supabase'
import './Navbar.css'

const LINKS = [
  { label: 'Mission', href: '#mission' },
  { label: 'Heroes', href: '#heroes' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Location', href: '#location' },
  { label: 'Register', href: '#register' },
]

export default function Navbar({ visible }: { visible: boolean }) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40)
  const [open, setOpen] = useState(false)
  const { active: hero } = useHero()
  const [active, setActive] = useState('')
  const [user, setUser] = useState<any>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setUser(data.session?.user ?? null)
  })

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null)
    },
  )

  return () => listener.subscription.unsubscribe()
}, [])

const handleLogout = async () => {
  await supabase.auth.signOut()
}
const handleAuth = async (e: FormEvent) => {
  e.preventDefault()

  setAuthLoading(true)
  setAuthMessage('')

  if (authMode === 'login') {
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    })

    if (error) {
      setAuthMessage(error.message)
    } else {
      setAuthOpen(false)
      setAuthPassword('')
    }
  } else {
    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
    })

    if (error) {
      setAuthMessage(error.message)
    } else if (data.session) {
      setAuthOpen(false)
      setAuthPassword('')
    } else {
      setAuthMessage(
        'Account created. Check your email to confirm your account.',
      )
    }
  }

  setAuthLoading(false)
}

  // Highlight the section currently crossing the middle of the viewport
  useEffect(() => {
    const triggers = LINKS.map(({ href }) =>
      ScrollTrigger.create({
        trigger: href,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => setActive((cur) => (self.isActive ? href : cur === href ? '' : cur)),
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [])

  // While the mobile menu is open: freeze page scroll and close on Escape
  useEffect(() => {
    if (!open) return
    lockScroll(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (e: MouseEvent, href: string) => {
    e.preventDefault()
    setOpen(false)
    // wait a frame so the scroll lock is released first
    requestAnimationFrame(() => scrollToTarget(href, { offset: href === '#register' ? 0 : -20 }))
  }

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${visible ? 'is-visible' : ''} ${open ? 'is-open' : ''}`}>
      <div className="nav-bar">
        <a href="#top" className="nav-logo" onClick={(e) => go(e, '#top')} aria-label="Back to top">
          <span className="nav-logo-mark">GFG</span>
          <span className="nav-logo-x">×</span>
          <span className="nav-logo-marvel">MARVEL</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => go(e, l.href)}
              className={`nav-link ${active === l.href ? 'is-active' : ''} ${l.href === '#register' ? 'nav-cta' : ''}`}
            >
              <span className="nav-idx">0{i + 1}</span>
              <ScrambleText text={l.label.toUpperCase()} />
            </a>
          ))}
        </nav>

                <button
                  className="nav-auth mono"
                  onClick={() => {
                    if (user) {
                      handleLogout()
                    } else {
                      setAuthMode('login')
                      setAuthMessage('')
                     setAuthOpen(true)
                    }
                  }}
                >            
                  {user ? 'LOGOUT' : 'LOGIN'}
                </button>

        {hero ? (
          <a
            href="#heroes"
            className="nav-status nav-hero mono"
            onClick={(e) => go(e, '#heroes')}
            key={hero.id}
            aria-label={`Active hero: ${hero.name}. Change hero`}
          >
            <HeroEmblem id={hero.id} className="nav-hero-emblem" />
            <span className="nav-hero-label">Active hero //</span> <b>{hero.name}</b>
          </a>
        ) : (
          <div className="nav-status mono" title="All systems nominal">
            <span className="pulse-dot green" />
            System online
          </div>
        )}

        <button
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {authOpen && (
  <div
    className="auth-overlay"
    onClick={() => setAuthOpen(false)}
  >
    <div
      className="auth-panel"
      role="dialog"
      aria-modal="true"
      aria-label={authMode === 'login' ? 'Login' : 'Create account'}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="auth-close"
        onClick={() => setAuthOpen(false)}
        aria-label="Close authentication"
      >
        <X size={18} />
      </button>

      <div className="auth-kicker mono">
        GFG × MARVEL // AUTHENTICATION
      </div>

      <h2>{authMode === 'login' ? 'Welcome back.' : 'Join the multiverse.'}</h2>

      <p className="auth-subtitle">
        {authMode === 'login'
          ? 'Authenticate to access your multiverse profile.'
          : 'Create an account to save heroes and register for the event.'}
      </p>

      <form onSubmit={handleAuth}>
        <label className="auth-label mono">
          EMAIL
        </label>

        <input
          className="auth-input"
          type="email"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <label className="auth-label mono">
          PASSWORD
        </label>

        <input
          className="auth-input"
          type="password"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          required
        />

        {authMessage && (
          <p className="auth-message">
            {authMessage}
          </p>
        )}

        <button
          className="auth-submit mono"
          type="submit"
          disabled={authLoading}
        >
          {authLoading
            ? 'PROCESSING...'
            : authMode === 'login'
              ? 'LOGIN // ENTER'
              : 'CREATE ACCOUNT'}
        </button>
      </form>

      <button
        className="auth-switch mono"
        onClick={() => {
          setAuthMode(authMode === 'login' ? 'signup' : 'login')
          setAuthMessage('')
        }}
      >
        {authMode === 'login'
          ? 'NEW USER? // CREATE ACCOUNT'
          : 'ALREADY REGISTERED? // LOGIN'}
      </button>
    </div>
  </div>
)}

      <div className="nav-mobile" id="mobile-menu" aria-hidden={!open}>
        <div className="nav-mobile-head mono">
          <span>{eventConfig.universeCode} // NAVIGATION</span>
          <span className="nav-mobile-status">
            <span className="pulse-dot green" /> {hero ? `Hero // ${hero.name}` : 'ONLINE'}
          </span>
        </div>
        <ul>
          {LINKS.map((l, i) => (
            <li key={l.href} style={{ '--i': i }}>
              <a href={l.href} onClick={(e) => go(e, l.href)} tabIndex={open ? 0 : -1}>
                <span className="mono">0{i + 1}</span>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="nav-mobile-foot mono">
          {eventConfig.organiser} · {eventConfig.university}
        </p>
      </div>
    </header>
  )
}
