/**
 * Original, stylised SVG placeholder art for each hero.
 * Replace with licensed/approved artwork by setting `image` fields in eventConfig.js —
 * <CharacterVisual> automatically prefers a real image and falls back to these.
 */
import { useState, type ReactElement } from 'react'
import type { CharacterId } from '../../config/eventConfig'

interface ArtProps {
  className?: string
}

const V = '0 0 400 500'

/* ── Spider web geometry (shared by the mask and background) ─────────── */
function webPaths(cx: number, cy: number, { spokes = 18, rings = 8, gap = 34, sag = 0.86 } = {}): string[] {
  const lines: string[] = []
  const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 - Math.PI / 2)
  const far = gap * (rings + 2)
  angles.forEach((a) => lines.push(`M${cx} ${cy}L${cx + Math.cos(a) * far} ${cy + Math.sin(a) * far}`))
  for (let r = 1; r <= rings; r++) {
    const rad = r * gap
    let d = ''
    angles.forEach((a, i) => {
      const b = angles[(i + 1) % spokes]
      const x1 = cx + Math.cos(a) * rad
      const y1 = cy + Math.sin(a) * rad
      const x2 = cx + Math.cos(b) * rad
      const y2 = cy + Math.sin(b) * rad
      const m = (a + b) / 2 + (i === spokes - 1 ? Math.PI : 0)
      const qx = cx + Math.cos(m) * rad * sag
      const qy = cy + Math.sin(m) * rad * sag
      d += `${i === 0 ? `M${x1} ${y1}` : ''}Q${qx} ${qy} ${x2} ${y2}`
    })
    lines.push(d)
  }
  return lines
}

const SPIDER_WEB = webPaths(200, 255, { spokes: 20, rings: 9, gap: 30 })

