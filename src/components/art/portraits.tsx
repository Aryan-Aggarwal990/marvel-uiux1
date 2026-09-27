/**
 * Original stylised placeholder portraits (400×500). Replace with licensed artwork by setting
 * `image` for a hero in src/config/characters.ts — <HeroPortrait> prefers a real image.
 */
import { useMemo } from 'react'
import { jagged, rng, useArtIds, webPaths } from './geometry'

export interface ArtProps {
  className?: string
}

const V = '0 0 400 500'
const HEAD = 'M200 40C290 40 330 110 330 195C330 285 280 365 200 392C120 365 70 285 70 195C70 110 110 40 200 40Z'
const BUST = 'M10 500C22 440 88 404 160 396H240C312 404 378 440 390 500Z'
const SPIDER_EYE = 'M188 200C172 158 130 134 94 142C92 196 130 236 182 233C191 229 192 214 188 200Z'
const MIRROR = 'translate(400 0) scale(-1 1)'
const SPIDER_WEB = webPaths(200, 215, { spokes: 20, rings: 9, gap: 26 })

function Glow({ id, blur = 5 }: { id: string; blur?: number }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={blur} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}

function Grad({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: [number, string][]; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c]) => (
        <stop key={o} offset={o} stopColor={c} />
      ))}
    </linearGradient>
  )
}

function SpiderGlyph({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={fill} strokeWidth="3" strokeLinecap="round">
      <ellipse cx="0" cy="-6" rx="5" ry="7" fill={fill} stroke="none" />
      <ellipse cx="0" cy="10" rx="7" ry="11" fill={fill} stroke="none" />
      <path d="M-5 -2L-22 -18L-26 -34M5 -2L22 -18L26 -34M-6 4L-28 -2L-36 -14M6 4L28 -2L36 -14M-6 10L-28 18L-36 32M6 10L28 18L36 32M-5 16L-20 32L-24 48M5 16L20 32L24 48" />
    </g>
  )
}

