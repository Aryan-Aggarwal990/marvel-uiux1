import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*+=_'

/** Returns [displayText, scramble()] — scramble() decodes `text` from random glyphs. */
export function useScramble(text, { duration = 600, autoplay = false } = {}) {
  const [output, setOutput] = useState(text)
  const frame = useRef(0)

  const scramble = useCallback(
    (nextText = text) => {
      cancelAnimationFrame(frame.current)
      if (prefersReducedMotion()) return setOutput(nextText)
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const revealed = Math.floor(p * nextText.length)
        let s = ''
        for (let i = 0; i < nextText.length; i++) {
          const ch = nextText[i]
          if (i < revealed || ch === ' ' || ch === '/' || ch === '.') s += ch
          else s += GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        setOutput(s)
        if (p < 1) frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    },
    [text, duration],
  )

  useEffect(() => {
    setOutput(text)
    if (autoplay) scramble(text)
    return () => cancelAnimationFrame(frame.current)
  }, [text, autoplay, scramble])

  return [output, scramble]
}
