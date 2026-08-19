// US-205: in-editor corrections feed the ledger.
//
// The feature extraction and counting are pure and fixture-tested here; the
// end of the file proves the wiring against a real brain subprocess — drafts
// settled by draft_outcome requests, folded into sync-state, and distilled by
// an idle sync pass into the section the draft path reads.
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EDIT_THRESHOLD,
  editFeatures,
  editRules,
  emptyEditState,
  foldDraftOutcome,
  sanitizeEdits,
  type DraftOutcomePress,
  type EditState,
} from "./editledger";
import { findStylePage } from "./draft";
import { Memory } from "./memory";
import { MOCK_LOGIN_CODE } from "./mock-provider";
import type { BrainEvent } from "./protocol";
import { distillGuidance } from "./steer";
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
  const dir = mkdtempSync(join(tmpdir(), "minne-editledger-"));
  dirs.push(dir);
  return dir;
}

/** One settled draft as the brain attributes it: an x.com press by default. */
function outcome(overrides: Partial<DraftOutcomePress> = {}): DraftOutcomePress {
  return {
    app: "Google Chrome",
    url: "https://x.com/compose",
    outcome: "inserted",
    ...overrides,
  };
}

const LONG_DRAFT =
  "I think we should move the launch to Thursday so the team has time to " +
  "test the build and update the docs before anyone sees it.";
const TRIMMED_DRAFT = "Let's move the launch to Thursday so we can test first.";

describe("editFeatures", () => {
  test("a trim-only edit is exactly a trim", () => {
    expect(editFeatures(LONG_DRAFT, TRIMMED_DRAFT)).toEqual(["trimmed"]);
  });

  test("a Swedish rewrite switches the language and reworks the greeting", () => {
    const generated = "Hi Anna,\nI will get back to you tomorrow with the numbers.\nThanks";
    const edited = "Hej Anna,\njag återkommer imorgon med siffrorna från lanseringen.\nTack";
    expect(editFeatures(generated, edited)).toEqual(["greeting_changed", "switched_to_sv"]);
  });

  test("stripping the greeting and the exclamation marks is two observations", () => {
    const generated =
      "Hey! Great news — the demo went really well! Can't wait to show you!\nSee you tomorrow!";
    const edited = "The demo went really well and the client seemed happy. See you tomorrow.";
    expect(editFeatures(generated, edited)).toEqual([
      "greeting_removed",
      "exclamations_removed",
    ]);
  });

  test("adding a sign-off grows the draft and ends it properly", () => {
    const generated = "Works for me. Wednesday at ten.";
    const edited = "Works for me. Wednesday at ten suits me well.\nBest regards\nMagnus";
    expect(editFeatures(generated, edited)).toEqual(["grew", "signoff_added"]);
  });

  test('"Dear" becoming "Hi" is a greeting change and nothing else', () => {
    const generated = "Dear Anna, thanks for the update on the timeline.";
    const edited = "Hi Anna, thanks for the update on the timeline.";
    expect(editFeatures(generated, edited)).toEqual(["greeting_changed"]);
  });

  test("a word-level tweak matches no feature at all", () => {
    const generated = "Can you send the deck before the standup tomorrow?";
    const edited = "Could you send the deck before the standup tomorrow?";
    expect(editFeatures(generated, edited)).toEqual([]);
  });
});

