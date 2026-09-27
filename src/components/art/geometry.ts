import { useId } from 'react'

/** Spider-web geometry: radial spokes plus sagging rings, as SVG path strings. */
export function webPaths(cx: number, cy: number, { spokes = 18, rings = 8, gap = 34, sag = 0.86 } = {}): string[] {
  const lines: string[] = []
  const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 - Math.PI / 2)
  const far = gap * (rings + 2)
  angles.forEach((a) => lines.push(`M${cx} ${cy}L${cx + Math.cos(a) * far} ${cy + Math.sin(a) * far}`))
  for (let r = 1; r <= rings; r++) {
    const rad = r * gap
    let d = ''
    angles.forEach((a, i) => {
      const b = angles[(i + 1) % spokes]
      const m = (a + b) / 2 + (i === spokes - 1 ? Math.PI : 0)
      const x1 = cx + Math.cos(a) * rad
      const y1 = cy + Math.sin(a) * rad
      const x2 = cx + Math.cos(b) * rad
      const y2 = cy + Math.sin(b) * rad
      d += `${i === 0 ? `M${x1} ${y1}` : ''}Q${cx + Math.cos(m) * rad * sag} ${cy + Math.sin(m) * rad * sag} ${x2} ${y2}`
    })
    lines.push(d)
  }
  return lines
}

/** Deterministic pseudo-random generator so generated art is identical every render. */
export function rng(seed: number): () => number {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** A jagged bolt / crack from (x1,y1) to (x2,y2). */
export function jagged(x1: number, y1: number, x2: number, y2: number, steps: number, spread: number, rand: () => number): string {
  let d = `M${x1} ${y1}`
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const nx = -(y2 - y1)
    const ny = x2 - x1
    const len = Math.hypot(nx, ny) || 1
    const off = (rand() - 0.5) * spread
    d += `L${(x1 + (x2 - x1) * t + (nx / len) * off).toFixed(1)} ${(y1 + (y2 - y1) * t + (ny / len) * off).toFixed(1)}`
  }
  return `${d}L${x2} ${y2}`
}

/**
 * Unique, CSS-safe ids for SVG defs. Several copies of the same artwork can be on the page at
 * once (and some hidden), so gradients must never be shared between instances.
 */
export function useArtIds() {
  const base = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (name: string) => `a${base}-${name}`
  const url = (name: string) => `url(#${id(name)})`
  return { id, url }
}
