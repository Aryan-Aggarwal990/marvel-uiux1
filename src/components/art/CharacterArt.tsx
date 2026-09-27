/**
 * Hero artwork entry point. <HeroPortrait> prefers a licensed image (set `image` in
 * src/config/characters.ts) and falls back to the built-in stylised SVG portrait if the
 * image is missing or fails to load, so the layout never breaks.
 */
import { useState, type ComponentType } from 'react'
import type { Hero, HeroId } from '../../config/characters'
import {
  CapArt,
  CaptainMarvelArt,
  DeadpoolArt,
  HulkArt,
  IronManArt,
  LokiArt,
  MilesArt,
  PantherArt,
  SpiderManArt,
  StrangeArt,
  ThorArt,
  WandaArt,
  type ArtProps,
} from './portraits'

const PORTRAITS: Record<HeroId, ComponentType<ArtProps>> = {
  spiderman: SpiderManArt,
  ironman: IronManArt,
  strange: StrangeArt,
  panther: PantherArt,
  thor: ThorArt,
  hulk: HulkArt,
  cap: CapArt,
  marvel: CaptainMarvelArt,
  wanda: WandaArt,
  loki: LokiArt,
  miles: MilesArt,
  deadpool: DeadpoolArt,
}

export function HeroPortrait({ hero, className = '' }: { hero: Hero; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  if (hero.image && failed !== hero.image) {
    return (
      <img
        className={className}
        src={hero.image}
        alt={`${hero.name} artwork`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(hero.image)}
      />
    )
  }
  const Art = PORTRAITS[hero.id]
  return <Art className={className} />
}
