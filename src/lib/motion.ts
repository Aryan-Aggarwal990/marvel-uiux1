import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isTouch = (): boolean => typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches

let lenis: Lenis | null = null

/** Start Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function initSmoothScroll(): () => void {
  if (lenis || prefersReducedMotion()) return () => {}
  const instance = new Lenis({ duration: 1.15, smoothWheel: true })
  lenis = instance
  instance.on('scroll', ScrollTrigger.update)
  const raf = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(raf)
    instance.destroy()
    lenis = null
  }
}

export function lockScroll(locked: boolean): void {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.documentElement.classList.toggle('is-locked', locked)
}

interface ScrollOptions {
  offset?: number
  duration?: number
}

/** Scroll to a selector / element, with an offset for the floating nav. */
export function scrollToTarget(target: string | HTMLElement, { offset = 0, duration = 1.4 }: ScrollOptions = {}): void {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { offset, duration, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }
}

export { gsap, ScrollTrigger, useGSAP }
