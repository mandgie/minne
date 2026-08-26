// Renders content/*.md into dist/ as a static docs site.
//
// One markdown file per page, one shared shell. The nav order lives in
// nav.json — a page that isn't listed there isn't built, so the sidebar and
// the site can't drift apart.
//
// Each page ships three ways:
//   dist/<slug>/index.html   the page
//   dist/<slug>.md           the same page as raw markdown, for AI clients
//   dist/search-index.json   headings + text, for the ⌘K search
import { Marked } from "marked";
import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile, rm, cp, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const OUT = join(ROOT, "dist");
const SITE = "https://docs.minne.sh";
const DMG = "https://github.com/mandgie/minne/releases/latest/download/Minne.dmg";
const REPO = "https://github.com/mandgie/minne";

/* ── markdown ────────────────────────────────────────────────────── */

// ::: note / tip / warn / lab — a fenced aside, the one construct the pages
// need that markdown has no syntax for.
const callout = {
  name: "callout",
  level: "block",
  start: (src) => src.match(/^:::/m)?.index,
  tokenizer(src) {
    const m = /^:::(note|tip|warn)[ \t]*\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/.exec(src);
    if (!m) return;
    return {
      type: "callout",
      raw: m[0],
      kind: m[1],
      tokens: this.lexer.blockTokens(m[2] + "\n"),
    };
  },
  renderer(token) {
    const label = { note: "Note", tip: "Tip", warn: "Careful" }[token.kind];
    return `<aside class="note note--${token.kind}"><p class="note__tag">${label}</p><div class="note__body">${this.parser.parse(token.tokens)}</div></aside>\n`;
  },
};

