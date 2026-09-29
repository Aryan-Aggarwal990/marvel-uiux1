import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, RotateCcw } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import { heroById, heroes, tracks, type Hero, type HeroId } from '../config/characters'
import { useHero } from '../theme/heroContext'
import { useMultiverse } from '../data/multiverseContext'
import { useAuth } from '../auth/authContext'
import { describeDbError, isDuplicate } from '../data/errors'
import { HeroPortrait } from './art/CharacterArt'
import { HeroEmblem } from './art/emblems'
import Magnetic from './ui/Magnetic'
import './Registration.css'

interface FormValues {
  name: string
  email: string
  phone: string
  branch: string
}
type FieldKey = keyof FormValues
type FormErrors = Partial<Record<FieldKey, string>>
type Status = 'idle' | 'processing' | 'done'

const EMPTY: FormValues = { name: '', email: '', phone: '', branch: '' }
const LOG = ['Verifying identity', `Syncing with ${eventConfig.universeCode}`, 'Allocating hero slot', 'Encrypting transmission']
const BLOCKS = 20

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {}
  if (v.name.trim().length < 2) e.name = 'Identify yourself, hero.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Invalid signal — check the email.'
  if (!/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(v.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid 10-digit mobile number.'
  if (!v.branch) e.branch = 'Select your branch / year.'
  return e
}

/** POSTs to eventConfig.registration.endpoint when set; otherwise the submission is simulated. */
interface Submission extends FormValues {
  hero: HeroId | null
  track: string | null
}

async function submitToEndpoint(values: Submission): Promise<void> {
  const { endpoint } = eventConfig.registration
  if (!endpoint) return
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

/** What the confirmed view shows — from PostgreSQL when logged in, or from the simulated submit. */
interface Confirmation {
  name: string
  email: string
  badge: string
  hero: Hero | undefined
  track: string | null
  /** true when this account had already registered (UNIQUE (user_id) → 23505) */
  already: boolean
}

export default function Registration() {
  const { active, select } = useHero()
  const { saveRegistration, registration: saved } = useMultiverse()
  const { status: authStatus, user, openPanel } = useAuth()
  const accountsOn = authStatus !== 'disabled'
  const root = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [failure, setFailure] = useState('')
  const [localConfirmation, setLocalConfirmation] = useState<Confirmation | null>(null)
  const [submittedBy, setSubmittedBy] = useState<string | null>(null)
  const { registration } = eventConfig

  // Logged in with a saved registration → always show it (PostgreSQL is the source of truth).
  const savedConfirmation: Confirmation | null =
    accountsOn && user && saved
      ? {
          name: saved.name,
          email: saved.email,
          badge: saved.badge_id,
          hero: heroById(saved.character_id),
          track: saved.track,
          already: submittedBy !== user.id,
        }
      : null
  const shown = savedConfirmation ?? (status === 'done' ? localConfirmation : null)
  const view: Status = status === 'processing' ? 'processing' : shown ? 'done' : 'idle'

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.reg-title .mask-inner', {
        yPercent: 110,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.reg-title', start: 'top 85%' },
      })
      gsap.from('.reg-side > *, .reg-panel', {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.reg-body', start: 'top 80%' },
      })
    },
    { scope: root },
  )

  // Success reveal, run whenever the panel switches to the confirmed view
  useGSAP(
    () => {
      if (view !== 'done' || prefersReducedMotion()) return
      gsap
        .timeline()
        .fromTo('.reg-flash', { opacity: 0.9 }, { opacity: 0, duration: 1.2, ease: 'power2.out' })
        .from('.reg-done .mask-inner', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.1 }, 0.1)
        .from('.reg-done-fade', { opacity: 0, y: 20, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.4)
    },
    { scope: panel, dependencies: [view] },
  )

  const set = (key: keyof FormValues) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const runSequence = () =>
    new Promise<void>((resolve) => {
      const el = panel.current
      const bar = el?.querySelector('.reg-bar')
      const pct = el?.querySelector('.reg-pct')
      if (!el || !bar || !pct) return resolve()
      const counter = { v: 0 }
      gsap
        .timeline({ onComplete: resolve })
        .from(el.querySelectorAll('.reg-proc > *'), { opacity: 0, y: 12, stagger: 0.08, duration: 0.4 })
        .to(
          counter,
          {
            v: 100,
            duration: prefersReducedMotion() ? 0.3 : 2.1,
            ease: 'power1.inOut',
            onUpdate: () => {
              const n = Math.round((counter.v / 100) * BLOCKS)
              bar.textContent = '█'.repeat(n) + '░'.repeat(BLOCKS - n)
              pct.textContent = `${Math.round(counter.v)}%`
            },
          },
          0.2,
        )
        .from(el.querySelectorAll('.reg-log li'), { opacity: 0, x: -10, stagger: 0.45, duration: 0.3 }, 0.3)
    })

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    setFailure('')
    const firstKey = Object.keys(found)[0]
    if (firstKey) {
      root.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus()
      gsap.fromTo(root.current?.querySelector('.reg-form') ?? null, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
      return
    }
    // ACCOUNT ≠ EVENT REGISTRATION: an account (Supabase Auth) is needed so the registration
    // can belong to auth.uid() — UNIQUE (user_id) then allows exactly one per account.
    if (accountsOn && !user) {
      if (authStatus === 'loading') setFailure('Checking your account — try again in a second.')
      else openPanel('login', 'Log in or create an agent account to lock in your registration. Your details stay filled in.')
      return
    }
    setStatus('processing')
    // Wait for the processing view to mount, then run animation + request together.
    await new Promise((r) => requestAnimationFrame(r))
    const badge = `${active ? active.id.slice(0, 4).toUpperCase() : 'GFG'}-616-${Math.floor(1000 + Math.random() * 9000)}`
    const track = active ? tracks[active.track].role : null
    // allSettled: always let the processing animation finish before showing the outcome.
    const [, saveResult, endpointResult] = await Promise.allSettled([
      runSequence(),
      // Supabase (when configured) — normalised to match the database CHECK constraints
      saveRegistration({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.replace(/[\s-]/g, ''),
        branch: values.branch,
        character_id: active?.id ?? null,
        track,
        badge_id: badge,
      }),
      submitToEndpoint({ ...values, hero: active?.id ?? null, track }),
    ])
    const error = saveResult.status === 'rejected' ? saveResult.reason : endpointResult.status === 'rejected' ? endpointResult.reason : null

    if (!error) {
      if (saveResult.status === 'fulfilled' && saveResult.value === 'saved') {
        setSubmittedBy(user?.id ?? null) // confirmation now comes from PostgreSQL
        setStatus('idle')
      } else {
        // No backend configured: simulated, exactly as before
        setLocalConfirmation({ name: values.name, email: values.email, badge, hero: active ?? undefined, track, already: false })
        setStatus('done')
      }
      return
    }
    setStatus('idle')
    // 23505 = this account is already registered; the provider has loaded the existing
    // registration, so the confirmed view appears with an "Already registered" label.
    if (!isDuplicate(error)) setFailure(`Transmission failed (${describeDbError(error)}). Please try again.`)
  }

  const reset = () => {
    setValues(EMPTY)
    setLocalConfirmation(null)
    setStatus('idle')
  }

  return (
    <section className="reg section" id="register" ref={root}>
      <div className="reg-glow" aria-hidden="true" />
      <div className="container">
        <p className="eyebrow">Final protocol</p>
        <h2 className="reg-title display">
          <span className="mask">
            <span className="mask-inner">Ready to enter</span>
          </span>
          <span className="mask">
            <span className="mask-inner">
              <span className="outline-text">The</span> multiverse<span className="accent">?</span>
            </span>
          </span>
        </h2>

        <div className="reg-body">
          <aside className="reg-side">
            <p className="reg-lead">
              Seats in this universe are limited. Lock in your spot, pick your hero, and we&apos;ll transmit your mission brief before the
              portals open.
            </p>
            <ol className="reg-steps">
              <li>
                <span className="mono accent">01</span> Transmit your details
              </li>
              <li>
                <span className="mono accent">02</span> Choose your hero track
              </li>
              <li>
                <span className="mono accent">03</span> Report to {eventConfig.venue}
              </li>
            </ol>
            <div className="reg-tags">
              <span className="hud-tag">
                Date // <b>{eventConfig.date}</b>
              </span>
              <span className="hud-tag">
                Time // <b>{eventConfig.time}</b>
              </span>
              <span className="hud-tag">
                <span className="pulse-dot" /> Seats // <b>Limited</b>
              </span>
            </div>
            {registration.externalLink && (
              <a className="u-link mono reg-external" href={registration.externalLink} target="_blank" rel="noreferrer">
                Prefer the official form? Register here <ArrowUpRight size={14} />
              </a>
            )}
          </aside>

          <div className={`reg-panel is-${view}`} ref={panel}>
            <div className="reg-panel-head mono">
              <span>
                <span className={`pulse-dot ${view === 'done' ? 'green' : ''}`} /> Entry terminal // {eventConfig.protocol}
              </span>
              <span className="muted">{view === 'idle' ? 'Awaiting input' : view === 'processing' ? 'Processing' : 'Confirmed'}</span>
            </div>
            <div className="corners" aria-hidden="true">
              <i />
            </div>

            {view === 'idle' && (
              <form className="reg-form" onSubmit={onSubmit} noValidate>
                <Field label="Name" index="01" error={errors.name}>
                  <input name="name" autoComplete="name" placeholder="Peter Parker" value={values.name} onChange={set('name')} />
                </Field>
                <Field label="Email" index="02" error={errors.email}>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@bennett.edu.in"
                    value={values.email}
                    onChange={set('email')}
                  />
                </Field>
                <Field label="Phone" index="03" error={errors.phone}>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="98XXXXXXXX"
                    value={values.phone}
                    onChange={set('phone')}
                  />
                </Field>
                <Field label="Branch / Year" index="04" error={errors.branch}>
                  <select name="branch" value={values.branch} onChange={set('branch')} className={values.branch ? '' : 'is-empty'}>
                    <option value="" disabled>
                      Select your division
                    </option>
                    {registration.branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="reg-hero">
                  <label className="reg-field reg-hero-field">
                    <span className="reg-label mono">
                      <span className="accent">05</span> Your hero <span className="muted">(changes your world)</span>
                    </span>
                    <select
                      name="hero"
                      value={active?.id ?? ''}
                      className={active ? '' : 'is-empty'}
                      onChange={(e) => {
                        const r = e.currentTarget.getBoundingClientRect()
                        select((e.target.value || null) as HeroId | null, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
                      }}
                    >
                      <option value="">No hero — stay in the multiverse</option>
                      {heroes.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {tracks[h.track].role}
                        </option>
                      ))}
                    </select>
                    <span className="reg-line" aria-hidden="true" />
                  </label>
                  {active && (
                    <p className="reg-hero-card mono" key={active.id}>
                      <HeroEmblem id={active.id} className="reg-hero-emblem" />
                      <span>
                        {tracks[active.track].role} <span className="muted">// {tracks[active.track].tags}</span>
                      </span>
                    </p>
                  )}
                </div>

                {failure && <p className="reg-failure mono">{failure}</p>}

                <Magnetic strength={0.2} className="reg-submit-wrap">
                  <button type="submit" className="btn btn-solid reg-submit" data-cursor="Enter">
                    Initiate entry <ArrowRight size={18} />
                  </button>
                </Magnetic>
                {accountsOn && (
                  <p className="reg-auth-hint mono">
                    {user ? (
                      <>
                        <span className="pulse-dot green" /> Registering as agent // {user.email}
                      </>
                    ) : (
                      <>
                        {'// '}Requires an agent account —{' '}
                        <button type="button" className="u-link" onClick={() => openPanel('login')}>
                          log in or sign up
                        </button>
                      </>
                    )}
                  </p>
                )}
              </form>
            )}

            {view === 'processing' && (
              <div className="reg-proc" aria-live="assertive">
                <p className="reg-proc-title display">Access requested</p>
                <p className="reg-progress mono">
                  <span className="reg-bar">{'░'.repeat(BLOCKS)}</span>
                  <span className="reg-pct">0%</span>
                </p>
                <ul className="reg-log mono">
                  {LOG.map((l) => (
                    <li key={l}>
                      <span className="accent">&gt;</span> {l}... <span className="reg-ok">OK</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {view === 'done' && shown && (
              <div className="reg-done" aria-live="assertive">
                <div className="reg-flash" aria-hidden="true" />
                {shown.hero && (
                  <div className="reg-done-art" aria-hidden="true">
                    <HeroPortrait hero={shown.hero} />
                  </div>
                )}
                <p className="mono reg-done-fade reg-done-kicker">
                  <span className="pulse-dot green" /> {shown.already ? 'Already registered // this account' : 'Access // Granted'}
                </p>
                <h3 className="display reg-done-title">
                  <span className="mask">
                    <span className="mask-inner">Welcome,</span>
                  </span>
                  <span className="mask">
                    <span className="mask-inner accent">Hero.</span>
                  </span>
                </h3>
                <p className="mono reg-done-fade reg-done-sub">
                  Registration confirmed.{shown.hero && <span className="accent"> {shown.hero.welcome}</span>}
                </p>

                <div className="reg-card reg-done-fade">
                  <div>
                    <span className="mono muted">Hero ID</span>
                    <b>{shown.badge}</b>
                  </div>
                  <div>
                    <span className="mono muted">Agent</span>
                    <b>{shown.name}</b>
                  </div>
                  <div>
                    <span className="mono muted">Hero</span>
                    <b>{shown.hero ? shown.hero.name : 'Unassigned'}</b>
                  </div>
                  <div>
                    <span className="mono muted">Track</span>
                    <b>{shown.track ?? 'Any'}</b>
                  </div>
                </div>

                <p className="reg-done-fade reg-done-note">
                  Your mission brief will be transmitted to <b>{shown.email}</b>. See you in the multiverse.
                </p>
                {savedConfirmation ? (
                  <p className="mono reg-done-fade reg-done-once">One registration per account — saved to your agent profile.</p>
                ) : (
                  <button className="u-link mono reg-done-fade reg-again" onClick={reset}>
                    <RotateCcw size={13} /> Register another hero
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

interface FieldProps {
  label: string
  index: string
  error?: string
  children: ReactNode
}

function Field({ label, index, error, children }: FieldProps) {
  return (
    <label className={`reg-field ${error ? 'has-error' : ''}`}>
      <span className="reg-label mono">
        <span className="accent">{index}</span> {label}
      </span>
      {children}
      <span className="reg-line" aria-hidden="true" />
      {error && (
        <span className="reg-error mono" role="alert">
          {'// '}
          {error}
        </span>
      )}
    </label>
  )
}
