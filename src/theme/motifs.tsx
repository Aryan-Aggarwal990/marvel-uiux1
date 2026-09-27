/**
 * Full-screen background motifs, one per hero world. Drawn in a 1600×1000 box that covers the
 * viewport; strokes use the live theme tokens so they follow the colour transition.
 */
import { useMemo, type ReactElement } from 'react'
import type { Motif } from '../config/characters'
import { jagged, rng, webPaths } from '../components/art/geometry'

const A = 'var(--accent)'
const B = 'var(--accent-2)'

function hexPath(x: number, y: number, r: number): string {
  return (
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      return `${i ? 'L' : 'M'}${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`
    }).join('') + 'Z'
  )
}

function build(motif: Motif): ReactElement {
  const r = rng(motif.length * 97)
  switch (motif) {
    case 'multiverse':
      return (
        <g fill="none" stroke={A} strokeOpacity=".5">
          {[180, 300, 440, 600].map((rad, i) => (
            <circle key={rad} cx="1180" cy="430" r={rad} strokeDasharray={i % 2 ? '2 14' : undefined} strokeWidth={i === 0 ? 1.5 : 1} />
          ))}
          <ellipse cx="1180" cy="430" rx="720" ry="190" stroke={B} strokeOpacity=".4" transform="rotate(-18 1180 430)" />
        </g>
      )
    case 'web': {
      const buildings = Array.from({ length: 34 }, (_, i) => {
        const w = 30 + r() * 40
        const hgt = 90 + r() * 260
        return { x: i * 48 - 10, w, h: hgt }
      })
      return (
        <g>
          <g fill="none" stroke={A} strokeWidth="1.2">
            {webPaths(1260, 250, { spokes: 22, rings: 13, gap: 48, sag: 0.9 }).map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g fill={B} fillOpacity=".55">
            {buildings.map((b, i) => (
              <rect key={i} x={b.x} y={1000 - b.h} width={b.w} height={b.h} />
            ))}
          </g>
          <g fill="#ffe7a3" fillOpacity=".35">
            {buildings.slice(0, 24).map((b, i) => (
              <rect key={i} x={b.x + 8} y={1000 - b.h + 20 + (i % 5) * 18} width="4" height="6" />
            ))}
          </g>
        </g>
      )
    }
    case 'reactor':
      return (
        <g fill="none" stroke={A}>
          <g className="spin-slow" style={{ transformOrigin: '1180px 500px' }}>
            {[90, 150, 230, 330, 450].map((rad, i) => (
              <circle
                key={rad}
                cx="1180"
                cy="500"
                r={rad}
                strokeWidth={i === 1 ? 6 : 1}
                strokeDasharray={i === 1 ? '40 20' : i === 3 ? '3 9' : undefined}
              />
            ))}
          </g>
          {Array.from({ length: 60 }, (_, i) => (
            <line key={i} x1="1180" y1="30" x2="1180" y2={i % 5 ? 44 : 60} transform={`rotate(${i * 6} 1180 500)`} />
          ))}
          <path d="M0 500H1600M1180 0V1000" strokeOpacity=".4" strokeDasharray="6 10" />
          <path d="M60 60h60M60 60v60M1540 60h-60M1540 60v60M60 940h60M60 940v-60M1540 940h-60M1540 940v-60" strokeWidth="2" stroke={B} />
        </g>
      )
    case 'portal':
      return (
        <g fill="none" stroke={A}>
          <g className="spin-slow" style={{ transformOrigin: '1200px 460px' }}>
            <circle cx="1200" cy="460" r="330" strokeWidth="2" strokeDasharray="2 7" />
            <circle cx="1200" cy="460" r="300" strokeWidth="1" />
            <rect x="990" y="250" width="420" height="420" strokeWidth="1" />
          </g>
          <g className="spin-rev" style={{ transformOrigin: '1200px 460px' }}>
            <rect x="990" y="250" width="420" height="420" strokeWidth="1" transform="rotate(45 1200 460)" />
            <circle cx="1200" cy="460" r="210" strokeWidth="3" strokeDasharray="30 12" stroke={B} />
          </g>
          <circle cx="220" cy="820" r="120" strokeDasharray="2 6" strokeWidth="2" />
        </g>
      )
    case 'vibranium':
      return (
        <g fill="none" stroke={A} strokeWidth="1">
          {Array.from({ length: 12 }, (_, row) =>
            Array.from({ length: 22 }, (_, col) => {
              const x = col * 80 + (row % 2) * 40
              const y = row * 70
              return (
                <path
                  key={`${row}-${col}`}
                  d={`M${x} ${y}L${x + 40} ${y + 70}L${x - 40} ${y + 70}Z`}
                  strokeOpacity={0.25 + ((row * col) % 7) / 14}
                />
              )
            }),
          )}
          <path d="M900 560L1200 380L1500 560M960 640L1200 500L1440 640" stroke={B} strokeWidth="2" />
        </g>
      )
    case 'storm':
      return (
        <g>
          <g className="flicker" fill="none" stroke={B} strokeWidth="2.5">
            {[0, 1, 2].map((i) => (
              <path key={i} d={jagged(300 + i * 520, 0, 420 + i * 470 + r() * 120, 520 + r() * 300, 12, 90, r)} />
            ))}
          </g>
          <g stroke={A} strokeOpacity=".4">
            {Array.from({ length: 70 }, (_, i) => {
              const x = r() * 1700
              const y = r() * 1000
              return <line key={i} x1={x} y1={y} x2={x - 18} y2={y + 60} />
            })}
          </g>
        </g>
      )
    case 'impact':
      return (
        <g fill="none" stroke={A}>
          {Array.from({ length: 11 }, (_, i) => {
            const a = (i / 11) * Math.PI * 2
            return (
              <path key={i} d={jagged(1180, 700, 1180 + Math.cos(a) * 900, 700 + Math.sin(a) * 900, 10, 70, r)} strokeWidth={3 - (i % 3)} />
            )
          })}
          {[120, 260, 420].map((rad, i) => (
            <circle
              key={rad}
              className="pulse-ring"
              cx="1180"
              cy="700"
              r={rad}
              stroke={B}
              style={{ animationDelay: `${i * 0.7}s`, transformOrigin: '1180px 700px' }}
            />
          ))}
        </g>
      )
    case 'shield':
      return (
        <g fill="none">
          {[120, 220, 330, 450, 580].map((rad, i) => (
            <circle
              key={rad}
              cx="1200"
              cy="480"
              r={rad}
              stroke={i % 2 ? B : A}
              strokeWidth={i % 2 ? 2 : 22}
              strokeOpacity={i % 2 ? 0.5 : 0.35}
            />
          ))}
          <g stroke={A} strokeOpacity=".3">
            {Array.from({ length: 9 }, (_, i) => (
              <line key={i} x1="0" y1={80 + i * 100} x2="700" y2={80 + i * 100} strokeWidth="18" />
            ))}
          </g>
        </g>
      )
    case 'cosmic':
      return (
        <g>
          <g stroke={A} strokeOpacity=".5">
            {Array.from({ length: 48 }, (_, i) => {
              const a = (i / 48) * Math.PI * 2
              const len = 400 + r() * 700
              return (
                <line
                  key={i}
                  x1={1200 + Math.cos(a) * 60}
                  y1={400 + Math.sin(a) * 60}
                  x2={1200 + Math.cos(a) * len}
                  y2={400 + Math.sin(a) * len}
                />
              )
            })}
          </g>
          <g fill={B}>
            {Array.from({ length: 90 }, (_, i) => (
              <circle key={i} cx={r() * 1600} cy={r() * 1000} r={r() * 2 + 0.5} />
            ))}
          </g>
          <ellipse cx="1200" cy="400" rx="600" ry="120" fill="none" stroke={B} strokeOpacity=".5" transform="rotate(-12 1200 400)" />
        </g>
      )
    case 'chaos':
      return (
        <g fill="none" stroke={A}>
          <g className="spin-slow" style={{ transformOrigin: '1180px 460px' }}>
            {Array.from({ length: 7 }, (_, i) => (
              <path
                key={i}
                d={`M1180 460m${-(80 + i * 60)} 0a${80 + i * 60} ${80 + i * 60} 0 0 1 ${(80 + i * 60) * 1.6} ${60 + i * 20}`}
                strokeWidth={2.5 - i * 0.25}
                transform={`rotate(${i * 52} 1180 460)`}
              />
            ))}
          </g>
          <g stroke={B} strokeOpacity=".6">
            {Array.from({ length: 16 }, (_, i) => (
              <path key={i} d={hexPath(100 + r() * 1400, 80 + r() * 840, 16 + r() * 34)} />
            ))}
          </g>
        </g>
      )
    case 'timeline':
      return (
        <g fill="none" strokeWidth="1.5">
          {Array.from({ length: 9 }, (_, i) => {
            const y = 160 + i * 90
            return <path key={i} d={`M-20 ${y}C400 ${y - 40} 800 ${y + 40} 1620 ${y}`} stroke={A} strokeOpacity={0.3 + (i % 3) * 0.2} />
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const x = 200 + r() * 1100
            const y = 160 + Math.floor(r() * 9) * 90
            return (
              <path
                key={`b${i}`}
                d={`M${x} ${y}C${x + 120} ${y} ${x + 200} ${y + (r() - 0.5) * 300} ${x + 420} ${y + (r() - 0.5) * 420}`}
                stroke={B}
              />
            )
          })}
          <circle cx="1300" cy="200" r="90" stroke={B} strokeDasharray="4 8" />
          <path d="M1300 130V200L1350 230" stroke={B} strokeWidth="3" />
        </g>
      )
    case 'glitch':
      return (
        <g>
          <g fill={A} fillOpacity=".55">
            {Array.from({ length: 12 }, (_, row) =>
              Array.from({ length: 16 }, (_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={900 + col * 44 + (row % 2) * 22}
                  cy={120 + row * 44}
                  r={Math.max(0.5, 9 - Math.hypot(col - 8, row - 6) * 1.1)}
                />
              )),
            )}
          </g>
          {Array.from({ length: 14 }, (_, i) => (
            <rect
              key={i}
              className="glitch-bar"
              x={r() * 1500}
              y={r() * 1000}
              width={40 + r() * 260}
              height={2 + r() * 8}
              fill={i % 2 ? A : B}
              style={{ animationDelay: `${r() * 4}s` }}
            />
          ))}
        </g>
      )
    case 'comic':
      return (
        <g>
          <g fill={A} fillOpacity=".5">
            {Array.from({ length: 14 }, (_, row) =>
              Array.from({ length: 20 }, (_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={col * 80 + (row % 2) * 40}
                  cy={row * 72}
                  r={Math.max(1, 14 - Math.hypot(col - 16, row - 3) * 1.3)}
                />
              )),
            )}
          </g>
          <g stroke={B} strokeOpacity=".5">
            {Array.from({ length: 26 }, (_, i) => {
              const a = Math.PI + (i / 26) * (Math.PI / 2)
              return (
                <line
                  key={i}
                  x1={1600 + Math.cos(a) * 300}
                  y1={1000 + Math.sin(a) * 300}
                  x2={1600 + Math.cos(a) * (900 + r() * 500)}
                  y2={1000 + Math.sin(a) * (900 + r() * 500)}
                  strokeWidth="3"
                />
              )
            })}
          </g>
        </g>
      )
  }
}

export function MotifArt({ motif }: { motif: Motif }) {
  const art = useMemo(() => build(motif), [motif])
  return (
    <svg className="world-motif-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {art}
    </svg>
  )
}