/* ── Spider-Man ─────────────────────────────────────────────── */
export function SpiderManArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Spider-Man portrait">
      <defs>
        <radialGradient id={id('skin')} cx="38%" cy="28%" r="85%">
          <stop offset="0" stopColor="#ff4a4f" />
          <stop offset=".45" stopColor="#c8141c" />
          <stop offset="1" stopColor="#2a0203" />
        </radialGradient>
        <Grad
          id={id('blue')}
          stops={[
            [0, '#2f5fd6'],
            [1, '#07143d'],
          ]}
        />
        <Grad
          id={id('lens')}
          stops={[
            [0, '#ffffff'],
            [0.6, '#e9edf3'],
            [1, '#9aa6b8'],
          ]}
          x2={1}
        />
        <clipPath id={id('head')}>
          <path d={HEAD} />
        </clipPath>
        <clipPath id={id('chest')}>
          <path d="M122 398H278L258 500H142Z" />
        </clipPath>
      </defs>
      <path d={BUST} fill={url('blue')} />
      <path d="M122 398H278L258 500H142Z" fill={url('skin')} />
      <g clipPath={url('chest')} stroke="#120000" strokeOpacity=".45" fill="none" strokeWidth="1.6">
        {webPaths(200, 380, { spokes: 14, rings: 5, gap: 24 }).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <SpiderGlyph x={200} y={446} s={0.8} fill="#0b0b0b" />
      <path d={HEAD} fill={url('skin')} />
      <g clipPath={url('head')} fill="none" stroke="#120000" strokeOpacity=".55" strokeWidth="2">
        {SPIDER_WEB.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path d={HEAD} fill="none" stroke="#7fa6ff" strokeOpacity=".35" strokeWidth="2" />
      <path d={SPIDER_EYE} fill={url('lens')} stroke="#0a0a0a" strokeWidth="10" strokeLinejoin="round" />
      <path d={SPIDER_EYE} transform={MIRROR} fill={url('lens')} stroke="#0a0a0a" strokeWidth="10" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Miles Morales ──────────────────────────────────────────── */
export function MilesArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const hood = 'M200 14C322 14 374 118 368 230C362 320 332 382 300 412H100C68 382 38 320 32 230C26 118 78 14 200 14Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Miles Morales portrait">
      <defs>
        <Grad
          id={id('hood')}
          stops={[
            [0, '#3a3a46'],
            [1, '#0d0d12'],
          ]}
        />
        <radialGradient id={id('mask')} cx="40%" cy="30%" r="85%">
          <stop offset="0" stopColor="#2a2a34" />
          <stop offset="1" stopColor="#050507" />
        </radialGradient>
        <clipPath id={id('head')}>
          <path d={HEAD} />
        </clipPath>
        <Glow id={id('glow')} blur={3} />
      </defs>
      <path d={hood} fill={url('hood')} />
      <path d={BUST} fill="#0c0c10" />
      <SpiderGlyph x={200} y={446} s={1.05} fill="#ff2d3d" />
      {/* Spider-verse offset print */}
      <path d={HEAD} transform="translate(-6 2)" fill="none" stroke="#3df0ff" strokeOpacity=".55" strokeWidth="3" />
      <path d={HEAD} transform="translate(6 -2)" fill="none" stroke="#ff2d3d" strokeOpacity=".55" strokeWidth="3" />
      <path d={HEAD} fill={url('mask')} />
      <g clipPath={url('head')} fill="none" stroke="#ff2d3d" strokeOpacity=".8" strokeWidth="2" filter={url('glow')}>
        {SPIDER_WEB.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path d={SPIDER_EYE} fill="#f5f5f5" stroke="#000" strokeWidth="11" strokeLinejoin="round" />
      <path d={SPIDER_EYE} transform={MIRROR} fill="#f5f5f5" stroke="#000" strokeWidth="11" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Iron Man ───────────────────────────────────────────────── */
export function IronManArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const shell = 'M200 28C302 28 346 108 346 206C346 300 332 378 292 428L244 470H156L108 428C68 378 54 300 54 206C54 108 98 28 200 28Z'
  const plate =
    'M200 74C246 74 272 96 284 130L300 246C306 298 300 342 280 380L252 432H148L120 380C100 342 94 298 100 246L116 130C128 96 154 74 200 74Z'
  const slit = 'M122 236L184 250L178 266L128 256Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Iron Man portrait">
      <defs>
        <Grad
          id={id('red')}
          stops={[
            [0, '#ff4b4b'],
            [0.5, '#a50d12'],
            [1, '#2b0204'],
          ]}
          x2={1}
        />
        <Grad
          id={id('gold')}
          stops={[
            [0, '#ffe29a'],
            [0.45, '#d9a441'],
            [1, '#5a3b0b'],
          ]}
          x2={0.6}
        />
        <radialGradient id={id('core')}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".4" stopColor="#bff4ff" />
          <stop offset="1" stopColor="#3cc8ff" stopOpacity="0" />
        </radialGradient>
        <Glow id={id('glow')} blur={6} />
      </defs>
      <path d={BUST} fill={url('red')} />
      <path d="M60 470C90 430 140 410 170 406L150 500H40Z" fill={url('gold')} opacity=".85" />
      <path d="M340 470C310 430 260 410 230 406L250 500H360Z" fill={url('gold')} opacity=".85" />
      <circle cx="200" cy="462" r="44" fill={url('core')} />
      <circle cx="200" cy="462" r="20" fill="none" stroke="#e6fbff" strokeWidth="3" filter={url('glow')} />
      <g transform="translate(40 0) scale(0.8)">
        <path d={shell} fill={url('red')} />
        <path d={shell} fill="none" stroke="#ffcf7a" strokeOpacity=".3" strokeWidth="2" />
        <path d={plate} fill={url('gold')} />
        <g fill="none" stroke="#3a2406" strokeOpacity=".55" strokeWidth="2.5">
          <path d="M200 74V180M150 90L168 190M250 90L232 190M112 300L150 312L170 380M288 300L250 312L230 380" />
          <path d="M168 398H232" strokeWidth="4" />
        </g>
        <g filter={url('glow')} fill="#f2fbff">
          <path d={slit} />
          <path d={slit} transform={MIRROR} />
        </g>
      </g>
    </svg>
  )
}

/* ── Doctor Strange ─────────────────────────────────────────── */
export function StrangeArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const ticks = Array.from({ length: 48 }, (_, i) => i * 7.5)
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Doctor Strange portrait">
      <defs>
        <radialGradient id={id('halo')}>
          <stop offset="0" stopColor="#ffb870" stopOpacity=".55" />
          <stop offset=".55" stopColor="#ff7a1a" stopOpacity=".18" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <Grad
          id={id('cloak')}
          stops={[
            [0, '#b3161d'],
            [1, '#2e0406'],
          ]}
        />
        <Grad
          id={id('face')}
          stops={[
            [0, '#2a2330'],
            [1, '#0c0a10'],
          ]}
        />
        <Glow id={id('glow')} blur={3} />
      </defs>
      <circle cx="200" cy="200" r="190" fill={url('halo')} />
      <g fill="none" stroke="#ffae5c" filter={url('glow')} opacity=".9">
        <g className="spin-slow" style={{ transformOrigin: '200px 200px' }}>
          <circle cx="200" cy="200" r="168" strokeWidth="1.5" />
          {ticks.map((a) => (
            <line key={a} x1="200" y1="32" x2="200" y2={a % 15 === 0 ? 46 : 40} strokeWidth="1.2" transform={`rotate(${a} 200 200)`} />
          ))}
        </g>
        <g className="spin-rev" style={{ transformOrigin: '200px 200px' }}>
          <rect x="95" y="95" width="210" height="210" strokeWidth="1.4" />
          <rect x="95" y="95" width="210" height="210" strokeWidth="1.4" transform="rotate(45 200 200)" />
        </g>
      </g>
      <path d={BUST} fill={url('cloak')} />
      <path d="M118 400C96 330 104 280 126 250L156 320L162 396Z" fill="#c21a21" />
      <path d="M282 400C304 330 296 280 274 250L244 320L238 396Z" fill="#c21a21" />
      <path d="M162 396L200 480L238 396Z" fill="#1b2a5e" />
      <g filter={url('glow')}>
        <circle cx="200" cy="440" r="22" fill="#caa24a" />
        <path d="M184 440Q200 426 216 440Q200 454 184 440Z" fill="#0c3a1f" />
        <circle cx="200" cy="440" r="6" fill="#6dffa6" />
      </g>
      <path
        d="M200 110C252 110 272 155 270 205C268 265 240 318 200 330C160 318 132 265 130 205C128 155 148 110 200 110Z"
        fill={url('face')}
      />
      <path d="M130 205C120 130 160 80 205 82C250 80 285 120 272 200C262 160 240 138 200 136C165 136 142 160 130 205Z" fill="#141018" />
      <path
        d="M136 176C140 150 150 138 162 132M264 176C260 150 250 138 238 132"
        stroke="#b7b2c2"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".7"
      />
      <path
        d="M178 280C190 272 210 272 222 280C214 286 186 286 178 280ZM182 292C186 318 196 326 200 326C204 326 214 318 218 292C210 300 190 300 182 292Z"
        fill="#050407"
      />
      <g fill="#ffb870" filter={url('glow')} opacity=".85">
        <path d="M148 208L184 213L181 220L151 217Z" />
        <path d="M148 208L184 213L181 220L151 217Z" transform={MIRROR} />
      </g>
    </svg>
  )
}

