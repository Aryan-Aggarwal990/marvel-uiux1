import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*+=_'

/** Returns [displayText, scramble] — scramble(next?) decodes `next` (default: `text`) from random glyphs. */
export function useScramble(text: string, duration = 600): [string, (next?: string) => void] {
  // Output is tagged with its source text, so a changed `text` prop wins without syncing state in an effect.
  const [state, setState] = useState({ source: text, value: text })
  const frame = useRef(0)

  const scramble = useCallback(
    (next: string = text) => {
      cancelAnimationFrame(frame.current)
      if (prefersReducedMotion()) {
        setState({ source: text, value: next })
        return
      }
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const revealed = Math.floor(p * next.length)
        let s = ''
        for (let i = 0; i < next.length; i++) {
          const ch = next[i]
          if (i < revealed || ch === ' ' || ch === '/' || ch === '.') s += ch
          else s += GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        setState({ source: text, value: s })
        if (p < 1) frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    },
    [text, duration],
  )

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return [state.source === text ? state.value : text, scramble]
}
