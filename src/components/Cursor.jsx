import { useEffect, useRef } from 'react'
import { gsap, isTouch, prefersReducedMotion } from '../lib/motion'
import './Cursor.css'

const INTERACTIVE = 'a, button, input, select, label, [data-cursor]'

/** Dot + trailing ring + soft red glow. Disabled on touch devices. */
export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const glow = useRef(null)
  const label = useRef(null)

  useEffect(() => {
    if (isTouch()) return
    document.documentElement.classList.add('has-cursor')
    const slow = prefersReducedMotion() ? 0.01 : 1
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08 * slow })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08 * slow })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.35 * slow, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.35 * slow, ease: 'power3' })
    const gx = gsap.quickTo(glow.current, 'x', { duration: 1 * slow, ease: 'power3' })
    const gy = gsap.quickTo(glow.current, 'y', { duration: 1 * slow, ease: 'power3' })

    const move = (e) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      gx(e.clientX)
      gy(e.clientY)
      document.body.classList.remove('cursor-hidden')
    }
    const over = (e) => {
      const target = e.target.closest?.(INTERACTIVE)
      ring.current.classList.toggle('is-hover', !!target)
      dot.current.classList.toggle('is-hover', !!target)
      label.current.textContent = target?.dataset?.cursor || ''
    }
    const down = () => ring.current.classList.add('is-down')
    const up = () => ring.current.classList.remove('is-down')
    const leave = () => document.body.classList.add('cursor-hidden')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor-glow" ref={glow} />
      <div className="cursor-ring" ref={ring}>
        <span ref={label} className="cursor-label" />
      </div>
      <div className="cursor-dot" ref={dot} />
    </div>
  )
}