/* ── Black Panther ──────────────────────────────────────────── */
export function PantherArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const head = 'M200 62C266 62 312 96 330 150L348 70L362 190C366 302 318 402 200 470C82 402 34 302 38 190L52 70L70 150C88 96 134 62 200 62Z'
  const slit = 'M118 238L184 254L176 272L128 262Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Black Panther portrait">
      <defs>
        <Grad
          id={id('skin')}
          stops={[
            [0, '#34304a'],
            [0.5, '#141219'],
            [1, '#050506'],
          ]}
          x2={1}
        />
        <Glow id={id('glow')} blur={2.5} />
      </defs>
      <path d={BUST} fill={url('skin')} />
      <g fill="none" stroke="#c9b6ff" strokeWidth="2" filter={url('glow')} opacity=".85">
        <path d="M70 440L130 420L200 470L270 420L330 440" />
        <path d="M90 470L140 450L200 494L260 450L310 470" />
        {[110, 150, 250, 290].map((x) => (
          <path key={x} d={`M${x} ${x < 200 ? 426 + (x - 110) / 3 : 426 + (290 - x) / 3}l8 16l8 -16`} />
        ))}
      </g>
      <g transform="translate(40 0) scale(0.8)">
        <path d={head} fill={url('skin')} />
        <g fill="none" stroke="#b89cff" strokeOpacity=".75" strokeWidth="1.8" filter={url('glow')}>
          <path d={head} strokeOpacity=".5" />
          <path d="M200 90L176 150L200 210L224 150ZM200 110L186 150L200 186L214 150ZM110 214L186 232M290 214L214 232M112 286L160 300L200 360L240 300L288 286M150 400L200 430L250 400" />
        </g>
        <g fill="#f5f3ff" filter={url('glow')}>
          <path d={slit} />
          <path d={slit} transform={MIRROR} />
        </g>
      </g>
    </svg>
  )
}

