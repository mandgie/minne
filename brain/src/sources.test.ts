import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EmptyQueryError, searchSources, toMatchExpression } from "./sources";
import { BrainSession, hello, seedSnapshotIndex, type TestSnapshot } from "./test-support";

let dirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "minne-sources-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

const OSLO: TestSnapshot = {
  capturedAt: new Date("2026-08-17T09:15:00Z"),
  app: "Mail",
  title: "Oslo trip — hotel booking",
  url: "https://mail.example.com/thread/9",
  sourcePath: "sources/2026-08-17/0900-mail.md",
  section: 2,
  text: "Confirmed the hotel in Oslo for the September trip with Ingrid.",
};

const GARDENING: TestSnapshot = {
  capturedAt: new Date("2026-08-17T11:00:00Z"),
  app: "Safari",
  title: "When to plant tulips",
  sourcePath: "sources/2026-08-17/1100-safari.md",
  section: 1,
  text: "Tulip bulbs go in the ground in October, well before the first frost.",
};

function seeded(snapshots: TestSnapshot[] = [OSLO, GARDENING]): string {
  const dir = tempDir();
  seedSnapshotIndex(dir, snapshots);
  return dir;
}

describe("toMatchExpression", () => {
  test("quotes every term so FTS5 operators cannot be typed by accident", () => {
    expect(toMatchExpression("oslo trip")).toBe('"oslo" "trip"');
    expect(toMatchExpression("NOT oslo OR bergen")).toBe('"NOT" "oslo" "OR" "bergen"');
    expect(toMatchExpression('say "hello" -now')).toBe('"say" "hello" "now"');
    expect(toMatchExpression("what did I do?")).toBe('"what" "did" "I" "do"');
  });

  test("keeps a trailing star as a prefix search", () => {
    expect(toMatchExpression("book*")).toBe('"book"*');
  });

  test("handles non-ASCII terms", () => {
    expect(toMatchExpression("möte i Göteborg")).toBe('"möte" "i" "Göteborg"');
  });

  test("rejects a query with nothing to search for", () => {
    expect(() => toMatchExpression("?!  --")).toThrow(EmptyQueryError);
  });
});

describe("searchSources", () => {
  test("round-trips an indexed snapshot into a ranked hit", () => {
    const result = searchSources(seeded(), "oslo hotel");
    expect(result.available).toBe(true);
    expect(result.indexed).toBe(2);
    expect(result.results).toHaveLength(1);
    const hit = result.results[0]!;
    expect(hit.source).toBe("sources/2026-08-17/0900-mail.md#2");
    expect(hit.capturedAt).toBe("2026-08-17T09:15:00.000Z");
    expect(hit.app).toBe("Mail");
    expect(hit.title).toBe("Oslo trip — hotel booking");
    expect(hit.url).toBe("https://mail.example.com/thread/9");
    expect(hit.snippet).toContain("**Oslo**");
    expect(hit.score).toBeGreaterThan(0);
  });

  test("matches window titles, not just captured text", () => {
    const result = searchSources(seeded(), "booking");
    expect(result.results.map((hit) => hit.source)).toEqual([
      "sources/2026-08-17/0900-mail.md#2",
    ]);
  });

  test("terms are ANDed, so an unrelated word excludes the hit", () => {
    expect(searchSources(seeded(), "oslo tulips").results).toHaveLength(0);
    expect(searchSources(seeded(), "oslo").results).toHaveLength(1);
  });

  test("omits url when the capture had none", () => {
    const result = searchSources(seeded(), "tulip*");
    expect(result.results[0]).not.toHaveProperty("url");
  });

  test("an empty index is 'nothing captured yet', not an error", () => {
    const result = searchSources(tempDir(), "anything");
    expect(result).toEqual({ query: "anything", available: false, indexed: 0, results: [] });
  });

  test("ranks the better match first and honours the limit", () => {
    const many: TestSnapshot[] = [1, 2, 3].map((n) => ({
      capturedAt: new Date(`2026-08-1${n}T09:00:00Z`),
      title: `Note ${n}`,
      sourcePath: `sources/2026-08-1${n}/0900-safari.md`,
      section: 1,
      text:
        n === 2
          ? "oslo oslo oslo, the whole page is about Oslo"
          : `a passing mention of oslo among ${"other words ".repeat(30)}`,
    }));
    const result = searchSources(seeded(many), "oslo", 2);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]!.source).toBe("sources/2026-08-12/0900-safari.md#1");
    expect(result.results[0]!.score).toBeGreaterThan(result.results[1]!.score);
  });

  test("never writes to the database it reads", () => {
    const dir = seeded();
    const before = Bun.file(join(dir, "minne.db")).lastModified;
    searchSources(dir, "oslo");
    expect(Bun.file(join(dir, "minne.db")).lastModified).toBe(before);
  });
});

describe("search_sources over the protocol", () => {
  test("returns ranked snippets with source refs", async () => {
    const dir = seeded();
    const session = new BrainSession(dir);
    try {
      await hello(session);
      const events = await session.request({
        type: "search_sources",
        id: "q1",
        query: "oslo hotel",
        limit: 3,
      });
      expect(events).toHaveLength(1);
      const done = events[0]!;
      expect(done.type).toBe("done");
      if (done.type !== "done") return;
      expect(done.result).toMatchObject({
        query: "oslo hotel",
        available: true,
        indexed: 2,
        results: [{ source: "sources/2026-08-17/0900-mail.md#2", app: "Mail" }],
      });
    } finally {
      expect(await session.close()).toBe(0);
    }
  }, 15000);

  test("a query with no searchable terms is a typed error", async () => {
    const session = new BrainSession(seeded());
    try {
      await hello(session);
      const events = await session.request({ type: "search_sources", id: "q2", query: "???" });
      expect(events[0]).toMatchObject({ type: "error", id: "q2", code: "invalid_request" });
    } finally {
      await session.close();
    }
  }, 15000);
});
