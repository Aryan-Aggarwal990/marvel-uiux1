import { gsap } from '../lib/motion'
import type { HeroId, HeroTheme } from '../config/characters'

/**
 * Pushes a hero theme onto the document: colour tokens are tweened (so every accent, glow and
 * border in the site eases into the new palette) and style switches are set as data attributes
 * that CSS uses for HUD / typography treatments.
 */
export function applyTheme(id: HeroId | null, theme: HeroTheme, duration = 0.8): void {
  const root = document.documentElement
  root.dataset.hero = id ?? 'none'
  root.dataset.hud = theme.hud
  root.dataset.type = theme.type
  gsap.to(root, {
    '--accent': theme.accent,
    '--on-accent': onColor(theme.accent),
    '--accent-2': theme.accent2,
    '--bg': theme.bg,
    duration,
    ease: 'power2.out',
    overwrite: true,
  })
}

/** Readable text colour on top of a solid accent fill (dark ink on light accents like gold). */
function onColor(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? '#0a0a0a' : '#f5f5f5'
}

const STORAGE_KEY = 'gfg-multiverse-hero'

export function loadStoredHero(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeHero(id: HeroId | null): void {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable (private mode, blocked) — selection simply isn't remembered */
  }
}
