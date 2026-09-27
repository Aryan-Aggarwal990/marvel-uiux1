import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/motion'

/** Thin red progress line pinned to the top of the viewport. */
export default function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    const setX = gsap.quickSetter(ref.current, 'scaleX')
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => setX(self.progress),
    })
    return () => st.kill()
  }, [])
  return <div className="scroll-progress" ref={ref} aria-hidden="true" />
}
