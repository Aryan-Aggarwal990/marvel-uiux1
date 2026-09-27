import './Marquee.css'

/** Infinite CSS ticker. `items` are repeated to fill the track seamlessly. */
interface MarqueeProps {
  items: string[]
  variant?: 'red' | 'dark'
  reverse?: boolean
  /** Rotation of the band in degrees */
  tilt?: number
}

export default function Marquee({ items, variant = 'red', reverse = false, tilt = 0 }: MarqueeProps) {
  const row = [...items, ...items, ...items]
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className={`marquee marquee-${variant}`} style={{ '--tilt': `${tilt}deg` }}>
        <div className={`marquee-track ${reverse ? 'is-reverse' : ''}`}>
          {[0, 1].map((k) => (
            <div className="marquee-group" key={k}>
              {row.map((t, i) => (
                <span className="marquee-item" key={i}>
                  {t}
                  <span className="marquee-sep">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
