// US-204: recurring steers become standing style rules.
//
// The counting and rendering are pure and fixture-tested here; the end of the
// file proves the two wiring points against real machinery — a SyncEngine
// distilling into a real Memory, and a brain subprocess counting steers off
// real draft requests, then writing the section the draft path reads.
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findStylePage } from "./draft";
import { emptyEditState, foldDraftOutcome, type EditState } from "./editledger";
import { Memory } from "./memory";
import { MOCK_LOGIN_CODE } from "./mock-provider";
import type { BrainEvent } from "./protocol";
import {
  MAX_STANDING_RULES,
  MAX_STEER_CHARS,
  STEER_THRESHOLD,
  distillGuidance,
  emptySteerState,
  foldSteerPress,
  normalizeSteer,
  renderStandingGuidance,
  sanitizeSteers,
  standingRules,
  type SteerPress,
  type SteerState,
} from "./steer";
import { loadSyncState, saveSyncState, syncStatePath } from "./sync-state";
import { BrainSession, hello } from "./test-support";
import { loadWikiTree } from "./wiki";
import { lintWiki } from "./wiki-lint";

let dirs: string[] = [];
let sessions: BrainSession[] = [];

afterEach(async () => {
  for (const session of sessions) await session.close().catch(() => 0);
  sessions = [];
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "minne-steer-"));
  dirs.push(dir);
  return dir;
}

/** One guided rework as the app sends it: the steer is the last entry. */
function press(overrides: Partial<SteerPress> = {}): SteerPress {
  return {
    app: "Google Chrome",
    url: "https://x.com/compose",
    guidance: ["shorter"],
    previousDraft: "A long draft about the launch.",
    ...overrides,
  };
}

/** Folds one steer per press, each steering a different draft. */
function foldTimes(steers: Record<string, SteerState>, times: number, steer: string, extra: Partial<SteerPress> = {}): void {
  for (let i = 0; i < times; i++) {
    foldSteerPress(steers, press({ guidance: [steer], previousDraft: `draft ${steer} ${i}`, ...extra }), "2026-08-19");
  }
}

describe("normalizeSteer", () => {
  test("case, whitespace and trailing punctuation are mechanical noise", () => {
    expect(normalizeSteer("  Shorter.  ")).toBe("shorter");
    expect(normalizeSteer("Make it   WARMER!!")).toBe("make it warmer");
    expect(normalizeSteer("hmm…?!")).toBe("hmm");
    expect(normalizeSteer("less\nformal,")).toBe("less formal");
  });

  /** Deliberately mechanical: different words are different steers. */
  test('"shorter please" is not "shorter"', () => {
    expect(normalizeSteer("shorter please")).toBe("shorter please");
    expect(normalizeSteer("shorter please")).not.toBe(normalizeSteer("Shorter."));
  });

  test("inner punctuation survives — only the tail is stripped", () => {
    expect(normalizeSteer("no exclamation marks, ever!")).toBe("no exclamation marks, ever");
  });
});

