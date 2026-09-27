import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { scrollToTarget, lockScroll, ScrollTrigger } from '../lib/motion'
import { eventConfig } from '../config/eventConfig'
import ScrambleText from './ui/ScrambleText'
import './Navbar.css'

const LINKS = [
  { label: 'Mission', href: '#mission' },
  { label: 'Heroes', href: '#heroes' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Location', href: '#location' },
  { label: 'Register', href: '#register' },
]

export default function Navbar({ visible }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  useEffect(() => {
    lockScroll(open)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (e, href) => {
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

        <div className="nav-status mono" title="All systems nominal">
          <span className="pulse-dot green" />
          System online
        </div>

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

      <div className="nav-mobile" id="mobile-menu" aria-hidden={!open}>
        <div className="nav-mobile-head mono">
          <span>{eventConfig.universeCode} // NAVIGATION</span>
          <span className="nav-mobile-status">
            <span className="pulse-dot green" /> ONLINE
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
