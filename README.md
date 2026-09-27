# THE MULTIVERSE IS OPEN — GFG × Marvel

A cinematic event microsite for the **GeeksForGeeks Student Chapter, Bennett University**.
It's built with React, Vite, GSAP (with ScrollTrigger), Lenis and Lucide.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build
```

## Edit content

All event content lives in **`src/config/eventConfig.js`**. That covers the name, date, time, venue, coordinates, maps link, registration endpoint, hero tracks, timeline, stats and social links.

To use real images, add them to `public/assets/` and set the `image` / `images.hero` fields (see `public/assets/README.md`).

## Structure

```
src/
  config/eventConfig.js     ← edit me
  lib/motion.js             GSAP + ScrollTrigger + Lenis setup, scroll helpers
  hooks/                    useGsap (scoped context), useScramble (text decode)
  components/
    Loader, Cursor, ScrollProgress, Navbar, Hero, Marquee, EventIntro,
    Mission, HeroSelector, Timeline, Location, Registration, Footer
    art/CharacterArt.jsx    SVG placeholder art + image-with-fallback
    ui/                     Magnetic, ScrambleText, Particles, SocialIcons
  styles/global.css         design tokens, type scale, buttons, HUD bits
```

## Deploy (Vercel)

Import the repository at vercel.com/new. The Vite preset is detected automatically (build `npm run build`, output `dist`). Then deploy.
You can also run `npx vercel` from the project root.
Netlify works as well: the build command is `npm run build`, the publish directory is `dist`, and `public/_redirects` is included.
