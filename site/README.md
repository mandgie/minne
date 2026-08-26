# minne.site

The product page, plus the learn pages. The homepage is plain static files —
`index.html` and `styles.css`, hand-written, no framework, no CDN, no runtime
network calls of any kind. The learn pages (`/rewind-alternative` and friends)
are markdown in `pages/`, rendered by a small build script in the docs-site's
image:

```sh
cd site
bun install     # marked, build-time only
bun run build   # homepage copied through + pages/*.md rendered -> dist/
bun run serve   # builds, then serves dist/ on :8765
```

## The learn pages

One markdown file per page in `pages/`, frontmatter carrying `slug`, `title`
(the tag), `h1`, `description`, and optionally `byline` (shows the author),
`checked` (comparison pages: renders the "facts checked on <date>" note) and
`definedTerm` (adds DefinedTerm JSON-LD). Every page must be listed in `PAGES`
in `scripts/build.mjs` — that list is the footer's Learn block, the sitemap
and `llms.txt`, so an unlisted page does not exist. The homepage footer's
Learn block is the same list by hand; change one, change both.

Each page ships as `dist/<slug>.html` (Cloudflare serves it at `/<slug>`) and
as raw markdown at `/<slug>.md` for AI clients, and carries Article JSON-LD.
The build also emits `robots.txt`, `sitemap.xml` (lastmod from git),
`llms.txt` and the IndexNow key file (`scripts/indexnow.key` at the repo
root). Comparison pages state only facts verified from the competitor's own
site — re-verify and bump `checked` quarterly.

## The page is the demo

Everything is arranged around one thing: the stage in `#demo`, which plays the
same story in four moments — a message to answer, an email that needs a time, a
blank note with an instruction in it, and a question put straight to your
memory. The caret waits, right-Option goes down, Minne's panel opens and
thinks, the draft streams in, Insert lands it in the field.

- **Scenes** are markup in `index.html` (`.scene`), one per moment, each
  carrying its *finished* text. `assets/demo.js` takes a copy of that text,
  empties the field and plays it back.
- **The overlay** (`#overlay`) is shared by every scene, so Minne's panel is
  built once.
- **Adding a moment** means adding a `.scene` and a `.tab` next to it, plus a
  line in `SAYS` in `assets/demo.js`. No other wiring.
- Without JavaScript the four scenes simply stack, each already finished, and
  the page still reads. Under `prefers-reduced-motion` nothing animates: the
  tabs switch between the same finished states.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css` | The whole page. Hand-written. |
| `assets/demo.js` | The stage: scene switching, the timeline, the typing. |
| `assets/site.js` | Sticky-nav state and the scroll reveals. |
| `assets/hero-static.svg` | The memory graph behind the hero, generated. |
| `assets/fonts/` | Familjen Grotesk, Source Serif 4, IBM Plex Mono — all OFL, licences alongside. |

Two assets are generated and committed, so nothing has to be built to deploy:

```sh
bun run build:svg   # src/make-static-svg.mjs -> assets/hero-static.svg
```

`assets/og.png` is a screenshot of `src/og.html` at 1200×630 — serve the site,
open `/src/og.html` at that viewport size and capture it.

The app surfaces on this page (the overlay, the windows, the file list) are
hand-built DOM, not screenshots: they stay true as the app moves and they can
act. They mimic Minne rather than clone it — keep them simple, and move them by
hand when the app's look changes.

## Deploy

Deployed as a Worker with static assets, on the `magnus@mandgie.com` Cloudflare
account (`2fc8e8ea8ca52f166fdd1d6a033b51a6`), pinned in `wrangler.toml`.

```sh
cd site
bun run deploy   # build + wrangler deploy + IndexNow ping
```

→ https://minne.sh

`bun run deploy` is `bun scripts/build.mjs && npx -y wrangler@4.86.0 deploy &&
bun ../scripts/indexnow.mjs dist https://minne.sh`. The build replaces `dist/`
wholesale, and the IndexNow ping tells Bing (whose index feeds ChatGPT search)
that the URLs changed — a failed ping never fails the deploy. Deploy from a
committed tree: sitemap `<lastmod>` dates come from git.

One thing that will bite you:

- **The wrangler version is pinned on purpose.** wrangler 4.87+ requires Node
  >= 22 and this machine runs Node 20; `npx wrangler` unpinned fails with
  "Wrangler requires at least Node.js v22.0.0". 4.86.0 needs only >= 20.3.0.
  Upgrade Node before you unpin.

`wrangler login` is authenticated as `magnus@mandgie.com`. The apex domain is
bound via the `[[routes]]` block with `custom_domain = true`; DNS and the edge
certificate are managed by Cloudflare from that binding alone.
