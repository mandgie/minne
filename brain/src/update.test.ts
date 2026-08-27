import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  UpdateChecker,
  type FetchLike,
  compareVersions,
  normalizeVersion,
  updateSettingsFromEnv,
  updateStatePath,
} from "./update";
import { PROTOCOL_VERSION, decodeRequest } from "./protocol";
import { BrainSession, hello } from "./test-support";

describe("normalizeVersion", () => {
  test("strips the tag's v and keeps the digits", () => {
    expect(normalizeVersion("v0.1.9")).toBe("0.1.9");
    expect(normalizeVersion("0.1.9")).toBe("0.1.9");
    expect(normalizeVersion(" v1.2 ")).toBe("1.2");
    expect(normalizeVersion("2")).toBe("2");
  });

  test("refuses anything that is not a version", () => {
    expect(normalizeVersion("latest")).toBeNull();
    expect(normalizeVersion("v1.2.3-beta")).toBeNull();
    expect(normalizeVersion("")).toBeNull();
    expect(normalizeVersion("v")).toBeNull();
  });
});

describe("compareVersions", () => {
  test("compares numerically, not lexically", () => {
    expect(compareVersions("0.1.10", "0.1.9")).toBeGreaterThan(0);
    expect(compareVersions("0.1.9", "0.1.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "0.9.9")).toBeGreaterThan(0);
  });

  test("a missing segment counts as zero", () => {
    expect(compareVersions("1.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.1", "1.0")).toBeGreaterThan(0);
  });
});

describe("updateSettingsFromEnv", () => {
  test("reads the knobs and ignores junk", () => {
    expect(
      updateSettingsFromEnv({
        MINNE_UPDATE_CHECK_URL: "http://localhost:9/latest",
        MINNE_UPDATE_INTERVAL_MS: "0",
        MINNE_UPDATE_TIMEOUT_MS: "500",
      }),
    ).toEqual({ url: "http://localhost:9/latest", intervalMs: 0, timeoutMs: 500 });
    expect(updateSettingsFromEnv({ MINNE_UPDATE_INTERVAL_MS: "-5" })).toEqual({});
    expect(updateSettingsFromEnv({ MINNE_UPDATE_TIMEOUT_MS: "0" })).toEqual({});
    expect(updateSettingsFromEnv({})).toEqual({});
  });
});

describe("UpdateChecker", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "minne-update-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function release(tag: string): Response {
    return new Response(
      JSON.stringify({ tag_name: tag, html_url: `https://example.test/releases/${tag}` }),
      { status: 200 },
    );
  }

  function makeChecker(opts: {
    version?: string;
    fetchFn: FetchLike;
    intervalMs?: number;
    now?: () => number;
  }): UpdateChecker {
    return new UpdateChecker({
      dataDir: dir,
      version: opts.version ?? "0.1.9",
      log: () => {},
      settings: { intervalMs: opts.intervalMs ?? 1000 },
      fetchFn: opts.fetchFn,
      ...(opts.now === undefined ? {} : { now: opts.now }),
    });
  }

  test("a newer release reports updateAvailable with its page", async () => {
    const checker = makeChecker({ fetchFn: async () => release("v0.2.0") });
    const report = await checker.check();
    expect(report).toMatchObject({
      version: "0.1.9",
      updateAvailable: true,
      latest: "0.2.0",
      url: "https://example.test/releases/v0.2.0",
    });
    expect(report.checkedAt).toBeString();
  });

  test("the current or an older release reports nothing to do", async () => {
    const current = makeChecker({ fetchFn: async () => release("v0.1.9") });
    expect((await current.check()).updateAvailable).toBe(false);
    const older = makeChecker({ version: "0.3.0", fetchFn: async () => release("v0.2.0") });
    expect((await older.check()).updateAvailable).toBe(false);
  });

  test("a second poke inside the interval answers from cache, no fetch", async () => {
    let fetches = 0;
    const fetchFn = (async () => {
      fetches++;
      return release("v0.2.0");
    });
    const checker = makeChecker({ fetchFn, intervalMs: 60_000 });
    await checker.check();
    await checker.check();
    expect(fetches).toBe(1);
  });

  test("the cadence and the result survive a restart", async () => {
    let fetches = 0;
    const fetchFn = (async () => {
      fetches++;
      return release("v0.2.0");
    });
    await makeChecker({ fetchFn, intervalMs: 60_000 }).check();
    // A new instance (the brain restarted with the app) reads the same state:
    // still inside the interval, so cache only — but the cached answer stands.
    const restarted = makeChecker({ fetchFn, intervalMs: 60_000 });
    const report = await restarted.check();
    expect(fetches).toBe(1);
    expect(report).toMatchObject({ updateAvailable: true, latest: "0.2.0" });
  });

  test("a failed fetch is silent, keeps the cache, and backs off", async () => {
    const clock = { now: 0 };
    let fetches = 0;
    const good = (async () => {
      fetches++;
      return release("v0.2.0");
    });
    const first = makeChecker({ fetchFn: good, intervalMs: 1000, now: () => clock.now });
    await first.check();

    clock.now = 2000; // past due: the next poke really fetches — and fails
    const bad = (async () => {
      fetches++;
      throw new Error("offline");
    });
    const failing = makeChecker({ fetchFn: bad, intervalMs: 1000, now: () => clock.now });
    const report = await failing.check();
    expect(report).toMatchObject({ updateAvailable: true, latest: "0.2.0" });
    expect(fetches).toBe(2);
    // Backed off: the failure set a fresh due time, so the next poke is cache.
    await failing.check();
    expect(fetches).toBe(2);
  });

  test("an HTTP error and a junk tag are failures, not answers", async () => {
    const httpError = makeChecker({ fetchFn: async () => new Response("nope", { status: 403 }) });
    expect((await httpError.check()).updateAvailable).toBe(false);
    const junkTag = makeChecker({ fetchFn: async () => release("nightly") });
    expect((await junkTag.check()).updateAvailable).toBe(false);
  });

  test("interval 0 disables checking entirely", async () => {
    let fetches = 0;
    const fetchFn = (async () => {
      fetches++;
      return release("v9.9.9");
    });
    const checker = makeChecker({ fetchFn, intervalMs: 0 });
    expect((await checker.check()).updateAvailable).toBe(false);
    expect(fetches).toBe(0);
  });

  test("a corrupt state file reads as empty rather than failing", async () => {
    writeFileSync(updateStatePath(dir), "{ not json");
    const checker = makeChecker({ fetchFn: async () => release("v0.2.0") });
    const report = await checker.check();
    expect(report.updateAvailable).toBe(true);
    // And the fresh check rewrote it whole.
    const stored = JSON.parse(readFileSync(updateStatePath(dir), "utf8")) as Record<
      string,
      unknown
    >;
    expect(stored["latest"]).toMatchObject({ version: "0.2.0" });
  });
});

