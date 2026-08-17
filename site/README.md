# minne.site

The product page. Plain static files — no server, no CDN, no runtime network
calls of any kind. Serve the directory and it works:

```sh
cd site && python3 -m http.server 8765   # or: bun run serve
```

## What is generated

Everything under `site/` is committed, including the two generated assets, so
the site needs no build to deploy. Regenerate them only when their source
changes (requires `bun install` in this directory):

```sh
bun run build      # src/hero.js  -> assets/hero.js  (three.js hero field)
bun run build:svg  # src/*.mjs    -> assets/hero-static.svg (its no-WebGL twin)
```

`assets/og.png` is a screenshot of `src/og.html` at 1200×630 — serve the site,
open `/src/og.html` at that viewport size and capture it.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css` | The page. Hand-written, no framework. |
| `assets/site.js` | Sticky-nav state and the scroll reveals. Not built. |
| `assets/hero.js` | Bundled three.js scene, built from `src/hero.js`. |
| `assets/*.png` | Real screenshots of Minne, cropped and quantised. |
| `assets/fonts/` | Familjen Grotesk, Source Serif 4, IBM Plex Mono — all OFL, licences alongside. |

The hero degrades in two steps: `prefers-reduced-motion` renders a single
still frame, and a machine without WebGL gets `assets/hero-static.svg`, which
is the same graph projected once by `src/make-static-svg.mjs`.
