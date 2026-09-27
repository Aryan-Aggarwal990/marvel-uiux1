import { useEffect, useRef } from 'react'
import type { ParticleKind } from '../config/characters'
import { prefersReducedMotion } from '../lib/motion'

interface P {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  age: number
  hue: 0 | 1 | 2
  phase: number
  dying: boolean
  kind: ParticleKind
}

interface Props {
  kind: ParticleKind
  colors: [string, string]
}

/**
 * One fixed canvas behind the page whose particle behaviour follows the active hero.
 * On a theme change old particles fade out while the new kind spawns in.
 */
export default function WorldParticles({ kind, colors }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef({ kind, colors, redraw: () => {} })

  useEffect(() => {
    state.current.kind = kind
    state.current.colors = colors
    state.current.redraw()
  }, [kind, colors])

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const reduced = prefersReducedMotion()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let raf = 0
    let frame = 0
    const target = () => (window.innerWidth < 700 ? 45 : 90)
    let parts: P[] = []

    const spawn = (k: ParticleKind, anywhere: boolean): P => {
      const p: P = {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.3 + 0.08),
        size: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.5 + 0.2,
        life: Infinity,
        age: 0,
        hue: (Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : 2) as 0 | 1 | 2,
        phase: Math.random() * Math.PI * 2,
        dying: false,
        kind: k,
      }
      switch (k) {
        case 'sparks':
          p.y = anywhere ? Math.random() * h : h * (0.7 + Math.random() * 0.3)
          p.vy = -(Math.random() * 2 + 0.8)
          p.vx = (Math.random() - 0.5) * 1.2
          p.life = 60 + Math.random() * 120
          p.hue = Math.random() < 0.7 ? 0 : 2
          break
        case 'spiral':
          p.phase = Math.random() * Math.PI * 2
          p.vx = 0.002 + Math.random() * 0.004 // angular speed
          p.vy = Math.min(w, h) * (0.15 + Math.random() * 0.45) // radius
          break
        case 'twinkle':
          p.vx *= 0.3
          p.vy *= 0.3
          p.size = Math.random() * 1.2 + 0.3
          break
        case 'rain':
          p.y = anywhere ? Math.random() * h : -20
          p.vy = 7 + Math.random() * 6
          p.vx = -1.6
          p.size = 10 + Math.random() * 14
          p.alpha = 0.12 + Math.random() * 0.25
          p.hue = Math.random() < 0.7 ? 1 : 2
          break
        case 'debris':
          p.y = anywhere ? Math.random() * h : -10
          p.vy = 0.4 + Math.random() * 1.1
          p.vx = (Math.random() - 0.5) * 0.4
          p.size = 1.5 + Math.random() * 3.5
          break
        case 'warp':
          p.phase = Math.random() * Math.PI * 2
          p.vy = anywhere ? Math.random() * Math.max(w, h) * 0.6 : Math.random() * 40 // distance from centre
          p.vx = 0.4 + Math.random() * 1.2 // speed
          break
        case 'wisp':
          p.size = 1 + Math.random() * 2.2
          p.vy = -(Math.random() * 0.5 + 0.15)
          break
        case 'glitch':
          p.life = 6 + Math.random() * 30
          p.size = 2 + Math.random() * 18
          p.y = Math.random() * h
          break
      }
      return p
    }

    const resize = () => {
      w = el.clientWidth
      h = el.clientHeight
      el.width = w * dpr
      el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const step = (p: P) => {
      p.age++
      switch (p.kind) {
        case 'spiral': {
          p.phase += p.vx
          p.vy *= 0.9992
          p.x = w * 0.62 + Math.cos(p.phase) * p.vy
          p.y = h * 0.45 + Math.sin(p.phase) * p.vy * 0.55
          break
        }
        case 'warp': {
          p.vy += p.vx * (1 + p.vy / 300)
          p.x = w * 0.7 + Math.cos(p.phase) * p.vy
          p.y = h * 0.4 + Math.sin(p.phase) * p.vy
          break
        }
        case 'wisp':
          p.x += Math.sin(p.age * 0.02 + p.phase) * 0.6
          p.y += p.vy
          break
        case 'sparks':
          p.vy += 0.012
          p.x += p.vx
          p.y += p.vy
          break
        default:
          p.x += p.vx
          p.y += p.vy
      }
    }

    const outOfBounds = (p: P) => p.y < -30 || p.y > h + 30 || p.x < -40 || p.x > w + 40 || p.age > p.life

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const { colors: c, kind: k } = state.current
      const palette = [c[0], c[1], '#f5f5f5']
      for (const p of parts) {
        let a = p.alpha
        if (p.kind === 'twinkle') a *= 0.5 + 0.5 * Math.sin(frame * 0.05 + p.phase)
        if (p.life !== Infinity) a *= 1 - p.age / p.life
        if (p.dying) a *= Math.max(0, 1 - (p.age % 1000) / 40)
        if (a <= 0.01) continue
        ctx.globalAlpha = a
        ctx.fillStyle = ctx.strokeStyle = palette[p.hue]
        switch (p.kind) {
          case 'rain':
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p.x + p.vx * 2, p.y - p.size)
            ctx.stroke()
            break
          case 'sparks':
          case 'warp':
            ctx.lineWidth = p.kind === 'warp' ? 1 : 1.4
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(
              p.x - (p.kind === 'warp' ? Math.cos(p.phase) * p.vx * 6 : p.vx * 4),
              p.y - (p.kind === 'warp' ? Math.sin(p.phase) * p.vx * 6 : p.vy * 4),
            )
            ctx.stroke()
            break
          case 'debris':
            ctx.fillRect(p.x, p.y, p.size, p.size * 0.7)
            break
          case 'glitch':
            ctx.fillRect(p.x, p.y, p.size, 2)
            break
          default:
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      return k
    }

    const tick = () => {
      frame++
      const k = state.current.kind
      for (const p of parts) {
        if (!p.dying && p.kind !== k) {
          p.dying = true
          p.age = 0
        }
        step(p)
      }
      parts = parts.filter((p) => !(p.dying && p.age > 40))
      parts = parts.map((p) => (!p.dying && outOfBounds(p) ? spawn(k, false) : p))
      const alive = parts.filter((p) => !p.dying).length
      for (let i = alive; i < target() && i < alive + 3; i++) parts.push(spawn(k, true))
      draw()
      raf = requestAnimationFrame(tick)
    }

    resize()
    if (reduced) {
      // A single still frame per theme — no motion.
      state.current.redraw = () => {
        parts = Array.from({ length: target() }, () => spawn(state.current.kind, true))
        draw()
      }
      state.current.redraw()
    } else {
      raf = requestAnimationFrame(tick)
    }

    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !reduced) raf = requestAnimationFrame(tick)
    }
    const onResize = () => {
      resize()
      if (reduced) state.current.redraw()
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvas} className="world-particles" aria-hidden="true" />
}