export function SpiderArt({ className }: ArtProps) {
  const head = 'M200 34C302 34 352 118 352 222C352 334 290 440 200 474C110 440 48 334 48 222C48 118 98 34 200 34Z'
  const eye = 'M186 222C168 170 118 140 76 150C74 214 118 262 180 258C190 254 191 236 186 222Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Spider-Man mask">
      <defs>
        <radialGradient id="sp-skin" cx="38%" cy="28%" r="85%">
          <stop offset="0" stopColor="#ff4a4f" />
          <stop offset=".45" stopColor="#c8141c" />
          <stop offset="1" stopColor="#2a0203" />
        </radialGradient>
        <linearGradient id="sp-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#e9edf3" />
          <stop offset="1" stopColor="#9aa6b8" />
        </linearGradient>
        <clipPath id="sp-clip">
          <path d={head} />
        </clipPath>
      </defs>
      <path d={head} fill="url(#sp-skin)" />
      <g clipPath="url(#sp-clip)" fill="none" stroke="#120000" strokeOpacity=".55" strokeWidth="2.2">
        {SPIDER_WEB.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* rim light */}
      <path d={head} fill="none" stroke="#ff7a7e" strokeOpacity=".35" strokeWidth="2" />
      <g>
        <path d={eye} fill="url(#sp-lens)" stroke="#0a0a0a" strokeWidth="11" strokeLinejoin="round" />
        <path
          d={eye}
          transform="translate(400 0) scale(-1 1)"
          fill="url(#sp-lens)"
          stroke="#0a0a0a"
          strokeWidth="11"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

export function IronArt({ className }: ArtProps) {
  const shell = 'M200 28C302 28 346 108 346 206C346 300 332 378 292 428L244 470H156L108 428C68 378 54 300 54 206C54 108 98 28 200 28Z'
  const plate =
    'M200 74C246 74 272 96 284 130L300 246C306 298 300 342 280 380L252 432H148L120 380C100 342 94 298 100 246L116 130C128 96 154 74 200 74Z'
  const slit = 'M122 236L184 250L178 266L128 256Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Iron Man helmet">
      <defs>
        <linearGradient id="im-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4b4b" />
          <stop offset=".5" stopColor="#a50d12" />
          <stop offset="1" stopColor="#2b0204" />
        </linearGradient>
        <linearGradient id="im-gold" x1=".2" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor="#ffe29a" />
          <stop offset=".45" stopColor="#d9a441" />
          <stop offset="1" stopColor="#5a3b0b" />
        </linearGradient>
        <filter id="im-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={shell} fill="url(#im-red)" />
      <path d={shell} fill="none" stroke="#ff8a8a" strokeOpacity=".3" strokeWidth="2" />
      <path d={plate} fill="url(#im-gold)" />
      <g fill="none" stroke="#3a2406" strokeOpacity=".55" strokeWidth="2.5">
        <path d="M200 74V180" />
        <path d="M150 90L168 190M250 90L232 190" />
        <path d="M112 300L150 312L170 380M288 300L250 312L230 380" />
        <path d="M168 398H232" strokeWidth="4" />
      </g>
      <g filter="url(#im-glow)" fill="#f2fbff">
        <path d={slit} />
        <path d={slit} transform="translate(400 0) scale(-1 1)" />
      </g>
    </svg>
  )
}

export function StrangeArt({ className }: ArtProps) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)
  const runes = Array.from({ length: 16 }, (_, i) => i * 22.5)
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised mystic sigil">
      <defs>
        <radialGradient id="ds-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffcf8a" stopOpacity=".9" />
          <stop offset=".35" stopColor="#ff8a3d" stopOpacity=".35" />
          <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
        </radialGradient>
        <filter id="ds-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="200" cy="250" r="190" fill="url(#ds-core)" />
      <g fill="none" stroke="#ffae5c" filter="url(#ds-glow)">
        <g className="spin-slow" style={{ transformOrigin: '200px 250px' }}>
          <circle cx="200" cy="250" r="176" strokeWidth="2" />
          <circle cx="200" cy="250" r="162" strokeWidth="1" strokeOpacity=".6" />
          {ticks.map((a) => (
            <line key={a} x1="200" y1="76" x2="200" y2={a % 15 === 0 ? 92 : 86} strokeWidth="1.5" transform={`rotate(${a} 200 250)`} />
          ))}
          {runes.map((a) => (
            <rect key={a} x="194" y="96" width="12" height="12" strokeWidth="1.5" transform={`rotate(${a} 200 250) rotate(45 200 102)`} />
          ))}
        </g>
        <g className="spin-rev" style={{ transformOrigin: '200px 250px' }}>
          <rect x="95" y="145" width="210" height="210" strokeWidth="2" />
          <rect x="95" y="145" width="210" height="210" strokeWidth="2" transform="rotate(45 200 250)" />
          <circle cx="200" cy="250" r="104" strokeWidth="1.5" />
        </g>
        <circle cx="200" cy="250" r="72" strokeWidth="2.5" />
        <path d="M140 250Q200 196 260 250Q200 304 140 250Z" strokeWidth="3" />
        <circle cx="200" cy="250" r="20" fill="#7CFFB2" fillOpacity=".85" stroke="#d6ffe7" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function PantherArt({ className }: ArtProps) {
  const head = 'M200 62C266 62 312 96 330 150L348 70L362 190C366 302 318 402 200 470C82 402 34 302 38 190L52 70L70 150C88 96 134 62 200 62Z'
  const slit = 'M118 238L184 254L176 272L128 262Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Black Panther mask">
      <defs>
        <linearGradient id="bp-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34304a" />
          <stop offset=".5" stopColor="#141219" />
          <stop offset="1" stopColor="#050506" />
        </linearGradient>
        <filter id="bp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={head} fill="url(#bp-skin)" />
      <g fill="none" stroke="#b89cff" strokeOpacity=".75" strokeWidth="1.8" filter="url(#bp-glow)">
        <path d={head} strokeOpacity=".5" />
        <path d="M200 90L176 150L200 210L224 150Z" />
        <path d="M200 110L186 150L200 186L214 150Z" />
        <path d="M110 214L186 232M290 214L214 232" />
        <path d="M112 286L160 300L200 360L240 300L288 286" />
        <path d="M150 400L200 430L250 400" />
        <path d="M168 330L200 380L232 330" strokeOpacity=".45" />
      </g>
      <g fill="#f5f3ff" filter="url(#bp-glow)">
        <path d={slit} />
        <path d={slit} transform="translate(400 0) scale(-1 1)" />
      </g>
    </svg>
  )
}

/** Large decorative web for the hero background. */
export function WebBackdrop({ className }: ArtProps) {
  const web = webPaths(500, 500, { spokes: 24, rings: 14, gap: 44, sag: 0.9 })
  return (
    <svg className={className} viewBox="0 0 1000 1000" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {web.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}

const ART: Record<CharacterId, (props: ArtProps) => ReactElement> = {
  spiderman: SpiderArt,
  ironman: IronArt,
  strange: StrangeArt,
  panther: PantherArt,
}

/** Prefers a real image (from config); falls back to built-in SVG art if missing or broken. */
interface CharacterVisualProps {
  id: CharacterId
  image: string | null
  alt: string
  className?: string
}

export function CharacterVisual({ id, image, alt, className = '' }: CharacterVisualProps) {
  const [failed, setFailed] = useState(false)
  if (image && !failed) {
    return <img className={className} src={image} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
  }
  const Art = ART[id] || SpiderArt
  return <Art className={className} />
}