describe("foldSteerPress", () => {
  test("the reworks of one press count each steer exactly once", () => {
    // The array accumulates across reworks; only the last entry is new.
    const steers: Record<string, SteerState> = {};
    expect(foldSteerPress(steers, press({ guidance: ["shorter"], previousDraft: "draft one" }), "2026-08-19")).toBe(true);
    expect(
      foldSteerPress(steers, press({ guidance: ["shorter", "warmer"], previousDraft: "draft two" }), "2026-08-19"),
    ).toBe(true);
    const state = steers["Style — x.com"] as SteerState;
    expect(state.counts).toEqual({ shorter: 1, warmer: 1 });
    expect(state.updated).toBe("2026-08-19");
  });

  test("a regenerate resends the steers it has and counts nothing", () => {
    const steers: Record<string, SteerState> = {};
    expect(
      foldSteerPress(steers, press({ regenerate: true, previousDraft: "another draft" }), "2026-08-19"),
    ).toBe(false);
    expect(steers).toEqual({});
  });

  test("a retry after a failure — same steer, same draft — counts once", () => {
    const steers: Record<string, SteerState> = {};
    const failed = press({ guidance: ["shorter"], previousDraft: "the draft it steered" });
    expect(foldSteerPress(steers, failed, "2026-08-19")).toBe(true);
    expect(foldSteerPress(steers, { ...failed }, "2026-08-19")).toBe(false);
    expect(steers["Style — x.com"]?.counts).toEqual({ shorter: 1 });
  });

  test("the same steer on different drafts is a genuine repeat", () => {
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, 3, "Shorter.");
    expect(steers["Style — x.com"]?.counts).toEqual({ shorter: 3 });
    expect(steers["Style — x.com"]?.dirty).toBe(true);
  });

  test("near-duplicates pool mechanically; different words do not", () => {
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, 1, "Shorter.");
    foldTimes(steers, 1, "shorter");
    foldTimes(steers, 1, "shorter please");
    // "Shorter." and "shorter" normalize apart from each other only by the
    // drafts they rode on, so they pool; "shorter please" stays its own steer.
    expect(steers["Style — x.com"]?.counts).toEqual({ shorter: 2, "shorter please": 1 });
  });

  test("contexts never pool: domain beats browser, recipient narrows, apps differ", () => {
    const steers: Record<string, SteerState> = {};
    foldSteerPress(steers, press(), "2026-08-19");
    foldSteerPress(steers, press({ url: "https://www.github.com/pulls" }), "2026-08-19");
    foldSteerPress(steers, { app: "Slack", guidance: ["shorter"], previousDraft: "d1" }, "2026-08-19");
    foldSteerPress(
      steers,
      { app: "Slack", recipient: "Ingrid Berg", guidance: ["shorter"], previousDraft: "d2" },
      "2026-08-19",
    );
    expect(Object.keys(steers).sort()).toEqual([
      "Style — Slack",
      "Style — Slack — Ingrid Berg",
      "Style — github.com",
      "Style — x.com",
    ]);
  });

  test("a first press, an empty steer and an essay-length steer count nothing", () => {
    const steers: Record<string, SteerState> = {};
    expect(
      foldSteerPress(steers, { app: "Google Chrome", url: "https://x.com/compose" }, "2026-08-19"),
    ).toBe(false);
    expect(foldSteerPress(steers, press({ guidance: ["  . "] }), "2026-08-19")).toBe(false);
    expect(
      foldSteerPress(steers, press({ guidance: ["x".repeat(MAX_STEER_CHARS + 1)] }), "2026-08-19"),
    ).toBe(false);
    expect(steers).toEqual({});
  });
});

describe("standing rules", () => {
  test("one-off and twice-asked steers are never distilled", () => {
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, STEER_THRESHOLD - 1, "shorter");
    foldTimes(steers, 1, "warmer");
    const state = steers["Style — x.com"] as SteerState;
    expect(standingRules(state)).toEqual([]);
    expect(state.dirty).toBe(false);
  });

  test("the threshold makes a rule, most-asked first, capped for the read budget", () => {
    const steers: Record<string, SteerState> = {};
    for (let i = 0; i < MAX_STANDING_RULES + 2; i++) {
      foldTimes(steers, STEER_THRESHOLD + i, `rule number ${String(i).padStart(2, "0")}`);
    }
    const state = steers["Style — x.com"] as SteerState;
    const rules = standingRules(state);
    expect(rules).toHaveLength(MAX_STANDING_RULES);
    expect(rules[0]).toEqual([`rule number 09`, STEER_THRESHOLD + 9]);
    expect(rules.at(-1)).toEqual([`rule number 02`, STEER_THRESHOLD + 2]);
  });

  test("the rendered section is the user's own words, counted, and fits the budget", () => {
    const state = emptySteerState("x.com");
    state.updated = "2026-08-19";
    // Worst case: a full page of maximum-length steers.
    for (let i = 0; i < MAX_STANDING_RULES; i++) {
      state.counts[`${String(i)} ${"long ".repeat(38)}steer`.slice(0, MAX_STEER_CHARS)] = STEER_THRESHOLD;
    }
    const section = renderStandingGuidance(state);
    expect(section.startsWith("## Standing guidance")).toBe(true);
    expect(section.length).toBeLessThan(2_500); // well inside the 4 000-char style read
    expect(section).toContain(`asked ${STEER_THRESHOLD} times`);

    const small = emptySteerState("x.com");
    small.updated = "2026-08-19";
    small.counts["keep it short"] = 3;
    expect(renderStandingGuidance(small)).toContain("- Keep it short — asked 3 times");
  });

  /** US-205: corrections and steers share the section, the cap and the budget. */
  test("edit-ledger rules merge under the same cap, most-repeated first", () => {
    const steer = emptySteerState("x.com");
    steer.updated = "2026-08-19";
    for (let i = 0; i < MAX_STANDING_RULES; i++) {
      steer.counts[`steer number ${String(i).padStart(2, "0")}`] = STEER_THRESHOLD + i;
    }
    const edits = emptyEditState("x.com");
    edits.updated = "2026-08-20";
    // More corrections than the most-asked steer: the edit rule leads the list.
    edits.corrections["trimmed"] = STEER_THRESHOLD + MAX_STANDING_RULES;

    const section = renderStandingGuidance(steer, edits);
    const rules = section.split("\n").filter((line) => line.startsWith("- "));
    expect(rules).toHaveLength(MAX_STANDING_RULES);
    expect(rules[0]).toBe(`- Trim it — the user shortened 11 of 11 drafts here`);
    // The least-asked steer fell off the end to make room.
    expect(section).not.toContain("steer number 00");
    expect(section).toContain("last updated 2026-08-20");
    expect(section.length).toBeLessThan(2_500);
  });
});

