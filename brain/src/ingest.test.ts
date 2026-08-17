// The ingestion job, end to end against the deterministic mock provider
// (mock-provider.ts): no network, no live LLM calls. The mock is scripted with
// `TOOL:` lines — in the seeded capture text for a sync pass, so the assertion
// is that the batch prompt really carried the snapshot; in MINNE_MOCK_SCRIPT
// for a lint pass, whose prompt is generated from the lint report.
//
// The two properties under test are the story's: the watermark makes a pass
// incremental, and a pass with nothing new past it is a no-op that never
// reaches a model — proven by the mock's own call counter, not by what happened
// to land on disk.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createModels } from "@earendil-works/pi-ai";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { FileCredentialStore } from "./credentials";
import { SyncBusyError, SyncEngine, renderBatch, type ModelResolution } from "./ingest";
import { Memory } from "./memory";
import { mockProvider, mockStreamCalls, resetMockStreamCalls, MOCK_LOGIN_CODE } from "./mock-provider";
import type { BrainEvent } from "./protocol";
import { readSnapshotsAfter, snapshotBacklog } from "./sources";
import { loadSyncState, saveSyncState, syncStatePath } from "./sync-state";
import { BrainSession, hello, seedSnapshotIndex, type TestSnapshot } from "./test-support";
import { bootstrapWiki, loadWikiTree } from "./wiki";
import { lintWiki } from "./wiki-lint";

let dirs: string[] = [];
let sessions: BrainSession[] = [];

beforeEach(() => {
  resetMockStreamCalls();
  delete process.env["MINNE_MOCK_SCRIPT"];
});

afterEach(async () => {
  for (const session of sessions) await session.close().catch(() => undefined);
  sessions = [];
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
  delete process.env["MINNE_MOCK_SCRIPT"];
});

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "minne-ingest-"));
  dirs.push(dir);
  return dir;
}

/** A snapshot as the app would have captured and indexed it. */
function snapshot(id: number, text: string, extra: Partial<TestSnapshot> = {}): TestSnapshot {
  return {
    capturedAt: new Date(`2026-08-17T1${id}:00:00Z`),
    app: "Mail",
    title: "Oslo trip",
    sourcePath: "sources/2026-08-17/1400-mail.md",
    section: id,
    text,
    ...extra,
  };
}

/**
 * Writes the markdown the app would have written alongside the index, so the
 * citations the pass produces point at files that are actually there.
 */
function seedSourceFiles(memoryRoot: string, snapshots: TestSnapshot[]): void {
  const byFile = new Map<string, TestSnapshot[]>();
  for (const snap of snapshots) {
    byFile.set(snap.sourcePath, [...(byFile.get(snap.sourcePath) ?? []), snap]);
  }
  for (const [relative, group] of byFile) {
    const path = join(memoryRoot, relative);
    mkdirSync(dirname(path), { recursive: true });
    const head = `---\ntype: source\napp: "${group[0]?.app ?? "Mail"}"\n---\n`;
    const body = group
      .map((snap) => `\n## Snapshot ${snap.section}\n\n\`\`\`text\n${snap.text}\n\`\`\`\n`)
      .join("");
    writeFileSync(path, head + body);
  }
}

interface Harness {
  dir: string;
  memoryRoot: string;
  engine: SyncEngine;
  memory: Memory;
}

/**
 * An engine wired to the mock provider through the real pi Models collection
 * and the real credential store — the same path chat takes to a model, with a
 * credential written straight to auth.json instead of a scripted login.
 */
function makeEngine(
  options: {
    settings?: ConstructorParameters<typeof SyncEngine>[0]["settings"];
    resolveModel?: () => Promise<ModelResolution>;
    snapshots?: TestSnapshot[];
  } = {},
): Harness {
  const dir = scratch();
  const memoryRoot = join(dir, "memory");
  if (options.snapshots !== undefined) {
    seedSnapshotIndex(dir, options.snapshots);
    seedSourceFiles(memoryRoot, options.snapshots);
  }
  writeFileSync(
    join(dir, "auth.json"),
    JSON.stringify({
      mock: { type: "oauth", refresh: "mock-refresh", access: "mock-access", expires: Date.now() + 3_600_000 },
    }),
  );
  const models = createModels({ credentials: new FileCredentialStore(join(dir, "auth.json")) });
  models.setProvider(mockProvider());
  const memory = new Memory({ root: memoryRoot, dataDir: dir });
  const engine = new SyncEngine({
    memory,
    dataDir: dir,
    log: () => {},
    resolveModel:
      options.resolveModel ??
      (async () => {
        const model = models.getModel("mock", "mock-model");
        return model === undefined ? { unavailable: "no mock model" } : { model };
      }),
    streamFn: models.streamSimple.bind(models),
    settings: { intervalMs: 0, lintIntervalMs: 0, ...options.settings },
  });
  return { dir, memoryRoot, engine, memory };
}