/* ── Thor ───────────────────────────────────────────────────── */
export function ThorArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const bolt = useMemo(() => {
    const r = rng(7)
    return [jagged(356, 186, 300, 40, 7, 34, r), jagged(372, 196, 398, 90, 5, 26, r)]
  }, [])
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Thor portrait">
      <defs>
        <Grad
          id={id('hair')}
          stops={[
            [0, '#e0c27a'],
            [1, '#5e4a1c'],
          ]}
        />
        <Grad
          id={id('face')}
          stops={[
            [0, '#262c3a'],
            [1, '#0b0e14'],
          ]}
        />
        <Grad
          id={id('steel')}
          stops={[
            [0, '#e4ebf3'],
            [0.5, '#8d9aab'],
            [1, '#2b3440'],
          ]}
          x2={1}
        />
        <Glow id={id('glow')} blur={4} />
      </defs>
      <path d="M0 500C30 380 90 330 150 330H250C310 330 370 380 400 500Z" fill="#5c0c12" />
      <path d="M200 60C290 60 320 130 318 210C330 290 320 360 290 410H110C80 360 70 290 82 210C80 130 110 60 200 60Z" fill={url('hair')} />
      <path d="M40 500C50 430 110 395 170 390H230C290 395 350 430 360 500Z" fill={url('steel')} />
      {[150, 250, 128, 272].map((x, i) => (
        <circle key={x} cx={x} cy={i < 2 ? 440 : 478} r="17" fill="#1b212b" stroke="#dfe7f0" strokeWidth="2" />
      ))}
      <path d="M200 95C262 95 285 150 283 205C282 270 250 330 200 345C150 330 118 270 117 205C115 150 138 95 200 95Z" fill={url('face')} />
      <path
        d="M270 150C284 190 282 250 256 300M130 150C118 180 116 220 124 250"
        fill="none"
        stroke="#9cc8ff"
        strokeOpacity=".45"
        strokeWidth="3"
      />
      <path
        d="M150 196L186 204M250 196L214 204M196 226L190 262L204 264"
        fill="none"
        stroke="#6f8fb8"
        strokeOpacity=".5"
        strokeWidth="2.5"
      />
      <path
        d="M130 270C150 330 180 350 200 352C220 350 250 330 270 270C250 300 230 312 200 312C170 312 150 300 130 270Z"
        fill={url('hair')}
        opacity=".9"
      />
      <g fill="#dff0ff" filter={url('glow')}>
        <path d="M146 208L186 214L182 222L148 218Z" />
        <path d="M146 208L186 214L182 222L148 218Z" transform={MIRROR} />
      </g>
      <g transform="rotate(-16 350 260)">
        <rect x="341" y="236" width="16" height="190" rx="4" fill="#6b4a2b" />
        <rect x="296" y="170" width="106" height="70" rx="6" fill={url('steel')} />
        <path d="M306 205H392" stroke="#2b3440" strokeWidth="2" />
      </g>
      <g fill="none" stroke="#bfe0ff" strokeWidth="3" filter={url('glow')}>
        {bolt.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}

