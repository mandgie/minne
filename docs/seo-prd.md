# PRD: Organic growth for minne.sh — SEO + AEO

**Owner:** Magnus Friberg · **Drafted:** 2026-08-26 · **Status:** proposal

Goal: grow qualified organic traffic (Google, Bing, and AI answer engines —
ChatGPT, Perplexity, Copilot, Google AI Overviews) to minne.sh, and convert it
to downloads. The lever is new content surface: today minne.sh is a single
page, so there is almost nothing for a search engine to rank beyond the brand
query.

Everything in this PRD is grounded in the actual site (`site/`,
`docs-site/`) and product copy as of 2026-08-26. No claim about Minne may be
invented for a page; the source of truth is the repo (README.md,
docs-site/content/*, site/index.html).

---

## 1. Current state (audit, 2026-08-26)

### minne.sh (marketing, `site/`, Worker `minne`)

Strong:

- Excellent title + meta description, canonical, full OG/Twitter tags, og.png.
- Hand-written static HTML/CSS, self-hosted fonts, no trackers, content
  readable without JS → Core Web Vitals are essentially solved.
- Clean `www → apex` 301 in `site/src/worker.js`.
- Semantic, accessible markup; `lang="en"`.

Weak / missing:

- **One page.** No subpages at all. The site can only ever rank for "minne"
  and near-brand queries. This is the single biggest gap.
- **No sitemap.xml** (404).
- **robots.txt is not ours.** What serves at minne.sh/robots.txt is
  Cloudflare's managed "content signals" preamble only — no `User-agent`, no
  `Allow`, no `Sitemap` line. There is no robots.txt in `site/dist`.
- **No structured data.** Zero JSON-LD — no `SoftwareApplication`, no
  `Organization`/`WebSite`.
- **No llms.txt** (404). (Low evidence of impact — see §4 — but zero cost.)
- No hreflang (fine — single-language English site; do not add).

### docs.minne.sh (`docs-site/`, Worker `minne-docs`)

Already good: 18 pages, per-page titles + meta descriptions from frontmatter,
canonicals, sitemap.xml, a real robots.txt with a Sitemap line, llms.txt, and
— unusually good for AEO — every page also ships as raw markdown
(`/<slug>.md`) with `<link rel="alternate" type="text/markdown">`.

Gaps:

- Homepage `<title>` is just "Minne docs" — no keyword, no proposition.
- `sitemap.xml` has no `<lastmod>` (build script writes bare `<loc>` only).
- No JSON-LD anywhere (FAQ page is a natural `FAQPage` schema candidate;
  guides fit `TechArticle`).
- Docs pages have no `og:image` (only `og:site_name` etc.; twitter card is
  bare `summary`).
- minne.sh and docs.minne.sh don't share a sitemap index, and (unverified from
  here) the properties are likely not registered in Google Search Console or
  Bing Webmaster Tools.

### Deployment reality (for implementation notes)

- `site/` is framework-free: `index.html` + `styles.css` hand-written; deploy
  is `cp` into `dist/` + `npx wrangler@4.86.0 deploy` (Node 20 pin — see
  `site/README.md`). Worker `minne`, account `2fc8e8ea8ca52f166fdd1d6a033b51a6`.
- `docs-site/` has a tiny builder (`scripts/build.mjs`, marked, nav.json)
  that already produces per-page HTML + .md + sitemap + llms.txt. New
  marketing subpages can either be hand-written HTML files in `site/` or —
  better once there are more than ~3 — a stripped copy of the docs builder.
- The `minne` worker serves assets directly; extensionless URLs for subpages
  need either `<slug>.html` assets (Cloudflare serves `/foo` from `foo.html`
  automatically) or the docs-site `html_handling = "drop-trailing-slash"`
  pattern with `<slug>/index.html`. Either works; pick one and keep canonical
  URLs slash-free like the docs.

---

## 2. What the research says (2025–2026), condensed

1. **Topical authority via clusters** is how small sites win: a hub page plus
   tightly interlinked spoke pages on one subject ("a private AI memory that
   writes for you on your Mac") beats scattered posts. Internal linking is the
   glue.
2. **Answer-first content** gets cited by AI engines: the first ~200 words of
   a page should answer the query outright; question-shaped H2s; short
   extractable definitions; FAQ schema where it is genuinely a FAQ.
3. **Bing matters again**: ChatGPT Search retrieves from Bing's index (~87% of
   ChatGPT citations match Bing top results). Bing Webmaster Tools +
   IndexNow gets new pages indexed in hours-to-days and now reports AI
   citations (Copilot/ChatGPT) first-party.
4. **llms.txt is near-zero signal** (multiple 2026 studies: ~0.1% of AI
   crawler traffic touches it; no major provider committed to it; no measured
   citation correlation). Ship it because it costs five minutes, expect
   nothing from it.
5. **Indie Mac apps rank with honest comparison content.** Rewrait, WunderType,
   Kerlig, TypeFire, Elephas, RewriteBar all rank for "best AI writing app
   Mac" / "[X] alternative" via their own blogs. These SERPs are won by small
   sites today — the competition is other indie apps, not publishers.
6. **A live market event:** Rewind AI was acquired by Meta and its capture
   shut down in December 2025. "Rewind alternative" is an active, high-intent
   cluster where every current winner is another small product site
   (Screenpipe, Littlebird, MemX, StashPad…). Minne has an honest, unique
   angle: memory *without* screen recording.
7. E-E-A-T for a product site = named human author (Magnus), open source
   verifiability (link claims to code), no fabricated numbers or testimonials.

**One product-copy risk flag (not an SEO item):** the homepage line "uses the
AI you already pay for" and the FAQ's "grey area" answer predate Anthropic's
Feb 2026 clarification that Free/Pro/Max OAuth tokens may not be used in
third-party tools (enforced server-side since ~Jan 2026). New pages written
under this PRD should lead with the API-key and local/Ollama paths and treat
subscription sign-in per the FAQ's honest framing at the time of writing.
Recommend revisiting that FAQ answer; do not build any landing page around
"use your Claude/ChatGPT subscription" as the hook.

---

## 3. Technical SEO fixes (do first — ~1 day total)

| # | Fix | Where | Effort |
|---|-----|-------|--------|
| T1 | `robots.txt` for minne.sh: `User-agent: * / Allow: /` + `Sitemap: https://minne.sh/sitemap.xml`. Ship as `site/dist` asset (add to the deploy `cp`); check the Cloudflare dashboard's managed robots.txt setting so the content-signals block doesn't shadow it. | `site/` + CF dashboard | 30 min |
| T2 | `sitemap.xml` for minne.sh listing `/` + every new page (hand-maintained until a builder exists). | `site/` | 30 min |
| T3 | JSON-LD on the homepage: `SoftwareApplication` (name Minne, `operatingSystem: "macOS 14.0 or later"`, `applicationCategory: "ProductivityApplication"`, `offers: {price: 0}`, `license` MIT, `downloadUrl` the .dmg, `sameAs` the GitHub repo) + `WebSite`. All values already true from the repo. | `site/index.html` | 1 h |
| T4 | Google Search Console + Bing Webmaster Tools: verify minne.sh **and** docs.minne.sh (Bing can import from GSC), submit both sitemaps. This is the precondition for all measurement, and Bing is the gateway to ChatGPT citations. | dashboards | 1 h |
| T5 | IndexNow: generate a key file, ping on deploy (a ~15-line script in `site/` and `docs-site/scripts/build.mjs`, POST changed URLs to `api.indexnow.org`). | both | 1–2 h |
| T6 | Docs index `<title>` → "Minne documentation — a memory for your Mac that writes where you type" (or similar); keep per-page titles as-is (they're good). | `docs-site/content/index.md` frontmatter / build.mjs | 15 min |
| T7 | `<lastmod>` in docs sitemap (git log date per content file, or file mtime at build). | `docs-site/scripts/build.mjs` | 30 min |
| T8 | `FAQPage` JSON-LD on docs FAQ (it is a genuine FAQ; generate from the H2/answer pairs at build time). `TechArticle` on guides is optional, lower value. | `docs-site/scripts/build.mjs` | 1 h |
| T9 | `og:image` on docs pages (reuse the marketing og.png or a docs variant); upgrade twitter card to `summary_large_image`. | `docs-site/scripts/build.mjs` | 30 min |
| T10 | `llms.txt` at minne.sh root: one short file describing the product and linking the docs llms.txt and key pages. Zero expectations (see §2.4). | `site/` | 15 min |

---

## 4. New pages — the core deliverable

All on **minne.sh** (marketing voice; docs stay documentation). Flat slugs.
Every page: unique title + meta description, one H1, answer-first opening
paragraph, `SoftwareApplication` or `Article` JSON-LD as fits, footer/nav
links, and 2–4 in-body links to sibling pages + docs. Add each to sitemap.xml
and to a new "Learn" block in the site footer so every page is crawlable from
the homepage.

Voice: exactly the existing site copy — plain, concrete, second person, no
hype, no invented numbers. Where a competitor is named, be accurate and
generous; Minne is new and unreviewed, and the pages must say only what the
code does.

Priority order:

### P1 — `/rewind-alternative`
- **Target queries:** "rewind ai alternative", "rewind ai alternative mac",
  "rewind ai shut down replacement", "limitless alternative", "app that
  remembers what you do on your mac". Mid volume, high intent, actively won
  by small sites — the best single opportunity right now.
- **Intent:** displaced Rewind users looking for a private local memory.
- **Outline:** H1 "A Rewind alternative that never records your screen".
  Open by answering: what happened to Rewind (Meta acquisition, capture
  disabled Dec 2025) and what Minne is (local text memory via Accessibility
  APIs, plain markdown, no server). Sections: How Minne's memory works vs
  screen recording · What Minne does that Rewind did (search your past, ask
  questions) · What it doesn't do (no screenshots, no audio/meeting capture —
  say so plainly, and name Screenpipe/Limitless as better fits for those
  needs) · Privacy comparison table (storage, format, network) · Get started.
- **Links:** → docs /guides/memory, /privacy, /guides/chat; ← homepage
  footer, /what-is-ai-memory, /ai-without-screen-recording.

### P2 — `/local-ai-writing`
- **Target queries:** "local ai writing assistant mac", "offline ai writing
  mac", "ollama writing assistant", "private ai writing assistant no cloud",
  "open source ai writing assistant mac". Modest volume, weak competition
  (mostly indie blogs), perfectly matches the product.
- **Intent:** privacy-conscious users wanting AI writing without cloud.
- **Outline:** H1 "A local, open-source AI writing assistant for your Mac".
  Answer first: Minne is free, MIT-licensed, stores memory as markdown in
  ~/Minne, and can run entirely against Ollama on localhost so nothing leaves
  the machine. Sections: What "local" means here (what leaves your Mac,
  per feature — lift from the audited egress ledger) · Running Minne on
  Ollama (link docs /start/provider) · What the memory folder looks like ·
  Why open source matters for a tool that reads your screen text.
- **Links:** → docs /start/provider, /privacy, /reference/build, GitHub;
  ↔ /rewind-alternative, /ai-without-screen-recording.

### P3 — `/email-replies`
- **Target queries:** "ai email reply generator mac", "ai that writes email
  replies", "write email replies faster", "smart reply mac mail". The generic
  web-tool SERP is crowded; the *Mac + system-wide + knows-your-context*
  angle is not.
- **Intent:** drowning-in-email professionals.
- **Outline:** H1 "Email replies that already know the thread". Answer first:
  tap right-Option in Mail (or any mail client — it's a text field), Minne
  reads the thread on screen plus what it remembers, drafts in your tone,
  nothing sends until you press Insert. Sections: How it differs from a
  reply *generator* (no copy-paste, no prompt-writing; memory supplies the
  context you'd have scrolled for) · In your words (tone learned from your
  writing) · Works in every mail app (Accessibility APIs, not a plugin) ·
  What gets sent to the model, exactly.
- **Links:** → docs /guides/minne-key, /guides/instructions; ↔
  /status-updates, /what-is-ai-memory.

### P4 — `/what-is-ai-memory` (AEO, question-shaped)
- **Target queries:** "what is a personal ai memory", "ai that remembers
  what you work on", "ai with memory of my work", "personal ai memory app".
  Definitional — built to be quoted by answer engines.
- **Outline:** H1 "What is a personal AI memory?" First 100 words: a crisp,
  citable definition (an index of what you've worked on, kept on your
  machine, that an assistant reads before it writes). H2s as questions: How
  is it different from chat history? · Does it need screen recording? (no —
  link P5) · Where should the memory live? (plain files you can open — the
  Karpathy-style markdown wiki argument, from README) · What can you do with
  one? Ends with how Minne implements each answer.
- **Schema:** `Article` + optionally `DefinedTerm`. Links: ↔ every other
  page; this is the cluster's conceptual hub.

### P5 — `/ai-without-screen-recording` (AEO, question-shaped)
- **Target queries:** "ai memory without screen recording", "does ai need to
  record your screen", "accessibility api vs screen recording privacy",
  "screenpipe alternative no screen recording". Low volume, near-zero
  competition, and it's Minne's sharpest differentiator.
- **Outline:** H1 "Your Mac's AI memory doesn't need a screen recorder".
  Answer first: text of the focused window via Accessibility APIs (what a
  screen reader uses) vs continuous screenshot capture — storage, privacy
  and battery consequences of each. H2s: What the Accessibility API actually
  exposes · Why no purple recording dot ever appears · What Minne masks
  before disk (cards, ID numbers, IBANs; password fields skipped) · When you
  genuinely need screen recording (be honest: pixels, video, meetings —
  other tools).
- **Links:** → docs /privacy, /faq; ↔ /rewind-alternative, /local-ai-writing.

### P6 — `/second-brain`
- **Target queries:** "second brain that maintains itself", "ai second brain
  app", "obsidian ai memory", "automatic note taking mac", "second brain
  markdown local". PKM audience; moderate volume; Minne's "no capture ritual"
  angle is distinctive.
- **Outline:** H1 "A second brain you never have to file". Answer first: the
  problem with second brains is upkeep; Minne's wiki writes itself from what
  you already do, in plain markdown you can open in Obsidian. Sections: The
  folder (sources/, wiki/, SCHEMA.md — from docs /guides/memory) · You own
  the schema · Grep it, git it, leave anytime · What it costs (nothing —
  MIT; the model is yours).
- **Links:** → docs /guides/memory, /guides/schema, /guides/mcp; ↔
  /what-is-ai-memory.

### P7 — `/status-updates`
- **Target queries:** "how to write a project status update", "weekly status
  update generator", "ai status report from my work". Informational head is
  content-farm territory; the winnable tail is "…from what I actually did".
- **Outline:** H1 "The status update writes itself — you were there all
  week, and so was Minne". Open with the third demo scene made concrete:
  blank doc, type the instruction, Minne pulls the last weeks together.
  Sections: What a good status update contains (genuinely useful, brief) ·
  Why the hard part is recall, not writing · Doing it with Minne (the
  instruction pattern, from docs /guides/instructions) · Editing and
  inserting.
- **Links:** → docs /guides/instructions, /guides/minne-key; ↔ /email-replies.

### P8 — `/vs/elephas` and P9 — `/vs/raycast-ai` (honest comparisons)
- **Target queries:** "minne vs elephas", "elephas alternative", "raycast ai
  writing", "raycast ai alternative for writing". Tiny volume today, but
  near-zero competition, high conversion, and they complete the cluster.
- **Outline (each):** H1 "Minne and X — which one is for you?" A fair,
  factual comparison from each product's own published docs/pricing: what X
  does well (say it plainly), what Minne does differently (passive memory,
  plain-markdown wiki, free/MIT, no account), an honest "choose X if…" list.
  No scores, no stars, no claims about X we can't source from X's site;
  re-verify X's current pricing/features at writing time and date the page.
- **Links:** ↔ /rewind-alternative, /local-ai-writing; → GitHub.

### P10 — `/text-expander-and-ai` (optional, later)
- **Target queries:** "textexpander alternative ai", "text expander vs ai
  writing", "stop retyping the same emails". The alternative SERP is owned
  by actual text expanders (Espanso, TypeFire, Text Blaze) — do not pretend
  Minne is one. Frame as the question page: "When a text expander stops
  being enough" — snippets for identical text, Minne for text that's always
  slightly different. Honest, and catches the adjacent intent.

**Explicitly not doing:** "best AI writing apps for Mac" listicle ranking
Minne above competitors (can't be honest while Minne is unreviewed and
early), doorway pages per synonym, programmatic pages, fake reviews or
testimonials, any page whose claims can't be traced to the repo.

---

## 5. AEO checklist

- [ ] Answer-first openings: first ~150 words of every §4 page fully answer
  the target query (retrieval engines weight the opening).
- [ ] Question-shaped H2s on P4/P5/P7; each answerable in the 2–3 sentences
  that follow the heading.
- [ ] One citable definition per page (a single quotable sentence — AI
  answers lift these verbatim).
- [ ] `FAQPage` schema where a page has a real Q&A block (docs FAQ first).
- [ ] Bing Webmaster Tools verified + sitemaps submitted (T4) — ChatGPT
  retrieves from Bing; watch the AI Performance report for citations.
- [ ] IndexNow on deploy (T5).
- [ ] Serve `.md` alternates for the new marketing pages too, mirroring the
  docs-site pattern (`<link rel="alternate" type="text/markdown">`) — cheap,
  and AI clients demonstrably fetch the docs ones.
- [ ] llms.txt on both hosts (T10) — five minutes, zero expectations.
- [ ] Keep robots.txt permissive for AI crawlers (GPTBot, ClaudeBot,
  PerplexityBot, CCBot) on both hosts — being read is the point. Note the
  Cloudflare content-signals block currently served on minne.sh and make a
  deliberate choice about ai-train signals.
- [ ] Community surface (later, human-only): answer real "Rewind
  alternative" / "local AI writing" threads on Reddit and HN as Magnus,
  linking only where genuinely relevant. AI engines lean on
  Reddit heavily; never astroturf.

## 6. Content guidelines

- Match the site's existing voice: short declaratives, concrete nouns,
  second person, lowercase eyebrows, no exclamation marks, no "unleash/
  supercharge/game-changing". Read `site/index.html` aloud first.
- Every product claim must be true of the shipped app and traceable to
  README, docs content, or the code. If the app changes, the pages change.
- No invented statistics, benchmarks, user counts, or testimonials. "Five
  minutes becomes fifteen seconds" style illustrations are fine; "87% faster"
  numbers are not.
- Comparisons: describe competitors from their own published material,
  verified at writing time; include an honest "choose them if" section; date
  the page; revisit quarterly.
- Named author where a page argues something (P4, P5, P10): "by Magnus
  Friberg" with a link to GitHub — E-E-A-T for a one-person product is the
  person.
- Provider messaging: lead with API key and local/Ollama; handle
  subscription sign-in only with the FAQ's honest framing (see §2 risk flag).
- English only; no hreflang; Norwegian/Swedish localization is out of scope.

## 7. Measurement

- **Setup (week 1):** GSC (both properties), Bing Webmaster Tools, sitemaps
  submitted. No client-side analytics exists (site promise: no trackers) —
  measurement is search-console-side + GitHub release download counts.
- **Track monthly:** GSC impressions/clicks per page and per query cluster;
  Bing AI Performance citations (first-party ChatGPT/Copilot signal);
  indexed-page counts on both properties; .dmg download counts per release
  (GitHub API) as the conversion proxy.
- **Spot-check quarterly:** ask ChatGPT/Perplexity/Claude the P1–P6 target
  questions and record whether/what they cite.
- **Success at 6 months (realistic for a new domain):** all pages indexed on
  both engines; non-brand impressions growing month-over-month; at least a
  few first-page rankings in the tail (P5-class queries); first observed AI
  citations of minne.sh or docs pages.

## 8. Out of scope / later

- Link building and PR outreach; paid anything; Product Hunt relaunch.
- A general blog / changelog (worth it later; not this PRD).
- Localized site (sv/no) — despite the name, keep English until traffic
  justifies it.
- Video/YouTube demos; App Store presence (Minne isn't in the MAS).
- The §2 ToS copy revision — product decision for Magnus, not an SEO task.

## 9. Implementation order

| Step | Item | Effort |
|------|------|--------|
| 1 | T1–T5: robots, sitemap, homepage JSON-LD, GSC + Bing, IndexNow | ~1 day |
| 2 | Page scaffolding: decide hand-written vs mini-builder (reuse `docs-site/scripts/build.mjs` pattern), shared head/footer with "Learn" links, sitemap wiring | ~1 day |
| 3 | P1 `/rewind-alternative` + P2 `/local-ai-writing` | 1–2 days |
| 4 | P3 `/email-replies` + P4 `/what-is-ai-memory` | 1–2 days |
| 5 | P5 `/ai-without-screen-recording` + P6 `/second-brain` | 1–2 days |
| 6 | Docs polish T6–T9 (title, lastmod, FAQPage schema, og:image) | ~0.5 day |
| 7 | P7 `/status-updates`, then P8/P9 comparisons | 1–2 days |
| 8 | AEO extras: .md alternates for marketing pages, llms.txt both hosts | ~0.5 day |
| 9 | Quarterly: comparison re-verification, AI-citation spot checks | recurring |

Steps 1–5 are the 80%: technical floor + the five pages with the clearest
query-to-product fit. Ship those before touching the rest.