/** A scripted digestion of one capture: write the page, then log the pass. */
function digestScript(title: string, citation: string): string {
  return [
    `TOOL: write_page {"type":"project","title":"${title}","summary":"Moving the team to Oslo in September.",` +
      `"sources":["${citation}"],"body":"# ${title}\\n\\nFlights are booked \`${citation}\`."}`,
    `TOOL: append_log {"pass":"sync","message":"Read one capture. Updated [[${title}]]."}`,
  ].join("\n");
}

describe("sync state", () => {
  test("a missing or corrupt file reads as an empty watermark", () => {
    const dir = scratch();
    expect(loadSyncState(join(dir, "nothing.json"))).toEqual({
      watermark: 0,
      lastSync: null,
      lastLint: null,
    });
    writeFileSync(join(dir, "corrupt.json"), "{not json");
    expect(loadSyncState(join(dir, "corrupt.json")).watermark).toBe(0);
    writeFileSync(join(dir, "negative.json"), JSON.stringify({ watermark: -3 }));
    expect(loadSyncState(join(dir, "negative.json")).watermark).toBe(0);
  });

  test("round-trips the watermark and the last pass summaries", () => {
    const path = syncStatePath(scratch());
    saveSyncState(path, {
      watermark: 42,
      lastSync: {
        at: "2026-08-17T14:00:00+02:00",
        status: "ingested",
        snapshots: 3,
        batches: 1,
        pagesTouched: ["wiki/oslo-trip.md"],
        remaining: 0,
      },
      lastLint: null,
    });
    const state = loadSyncState(path);
    expect(state.watermark).toBe(42);
    expect(state.lastSync?.pagesTouched).toEqual(["wiki/oslo-trip.md"]);
    expect(state.lastLint).toBeNull();
  });
});

describe("unprocessed snapshots", () => {
  test("only what is past the watermark, oldest first", () => {
    const dir = scratch();
    seedSnapshotIndex(dir, [1, 2, 3].map((n) => snapshot(n, `capture ${n}`)));

    expect(snapshotBacklog(dir, 0)).toMatchObject({ available: true, maxId: 3, pending: 3 });
    expect(snapshotBacklog(dir, 2)).toMatchObject({ maxId: 3, pending: 1 });
    expect(snapshotBacklog(dir, 9)).toMatchObject({ maxId: 3, pending: 0 });

    const rows = readSnapshotsAfter(dir, 1, 10);
    expect(rows.map((row) => row.id)).toEqual([2, 3]);
    expect(rows[0]).toMatchObject({
      citation: "sources/2026-08-17/1400-mail.md#2",
      app: "Mail",
      text: "capture 2",
    });
    expect(readSnapshotsAfter(dir, 0, 2).map((row) => row.id)).toEqual([1, 2]);
  });

  test("an index that does not exist yet is empty, not an error", () => {
    const dir = scratch();
    expect(snapshotBacklog(dir, 0)).toEqual({ available: false, maxId: 0, pending: 0 });
    expect(readSnapshotsAfter(dir, 0, 10)).toEqual([]);
  });

  test("each capture is truncated to the character budget", () => {
    const dir = scratch();
    seedSnapshotIndex(dir, [snapshot(1, "x".repeat(5_000))]);
    const row = readSnapshotsAfter(dir, 0, 10, 200)[0];
    expect(row?.text.length).toBeLessThan(300);
    expect(row?.text).toContain("truncated at 200 characters");
  });

  test("the batch prompt carries every citation and its text", () => {
    const dir = scratch();
    seedSnapshotIndex(dir, [snapshot(1, "flights booked"), snapshot(2, "hotel booked")]);
    const prompt = renderBatch(readSnapshotsAfter(dir, 0, 10));
    expect(prompt).toContain("2 new captures to digest");
    expect(prompt).toContain("--- sources/2026-08-17/1400-mail.md#1");
    expect(prompt).toContain("flights booked");
    expect(prompt).toContain("hotel booked");
  });
});

