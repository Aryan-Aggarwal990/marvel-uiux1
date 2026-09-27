import { ArrowUp } from 'lucide-react'
import { eventConfig } from '../config/eventConfig'
import { heroes } from '../config/characters'
import { useHero } from '../theme/heroContext'
import { HeroEmblem } from './art/emblems'
import { scrollToTarget } from '../lib/motion'
import { GithubIcon, InstagramIcon, LinkedinIcon } from './ui/SocialIcons'
import './Footer.css'

export default function Footer() {
  const { active, select } = useHero()
  const { socials, organiser, university, universeCode, year } = eventConfig
  const links = [
    { label: 'Instagram', href: socials.instagram, Icon: InstagramIcon },
    { label: 'LinkedIn', href: socials.linkedin, Icon: LinkedinIcon },
    { label: 'GitHub', href: socials.github, Icon: GithubIcon },
  ]
  const [brand, ...chapter] = organiser.split(' ')

  return (
    <footer className="footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="container">
        <div className="footer-top">
          <div className="footer-id">
            <p className="footer-brand display">{brand}</p>
            <p className="mono muted">{chapter.join(' ')}</p>
            <p className="mono muted">{university}</p>
          </div>
          <ul className="footer-social">
            {links.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" className="footer-social-link">
                  <Icon />
                  <span className="u-link">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="footer-final display" aria-label="The multiverse is waiting.">
          The multiverse <span className="footer-final-accent">is waiting.</span>
        </p>
        {active && (
          <p className="footer-signoff mono" key={active.id}>
            — Signing off, {active.name} // {active.code}
          </p>
        )}

        <nav className="footer-roster" aria-label="Switch hero world">
          {heroes.map((h) => (
            <button
              key={h.id}
              className={`footer-roster-item ${h.id === active?.id ? 'is-active' : ''}`}
              style={{ '--c1': h.theme.accent }}
              onClick={(e) => select(h.id, { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 })}
              aria-label={`Switch to ${h.name}`}
              aria-pressed={h.id === active?.id}
              data-cursor={h.name}
            >
              <HeroEmblem id={h.id} />
            </button>
          ))}
        </nav>

        <div className="footer-bottom mono">
          <span>
            {universeCode} // {year}
          </span>
          <span className="footer-status">
            <span className="pulse-dot green" /> System status // Online
          </span>
          <button className="u-link footer-top-btn mono" onClick={() => scrollToTarget('#top', { duration: 2 })}>
            Back to top <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  )
}
