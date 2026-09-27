# THE MULTIVERSE IS OPEN — GFG × Marvel

A cinematic event microsite for the **GeeksForGeeks Student Chapter, Bennett University**.
It's built with Vite, React, TypeScript, GSAP (ScrollTrigger + `@gsap/react`), Lenis and Lucide.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build → dist/
npm run lint      # oxlint
```

## Add to an existing Vite + React + TS project

The config files (`tsconfig*.json`, `vite.config.ts`, `.oxlintrc.json`) match the stock `create-vite` react-ts template. You don't need to change your build setup.

1. Install the runtime dependencies:
   ```bash
   npm i gsap @gsap/react lenis lucide-react @fontsource/anton @fontsource/space-grotesk @fontsource/jetbrains-mono
   ```
2. Copy `src/` into your project, replacing `App.tsx`, `main.tsx` and `vite-env.d.ts`. After that you can delete the template's `App.css`, `index.css` and `assets/` folder.
3. Copy `public/favicon.svg` and `public/assets/`.
4. Set `<title>` and `<meta name="description">` in `index.html` (see this repo's `index.html`).

## Edit content

- **Event details** (name, date, time, venue, timeline, socials, registration endpoint):
  **`src/config/eventConfig.ts`**
- **Hero roster** (12 heroes: names, taglines, microcopy, challenge track, artwork path, and the
  colours, motif, particles, transition, HUD and type style of each hero's world):
  **`src/config/characters.ts`**

Both files are typed, so a typo in a field shows up as a TypeScript error.

## How hero worlds work

Choosing a hero (in the lineup, the hero-section orbit, the registration picker or the footer roster)
calls `select()` from `src/theme/heroContext.ts`. `HeroThemeProvider` then:

1. Plays a 1.2s **dimension shift** (`src/theme/DimensionShift.tsx`) that radiates from the click point.
   Each hero has its own style: web lines, HUD scan, portal rings, lightning, shockwave, glitch and more.
2. At the peak, swaps the world: it tweens the `--accent`, `--accent-2` and `--bg` tokens on `<html>`,
   and sets `data-hud` and `data-type` for the HUD chrome and heading treatment.
3. `WorldBackdrop` crossfades that hero's background motif and switches the global particle behaviour.

The choice is remembered in `localStorage`. With `prefers-reduced-motion`, worlds switch instantly
with no transition or particle motion.

## Structure

```
src/
  main.tsx · App.tsx · vite-env.d.ts   (vite-env also types CSS custom properties)
  config/eventConfig.ts     ← event content
  config/characters.ts      ← hero roster + per-hero world themes
  theme/                    hero context, provider, dimension shift, world backdrop, motifs, particles
  lib/motion.ts             GSAP + ScrollTrigger + useGSAP + Lenis, scroll helpers
  hooks/useScramble.ts      text-decode effect
  components/
    Loader, Cursor, ScrollProgress, Navbar, Hero, Marquee, EventIntro,
    Mission, HeroSelector, Timeline, Location, Registration, Footer
    art/                    12 stylised SVG portraits, emblems, image-with-fallback
    ui/                     Magnetic, ScrambleText, SocialIcons
  styles/global.css         design tokens, type scale, buttons, HUD bits
public/assets/characters/   drop licensed hero artwork here (see its README)
```

## Deploy (Vercel)

Import the repository at vercel.com/new. The Vite preset is detected automatically (build `npm run build`, output `dist`). Then deploy.
You can also run `npx vercel` from the project root.
Netlify: the build command is `npm run build` and the publish directory is `dist` (`public/_redirects` is included).
