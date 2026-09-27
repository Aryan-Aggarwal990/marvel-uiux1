import { ArrowUp } from 'lucide-react'
import { eventConfig } from '../config/eventConfig'
import { scrollToTarget } from '../lib/motion'
import { GithubIcon, InstagramIcon, LinkedinIcon } from './ui/SocialIcons'
import './Footer.css'

export default function Footer() {
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
          The multiverse <span className="footer-final-red">is waiting.</span>
        </p>

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