/* ── Hulk ───────────────────────────────────────────────────── */
export function HulkArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Hulk portrait">
      <defs>
        <radialGradient id={id('skin')} cx="40%" cy="30%" r="85%">
          <stop offset="0" stopColor="#7fd65a" />
          <stop offset=".5" stopColor="#3f8a2c" />
          <stop offset="1" stopColor="#0f260b" />
        </radialGradient>
        <Glow id={id('glow')} blur={4} />
      </defs>
      <path d="M-30 500C-10 390 70 336 150 330H250C330 336 410 390 430 500Z" fill={url('skin')} />
      <path d="M90 360C130 380 160 420 170 500M310 360C270 380 240 420 230 500" stroke="#0f260b" strokeWidth="3" fill="none" opacity=".6" />
      <path d="M150 318H250L240 380H160Z" fill={url('skin')} />
      <path
        d="M200 70C275 70 318 110 322 170C330 190 332 230 322 262C312 320 270 372 200 384C130 372 88 320 78 262C68 230 70 190 78 170C82 110 125 70 200 70Z"
        fill={url('skin')}
      />
      <path d="M78 176C68 92 140 48 200 50C268 48 334 92 322 176C300 132 262 116 200 118C138 116 100 132 78 176Z" fill="#0b0f0a" />
      <path d="M96 200L188 222L200 236L212 222L304 200L300 214L214 240L200 252L186 240L100 214Z" fill="#1a3a12" />
      <g fill="#e6ffd9" filter={url('glow')}>
        <path d="M122 232L180 244L176 254L128 246Z" />
        <path d="M122 232L180 244L176 254L128 246Z" transform={MIRROR} />
      </g>
      <path d="M150 312C170 300 230 300 250 312L244 336C226 346 174 346 156 336Z" fill="#0b0f0a" />
      <path d="M160 316H240V330H160Z" fill="#e8f2d8" />
      <path d="M173 316V330M186 316V330M200 316V330M214 316V330M227 316V330" stroke="#0b0f0a" strokeWidth="2" />
    </svg>
  )
}