// Slugs for headings, so the on-this-page rail can link into the prose.
const slugged = new Map();
function slugify(text) {
  const base =
    text
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      // An apostrophe is inside a word ("the brain's" -> brains); every other
      // punctuation mark separates two ("config.json" -> config-json, which
      // dropping the dot outright would glue into "configjson").
      .replace(/['’]/g, "")
      .replace(/[^\w\s-]/g, " ")
      .trim()
      .replace(/[\s-]+/g, "-") || "section";
  const n = slugged.get(base) ?? 0;
  slugged.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

function makeMarked(headings) {
  const marked = new Marked({ gfm: true });
  marked.use({ extensions: [callout] });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = unesc(text.replace(/<[^>]+>/g, ""));
        const id = slugify(plain);
        if (depth === 2 || depth === 3) headings.push({ id, text: plain, depth });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const ext = /^https?:\/\//.test(href) && !href.startsWith(SITE);
        const attrs = ext ? ' target="_blank" rel="noopener"' : "";
        const t = title ? ` title="${title}"` : "";
        return `<a href="${href}"${t}${attrs}>${text}${ext ? '<svg class="ext" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 1.5h6v6M10 2 2 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}</a>`;
      },
      table({ header, rows }) {
        const th = header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join("");
        const tb = rows
          .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`)
          .join("\n");
        return `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>\n${tb}\n</tbody></table></div>\n`;
      },
    },
  });
  return marked;
}

/* ── content ─────────────────────────────────────────────────────── */

function frontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return { data, body: raw.slice(m[0].length) };
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Heading text arrives already rendered, so stripping its tags leaves entities
// behind — and `esc` would then escape the ampersand a second time
// ("the brain&#39;s"). Decode before handing plain text to the rail, the search
// index or a title.
const unesc = (s) =>
  String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/g, "&");

/* ── shell ───────────────────────────────────────────────────────── */

const SPARK = `<svg class="spark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1.5c.6 4.6 1.8 6.9 4.3 8.2 1.4.7 3.2 1.2 6.2 1.6v1.4c-3 .4-4.8.9-6.2 1.6-2.5 1.3-3.7 3.6-4.3 8.2h-1.4c-.6-4.6-1.8-6.9-4.3-8.2-1.4-.7-3.2-1.2-6.2-1.6v-1.4c3-.4 4.8-.9 6.2-1.6C8.8 8.4 10 6.1 10.6 1.5Z"/></svg>`;

function sidebar(nav, current) {
  return nav
    .map((section) => {
      const items = section.pages
        .map((p) => {
          const on = p.slug === current ? ' class="is-on" aria-current="page"' : "";
          return `<li><a href="${p.slug === "" ? "/" : "/" + p.slug}"${on}>${esc(p.title)}</a></li>`;
        })
        .join("\n");
      const head = section.title
        ? `<p class="side__head">${esc(section.title)}</p>`
        : "";
      return `<div class="side__group">${head}<ul>\n${items}\n</ul></div>`;
    })
    .join("\n");
}

function toc(headings) {
  if (headings.length < 2) return "";
  const items = headings
    .map((h) => `<li class="toc__l${h.depth}"><a href="#${h.id}">${esc(h.text)}</a></li>`)
    .join("\n");
  return `<nav class="toc" aria-label="On this page"><p class="toc__head">On this page</p><ul>\n${items}\n</ul></nav>`;
}

function pager(flat, i) {
  const prev = flat[i - 1];
  const next = flat[i + 1];
  if (!prev && !next) return "";
  const link = (p, dir, label) =>
    p
      ? `<a class="pager__link pager__link--${dir}" href="${p.slug === "" ? "/" : "/" + p.slug}"><span class="pager__dir">${label}</span><span class="pager__title">${esc(p.title)}</span></a>`
      : `<span class="pager__link pager__link--${dir}"></span>`;
  return `<nav class="pager" aria-label="Previous and next page">${link(prev, "prev", "Previous")}${link(next, "next", "Next")}</nav>`;
}

function shell({ title, description, slug, body, headings, nav, flat, index, jsonld }) {
  const url = slug === "" ? SITE + "/" : `${SITE}/${slug}`;
  const pageTitle =
    slug === ""
      ? "Minne documentation — a memory for your Mac that writes where you type"
      : `${title} — Minne docs`;
  const depth = slug === "" ? 0 : slug.split("/").length;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#06070a" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Minne docs">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og.png">
<link rel="alternate" type="text/markdown" href="${slug === "" ? "/index.md" : "/" + slug + ".md"}">${jsonld ? "\n" + jsonld : ""}
<link rel="stylesheet" href="/assets/docs.css">
<script>
  // Before first paint, so the page never flashes the wrong ground.
  try {
    var t = localStorage.getItem("minne-docs-theme");
    if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
  } catch (e) {}
  document.documentElement.classList.add("js");
</script>
</head>
<body data-slug="${esc(slug)}" data-depth="${depth}">
<a class="skip" href="#doc">Skip to content</a>

<header class="top">
  <div class="top__inner">
    <button class="burger" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="side">
      <span></span><span></span><span></span>
    </button>
    <a class="wordmark" href="/">${SPARK}<span>minne</span><span class="wordmark__tag">docs</span></a>
    <button class="search-open" type="button" aria-label="Search the docs">
      <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.6 10.6 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span class="search-open__label">Search</span>
      <kbd>⌘K</kbd>
    </button>
    <div class="top__right">
      <a class="top__link" href="https://minne.sh">minne.sh</a>
      <a class="top__link" href="${REPO}">GitHub</a>
      <button class="theme" type="button" aria-label="Switch between light and dark">
        <svg class="theme__sun" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.8" fill="currentColor"/><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 1.6v2M10 16.4v2M18.4 10h-2M3.6 10h-2M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5 4.1 4.1"/></g></svg>
        <svg class="theme__moon" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" fill="currentColor"/></svg>
      </button>
      <a class="btn btn--solid" href="${DMG}">Download</a>
    </div>
  </div>
</header>

<div class="shell">
  <aside class="side" id="side">
    <nav aria-label="Documentation">
${sidebar(nav, slug)}
    </nav>
  </aside>

  <main class="doc" id="doc">
    <article class="prose">
      <p class="eyebrow">${esc(nav.find((s) => s.pages.some((p) => p.slug === slug))?.title ?? "Minne")}</p>
      <h1>${esc(title)}</h1>
      <p class="lede">${esc(description)}</p>
${body}
    </article>
    ${pager(flat, index)}
    <footer class="foot">
      <p>${SPARK} <span>Minne is free and open source. <a href="${REPO}">Read the code</a>, or <a href="${REPO}/issues">tell us what is wrong here</a>.</span></p>
      <p class="foot__meta"><a href="${slug === "" ? "/index.md" : "/" + slug + ".md"}">This page as markdown</a> · <a href="https://minne.sh">minne.sh</a></p>
    </footer>
  </main>

  <div class="rail">
${toc(headings)}
  </div>
</div>

<div class="search" id="search" hidden>
  <div class="search__scrim"></div>
  <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search the docs">
    <div class="search__bar">
      <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.6 10.6 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input type="search" id="searchInput" placeholder="Search the docs" autocomplete="off" spellcheck="false" aria-label="Search query">
      <kbd>esc</kbd>
    </div>
    <ul class="search__results" id="searchResults"></ul>
    <p class="search__empty" id="searchEmpty" hidden>Nothing here matches that.</p>
  </div>
</div>

<script src="/assets/docs.js" defer></script>
</body>
</html>
`;
}

// The date a page's source last changed, for <lastmod>. Git is the truth;
// mtime is the fallback for a tree without history.
async function lastmod(rel) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${rel}"`, { cwd: ROOT, encoding: "utf8" }).trim();
    if (d) return d;
  } catch {}
  return (await stat(join(ROOT, rel))).mtime.toISOString().slice(0, 10);
}

// Markdown, flattened to the plain text a FAQPage answer wants.
function mdToText(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/:::\w*\n?/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// The FAQ is a genuine FAQ — one H2 per question — so it gets FAQPage schema,
// generated from the same markdown the page is.
function faqJsonld(md) {
  const sections = md.split(/^## +/m).slice(1);
  const mainEntity = sections.map((s) => {
    const [q, ...rest] = s.split("\n");
    return {
      "@type": "Question",
      name: mdToText(q),
      acceptedAnswer: { "@type": "Answer", text: mdToText(rest.join("\n")) },
    };
  });
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  })}</script>`;
}

/* ── build ───────────────────────────────────────────────────────── */

const nav = JSON.parse(await readFile(join(ROOT, "nav.json"), "utf8"));
const flat = nav.flatMap((s) => s.pages);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(join(ROOT, "assets"), join(OUT, "assets"), { recursive: true });

const searchIndex = [];

for (const [i, page] of flat.entries()) {
  const raw = await readFile(join(ROOT, "content", page.file), "utf8");
  const { data, body: md } = frontmatter(raw);
  const title = data.title ?? page.title;
  const description = data.description ?? "";

  slugged.clear();
  const headings = [];
  const html = makeMarked(headings).parse(md);

  page.lastmod = await lastmod(join("content", page.file));

  const out = page.slug === "" ? join(OUT, "index.html") : join(OUT, page.slug, "index.html");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(
    out,
    shell({
      title,
      description,
      slug: page.slug,
      body: html,
      headings,
      nav,
      flat,
      index: i,
      jsonld: page.slug === "faq" ? faqJsonld(md) : "",
    }),
  );

  // The same page as plain markdown, at /<slug>.md — paste the URL into any
  // assistant and it can read the docs without a scraper.
  const mdOut = page.slug === "" ? join(OUT, "index.md") : join(OUT, `${page.slug}.md`);
  await mkdir(dirname(mdOut), { recursive: true });
  await writeFile(mdOut, `---\ntitle: ${title}\ndescription: ${description}\n---\n\n${md}`);

  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|:\-\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  searchIndex.push({
    slug: page.slug,
    title,
    description,
    section: nav.find((s) => s.pages.includes(page))?.title ?? "",
    headings: headings.map((h) => ({ id: h.id, text: h.text })),
    text: text.slice(0, 5000),
  });
}

await writeFile(join(OUT, "search-index.json"), JSON.stringify(searchIndex));

// Everything Minne's docs are, in one file an agent can fetch. Same idea as
// /<slug>.md, one level up.
const llms = [
  "# Minne docs",
  "",
  "Minne is a macOS menu-bar app that remembers what you work on and writes from",
  "it wherever you type. Memory is a folder of plain markdown on your own Mac.",
  "",
  ...nav.flatMap((s) => [
    `## ${s.title}`,
    "",
    ...s.pages.map(
      (p) => `- [${p.title}](${SITE}/${p.slug === "" ? "index" : p.slug}.md): ${searchIndex.find((x) => x.slug === p.slug)?.description ?? ""}`,
    ),
    "",
  ]),
].join("\n");
await writeFile(join(OUT, "llms.txt"), llms);

await writeFile(
  join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`,
);
await writeFile(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${flat
    .map(
      (p) =>
        `  <url><loc>${p.slug === "" ? SITE + "/" : SITE + "/" + p.slug}</loc><lastmod>${p.lastmod}</lastmod></url>`,
    )
    .join("\n")}\n</urlset>\n`,
);

// IndexNow host verification — the deploy script pings api.indexnow.org with
// this key after every deploy (scripts/indexnow.mjs at the repo root).
const indexnowKey = (await readFile(join(ROOT, "..", "scripts", "indexnow.key"), "utf8")).trim();
await writeFile(join(OUT, `${indexnowKey}.txt`), indexnowKey);

// A 404 that still gets you somewhere.
await writeFile(
  join(OUT, "404.html"),
  shell({
    title: "No such page",
    description: "That URL is not part of these docs.",
    slug: "404",
    body: `<p>The page you asked for is not here. The sidebar has everything these docs cover — or <a href="/">start at the beginning</a>.</p>`,
    headings: [],
    nav,
    flat: [],
    index: 0,
  }),
);

console.log(`built ${flat.length} pages → dist/`);