describe("foldDraftOutcome", () => {
  test("edited inserts count features; untouched inserts count approvals", () => {
    const edits: Record<string, EditState> = {};
    for (let i = 0; i < EDIT_THRESHOLD; i++) {
      expect(
        foldDraftOutcome(
          edits,
          outcome({ generated: `${LONG_DRAFT} (${i})`, edited: TRIMMED_DRAFT }),
          "2026-08-20",
        ),
      ).toBe(true);
    }
    expect(foldDraftOutcome(edits, outcome(), "2026-08-20")).toBe(true);
    const state = edits["Style — x.com"] as EditState;
    expect(state.corrections).toEqual({ trimmed: 3 });
    expect(state.approvals).toBe(1);
    expect(state.dirty).toBe(true);
    expect(state.updated).toBe("2026-08-20");
    expect(editRules(state)).toEqual([
      ["Trim it — the user shortened 3 of 4 drafts here", 3],
    ]);
  });

  test("approvals outnumbering a correction retire its rule", () => {
    const state = emptyEditState("x.com");
    state.corrections["trimmed"] = EDIT_THRESHOLD;
    state.approvals = EDIT_THRESHOLD;
    expect(editRules(state)).toEqual([]);
    // The next approval marks the state dirty so the page re-renders without it.
    const edits = { "Style — x.com": state };
    foldDraftOutcome(edits, outcome(), "2026-08-20");
    expect(state.dirty).toBe(true);
  });

  test("abandons are counted raw and never interpreted", () => {
    const edits: Record<string, EditState> = {};
    foldDraftOutcome(edits, outcome({ outcome: "abandoned" }), "2026-08-20");
    foldDraftOutcome(edits, outcome({ outcome: "abandoned" }), "2026-08-20");
    const state = edits["Style — x.com"] as EditState;
    expect(state.abandons).toBe(2);
    expect(state.corrections).toEqual({});
    expect(state.approvals).toBe(0);
    expect(state.dirty).toBe(false);
    expect(editRules(state)).toEqual([]);
  });

  test("a byte-identical pair is an approval, not a correction", () => {
    const edits: Record<string, EditState> = {};
    foldDraftOutcome(edits, outcome({ generated: LONG_DRAFT, edited: LONG_DRAFT }), "2026-08-20");
    const state = edits["Style — x.com"] as EditState;
    expect(state.approvals).toBe(1);
    expect(state.corrections).toEqual({});
  });

  test("contexts never pool: domain beats browser, recipient narrows, apps differ", () => {
    const edits: Record<string, EditState> = {};
    foldDraftOutcome(edits, outcome(), "2026-08-20");
    foldDraftOutcome(edits, { app: "Slack", outcome: "inserted" }, "2026-08-20");
    foldDraftOutcome(
      edits,
      { app: "Slack", recipient: "Ingrid Berg", outcome: "inserted" },
      "2026-08-20",
    );
    expect(Object.keys(edits).sort()).toEqual([
      "Style — Slack",
      "Style — Slack — Ingrid Berg",
      "Style — x.com",
    ]);
    expect(foldDraftOutcome(edits, { app: "  ", outcome: "inserted" }, "2026-08-20")).toBe(false);
  });
});

describe("sanitizeEdits", () => {
  test("round-trips through sync-state.json and drops garbage entry- and key-wise", () => {
    const dir = scratch();
    const edits: Record<string, EditState> = {};
    for (let i = 0; i < 3; i++) {
      foldDraftOutcome(edits, outcome({ generated: `${LONG_DRAFT} ${i}`, edited: TRIMMED_DRAFT }), "2026-08-20");
    }
    foldDraftOutcome(edits, outcome({ outcome: "abandoned" }), "2026-08-20");
    const path = syncStatePath(dir);
    saveSyncState(path, { watermark: 3, lastSync: null, lastLint: null, edits });
    expect(loadSyncState(path).edits).toEqual(edits);

    expect(
      sanitizeEdits({
        good: {
          context: "x.com",
          corrections: { trimmed: 2, invented_feature: 9, grew: -1 },
          approvals: 1,
          abandons: "many",
          updated: "2026-08-20",
          dirty: false,
        },
        bad: { corrections: {} },
        worse: 7,
      }),
    ).toEqual({
      good: {
        context: "x.com",
        corrections: { trimmed: 2 },
        approvals: 1,
        abandons: 0,
        updated: "2026-08-20",
        dirty: false,
      },
    });
  });
});

