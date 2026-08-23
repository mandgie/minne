# docs.minne.sh

The documentation. One markdown file per page in `content/`, one shared shell,
rendered to `dist/` by a ~250-line build script. No framework, no CDN, no
runtime network calls — the only fetch the page makes is `search-index.json`
from its own origin.

```sh
cd docs-site
bun install          # marked, build-time only
bun run build        # content/*.md + nav.json -> dist/
bun run serve        # builds, then serves dist/ on :8766
```

## Writing a page

1. Add `content/<name>.md` with frontmatter:

   ```markdown
   ---
   title: The Minne key
   description: One sentence. It becomes the lede and the meta description.
   ---
   ```

2. List it in `nav.json`, in the section and position it should appear in.

`nav.json` is the single source of order: the sidebar, the previous/next pager,
the sitemap and `llms.txt` all come from it, and **a page not listed there is
not built**. That is deliberate — an orphan page can't drift out of the nav
because it can't exist.

Markdown is GFM, plus one extra construct for asides:

```markdown
:::note
Ordinary markdown, indented or not.
:::
```

`note`, `tip` and `warn` are the three kinds. The index page also uses a
`<ul class="cards">` block of `<strong>` + `<span>` links for its grid.

`##` and `###` headings get slugged ids and populate the on-this-page rail; a
page with fewer than two of them simply has no rail.

## What the build emits

| Path | What it is |
| --- | --- |
| `dist/<slug>/index.html` | the page |
| `dist/<slug>.md` | the same page as raw markdown |
| `dist/llms.txt` | the whole map, for agents |
| `dist/search-index.json` | headings and text for the ⌘K search |
| `dist/sitemap.xml`, `robots.txt`, `404.html` | the usual |

The `.md` twins are the reason the docs are worth pointing an assistant at:
`https://docs.minne.sh/guides/minne-key.md` is the page, in full, with no
scraping.

`dist/` is generated and **not committed** — `bun run build` before deploy.

## Layout

| Path | What it is |
| --- | --- |
| `content/*.md` | every page |
| `nav.json` | sidebar order and structure |
| `scripts/build.mjs` | markdown -> html, plus the shell |
| `assets/docs.css` | the whole design |
| `assets/docs.js` | theme, ⌘K search, on-this-page, mobile drawer |
| `assets/fonts/` | the same three OFL faces as `site/`, licences alongside |
| `src/worker.js` | clean URLs and the 404 |

Type and colour are the marketing site's, deliberately: Familjen Grotesk,
Source Serif 4, IBM Plex Mono, and the product's blue. Docs default to the
paper ground rather than minne.sh's night one because they are read at length;
the toggle in the top bar switches, and the choice sticks in `localStorage`.

## Deploy

A second Worker on the same Cloudflare account as `site/`
(`magnus@mandgie.com`, `2fc8e8ea8ca52f166fdd1d6a033b51a6`), bound to
`docs.minne.sh` by the `[[routes]]` block in `wrangler.toml`.

```sh
cd docs-site
bun run build
npx -y wrangler@4.86.0 deploy
```

→ https://docs.minne.sh

Three things that will bite you:

- **`html_handling = "drop-trailing-slash"` is load-bearing.** Without it
  Cloudflare answers `/guides/minne-key` with a 307 to `/guides/minne-key/` —
  the directory holding `index.html` — and `src/worker.js` 301s the trailing
  slash straight back. That is an infinite redirect on every page but the root,
  and **it cannot reproduce locally**: `python -m http.server` serves a
  directory index without redirecting. Verify a subpage against the deployed
  host, not just against `bun run serve`.
- **The wrangler version is pinned on purpose.** 4.87+ needs Node >= 22 and
  this machine runs Node 20. Upgrade Node before you unpin.
- **`run_worker_first` is required.** Without it Cloudflare answers asset-shaped
  paths at the edge and `src/worker.js` never runs, so the trailing-slash
  redirect and the 404 page both go missing.

DNS for `docs.minne.sh` is created by the custom-domain binding itself — there
is no record to add by hand.