describe("ingestion pass", () => {
  test("digests new captures into a cited page, logs the pass, advances the watermark", async () => {
    const citation = "sources/2026-08-17/1400-mail.md#1";
    const { engine, memoryRoot, dir } = makeEngine({
      snapshots: [snapshot(1, `Booking the Oslo trip.\n${digestScript("Oslo Trip", citation)}`)],
    });

    const summary = await engine.runSync();
    expect(summary).toMatchObject({
      status: "ingested",
      snapshots: 1,
      batches: 1,
      pagesTouched: ["wiki/oslo-trip.md"],
      remaining: 0,
    });

    const page = readFileSync(join(memoryRoot, "wiki", "oslo-trip.md"), "utf8");
    expect(page).toContain("title: Oslo Trip");
    expect(page).toContain(`sources: [${citation}]`);
    expect(page).toContain(`\`${citation}\``);
    expect(readFileSync(join(memoryRoot, "index.md"), "utf8")).toContain("- [[Oslo Trip]] —");
    expect(readFileSync(join(memoryRoot, "log.md"), "utf8")).toContain("— sync");

    // The pass left a wiki that still satisfies its own schema.
    expect(lintWiki(loadWikiTree(memoryRoot)).errors).toEqual([]);
    expect(loadSyncState(syncStatePath(dir)).watermark).toBe(1);
  }, 15000);

  test("re-running ingests nothing and calls no model", async () => {
    const citation = "sources/2026-08-17/1400-mail.md#1";
    const { engine, dir, memoryRoot } = makeEngine({
      snapshots: [snapshot(1, `Booking the Oslo trip.\n${digestScript("Oslo Trip", citation)}`)],
    });

    await engine.runSync();
    const afterFirst = mockStreamCalls();
    expect(afterFirst).toBeGreaterThan(0);
    const logAfterFirst = readFileSync(join(memoryRoot, "log.md"), "utf8");

    const second = await engine.runSync();
    expect(second).toMatchObject({ status: "idle", snapshots: 0, batches: 0, pagesTouched: [] });
    // The whole point of the watermark: the second pass never reached a model.
    expect(mockStreamCalls()).toBe(afterFirst);
    expect(readFileSync(join(memoryRoot, "log.md"), "utf8")).toBe(logAfterFirst);
    expect(loadSyncState(syncStatePath(dir)).watermark).toBe(1);

    // And a third pass from a *fresh* engine, which reloads the watermark from
    // disk rather than remembering it — the restart case.
    const restarted = new SyncEngine({
      memory: new Memory({ root: memoryRoot, dataDir: dir }),
      dataDir: dir,
      log: () => {},
      resolveModel: async () => ({ unavailable: "should not be asked" }),
      streamFn: () => {
        throw new Error("a pass with nothing new must not stream");
      },
      settings: { intervalMs: 0, lintIntervalMs: 0 },
    });
    expect((await restarted.runSync()).status).toBe("idle");
    expect(mockStreamCalls()).toBe(afterFirst);
  }, 15000);

  test("batches the backlog and leaves the rest for the next pass", async () => {
    const citation = (n: number) => `sources/2026-08-17/1400-mail.md#${n}`;
    const snapshots = [1, 2, 3].map((n) =>
      snapshot(n, `Capture ${n}.\n${digestScript(`Trip ${n}`, citation(n))}`),
    );
    const { engine, dir } = makeEngine({
      snapshots,
      settings: { batchSize: 1, maxBatches: 2 },
    });

    const first = await engine.runSync();
    expect(first).toMatchObject({ status: "ingested", snapshots: 2, batches: 2, remaining: 1 });
    expect(first.pagesTouched).toEqual(["wiki/trip-1.md", "wiki/trip-2.md"]);
    expect(loadSyncState(syncStatePath(dir)).watermark).toBe(2);

    const second = await engine.runSync();
    expect(second).toMatchObject({ status: "ingested", snapshots: 1, remaining: 0 });
    expect(second.pagesTouched).toEqual(["wiki/trip-3.md"]);
    expect(loadSyncState(syncStatePath(dir)).watermark).toBe(3);
  }, 20000);

  test("skips gracefully, and without a model, when nothing is signed in", async () => {
    const { engine, dir } = makeEngine({
      snapshots: [snapshot(1, "something worth remembering")],
      resolveModel: async () => ({ unavailable: 'provider "anthropic" is not authenticated' }),
    });

    const summary = await engine.runSync();
    expect(summary).toMatchObject({ status: "skipped", snapshots: 0, remaining: 1 });
    expect(summary.reason).toContain("not authenticated");
    expect(mockStreamCalls()).toBe(0);
    // Nothing was consumed: the backlog is still there for a signed-in pass.
    expect(loadSyncState(syncStatePath(dir)).watermark).toBe(0);
    expect(engine.status()).toMatchObject({ state: "idle", pending: 1, watermark: 0 });
  });

  test("a second pass on top of a running one is refused, not queued", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { engine } = makeEngine({
      snapshots: [snapshot(1, "TOOL: list_index {}")],
      resolveModel: async () => {
        await gate;
        return { unavailable: "gated" };
      },
    });

    const first = engine.runSync();
    await Promise.resolve();
    expect(engine.status().state).toBe("running");
    await expect(engine.runSync()).rejects.toBeInstanceOf(SyncBusyError);
    release();
    expect((await first).status).toBe("skipped");
    expect(engine.status().state).toBe("idle");
  });

  test("a rebuilt index resets the watermark instead of ignoring everything", async () => {
    const { engine, dir } = makeEngine({ snapshots: [snapshot(1, "old capture")] });
    saveSyncState(syncStatePath(dir), { watermark: 900, lastSync: null, lastLint: null });
    const reloaded = new SyncEngine({
      memory: new Memory({ root: join(dir, "memory"), dataDir: dir }),
      dataDir: dir,
      log: () => {},
      resolveModel: async () => ({ unavailable: "not signed in" }),
      streamFn: () => {
        throw new Error("unused");
      },
      settings: { intervalMs: 0, lintIntervalMs: 0 },
    });

    expect((await reloaded.runSync()).status).toBe("skipped");
    expect(loadSyncState(syncStatePath(dir)).watermark).toBe(0);
    expect(reloaded.status().pending).toBe(1);
  });

  test("a provider failure keeps the watermark where it was", async () => {
    const citation = "sources/2026-08-17/1400-mail.md#1";
    const { engine, dir } = makeEngine({
      snapshots: [
        snapshot(1, `Capture one.\n${digestScript("Trip 1", citation)}`),
        snapshot(2, "Capture two.\nFAIL: rate limited"),
      ],
      settings: { batchSize: 1, maxBatches: 3 },
    });

    const summary = await engine.runSync();
    expect(summary.status).toBe("error");
    expect(summary.reason).toContain("rate limited");
    // The batch that succeeded is banked; the one that failed is not.
    expect(summary).toMatchObject({ snapshots: 1, batches: 1, pagesTouched: ["wiki/trip-1.md"] });
    expect(loadSyncState(syncStatePath(dir)).watermark).toBe(1);
    expect(engine.status()).toMatchObject({ pending: 1, lastSync: { status: "error" } });
  }, 15000);

  test("a scheduled tick with nothing captured runs and costs no model call", async () => {
    const { engine } = makeEngine({ settings: { intervalMs: 20 } });
    engine.startTimers();
    try {
      const deadline = Date.now() + 2_000;
      while (engine.status().lastSync === null && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      engine.stopTimers();
    }
    expect(engine.status().lastSync).toMatchObject({ status: "idle", snapshots: 0 });
    expect(mockStreamCalls()).toBe(0);
  });
});

