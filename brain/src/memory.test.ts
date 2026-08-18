// The memory operations behind the agent's tools: what the LLM can read, what
// it can write, and everything it must not be able to do to the filesystem.
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseFrontmatter, scalar } from "./frontmatter";
import { Memory, NotFoundError, SchemaViolationError, updateIndex } from "./memory";
import { UnsafePathError } from "./memory-path";
import { EmptyQueryError } from "./sources";
import { seedSnapshotIndex } from "./test-support";
import { INDEX_FILE, LOG_FILE, bootstrapWiki, loadWikiTree } from "./wiki";
import { lintWiki } from "./wiki-lint";

const CLOCK = new Date("2026-08-18T09:15:07");

let dirs: string[] = [];

function tempDir(prefix = "minne-memory-"): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

/** A memory in a scratch root, with a frozen clock so dates are assertable. */
function makeMemory(options: { seeded?: boolean } = {}): Memory {
  const root = tempDir();
  if (options.seeded !== false) bootstrapWiki(root);
  return new Memory({ root, dataDir: root, now: () => CLOCK });
}

function read(memory: Memory, relative: string): string {
  return readFileSync(join(memory.root, relative), "utf8");
}

/** A capture the app would have written, in both the markdown and the index. */
function addSnapshot(
  memory: Memory,
  source: string,
  section: number,
  text: string,
  extra: { app?: string; title?: string } = {},
): void {
  const path = join(memory.root, source);
  mkdirSync(join(path, ".."), { recursive: true });
  const app = extra.app ?? "Mail";
  const header = `---\ntype: source\napp: "${app}"\n---\n`;
  let existing = "";
  try {
    existing = readFileSync(path, "utf8");
  } catch {
    existing = header;
  }
  writeFileSync(path, `${existing}\n## Snapshot ${section} — 14:0${section}:00\n\n${text}\n`);
  seedSnapshotIndex(memory.dataDir, [
    {
      capturedAt: new Date("2026-08-17T14:00:00Z"),
      app,
      title: extra.title ?? "Inbox",
      sourcePath: source,
      section,
      text,
    },
  ]);
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("write_page", () => {
  test("creates a page from its template, with an index entry and today's date", () => {
    const memory = makeMemory();
    const result = memory.writePage({
      type: "project",
      title: "Oslo Trip",
      summary: "Moving the team to Oslo in September.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
    });

    expect(result).toMatchObject({
      path: "wiki/oslo-trip.md",
      created: true,
      lastUpdated: "2026-08-18",
      indexEntry: "added",
    });
    const page = parseFrontmatter(read(memory, "wiki/oslo-trip.md"));
    expect(page.fields).toMatchObject({
      title: "Oslo Trip",
      type: "project",
      summary: "Moving the team to Oslo in September.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
      last_updated: "2026-08-18",
      // The project template's own field survives being written through.
      status: "active",
    });
    expect(page.body).toContain("## Decisions");
    expect(read(memory, INDEX_FILE)).toContain(
      "- [[Oslo Trip]] — Moving the team to Oslo in September.",
    );
  });

  test("the written tree lints clean", () => {
    const memory = makeMemory();
    addSnapshot(memory, "sources/2026-08-17/1400-mail.md", 3, "Oslo in September");
    memory.writePage({
      type: "project",
      title: "Oslo Trip",
      summary: "Moving the team to Oslo.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
      body: "# Oslo Trip\n\nSeptember, per `sources/2026-08-17/1400-mail.md#3`.",
    });
    expect(lintWiki(loadWikiTree(memory.root)).issues).toEqual([]);
  });

  test("last_updated comes from the clock, never from the model", () => {
    const memory = makeMemory();
    memory.writePage({
      type: "topic",
      title: "Swift concurrency",
      summary: "Notes.",
      // A body that tries to smuggle its own frontmatter is just body text.
      body: "---\nlast_updated: 1999-01-01\n---\n\n# Swift concurrency\n\nNotes.",
    });
    const page = read(memory, "wiki/swift-concurrency.md");
    expect(scalar(parseFrontmatter(page), "last_updated")).toBe("2026-08-18");
  });

  test("an update keeps the body and citations it is not given", () => {
    const memory = makeMemory();
    memory.writePage({
      type: "person",
      title: "Ingrid Berg",
      summary: "Colleague.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
      body: "# Ingrid Berg\n\nRuns the Oslo migration.",
    });
    const result = memory.writePage({
      type: "person",
      title: "Ingrid Berg",
      summary: "Colleague; runs the Oslo migration.",
    });

    expect(result).toMatchObject({ created: false, indexEntry: "updated" });
    const page = parseFrontmatter(read(memory, "wiki/ingrid-berg.md"));
    expect(page.fields["sources"]).toEqual(["sources/2026-08-17/1400-mail.md#3"]);
    expect(page.body).toContain("Runs the Oslo migration.");
    expect(read(memory, INDEX_FILE)).toContain(
      "- [[Ingrid Berg]] — Colleague; runs the Oslo migration.",
    );
    expect(read(memory, INDEX_FILE)).not.toContain("— Colleague.");
  });

  test("a daily page nests under wiki/daily and carries its date", () => {
    const memory = makeMemory();
    const result = memory.writePage({
      type: "daily",
      title: "2026-08-17",
      summary: "Planned the Oslo trip.",
    });
    expect(result.path).toBe("wiki/daily/2026-08-17.md");
    expect(scalar(parseFrontmatter(read(memory, result.path)), "date")).toBe("2026-08-17");
    expect(read(memory, INDEX_FILE)).toContain("## Daily logs\n\n- [[2026-08-17]]");
  });

  test("a daily page with no usable date is refused", () => {
    const memory = makeMemory();
    expect(() =>
      memory.writePage({ type: "daily", title: "Monday", summary: "..." }),
    ).toThrow(SchemaViolationError);
  });

  test("a renamed page moves its index entry instead of doubling it", () => {
    const memory = makeMemory();
    memory.writePage({ type: "topic", title: "Swift", summary: "Notes." });
    const result = memory.writePage({
      type: "topic",
      title: "Swift concurrency",
      summary: "Notes.",
      path: "wiki/swift.md",
    });
    const index = read(memory, INDEX_FILE);
    expect(result.indexEntry).toBe("updated");
    expect(index).toContain("- [[Swift concurrency]] — Notes.");
    expect(index).not.toContain("- [[Swift]] —");
  });

  test("a page that changed type moves to the other section", () => {
    const memory = makeMemory();
    memory.writePage({ type: "topic", title: "Oslo", summary: "A city." });
    memory.writePage({
      type: "project",
      title: "Oslo",
      summary: "A move.",
      path: "wiki/oslo.md",
    });
    const index = read(memory, INDEX_FILE);
    expect(index.indexOf("[[Oslo]]")).toBeGreaterThan(index.indexOf("## Projects"));
    expect(index.indexOf("[[Oslo]]")).toBeLessThan(index.indexOf("## Topics"));
    expect(index.match(/\[\[Oslo\]\]/g)).toHaveLength(1);
  });

  test("index.md, log.md, SCHEMA.md and sources/ are not writable", () => {
    const memory = makeMemory();
    for (const path of [INDEX_FILE, LOG_FILE, "SCHEMA.md", "sources/2026-08-17/1400-mail.md"]) {
      expect(() =>
        memory.writePage({ type: "topic", title: "X", summary: "y", path }),
      ).toThrow(SchemaViolationError);
    }
    expect(read(memory, INDEX_FILE)).toContain("_(none yet)_");
  });

  test.each([
    ["../escape.md", UnsafePathError],
    ["/etc/passwd", UnsafePathError],
    ["wiki/../../escape.md", UnsafePathError],
  ])("a %s path is refused before anything is written", (path, error) => {
    const memory = makeMemory();
    expect(() => memory.writePage({ type: "topic", title: "X", summary: "y", path })).toThrow(
      error as never,
    );
  });

  test("a symlink out of the wiki is refused even though it is under wiki/", () => {
    const memory = makeMemory();
    const outside = tempDir("minne-outside-");
    symlinkSync(outside, join(memory.root, "wiki", "elsewhere"));
    expect(() =>
      memory.writePage({
        type: "topic",
        title: "X",
        summary: "y",
        path: "wiki/elsewhere/leak.md",
      }),
    ).toThrow(UnsafePathError);
  });

  test("a dangling [[link]] is an error and nothing is written", () => {
    const memory = makeMemory();
    expect(() =>
      memory.writePage({
        type: "topic",
        title: "Oslo",
        summary: "A city.",
        body: "# Oslo\n\nSee [[Ingrid Berg]], who does not exist yet.",
      }),
    ).toThrow(/broken_link/);
    expect(loadWikiTree(memory.root).files["wiki/oslo.md"]).toBeUndefined();
    expect(read(memory, INDEX_FILE)).not.toContain("[[Oslo]]");
  });

  test("a link resolves once the page it points at exists", () => {
    const memory = makeMemory();
    memory.writePage({ type: "person", title: "Ingrid Berg", summary: "Colleague." });
    const result = memory.writePage({
      type: "topic",
      title: "Oslo",
      summary: "A city.",
      body: "# Oslo\n\nWhere [[Ingrid Berg]] works.",
    });
    expect(result.created).toBe(true);
  });

  test("a citation that is not a citation is an error", () => {
    const memory = makeMemory();
    expect(() =>
      memory.writePage({
        type: "topic",
        title: "Oslo",
        summary: "A city.",
        sources: ["I read it somewhere"],
      }),
    ).toThrow(/citation_invalid/);
  });

  test("drift comes back as warnings, and the write still happens", () => {
    const memory = makeMemory();
    const result = memory.writePage({ type: "topic", title: "Oslo", summary: "A city." });
    expect(result.warnings.join("\n")).toContain("no_sources");
    expect(read(memory, "wiki/oslo.md")).toContain("title: Oslo");

    const cited = memory.writePage({
      type: "topic",
      title: "Bergen",
      summary: "Another city.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
    });
    expect(cited.warnings.join("\n")).toContain("citation_missing");
  });

  test("a wiki the user already broke elsewhere does not block a write", () => {
    const memory = makeMemory();
    writeFileSync(join(memory.root, "wiki", "broken.md"), "no frontmatter here\n");
    const result = memory.writePage({ type: "topic", title: "Oslo", summary: "A city." });
    expect(result.created).toBe(true);
    // The pre-existing error is still there — it is simply not ours to answer for.
    expect(lintWiki(loadWikiTree(memory.root)).errors.map((issue) => issue.path)).toEqual([
      "wiki/broken.md",
    ]);
  });

  test("creates the memory root when it does not exist yet", () => {
    const memory = makeMemory({ seeded: false });
    rmSync(memory.root, { recursive: true, force: true });
    memory.writePage({ type: "topic", title: "Oslo", summary: "A city." });
    expect(read(memory, INDEX_FILE)).toContain("[[Oslo]]");
    expect(read(memory, "SCHEMA.md")).toContain("Three layers");
  });

  test("an empty title or summary is refused", () => {
    const memory = makeMemory();
    expect(() => memory.writePage({ type: "topic", title: " ", summary: "y" })).toThrow(
      SchemaViolationError,
    );
    expect(() => memory.writePage({ type: "topic", title: "X", summary: "\n" })).toThrow(
      SchemaViolationError,
    );
  });

  test("a multi-line summary is collapsed so the frontmatter stays flat", () => {
    const memory = makeMemory();
    memory.writePage({ type: "topic", title: "Oslo", summary: "A city.\nIn Norway." });
    expect(scalar(parseFrontmatter(read(memory, "wiki/oslo.md")), "summary")).toBe(
      "A city. In Norway.",
    );
  });
});

describe("append_log", () => {
  test("appends an entry the linter accepts and keeps what was there", () => {
    const memory = makeMemory();
    memory.writePage({ type: "topic", title: "Oslo", summary: "A city." });
    const first = memory.appendLog("chat", "Wrote [[Oslo]] from what the user said.");
    const second = memory.appendLog("sync", "Nothing new.");

    const log = read(memory, LOG_FILE);
    expect(first.timestamp.startsWith("2026-08-18T09:15:07")).toBe(true);
    expect(second.pass).toBe("sync");
    expect(log).toContain(`## ${first.timestamp} — chat\n\nWrote [[Oslo]] from what the user said.`);
    expect(log).toContain(`## ${second.timestamp} — sync\n\nNothing new.`);
    expect(log).toContain("Append-only.");
    expect(log.indexOf("— chat")).toBeLessThan(log.indexOf("— sync"));
    expect(lintWiki(loadWikiTree(memory.root)).errors).toEqual([]);
  });

  test("a dangling [[link]] in an entry is refused and the log is untouched", () => {
    const memory = makeMemory();
    const before = read(memory, LOG_FILE);
    expect(() => memory.appendLog("chat", "Wrote [[Nothing At All]].")).toThrow(/broken_link/);
    expect(read(memory, LOG_FILE)).toBe(before);
  });

  test("an empty entry is refused", () => {
    const memory = makeMemory();
    expect(() => memory.appendLog("chat", "   ")).toThrow(SchemaViolationError);
  });
});

describe("read_page", () => {
  test("reads a wiki page with its frontmatter", () => {
    const memory = makeMemory();
    memory.writePage({ type: "topic", title: "Oslo", summary: "A city." });
    const page = memory.read("wiki/oslo.md");
    expect(page).toMatchObject({ path: "wiki/oslo.md", kind: "wiki", truncated: false });
    expect(page.frontmatter).toMatchObject({ title: "Oslo", type: "topic" });
    expect(page.text).toContain("# Oslo");
  });

  test.each([
    [INDEX_FILE, "index"],
    [LOG_FILE, "log"],
    ["SCHEMA.md", "schema"],
  ] as const)("reads %s as kind %s", (path, kind) => {
    const memory = makeMemory();
    expect(memory.read(path).kind).toBe(kind);
  });

  test("a citation reads back the one snapshot it names", () => {
    const memory = makeMemory();
    addSnapshot(memory, "sources/2026-08-17/1400-mail.md", 1, "first capture");
    addSnapshot(memory, "sources/2026-08-17/1400-mail.md", 2, "second capture");
    const page = memory.read("sources/2026-08-17/1400-mail.md#2");
    expect(page).toMatchObject({ kind: "source", section: 2 });
    expect(page.text).toContain("second capture");
    expect(page.text).not.toContain("first capture");
    expect(memory.read("sources/2026-08-17/1400-mail.md").text).toContain("first capture");
  });

  test("a citation to a snapshot that is not there says which are", () => {
    const memory = makeMemory();
    addSnapshot(memory, "sources/2026-08-17/1400-mail.md", 1, "only one");
    expect(() => memory.read("sources/2026-08-17/1400-mail.md#7")).toThrow(NotFoundError);
    expect(() => memory.read("sources/2026-08-17/1400-mail.md#7")).toThrow("it has 1");
  });

  test("a missing page points at the tools that would have found it", () => {
    const memory = makeMemory();
    expect(() => memory.read("wiki/nothing.md")).toThrow(NotFoundError);
    expect(() => memory.read("wiki/nothing.md")).toThrow("list_index");
  });

  test("a directory is not a page", () => {
    const memory = makeMemory();
    expect(() => memory.read("wiki")).toThrow(NotFoundError);
  });

  test.each(["../../etc/passwd", "/etc/passwd", "wiki/../../escape.md", "~/.ssh/id_rsa"])(
    "refuses to read %s",
    (path) => {
      const memory = makeMemory();
      expect(() => memory.read(path)).toThrow(UnsafePathError);
    },
  );

  test("refuses to read through a symlink out of the memory", () => {
    const memory = makeMemory();
    const outside = tempDir("minne-outside-");
    writeFileSync(join(outside, "secrets.md"), "not yours\n");
    symlinkSync(join(outside, "secrets.md"), join(memory.root, "wiki", "leak.md"));
    expect(() => memory.read("wiki/leak.md")).toThrow(UnsafePathError);
  });

  test("truncates a page that is too large to hand a model", () => {
    const memory = makeMemory();
    writeFileSync(join(memory.root, "wiki", "huge.md"), "x".repeat(5000));
    const page = memory.read("wiki/huge.md", { maxChars: 100 });
    expect(page.truncated).toBe(true);
    expect(page.text).toContain("truncated at 100 characters");
  });
});

describe("list_index", () => {
  test("lists every page with what the agent needs to decide about it", () => {
    const memory = makeMemory();
    memory.writePage({
      type: "person",
      title: "Ingrid Berg",
      summary: "Colleague.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
    });
    memory.writePage({ type: "topic", title: "Oslo", summary: "A city." });

    const listing = memory.listIndex();
    expect(listing.counts).toEqual({ person: 1, topic: 1 });
    expect(listing.pages).toEqual([
      {
        path: "wiki/ingrid-berg.md",
        title: "Ingrid Berg",
        type: "person",
        summary: "Colleague.",
        lastUpdated: "2026-08-18",
        sources: 1,
      },
      {
        path: "wiki/oslo.md",
        title: "Oslo",
        type: "topic",
        summary: "A city.",
        lastUpdated: "2026-08-18",
        sources: 0,
      },
    ]);
    expect(listing.index).toContain("# Index");
  });

  test("an empty memory lists nothing rather than failing", () => {
    const memory = makeMemory({ seeded: false });
    expect(memory.listIndex()).toEqual({ index: null, pages: [], counts: {} });
  });
});

describe("recentPages", () => {
  /** A page written straight to disk, so `last_updated` can differ per page. */
  function plantPage(memory: Memory, slug: string, title: string, lastUpdated: string | null) {
    writeFileSync(
      join(memory.root, "wiki", `${slug}.md`),
      [
        "---",
        "type: topic",
        `title: ${title}`,
        "summary: A page.",
        ...(lastUpdated === null ? [] : [`last_updated: ${lastUpdated}`]),
        "sources: []",
        "---",
        "",
        "Body.",
        "",
      ].join("\n"),
    );
  }

  test("newest first, undated pages last, only path/title/lastUpdated", () => {
    const memory = makeMemory();
    plantPage(memory, "older", "Older", "2026-08-10");
    plantPage(memory, "newest", "Newest", "2026-08-17");
    plantPage(memory, "undated", "Undated", null);
    expect(memory.recentPages()).toEqual([
      { path: "wiki/newest.md", title: "Newest", lastUpdated: "2026-08-17" },
      { path: "wiki/older.md", title: "Older", lastUpdated: "2026-08-10" },
      { path: "wiki/undated.md", title: "Undated", lastUpdated: null },
    ]);
  });

  test("caps at eight, ties broken by path", () => {
    const memory = makeMemory();
    for (let i = 0; i < 10; i++) {
      plantPage(memory, `page-${String(i).padStart(2, "0")}`, `Page ${i}`, "2026-08-17");
    }
    const recent = memory.recentPages();
    expect(recent).toHaveLength(8);
    expect(recent.map((page) => page.path)).toEqual(
      [...Array(8).keys()].map((i) => `wiki/page-0${i}.md`),
    );
  });

  test("an empty memory answers an empty list", () => {
    const memory = makeMemory({ seeded: false });
    expect(memory.recentPages()).toEqual([]);
  });
});

describe("search_memory", () => {
  test("finds wiki pages, ranked, with the title weighing most", () => {
    const memory = makeMemory();
    memory.writePage({ type: "project", title: "Oslo Trip", summary: "Moving in September." });
    memory.writePage({
      type: "person",
      title: "Ingrid Berg",
      summary: "Colleague.",
      body: "# Ingrid Berg\n\nShe is organising the move to Oslo.",
    });
    memory.writePage({ type: "topic", title: "Swift", summary: "Notes on Swift 6." });

    const result = memory.search("oslo");
    expect(result.results.map((hit) => hit.kind)).toEqual(["wiki", "wiki"]);
    expect(result.results.map((hit) => (hit.kind === "wiki" ? hit.path : hit.source))).toEqual([
      "wiki/oslo-trip.md",
      "wiki/ingrid-berg.md",
    ]);
    expect(result.scannedPages).toBe(3);
    const first = result.results[0];
    if (first?.kind !== "wiki") throw new Error("unreachable");
    expect(first.title).toBe("Oslo Trip");
    expect(first.snippet).toContain("**Oslo**");
  });

  test("terms are ANDed and a trailing * is a prefix", () => {
    const memory = makeMemory();
    memory.writePage({
      type: "project",
      title: "Oslo Trip",
      summary: "Moving the team in September.",
    });
    expect(memory.search("oslo trip").results).toHaveLength(1);
    expect(memory.search("oslo bergen").results).toHaveLength(0);
    expect(memory.search("os*").results).toHaveLength(1);
    // Whole words only: "os" is not a word of "Oslo".
    expect(memory.search("os").results).toHaveLength(0);
  });

  test("index.md, log.md and SCHEMA.md are not searchable pages", () => {
    const memory = makeMemory();
    // "memory" appears in all three bootstrap files and in no wiki page.
    const result = memory.search("memory");
    expect(result.results).toEqual([]);
    expect(result.scannedPages).toBe(0);
  });

  test("finds captures through the FTS index, labelled as sources", () => {
    const memory = makeMemory();
    addSnapshot(memory, "sources/2026-08-17/1400-mail.md", 3, "Flights to Oslo are booked");
    const result = memory.search("oslo");
    expect(result.sourcesAvailable).toBe(true);
    expect(result.indexedSnapshots).toBe(1);
    const hit = result.results.find((h) => h.kind === "source");
    expect(hit).toMatchObject({
      kind: "source",
      source: "sources/2026-08-17/1400-mail.md#3",
      app: "Mail",
    });
  });

  test("both layers come back from one query, wiki first", () => {
    const memory = makeMemory();
    addSnapshot(memory, "sources/2026-08-17/1400-mail.md", 3, "Flights to Oslo are booked");
    memory.writePage({
      type: "project",
      title: "Oslo Trip",
      summary: "Moving in September.",
      sources: ["sources/2026-08-17/1400-mail.md#3"],
    });
    expect(memory.search("oslo").results.map((hit) => hit.kind)).toEqual(["wiki", "source"]);
    expect(memory.search("oslo", { scope: "wiki" }).results.map((h) => h.kind)).toEqual(["wiki"]);
    expect(memory.search("oslo", { scope: "sources" }).results.map((h) => h.kind)).toEqual([
      "source",
    ]);
  });

  test("nothing captured yet is not an error", () => {
    const memory = makeMemory();
    const result = memory.search("oslo");
    expect(result.sourcesAvailable).toBe(false);
    expect(result.results).toEqual([]);
  });

  test("a query with no searchable words is refused", () => {
    const memory = makeMemory();
    expect(() => memory.search("  -- ")).toThrow(EmptyQueryError);
  });

  test("limit caps each layer", () => {
    const memory = makeMemory();
    for (const n of [1, 2, 3]) {
      memory.writePage({ type: "topic", title: `Oslo ${n}`, summary: "A city." });
    }
    expect(memory.search("oslo", { limit: 2 }).results).toHaveLength(2);
  });
});

describe("updateIndex", () => {
  test("creates the section when the index has none", () => {
    const { text, entry } = updateIndex("# Index\n", {
      type: "person",
      title: "Ingrid Berg",
      summary: "Colleague.",
      previousTitle: null,
      lastUpdated: "2026-08-18",
    });
    expect(entry).toBe("added");
    expect(text).toContain("## People\n\n- [[Ingrid Berg]] — Colleague.");
  });

  test("an identical entry is left alone", () => {
    const index = "# Index\n\n## Topics\n\n- [[Oslo]] — A city.\n";
    const { text, entry } = updateIndex(index, {
      type: "topic",
      title: "Oslo",
      summary: "A city.",
      previousTitle: null,
      lastUpdated: "2026-08-18",
    });
    expect(entry).toBe("unchanged");
    expect(text).toBe(index);
  });

  test("a new entry joins the ones already in its section", () => {
    const index = "# Index\n\n## Topics\n\n- [[Bergen]] — A city.\n\n## Daily logs\n\n_(none yet)_\n";
    const { text } = updateIndex(index, {
      type: "topic",
      title: "Oslo",
      summary: "Another city.",
      previousTitle: null,
      lastUpdated: "2026-08-18",
    });
    expect(text).toContain("- [[Bergen]] — A city.\n- [[Oslo]] — Another city.\n\n## Daily logs");
  });
});
