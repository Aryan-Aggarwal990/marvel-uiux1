import { useCallback, useEffect, useState } from 'react'
import { initSmoothScroll, lockScroll, scrollToTarget, ScrollTrigger } from './lib/motion'
import { eventConfig } from './config/eventConfig'
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

const TICKER = [
  'The multiverse is open',
  `${eventConfig.universeCode} // ${eventConfig.university}`,
  'GeeksForGeeks Student Chapter',
  'Choose your hero',
]
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
  const [selectedHero, setSelectedHero] = useState('')

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

  const selectHero = useCallback((id) => {
    setSelectedHero(id)
    scrollToTarget('#register', { duration: 1.8 })
  }, [])

  return (
    <>
      {loading && <Loader onReveal={onReveal} onDone={() => setLoading(false)} />}
      <Cursor />
      <ScrollProgress />
      <div className="grain" aria-hidden="true" />
      <Navbar visible={revealed} />

      <main>
        <Hero ready={revealed} />
        <Marquee items={TICKER} tilt={-2} />
        <EventIntro />
        <Mission />
        <Marquee items={HUD_TICKER} variant="dark" reverse />
        <HeroSelector onSelect={selectHero} />
        <Timeline />
        <Location />
        <Registration selectedHero={selectedHero} />
      </main>

      <Footer />
    </>
  )
}
