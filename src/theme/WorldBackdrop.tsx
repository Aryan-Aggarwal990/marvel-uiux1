import { useState } from 'react'
import type { Motif } from '../config/characters'
import { useHero } from './heroContext'
import { MotifArt } from './motifs'
import WorldParticles from './WorldParticles'
import './WorldBackdrop.css'

/**
 * The "world" behind every section: tinted base, accent glows, the hero's motif and particle
 * field. Motifs crossfade — the outgoing one stays mounted until the new one has faded in.
 */
export default function WorldBackdrop() {
  const { theme } = useHero()
  const [layers, setLayers] = useState<{ current: Motif; previous: Motif | null }>({ current: theme.motif, previous: null })

  // Adjust state during render when the motif changes (keeps the old layer for the crossfade).
  if (layers.current !== theme.motif) setLayers({ current: theme.motif, previous: layers.current })

  return (
    <div className="world" aria-hidden="true">
      <div className="world-glow world-glow-a" />
      <div className="world-glow world-glow-b" />
      {layers.previous && (
        <div
          key={`prev-${layers.previous}`}
          className="world-motif is-leaving"
          data-motif={layers.previous}
          onAnimationEnd={(e) => e.target === e.currentTarget && setLayers((l) => ({ ...l, previous: null }))}
        >
          <MotifArt motif={layers.previous} />
        </div>
      )}
      <div key={layers.current} className="world-motif is-entering" data-motif={layers.current}>
        <MotifArt motif={layers.current} />
      </div>
      <WorldParticles kind={theme.particles} colors={[theme.accent, theme.accent2]} />
      <div className="world-vignette" />
    </div>
  )
}
