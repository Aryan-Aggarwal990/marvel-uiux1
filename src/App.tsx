import { useCallback, useEffect, useState } from 'react'
import { initSmoothScroll, lockScroll, ScrollTrigger } from './lib/motion'
import { eventConfig } from './config/eventConfig'
import { heroes } from './config/characters'
import { useHero } from './theme/heroContext'
import WorldBackdrop from './theme/WorldBackdrop'
import Loader from './components/Loader'
import Cursor from './components/Cursor'
import ScrollProgress from './components/ScrollProgress'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import EventIntro from './components/EventIntro'
import Mission from './components/Mission'
import HeroSelector from './components/HeroSelector'
import Timeline from './components/Timeline'
import Location from './components/Location'
import Registration from './components/Registration'
import Footer from './components/Footer'

const TICKER = ['The multiverse is open', ...heroes.map((h) => h.name), 'Choose your hero']
const HUD_TICKER = [
  'System status // Online',
  'Signal strength // 100%',
  'Threat level // Unknown',
  `Protocol // ${eventConfig.protocol}`,
  'Access // Granted',
  `Coordinates // ${eventConfig.coordinates.decimal}`,
]

export default function App() {
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const { active } = useHero()
  const hudTicker = active
    ? [`Active hero // ${active.name}`, ...active.status, `Origin // ${active.code}`, ...HUD_TICKER.slice(3)]
    : HUD_TICKER

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const stop = initSmoothScroll()
    lockScroll(true)
    // Recalculate trigger positions once webfonts have settled the layout
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return stop
  }, [])

  const onReveal = useCallback(() => {
    setRevealed(true)
    lockScroll(false)
  }, [])

  return (
    <>
      {loading && <Loader onReveal={onReveal} onDone={() => setLoading(false)} />}
      <Cursor />
      <ScrollProgress />
      <WorldBackdrop />
      <div className="grain" aria-hidden="true" />
      <Navbar visible={revealed} />

      <main>
        <Hero ready={revealed} />
        <Marquee items={TICKER} tilt={-2} />
        <EventIntro />
        <Mission />
        <Marquee items={hudTicker} variant="dark" reverse />
        <HeroSelector />
        <Timeline />
        <Location />
        <Registration />
      </main>

      <Footer />
    </>
  )
}
