// Renders pages/*.md into dist/ alongside the hand-written homepage.
//
// The homepage stays exactly what it is — index.html and styles.css, written
// by hand, copied through untouched. This script exists for the learn pages:
// one markdown file per page in pages/, one shared marketing shell, plus the
// crawl surface (sitemap.xml, robots.txt, llms.txt, the IndexNow key) that a
// one-page site never needed.
//
// Each page ships two ways, like the docs:
//   dist/<slug>.html   the page (Cloudflare serves it at /<slug>)
//   dist/<slug>.md     the same page as raw markdown, for AI clients
import { Marked } from "marked";
import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile, rm, cp } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const OUT = join(ROOT, "dist");
const SITE = "https://minne.sh";
const DMG = "https://github.com/mandgie/minne/releases/latest/download/Minne.dmg";
const REPO = "https://github.com/mandgie/minne";
const AUTHOR = { "@type": "Person", name: "Magnus Friberg", url: "https://github.com/mandgie" };

// The learn cluster, in the order it appears in the footer, the sitemap and
// llms.txt. A page not listed here isn't built.
const PAGES = [
  { file: "rewind-alternative.md", label: "Rewind alternative" },
  { file: "local-ai-writing.md", label: "Local AI writing" },
  { file: "email-replies.md", label: "Email replies" },
  { file: "what-is-ai-memory.md", label: "What is an AI memory?" },
  { file: "ai-without-screen-recording.md", label: "No screen recording" },
  { file: "second-brain.md", label: "Second brain" },
  { file: "status-updates.md", label: "Status updates" },
  { file: "vs-elephas.md", label: "Minne vs Elephas" },
  { file: "vs-raycast-ai.md", label: "Minne vs Raycast AI" },
];

/* ── helpers ─────────────────────────────────────────────────────── */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

