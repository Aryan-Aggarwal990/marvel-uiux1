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

All event content is in **`src/config/eventConfig.ts`**. It's typed, so a typo in a field shows up as a TypeScript error.

## Structure

```
src/
  main.tsx · App.tsx · vite-env.d.ts   (vite-env also types CSS custom properties)
  config/eventConfig.ts     ← edit me
  lib/motion.ts             GSAP + ScrollTrigger + useGSAP + Lenis, scroll helpers
  hooks/useScramble.ts      text-decode effect
  components/
    Loader, Cursor, ScrollProgress, Navbar, Hero, Marquee, EventIntro,
    Mission, HeroSelector, Timeline, Location, Registration, Footer
    art/CharacterArt.tsx    SVG placeholder art + image-with-fallback
    ui/                     Magnetic, ScrambleText, Particles, SocialIcons
  styles/global.css         design tokens, type scale, buttons, HUD bits
public/assets/              drop licensed artwork here (see its README)
```

## Deploy (Vercel)

Import the repository at vercel.com/new. The Vite preset is detected automatically (build `npm run build`, output `dist`). Then deploy.
You can also run `npx vercel` from the project root.
Netlify: the build command is `npm run build` and the publish directory is `dist` (`public/_redirects` is included).
