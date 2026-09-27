import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

/** Lightweight canvas of drifting dust particles. Pauses when offscreen. */
export default function Particles({ count = 70, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let raf = 0
    let running = false
    const n = window.innerWidth < 700 ? Math.round(count * 0.5) : count

    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      vy: -(Math.random() * 0.25 + 0.05),
      vx: (Math.random() - 0.5) * 0.12,
      a: Math.random() * 0.6 + 0.15,
      red: Math.random() < 0.28,
    })
    let dots = []

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = Array.from({ length: n }, make)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const d of dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.y < -5) {
          d.y = h + 5
          d.x = Math.random() * w
        }
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = d.red ? `rgba(230,36,41,${d.a})` : `rgba(245,245,245,${d.a * 0.6})`
        ctx.fill()
      }
    }

    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }

    resize()
    draw()
    if (prefersReducedMotion()) return

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true
        loop()
      } else if (!entry.isIntersecting && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    })
    io.observe(canvas)
    window.addEventListener('resize', resize)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