// The date a page's source last changed, for <lastmod>. Git is the truth;
// mtime is the fallback for a tree without history.
function lastmod(path) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${path}"`, { cwd: ROOT, encoding: "utf8" }).trim();
    if (d) return d;
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/&#0?39;|&#x27;|&rsquo;/gi, "")
      .replace(/&[a-z]+;|&#x?\w+;/gi, " ")
      .replace(/['’]/g, "")
      .replace(/[^\w\s-]/g, " ")
      .trim()
      .replace(/[\s-]+/g, "-") || "section"
  );
}

function makeMarked() {
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`;
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

/* ── shell ───────────────────────────────────────────────────────── */

const SPARK = `<svg class="spark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1.5c.6 4.6 1.8 6.9 4.3 8.2 1.4.7 3.2 1.2 6.2 1.6v1.4c-3 .4-4.8.9-6.2 1.6-2.5 1.3-3.7 3.6-4.3 8.2h-1.4c-.6-4.6-1.8-6.9-4.3-8.2-1.4-.7-3.2-1.2-6.2-1.6v-1.4c3-.4 4.8-.9 6.2-1.6C8.8 8.4 10 6.1 10.6 1.5Z"/></svg>`;

// The same Learn block the homepage footer carries — change one, change both
// (site/index.html is hand-written).
function learnLinks(pages, current) {
  return pages
    .map((p) =>
      p.slug === current
        ? `<span aria-current="page">${esc(p.label)}</span>`
        : `<a href="/${p.slug}">${esc(p.label)}</a>`,
    )
    .join("\n      ");
}

function footer(pages, current) {
  return `<footer class="foot">
  <div class="wrap foot__learn">
    <p class="foot__head">learn</p>
    <nav class="foot__links foot__links--learn" aria-label="Learn">
      ${learnLinks(pages, current)}
    </nav>
  </div>
  <div class="wrap foot__inner">
    <p class="foot__mark">${SPARK} minne</p>
    <p class="foot__meta">MIT licensed · this page has no trackers and loads nothing from anywhere else</p>
    <nav class="foot__links" aria-label="Elsewhere">
      <a href="${REPO}">Source</a>
      <a href="${REPO}/releases/latest">Releases</a>
      <a href="https://docs.minne.sh">Docs</a>
    </nav>
  </div>
</footer>`;
}

function jsonld({ data, url }) {
  const graph = [
    {
      "@type": "Article",
      headline: data.h1,
      description: data.description,
      url,
      mainEntityOfPage: url,
      datePublished: data.published,
      dateModified: data.modified,
      author: AUTHOR,
      isPartOf: { "@type": "WebSite", name: "Minne", url: SITE + "/" },
    },
  ];
  if (data.definedTerm) {
    graph.push({
      "@type": "DefinedTerm",
      name: data.definedTerm,
      description:
        "An index of what you have worked on — the people, projects and decisions — kept on your own machine in a form you can read, that an AI assistant consults before it writes or answers.",
      url,
    });
  }
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

function shell({ data, body, pages }) {
  const url = `${SITE}/${data.slug}`;
  const byline = data.byline
    ? `<p class="learn__byline">by <a href="https://github.com/mandgie">Magnus Friberg</a> · ${esc(data.published)}</p>`
    : "";
  const checked = data.checked
    ? `<p class="learn__checked">Product facts on this page were checked against each product's own published material on ${esc(data.checked)}. Something outdated? <a href="${REPO}/issues">Say so</a> and it will be fixed.</p>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.title)}</title>
<meta name="description" content="${esc(data.description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<meta name="theme-color" content="#06070a">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(data.title)}">
<meta property="og:description" content="${esc(data.description)}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(data.title)}">
<meta name="twitter:description" content="${esc(data.description)}">
<meta name="twitter:image" content="${SITE}/assets/og.png">
<link rel="alternate" type="text/markdown" href="/${data.slug}.md">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/learn.css">
${jsonld({ data, url })}
<script>document.documentElement.classList.add("js");</script>
</head>
<body class="learn">
<a class="skip" href="#main">Skip to content</a>

<header class="nav" id="nav">
  <div class="nav__inner">
    <a class="wordmark" href="/" aria-label="Minne, home">
      ${SPARK}
      <span>minne</span>
    </a>
    <div class="nav__cta">
      <a class="btn btn--ghost" href="https://docs.minne.sh">Docs</a>
      <a class="btn btn--ghost" href="${REPO}">GitHub</a>
      <a class="btn btn--solid" href="${DMG}">Download</a>
    </div>
  </div>
</header>

<main id="main" class="learn__main">
  <article class="wrap learn__article">
    <header class="learn__head">
      <p class="eyebrow eyebrow--link">[[${esc(data.slug)}]]</p>
      <h1 class="learn__title">${esc(data.h1)}</h1>
      ${byline}
    </header>
${body}
    ${checked}
    <div class="learn__cta">
      <a class="btn btn--solid btn--lg" href="${DMG}">Download for macOS</a>
      <a class="btn btn--quiet btn--lg" href="https://docs.minne.sh">Read the docs</a>
    </div>
    <p class="closing__note">Free, open source, and yours to read. macOS 14 and later.</p>
  </article>
</main>

${footer(pages, data.slug)}

<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

/* ── build ───────────────────────────────────────────────────────── */

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// The homepage, exactly as written.
for (const f of ["index.html", "styles.css", "learn.css"]) {
  await cp(join(ROOT, f), join(OUT, f));
}
await cp(join(ROOT, "assets"), join(OUT, "assets"), { recursive: true });

const pages = [];
for (const p of PAGES) {
  const raw = await readFile(join(ROOT, "pages", p.file), "utf8");
  const { data, body } = frontmatter(raw);
  data.modified = lastmod(join("pages", p.file));
  pages.push({ ...p, ...data, md: body });
}

for (const page of pages) {
  const html = makeMarked().parse(page.md);
  const out = join(OUT, `${page.slug}.html`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, shell({ data: page, body: html, pages }));
  await writeFile(
    join(OUT, `${page.slug}.md`),
    `---\ntitle: ${page.h1}\ndescription: ${page.description}\n---\n\n${page.md}`,
  );
}

/* the crawl surface */

await writeFile(
  join(OUT, "robots.txt"),
  `# minne.sh — everything here is meant to be read, by people and by machines.
# AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot, and the rest) are welcome.
User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`,
);

const urls = [
  { loc: `${SITE}/`, mod: lastmod("index.html") },
  ...pages.map((p) => ({ loc: `${SITE}/${p.slug}`, mod: p.modified })),
];
await writeFile(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.mod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
);

await writeFile(
  join(OUT, "llms.txt"),
  `# Minne

Minne is a free, open-source macOS app that remembers what you work on and
writes from it wherever you type. It reads the text of the window you are in
via the Accessibility APIs (never screenshots), keeps its memory as plain
markdown in ~/Minne, and uses the AI provider you configure — including Ollama
on localhost, in which case nothing leaves the machine. MIT licensed.

Every page below is also plain markdown at the same URL with .md appended.

## Pages

- [Minne](${SITE}/): the product page
${pages.map((p) => `- [${p.h1}](${SITE}/${p.slug}.md): ${p.description}`).join("\n")}

## Documentation

- [Minne docs](https://docs.minne.sh/): install, guides, settings, privacy
- [Docs llms.txt](https://docs.minne.sh/llms.txt): the full docs map
`,
);

// IndexNow host verification — the deploy script pings api.indexnow.org with
// this key after every deploy (scripts/indexnow.mjs at the repo root).
const key = (await readFile(join(ROOT, "..", "scripts", "indexnow.key"), "utf8")).trim();
await writeFile(join(OUT, `${key}.txt`), key);

console.log(`built homepage + ${pages.length} learn pages → dist/`);