describe("sanitizeSteers", () => {
  test("round-trips a real state through sync-state.json and drops garbage entry-wise", () => {
    const dir = scratch();
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, 3, "shorter");
    const path = syncStatePath(dir);
    saveSyncState(path, { watermark: 7, lastSync: null, lastLint: null, steers });
    const loaded = loadSyncState(path).steers;
    expect(loaded).toEqual(steers);

    expect(
      sanitizeSteers({
        good: { context: "x.com", counts: { shorter: 2 }, hashes: ["ab"], updated: "", dirty: false },
        bad: { counts: { shorter: 2 } },
        worse: 7,
      }),
    ).toEqual({
      good: { context: "x.com", counts: { shorter: 2 }, hashes: ["ab"], updated: "", dirty: false },
    });
  });
});

describe("distillGuidance", () => {
  test("a steer past threshold becomes a section on a page the draft path reads", () => {
    const root = scratch();
    const memory = new Memory({ root, dataDir: root });
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, 3, "shorter");
    foldTimes(steers, 1, "warmer"); // one-off: never distilled

    const pages = distillGuidance(memory, steers, {}, () => {});
    expect(pages).toEqual(["wiki/style/style-x-com.md"]);
    const page = readFileSync(join(root, "wiki", "style", "style-x-com.md"), "utf8");
    expect(page).toContain("## Standing guidance");
    expect(page).toContain("- Shorter — asked 3 times");
    expect(page).not.toContain("warmer");
    expect(lintWiki(loadWikiTree(root)).errors).toEqual([]);

    // The rules ride into prompts through the existing style read: the page
    // findStylePage picks for a Chrome press on x.com is this one, whole.
    const style = findStylePage(memory, "Google Chrome", undefined, "x.com");
    expect(style?.path).toBe("wiki/style/style-x-com.md");
    expect(style?.text).toContain("- Shorter — asked 3 times");

    // Distillation cleared the dirty flag; a clean pass leaves the page alone.
    expect(steers["Style — x.com"]?.dirty).toBe(false);
    expect(distillGuidance(memory, steers, {}, () => {})).toEqual([]);
  });

  test("an existing style page keeps its prose, register and frontmatter", () => {
    const root = scratch();
    const memory = new Memory({ root, dataDir: root });
    memory.writePage({
      type: "style",
      title: "Style — x.com",
      summary: "Lowercase, no hashtags.",
      sources: ["sources/2026-08-17/1400-chrome.md#1"],
      body: "# Style — x.com\n\nIntro prose.\n\n## Register\n\n- Greeting: none\n\n## Observations\n\n- lowercase always\n",
    });
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, 4, "no hashtags");

    distillGuidance(memory, steers, {}, () => {});
    const page = readFileSync(join(root, "wiki", "style", "style-x-com.md"), "utf8");
    expect(page).toContain("summary: Lowercase, no hashtags.");
    expect(page).toContain("sources/2026-08-17/1400-chrome.md#1");
    expect(page).toContain("Intro prose.");
    expect(page).toContain("- Greeting: none");
    expect(page).toContain("- lowercase always");
    expect(page).toContain("- No hashtags — asked 4 times");
    // The section lands before the first existing heading, like the register.
    expect(page.indexOf("## Standing guidance")).toBeLessThan(page.indexOf("## Register"));
  });

  /** US-205: one pipeline — a steer and a correction land in the one section. */
  test("steers and edit-ledger corrections distill into the same section", () => {
    const root = scratch();
    const memory = new Memory({ root, dataDir: root });
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, 3, "shorter");
    const edits: Record<string, EditState> = {};
    for (let i = 0; i < 4; i++) {
      foldDraftOutcome(
        edits,
        {
          app: "Google Chrome",
          url: "https://x.com/compose",
          outcome: "inserted",
          generated: `Hey! Great news — the demo went really well! Can't wait! (${i})`,
          edited: "The demo went really well and the client seemed happy today.",
        },
        "2026-08-20",
      );
    }

    const pages = distillGuidance(memory, steers, edits, () => {});
    expect(pages).toEqual(["wiki/style/style-x-com.md"]);
    const page = readFileSync(join(root, "wiki", "style", "style-x-com.md"), "utf8");
    // Most-repeated first: 4 corrections outrank 3 asks, inside one section.
    const section = page.slice(page.indexOf("## Standing guidance"));
    expect(section.indexOf("Skip the greeting — the user removed it from 4 of 4 drafts here"))
      .toBeLessThan(section.indexOf("Shorter — asked 3 times"));
    expect((page.match(/## Standing guidance/g) ?? []).length).toBe(1);
    expect(lintWiki(loadWikiTree(root)).errors).toEqual([]);
  });

  test("more asks re-render the count on the page", () => {
    const root = scratch();
    const memory = new Memory({ root, dataDir: root });
    const steers: Record<string, SteerState> = {};
    foldTimes(steers, 3, "shorter");
    distillGuidance(memory, steers, {}, () => {});
    // Two more asks, on drafts the first three did not steer.
    foldSteerPress(steers, press({ guidance: ["shorter"], previousDraft: "fourth draft" }), "2026-08-20");
    foldSteerPress(steers, press({ guidance: ["shorter"], previousDraft: "fifth draft" }), "2026-08-20");
    distillGuidance(memory, steers, {}, () => {});
    const page = readFileSync(join(root, "wiki", "style", "style-x-com.md"), "utf8");
    expect(page).toContain("— asked 5 times");
    expect((page.match(/## Standing guidance/g) ?? []).length).toBe(1);
  });
});

/**
 * The whole story over the wire: three guided drafts steer "shorter" on x.com,
 * the sync pass distills — with nothing captured and no model spent — and the
 * standing rule sits on the style page the next draft will read.
 */
describe("steers over the protocol", () => {
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
    expect((await session.collectUntilTerminal("l1")).at(-1)).toMatchObject({ type: "done" });
    expect((await session.request({ type: "configure", id: "cfg", provider: "mock" })).at(-1))
      .toMatchObject({ type: "done" });
  }

  test("three steers on x.com become a standing rule in an idle sync pass", async () => {
    const dir = scratch();
    const memoryRoot = join(dir, "memory");
    const session = new BrainSession(dir, {
      ANTHROPIC_API_KEY: undefined,
      OPENAI_API_KEY: undefined,
      MINNE_MEMORY_ROOT: memoryRoot,
      MINNE_MOCK_REPLY: "gm. shipping today.",
    });
    sessions.push(session);
    await hello(session);
    await signIn(session);

    for (let i = 0; i < 3; i++) {
      const events = await session.request({
        type: "draft",
        id: `d${i}`,
        mode: "infer",
        app: "Google Chrome",
        url: "https://x.com/compose",
        previousDraft: `draft number ${i}`,
        guidance: ["shorter"],
      });
      expect(events.at(-1)).toMatchObject({ type: "done", id: `d${i}` });
    }
    expect(loadSyncState(syncStatePath(dir)).steers?.["Style — x.com"]?.counts).toEqual({
      shorter: 3,
    });

    const pass = await session.request({ type: "ingest", id: "i1" });
    expect(pass.at(-1)).toMatchObject({
      type: "done",
      id: "i1",
      result: {
        pass: "sync",
        status: "idle",
        snapshots: 0,
        pagesTouched: ["wiki/style/style-x-com.md"],
      },
    });
    const page = readFileSync(join(memoryRoot, "wiki", "style", "style-x-com.md"), "utf8");
    expect(page).toContain("- Shorter — asked 3 times");
  }, 20000);
});
