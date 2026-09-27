# /public/assets

Drop licensed / approved artwork here, then point the matching field in
`src/config/eventConfig.js` at it. Any missing or broken file falls back to the
built-in SVG artwork, so the layout never breaks.

| File (suggested)      | Config field                         | Notes                                  |
| --------------------- | ------------------------------------ | -------------------------------------- |
| `hero-character.png`  | `images.hero`                        | Transparent PNG/WebP, ~1200×1500, 4:5  |
| `ironman.png`         | `characters[0].image`                | Transparent PNG/WebP, 4:5              |
| `spiderman.png`       | `characters[1].image`                | Transparent PNG/WebP, 4:5              |
| `strange.png`         | `characters[2].image`                | Transparent PNG/WebP, 4:5              |
| `black-panther.png`   | `characters[3].image`                | Transparent PNG/WebP, 4:5              |