/* ── Captain America ────────────────────────────────────────── */
export function CapArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const star = (cx: number, cy: number, r: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const a = (i * Math.PI) / 5 - Math.PI / 2
      const rr = i % 2 ? r * 0.42 : r
      return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`
    }).join('') + 'Z'
  const wing = 'M92 160L58 148L94 176L62 172L96 192Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Captain America portrait">
      <defs>
        <Grad
          id={id('blue')}
          stops={[
            [0, '#4f7fe8'],
            [0.55, '#1b3f9c'],
            [1, '#081333'],
          ]}
          x2={1}
        />
        <Grad
          id={id('jaw')}
          stops={[
            [0, '#2a2530'],
            [1, '#0b0a10'],
          ]}
        />
        <Glow id={id('glow')} blur={3} />
      </defs>
      <path d={BUST} fill={url('blue')} />
      <path d={star(200, 452, 30)} fill="#f5f5f5" />
      <path d="M112 240C116 320 160 372 200 376C240 372 284 320 288 240Z" fill={url('jaw')} />
      <path
        d="M200 58C280 58 312 120 312 190L310 250C300 250 280 262 270 290H130C120 262 100 250 90 250L88 190C88 120 120 58 200 58Z"
        fill={url('blue')}
      />
      <path d="M200 96L222 150H212L207 138H193L188 150H178ZM196 126H204L200 114Z" fill="#f5f5f5" />
      <path d={wing} fill="#f5f5f5" />
      <path d={wing} transform={MIRROR} fill="#f5f5f5" />
      <path d="M138 204L182 212L178 228L142 222ZM262 204L218 212L222 228L258 222Z" fill="#06070c" />
      <g fill="#dfe8ff" filter={url('glow')} opacity=".7">
        <circle cx="162" cy="216" r="3" />
        <circle cx="238" cy="216" r="3" />
      </g>
      <g transform="translate(92 420)">
        <circle r="92" fill="#c8202c" />
        <circle r="72" fill="#f0f0f0" />
        <circle r="54" fill="#c8202c" />
        <circle r="36" fill="#1f45b8" />
        <path d={star(0, 0, 34)} fill="#f5f5f5" />
        <circle r="92" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="2" />
      </g>
    </svg>
  )
}

/* ── Captain Marvel ─────────────────────────────────────────── */
export function CaptainMarvelArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const star8 = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    const r = i % 2 ? 11 : 26
    return `${i ? 'L' : 'M'}${(200 + Math.cos(a) * r).toFixed(1)} ${(452 + Math.sin(a) * r).toFixed(1)}`
  }).join('')
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Captain Marvel portrait">
      <defs>
        <radialGradient id={id('aura')}>
          <stop offset="0" stopColor="#ffe08a" stopOpacity=".7" />
          <stop offset=".5" stopColor="#ffb020" stopOpacity=".16" />
          <stop offset="1" stopColor="#ffb020" stopOpacity="0" />
        </radialGradient>
        <Grad
          id={id('helm')}
          stops={[
            [0, '#3a64d8'],
            [1, '#0b1640'],
          ]}
          x2={1}
        />
        <Grad
          id={id('gold')}
          stops={[
            [0, '#fff0b3'],
            [1, '#c98a12'],
          ]}
        />
        <Grad
          id={id('face')}
          stops={[
            [0, '#2a2226'],
            [1, '#0c0a0b'],
          ]}
        />
        <Glow id={id('glow')} blur={5} />
      </defs>
      <circle cx="200" cy="210" r="210" fill={url('aura')} />
      <g stroke="#ffd36b" strokeOpacity=".35" strokeWidth="1.5">
        {Array.from({ length: 18 }, (_, i) => (
          <line key={i} x1="200" y1="210" x2={200 + Math.cos(i * 0.35) * 260} y2={210 - Math.abs(Math.sin(i * 0.35)) * 260} />
        ))}
      </g>
      <path d={BUST} fill="#12235e" />
      <path d="M150 398H250L236 500H164Z" fill="#b8182a" />
      <circle cx="200" cy="452" r="34" fill="#12235e" stroke={url('gold')} strokeWidth="4" />
      <path d={star8} fill={url('gold')} filter={url('glow')} />
      <path d="M150 96L160 50L176 78L186 24L200 66L214 24L224 78L240 50L250 96Z" fill={url('gold')} />
      <path d="M200 70C272 70 308 125 308 195C308 280 266 350 200 368C134 350 92 280 92 195C92 125 128 70 200 70Z" fill={url('helm')} />
      <path d="M140 170C160 160 240 160 260 170C262 250 240 320 200 334C160 320 138 250 140 170Z" fill={url('face')} />
      <path d="M140 170C130 120 170 92 200 92C230 92 270 120 260 170" fill="none" stroke={url('gold')} strokeWidth="5" />
      <path
        d="M92 200C92 250 110 300 140 330L140 172C120 176 100 186 92 200ZM308 200C308 250 290 300 260 330L260 172C280 176 300 186 308 200Z"
        fill="#b8182a"
        opacity=".85"
      />
      <g fill="#fff6d6" filter={url('glow')}>
        <path d="M150 214L188 220L184 230L152 226Z" />
        <path d="M150 214L188 220L184 230L152 226Z" transform={MIRROR} />
      </g>
    </svg>
  )
}

/* ── Scarlet Witch ──────────────────────────────────────────── */
export function WandaArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Scarlet Witch portrait">
      <defs>
        <Grad
          id={id('hair')}
          stops={[
            [0, '#6a1424'],
            [1, '#1d0508'],
          ]}
        />
        <Grad
          id={id('crown')}
          stops={[
            [0, '#ff5a7e'],
            [1, '#7a0a22'],
          ]}
        />
        <Grad
          id={id('face')}
          stops={[
            [0, '#261a20'],
            [1, '#0c080a'],
          ]}
        />
        <Glow id={id('glow')} blur={5} />
      </defs>
      <g fill="none" stroke="#ff4d8d" strokeWidth="2.5" filter={url('glow')} opacity=".75">
        <path d="M58 420C12 330 96 290 64 210C44 160 80 120 60 70" />
        <path d="M342 420C388 330 304 290 336 210C356 160 320 120 340 70" />
        <path d="M30 300C60 260 20 230 44 190" strokeOpacity=".6" />
        <path d="M370 300C340 260 380 230 356 190" strokeOpacity=".6" />
      </g>
      <path d="M200 60C300 60 330 150 322 240C330 330 350 410 330 480H70C50 410 70 330 78 240C70 150 100 60 200 60Z" fill={url('hair')} />
      <path d={BUST} fill="#4a0914" />
      <path d="M150 396L200 470L250 396Z" fill="#1a0307" />
      <path
        d="M200 100C255 100 278 150 276 205C274 270 244 325 200 338C156 325 126 270 124 205C122 150 145 100 200 100Z"
        fill={url('face')}
      />
      <path
        d="M100 170L120 88L152 140L200 150L248 140L280 88L300 170L262 158L230 176L200 204L170 176L138 158Z"
        fill={url('crown')}
        filter={url('glow')}
      />
      <g fill="#ff6b98" filter={url('glow')}>
        <path d="M148 222L186 228L182 236L150 232Z" />
        <path d="M148 222L186 228L182 236L150 232Z" transform={MIRROR} />
      </g>
    </svg>
  )
}

/* ── Loki ───────────────────────────────────────────────────── */
export function LokiArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const horn = 'M176 96C152 66 122 30 70 14C108 42 128 76 146 122Z'
  const cheek = 'M120 186L140 194L152 300L128 280Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Loki portrait">
      <defs>
        <Grad
          id={id('gold')}
          stops={[
            [0, '#fff0b8'],
            [0.45, '#d4a73a'],
            [1, '#5a3d08'],
          ]}
          x2={1}
        />
        <Grad
          id={id('cape')}
          stops={[
            [0, '#1b8a4c'],
            [1, '#05200e'],
          ]}
        />
        <Grad
          id={id('face')}
          stops={[
            [0, '#1f2528'],
            [1, '#090b0c'],
          ]}
        />
        <Glow id={id('glow')} blur={4} />
      </defs>
      <path
        d="M122 200C108 280 98 340 92 410L150 390C140 320 140 260 138 200ZM278 200C292 280 302 340 308 410L250 390C260 320 260 260 262 200Z"
        fill="#070808"
      />
      <path d={BUST} fill={url('cape')} />
      <path d="M120 400L160 396L200 440L240 396L280 400L200 470Z" fill={url('gold')} opacity=".9" />
      <path
        d="M200 110C252 110 272 155 270 205C268 265 240 318 200 330C160 318 132 265 130 205C128 155 148 110 200 110Z"
        fill={url('face')}
      />
      <path d={horn} fill={url('gold')} />
      <path d={horn} transform={MIRROR} fill={url('gold')} />
      <path
        d="M120 190C118 120 150 80 200 80C250 80 282 120 280 190L262 196C258 150 236 124 200 124C164 124 142 150 138 196Z"
        fill={url('gold')}
      />
      <path d={cheek} fill={url('gold')} />
      <path d={cheek} transform={MIRROR} fill={url('gold')} />
      <path d="M200 124V150" stroke="#5a3d08" strokeWidth="3" />
      <g fill="#8dffba" filter={url('glow')} opacity=".85">
        <path d="M150 212L186 218L183 225L152 221Z" />
        <path d="M150 212L186 218L183 225L152 221Z" transform={MIRROR} />
      </g>
    </svg>
  )
}

/* ── Deadpool ───────────────────────────────────────────────── */
export function DeadpoolArt({ className }: ArtProps) {
  const { id, url } = useArtIds()
  const patch = 'M196 205C180 150 120 120 70 140C60 210 110 262 186 250C198 240 200 222 196 205Z'
  const eye = 'M176 210C164 180 134 166 104 172C104 206 130 228 170 226Z'
  return (
    <svg className={className} viewBox={V} role="img" aria-label="Stylised Deadpool portrait">
      <defs>
        <radialGradient id={id('skin')} cx="38%" cy="28%" r="85%">
          <stop offset="0" stopColor="#ff4558" />
          <stop offset=".5" stopColor="#b80f24" />
          <stop offset="1" stopColor="#2a0207" />
        </radialGradient>
      </defs>
      <g fill="#1a1a1a" stroke="#555" strokeWidth="2">
        <rect x="70" y="250" width="16" height="170" rx="3" transform="rotate(-24 78 335)" />
        <rect x="314" y="250" width="16" height="170" rx="3" transform="rotate(24 322 335)" />
      </g>
      <path d={BUST} fill="#150406" />
      <path d="M140 398H260L246 500H154Z" fill={url('skin')} />
      <path d="M36 470L150 420M364 470L250 420" stroke="#2b2b2b" strokeWidth="18" />
      <path d={HEAD} fill={url('skin')} />
      <path d="M200 40V392" stroke="#5a0610" strokeWidth="3" opacity=".5" />
      <path d={patch} fill="#0a0a0a" />
      <path d={patch} transform={MIRROR} fill="#0a0a0a" />
      <path d={eye} fill="#f5f5f5" />
      <path d={eye} transform={MIRROR} fill="#f5f5f5" />
      <path d={HEAD} fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="2" />
    </svg>
  )
}