describe("lint pass", () => {
  test("bootstraps a memory that has none and reports clean without a model", async () => {
    const { engine, memoryRoot } = makeEngine();
    const summary = await engine.runLint();
    expect(summary).toMatchObject({ status: "clean", after: { errors: 0 } });
    expect(mockStreamCalls()).toBe(0);
    expect(readFileSync(join(memoryRoot, "SCHEMA.md"), "utf8")).toContain("Three layers");
  });

  test("hands the report to the agent, which links an orphan back into the index", async () => {
    const { engine, memoryRoot } = makeEngine();
    bootstrapWiki(memoryRoot);
    writeFileSync(
      join(memoryRoot, "wiki", "ada-lovelace.md"),
      [
        "---",
        "title: Ada Lovelace",
        "type: person",
        "summary: Wrote the first program.",
        "sources: [sources/2026-08-17/1400-mail.md#1]",
        "last_updated: 2026-08-17",
        "---",
        "",
        "# Ada Lovelace",
        "",
        "Notes.",
      ].join("\n"),
    );
    const before = lintWiki(loadWikiTree(memoryRoot));
    expect(before.issues.map((issue) => issue.code)).toContain("orphan");

    // The lint prompt is built from the report, so the script rides in the env.
    process.env["MINNE_MOCK_SCRIPT"] = [
      'TOOL: write_page {"type":"person","title":"Ada Lovelace","summary":"Wrote the first program."}',
      'TOOL: append_log {"pass":"lint","message":"Linked [[Ada Lovelace]] back into the index."}',
    ].join("\n");

    const summary = await engine.runLint();
    expect(summary.status).toBe("fixed");
    expect(summary.pagesTouched).toEqual(["wiki/ada-lovelace.md"]);
    expect(summary.after.warnings).toBeLessThan(summary.before.warnings);
    expect(lintWiki(loadWikiTree(memoryRoot)).issues.map((issue) => issue.code)).not.toContain("orphan");
    expect(readFileSync(join(memoryRoot, "index.md"), "utf8")).toContain("- [[Ada Lovelace]] —");
    expect(readFileSync(join(memoryRoot, "log.md"), "utf8")).toContain("— lint");
  }, 15000);
});

