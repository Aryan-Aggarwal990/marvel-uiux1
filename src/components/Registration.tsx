import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, RotateCcw } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { eventConfig, type CharacterId } from '../config/eventConfig'
import Magnetic from './ui/Magnetic'
import './Registration.css'

interface FormValues {
  name: string
  email: string
  phone: string
  branch: string
  hero: CharacterId | ''
}
type FieldKey = Exclude<keyof FormValues, 'hero'>
type FormErrors = Partial<Record<FieldKey, string>>
type Status = 'idle' | 'processing' | 'done'

const EMPTY: FormValues = { name: '', email: '', phone: '', branch: '', hero: '' }
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
async function submitToEndpoint(values: FormValues): Promise<void> {
  const { endpoint } = eventConfig.registration
  if (!endpoint) return
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export default function Registration({ selectedHero }: { selectedHero: CharacterId | '' }) {
  const root = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [failure, setFailure] = useState('')
  const [heroId, setHeroId] = useState('')
  const { characters, registration } = eventConfig

  // Prefill the hero chosen in the Hero Selector (adjusting state during render, no effect needed)
  const [lastSelected, setLastSelected] = useState(selectedHero)
  if (selectedHero !== lastSelected) {
    setLastSelected(selectedHero)
    if (selectedHero) setValues((v) => ({ ...v, hero: selectedHero }))
  }

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
      if (status !== 'done' || prefersReducedMotion()) return
      gsap
        .timeline()
        .fromTo('.reg-flash', { opacity: 0.9 }, { opacity: 0, duration: 1.2, ease: 'power2.out' })
        .from('.reg-done .mask-inner', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.1 }, 0.1)
        .from('.reg-done-fade', { opacity: 0, y: 20, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.4)
    },
    { scope: panel, dependencies: [status] },
  )

  const set = (key: keyof FormValues) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (key !== 'hero' && errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
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
    setStatus('processing')
    // Wait for the processing view to mount, then run animation + request together.
    await new Promise((r) => requestAnimationFrame(r))
    try {
      await Promise.all([runSequence(), submitToEndpoint(values)])
      setHeroId(`GFG-616-${Math.floor(1000 + Math.random() * 9000)}`)
      setStatus('done')
    } catch (err) {
      setFailure(`Transmission failed (${err instanceof Error ? err.message : 'unknown error'}). Please try again.`)
      setStatus('idle')
    }
  }

  const reset = () => {
    setValues({ ...EMPTY, hero: values.hero })
    setStatus('idle')
  }

  const heroName = characters.find((c) => c.id === values.hero)?.name

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
              <span className="outline-text">The</span> multiverse<span className="red">?</span>
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
                <span className="mono red">01</span> Transmit your details
              </li>
              <li>
                <span className="mono red">02</span> Choose your hero track
              </li>
              <li>
                <span className="mono red">03</span> Report to {eventConfig.venue}
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

          <div className={`reg-panel is-${status}`} ref={panel}>
            <div className="reg-panel-head mono">
              <span>
                <span className={`pulse-dot ${status === 'done' ? 'green' : ''}`} /> Entry terminal // {eventConfig.protocol}
              </span>
              <span className="muted">{status === 'idle' ? 'Awaiting input' : status === 'processing' ? 'Processing' : 'Confirmed'}</span>
            </div>
            <div className="corners" aria-hidden="true">
              <i />
            </div>

            {status === 'idle' && (
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

                <fieldset className="reg-heroes">
                  <legend className="mono">
                    <span className="red">05</span> Hero track <span className="muted">(optional)</span>
                  </legend>
                  <div className="reg-chips">
                    {characters.map((c) => (
                      <label key={c.id} className={`reg-chip ${values.hero === c.id ? 'is-on' : ''}`}>
                        <input type="radio" name="hero" value={c.id} checked={values.hero === c.id} onChange={set('hero')} />
                        <span className="mono">{c.number}</span> {c.name}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {failure && <p className="reg-failure mono">{failure}</p>}

                <Magnetic strength={0.2} className="reg-submit-wrap">
                  <button type="submit" className="btn btn-solid reg-submit" data-cursor="Enter">
                    Initiate entry <ArrowRight size={18} />
                  </button>
                </Magnetic>
              </form>
            )}

            {status === 'processing' && (
              <div className="reg-proc" aria-live="assertive">
                <p className="reg-proc-title display">Access requested</p>
                <p className="reg-progress mono">
                  <span className="reg-bar">{'░'.repeat(BLOCKS)}</span>
                  <span className="reg-pct">0%</span>
                </p>
                <ul className="reg-log mono">
                  {LOG.map((l) => (
                    <li key={l}>
                      <span className="red">&gt;</span> {l}... <span className="reg-ok">OK</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {status === 'done' && (
              <div className="reg-done" aria-live="assertive">
                <div className="reg-flash" aria-hidden="true" />
                <p className="mono reg-done-fade reg-done-kicker">
                  <span className="pulse-dot green" /> Access // Granted
                </p>
                <h3 className="display reg-done-title">
                  <span className="mask">
                    <span className="mask-inner">Welcome,</span>
                  </span>
                  <span className="mask">
                    <span className="mask-inner red">Hero.</span>
                  </span>
                </h3>
                <p className="mono reg-done-fade reg-done-sub">Registration confirmed.</p>

                <div className="reg-card reg-done-fade">
                  <div>
                    <span className="mono muted">Hero ID</span>
                    <b>{heroId}</b>
                  </div>
                  <div>
                    <span className="mono muted">Agent</span>
                    <b>{values.name}</b>
                  </div>
                  <div>
                    <span className="mono muted">Track</span>
                    <b>{heroName || 'Unassigned'}</b>
                  </div>
                  <div>
                    <span className="mono muted">Universe</span>
                    <b>{eventConfig.universeCode}</b>
                  </div>
                </div>

                <p className="reg-done-fade reg-done-note">
                  Your mission brief will be transmitted to <b>{values.email}</b>. See you in the multiverse.
                </p>
                <button className="u-link mono reg-done-fade reg-again" onClick={reset}>
                  <RotateCcw size={13} /> Register another hero
                </button>
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
        <span className="red">{index}</span> {label}
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