describe("update_check over the protocol", () => {
  test("decodes", () => {
    const decoded = decodeRequest(JSON.stringify({ type: "update_check", id: "u1" }));
    expect(decoded).toEqual({ ok: true, request: { type: "update_check", id: "u1" } });
  });

  test("round-trips against a live brain and a local release host", async () => {
    const server = Bun.serve({
      port: 0,
      fetch: () =>
        new Response(
          JSON.stringify({
            tag_name: "v99.0.0",
            html_url: "https://example.test/releases/v99.0.0",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    });
    const dir = mkdtempSync(join(tmpdir(), "minne-update-proto-"));
    const session = new BrainSession(dir, {
      MINNE_UPDATE_INTERVAL_MS: "86400000",
      MINNE_UPDATE_CHECK_URL: `http://localhost:${server.port}/latest`,
    });
    try {
      await hello(session);
      const events = await session.request({ type: "update_check", id: "u1" });
      expect(events.at(-1)).toMatchObject({
        type: "done",
        id: "u1",
        result: {
          updateAvailable: true,
          latest: "99.0.0",
          url: "https://example.test/releases/v99.0.0",
        },
      });
    } finally {
      await session.close();
      server.stop(true);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("with checking disabled it answers from an empty cache, never errors", async () => {
    const dir = mkdtempSync(join(tmpdir(), "minne-update-off-"));
    const session = new BrainSession(dir); // harness sets MINNE_UPDATE_INTERVAL_MS=0
    try {
      await hello(session);
      const events = await session.request({ type: "update_check", id: "u2" });
      expect(events.at(-1)).toMatchObject({
        type: "done",
        id: "u2",
        result: { updateAvailable: false },
      });
    } finally {
      await session.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Keeps the request part of PROTOCOL_VERSION 1: additive requests ride the
// same version because app and brain always ship together in one bundle.
void PROTOCOL_VERSION;
