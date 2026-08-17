import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseFrontmatter, scalar } from "./frontmatter";
import { lintWiki } from "./wiki-lint";
import {
  BOOTSTRAP_FILES,
  INDEX_FILE,
  LOG_FILE,
  PAGE_TEMPLATES,
  PAGE_TYPES,
  SCHEMA_FILE,
  bootstrapWiki,
  loadWikiTree,
  pagePath,
  renderPage,
  slugify,
  wikiLinks,
  writePage,
} from "./wiki";

let roots: string[] = [];
function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "minne-wiki-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  roots = [];
});

describe("bootstrapWiki", () => {
  test("a fresh memory has index.md, log.md and SCHEMA.md — and lints clean", () => {
    const root = tempRoot();
    expect(bootstrapWiki(root).sort()).toEqual([INDEX_FILE, LOG_FILE, SCHEMA_FILE].sort());
    const tree = loadWikiTree(root);
    expect(Object.keys(tree.files).sort()).toEqual([INDEX_FILE, LOG_FILE, SCHEMA_FILE].sort());
    const report = lintWiki(tree);
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
  });

  test("the bootstrap log is empty of entries", () => {
    const root = tempRoot();
    bootstrapWiki(root);
    const log = readFileSync(join(root, LOG_FILE), "utf8");
    expect(log).not.toContain("\n## ");
    expect(scalar(parseFrontmatter(log), "type")).toBe("log");
  });

  test("is idempotent and never overwrites an edited file", () => {
    const root = tempRoot();
    bootstrapWiki(root);
    writeFileSync(join(root, INDEX_FILE), "mine now\n");
    expect(bootstrapWiki(root)).toEqual([]);
    expect(readFileSync(join(root, INDEX_FILE), "utf8")).toBe("mine now\n");
  });

  test("re-seeds a file the user deleted", () => {
    const root = tempRoot();
    bootstrapWiki(root);
    rmSync(join(root, LOG_FILE));
    expect(bootstrapWiki(root)).toEqual([LOG_FILE]);
    expect(readFileSync(join(root, LOG_FILE), "utf8")).toBe(BOOTSTRAP_FILES[LOG_FILE] as string);
  });
});

describe("renderPage", () => {
  test.each([...PAGE_TYPES])("a rendered %s page lints clean", (type) => {
    const root = tempRoot();
    bootstrapWiki(root);
    const title = type === "daily" ? "2026-08-17" : "Oslo Trip";
    const page = renderPage(type, {
      title,
      summary: "Moving the team to Oslo in September.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
      lastUpdated: "2026-08-18",
    });
    writePage(root, pagePath(type, title), page);
    // Link it from the index so the page is not an orphan, and pretend the
    // cited capture is still on disk.
    writeFileSync(
      join(root, INDEX_FILE),
      `${BOOTSTRAP_FILES[INDEX_FILE]}\n- [[${title}]]\n`,
    );
    const tree = loadWikiTree(root);
    tree.sources = new Set(["sources/2026-08-17/1400-mail.md"]);
    const report = lintWiki(tree);
    expect(report.issues).toEqual([]);
  });

  test("quotes values in the frontmatter but not in the heading", () => {
    const page = renderPage("topic", {
      title: "Swift: strict concurrency",
      summary: "Notes on Swift 6.",
      sources: [],
      lastUpdated: "2026-08-18",
    });
    expect(page).toContain('title: "Swift: strict concurrency"');
    expect(page).toContain("# Swift: strict concurrency");
    expect(scalar(parseFrontmatter(page), "title")).toBe("Swift: strict concurrency");
  });

  test("defaults last_updated to today", () => {
    const page = renderPage("topic", { title: "X", summary: "y", sources: [] });
    expect(scalar(parseFrontmatter(page), "last_updated")).toBe(
      new Date().toISOString().slice(0, 10),
    );
  });

  test("a daily page takes its date from the title, or is refused", () => {
    expect(renderPage("daily", { title: "2026-08-17", summary: "s", sources: [] })).toContain(
      "date: 2026-08-17",
    );
    expect(() => renderPage("daily", { title: "Monday", summary: "s", sources: [] })).toThrow(
      "YYYY-MM-DD",
    );
  });

  test("every template placeholder is filled", () => {
    for (const type of PAGE_TYPES) {
      expect(PAGE_TEMPLATES[type]).toContain("{{title}}");
      const page = renderPage(type, {
        title: type === "daily" ? "2026-08-17" : "T",
        summary: "s",
        sources: [],
      });
      expect(page).not.toContain("{{");
    }
  });
});

describe("slugify and pagePath", () => {
  test.each([
    ["Ingrid Berg", "ingrid-berg"],
    ["Oslo Trip 2026", "oslo-trip-2026"],
    ["Åsa Öberg", "asa-oberg"],
    ["  spaces  ", "spaces"],
    ["C++ / Rust", "c-rust"],
    ["...", "page"],
  ])("%j slugifies to %j", (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });

  test("daily logs are the one nested type", () => {
    expect(pagePath("person", "Ingrid Berg")).toBe("wiki/ingrid-berg.md");
    expect(pagePath("daily", "2026-08-17")).toBe("wiki/daily/2026-08-17.md");
  });
});

describe("wikiLinks", () => {
  test("finds targets and aliases with their line numbers", () => {
    const links = wikiLinks("see [[Oslo Trip]]\nand [[Ingrid Berg|Ingrid]] too");
    expect(links).toEqual([
      { target: "Oslo Trip", line: 1 },
      { target: "Ingrid Berg", line: 2 },
    ]);
  });

  test("ignores links inside fenced code", () => {
    const text = ["real [[A]]", "```markdown", "example [[B]]", "```", "real [[C]]"].join("\n");
    expect(wikiLinks(text).map((link) => link.target)).toEqual(["A", "C"]);
  });
});

describe("loadWikiTree", () => {
  test("reads the root pages, wiki/ recursively, and the source file names", () => {
    const root = tempRoot();
    bootstrapWiki(root);
    writePage(root, "wiki/oslo-trip.md", "page\n");
    writePage(root, "wiki/daily/2026-08-17.md", "day\n");
    writePage(root, "wiki/notes.txt", "ignored\n");
    writePage(root, "sources/2026-08-17/1400-mail.md", "capture\n");
    const tree = loadWikiTree(root);
    expect(Object.keys(tree.files).sort()).toEqual([
      "SCHEMA.md",
      "index.md",
      "log.md",
      "wiki/daily/2026-08-17.md",
      "wiki/oslo-trip.md",
    ]);
    expect([...(tree.sources ?? [])]).toEqual(["sources/2026-08-17/1400-mail.md"]);
  });

  test("an empty directory reads as an empty tree", () => {
    const tree = loadWikiTree(tempRoot());
    expect(tree.files).toEqual({});
    expect(tree.sources?.size).toBe(0);
  });
});