describe("ingest over the protocol", () => {
  test("an on-demand pass digests, reports, and shows up in status", async () => {
    const dir = scratch();
    const memoryRoot = join(dir, "memory");
    const citation = "sources/2026-08-17/1400-mail.md#1";
    const snapshots = [snapshot(1, `Booking the Oslo trip.\n${digestScript("Oslo Trip", citation)}`)];
    seedSnapshotIndex(dir, snapshots);
    seedSourceFiles(memoryRoot, snapshots);

    const session = new BrainSession(dir, {
      ANTHROPIC_API_KEY: undefined,
      OPENAI_API_KEY: undefined,
      MINNE_MEMORY_ROOT: memoryRoot,
    });
    sessions.push(session);
    await hello(session);

    // Before signing in the pass skips rather than failing.
    const skipped = await session.request({ type: "ingest", id: "i0" });
    expect(skipped.at(-1)).toMatchObject({
      type: "done",
      id: "i0",
      result: { pass: "sync", status: "skipped" },
    });

    await signIn(session);

    const ingested = await session.request({ type: "ingest", id: "i1" });
    expect(ingested.at(-1)).toMatchObject({
      type: "done",
      id: "i1",
      result: { pass: "sync", status: "ingested", snapshots: 1, pagesTouched: ["wiki/oslo-trip.md"] },
    });
    expect(readFileSync(join(memoryRoot, "wiki", "oslo-trip.md"), "utf8")).toContain("Oslo Trip");

    const status = await session.request({ type: "status", id: "s1" });
    expect(status.at(-1)).toMatchObject({
      type: "done",
      id: "s1",
      result: {
        sync: {
          state: "idle",
          watermark: 1,
          pending: 0,
          intervalMinutes: 0,
          lastSync: { status: "ingested", snapshots: 1 },
        },
      },
    });

    const again = await session.request({ type: "ingest", id: "i2" });
    expect(again.at(-1)).toMatchObject({
      type: "done",
      id: "i2",
      result: { pass: "sync", status: "idle", snapshots: 0 },
    });
    expect(await session.close()).toBe(0);
  }, 20000);

  test("an unknown ingest mode is rejected before anything runs", async () => {
    const session = new BrainSession(scratch());
    sessions.push(session);
    await hello(session);
    const events = await session.request({ type: "ingest", id: "i1", mode: "compost" });
    expect(events.at(-1)).toMatchObject({ type: "error", id: "i1", code: "invalid_request" });
  });
});

/** The scripted mock OAuth login, then select the mock provider. */
async function signIn(session: BrainSession): Promise<void> {
  session.send({ type: "login", id: "l1", provider: "mock" });
  let prompt: BrainEvent;
  do {
    prompt = await session.next();
  } while (prompt.type !== "auth_prompt");
  session.send({
    type: "auth_reply",
    id: "r1",
    targetId: "l1",
    promptId: prompt.promptId,
    value: MOCK_LOGIN_CODE,
  });
  await session.collectUntilTerminal("l1");
  await session.request({ type: "configure", id: "cfg", provider: "mock" });
}