describe("distilling corrections", () => {
  test("a correction past threshold becomes a rule on the page the draft path reads", () => {
    const root = scratch();
    const memory = new Memory({ root, dataDir: root });
    const edits: Record<string, EditState> = {};
    for (let i = 0; i < EDIT_THRESHOLD; i++) {
      foldDraftOutcome(edits, outcome({ generated: `${LONG_DRAFT} ${i}`, edited: TRIMMED_DRAFT }), "2026-08-20");
    }
    foldDraftOutcome(edits, outcome(), "2026-08-20"); // one approval — outnumbered

    const pages = distillGuidance(memory, {}, edits, () => {});
    expect(pages).toEqual(["wiki/style/style-x-com.md"]);
    const page = readFileSync(join(root, "wiki", "style", "style-x-com.md"), "utf8");
    expect(page).toContain("## Standing guidance");
    expect(page).toContain("- Trim it — the user shortened 3 of 4 drafts here");
    expect(lintWiki(loadWikiTree(root)).errors).toEqual([]);

    const style = findStylePage(memory, "Google Chrome", undefined, "x.com");
    expect(style?.path).toBe("wiki/style/style-x-com.md");
    expect(style?.text).toContain("Trim it");

    // Distillation cleared the dirty flag; a clean pass leaves the page alone.
    expect(edits["Style — x.com"]?.dirty).toBe(false);
    expect(distillGuidance(memory, {}, edits, () => {})).toEqual([]);
  });
});

/**
 * The whole story over the wire: three drafts on x.com come back trimmed by
 * the user, a fourth goes in untouched and a fifth is abandoned; the sync pass
 * distills — with nothing captured and no model spent — and the rule sits on
 * the style page the next draft will read.
 */
describe("draft outcomes over the protocol", () => {
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

  test("three trims against one approval become a standing rule in an idle pass", async () => {
    const dir = scratch();
    const memoryRoot = join(dir, "memory");
    const session = new BrainSession(dir, {
      ANTHROPIC_API_KEY: undefined,
      OPENAI_API_KEY: undefined,
      MINNE_MEMORY_ROOT: memoryRoot,
      MINNE_MOCK_REPLY: LONG_DRAFT,
    });
    sessions.push(session);
    await hello(session);
    await signIn(session);

    for (let i = 0; i < 5; i++) {
      const events = await session.request({
        type: "draft",
        id: `d${i}`,
        mode: "infer",
        app: "Google Chrome",
        url: "https://x.com/compose",
      });
      expect(events.at(-1)).toMatchObject({ type: "done", id: `d${i}` });
    }
    for (let i = 0; i < 3; i++) {
      const events = await session.request({
        type: "draft_outcome",
        id: `o${i}`,
        draftId: `d${i}`,
        outcome: "inserted",
        generated: `${LONG_DRAFT} (${i})`,
        edited: TRIMMED_DRAFT,
      });
      expect(events.at(-1)).toMatchObject({ type: "done", id: `o${i}`, result: { recorded: true } });
    }
    expect(
      (await session.request({ type: "draft_outcome", id: "o3", draftId: "d3", outcome: "inserted" })).at(-1),
    ).toMatchObject({ type: "done", result: { recorded: true } });
    expect(
      (await session.request({ type: "draft_outcome", id: "o4", draftId: "d4", outcome: "abandoned" })).at(-1),
    ).toMatchObject({ type: "done", result: { recorded: true } });
    // A brain restarted mid-press knows nothing about the draft: dropped, not an error.
    expect(
      (await session.request({ type: "draft_outcome", id: "o5", draftId: "never-seen", outcome: "inserted" })).at(-1),
    ).toMatchObject({ type: "done", result: { recorded: false } });

    const state = loadSyncState(syncStatePath(dir)).edits?.["Style — x.com"];
    expect(state?.corrections).toEqual({ trimmed: 3 });
    expect(state?.approvals).toBe(1);
    expect(state?.abandons).toBe(1);

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
    expect(page).toContain("- Trim it — the user shortened 3 of 4 drafts here");
  }, 20000);
});
