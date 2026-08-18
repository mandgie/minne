// US-109: the per-recipient voice register, pure parts and the write path.
//
// The extraction is pinned against five fixture transcripts — formal email,
// casual Slack, emoji-heavy chat, a Swedish thread, terse one-liners — and the
// binding principle throughout is the PRD's: a register learned from the OTHER
// person's messages is worse than none, so a surface with no unambiguous
// authorship marker must yield nothing at all.
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findStylePage } from "./draft";
import { Memory } from "./memory";
import {
  analyzeMessage,
  emptyRegister,
  extractSentMessages,
  foldMessage,
  messageHash,
  renderRegister,
  sanitizeRegisters,
  updateVoiceRegisters,
  upsertRegisterSection,
  type RegisterState,
} from "./register";
import { loadSyncState, saveSyncState, syncStatePath } from "./sync-state";
import { loadWikiTree } from "./wiki";
import { lintWiki } from "./wiki-lint";

// ---- fixtures: captured window text, as the AX walk flattens it ----

/** 1. Casual chat in Messages: a receipt marks the user's own bubble. */
const MESSAGES_CASUAL = {
  app: "Messages",
  bundleId: "com.apple.MobileSMS",
  title: "Ingrid Berg",
  text: [
    "Messages",
    "Ingrid Berg",
    "iMessage",
    "Today 14:02",
    "Are we still on for Friday?",
    "Yeah! I'll book the table for 7",
    "Delivered",
    "iMessage",
  ].join("\n"),
};

/** 2. A Swedish thread, with localized receipts. */
const MESSAGES_SWEDISH = {
  app: "Messages",
  bundleId: "com.apple.MobileSMS",
  title: "Anna Lindqvist",
  text: [
    "Anna Lindqvist",
    "iMessage",
    "Idag 09:12",
    "Hinner du ta en kaffe imorgon?",
    "Hej! Ja det blir bra, vi ses vid tio",
    "Läst 09:15",
  ].join("\n"),
};

/** 3. Emoji-heavy chat. */
const MESSAGES_EMOJI = {
  app: "Messages",
  bundleId: "com.apple.MobileSMS",
  title: "Jonas Ek",
  text: [
    "Jonas Ek",
    "iMessage",
    "Today 18:40",
    "Match tonight??",
    "Let's gooo 🔥🔥 see you there 😅",
    "Delivered",
  ].join("\n"),
};

/** 4. Terse one-liners. */
const MESSAGES_TERSE = {
  app: "Messages",
  bundleId: "com.apple.MobileSMS",
  title: "Sam Öberg",
  text: ["Sam Öberg", "Today 08:01", "running late?", "omw", "Delivered"].join("\n"),
};

/**
 * 5. A casual Slack DM. Both people's messages are right there — but the flat
 * text carries no marker tying any of them to the user (we do not know their
 * display name), so extraction must return nothing. Harvesting Ingrid's lines
 * into the user's register is exactly the pollution this story forbids.
 */
const SLACK_DM = {
  app: "Slack",
  bundleId: "com.tinyspeck.slackmacgap",
  title: "Ingrid Berg (DM) - Nordfjord - Slack",
  text: [
    "Ingrid Berg (DM) - Nordfjord - Slack",
    "Ingrid Berg 14:02",
    "can you review the deploy PR?",
    "Magnus Friberg 14:05",
    "on it, gimme 10",
    "Message Ingrid Berg",
  ].join("\n"),
};

/**
 * A formal email. The window fixture proves Mail yields nothing (a compose
 * window and a reading pane are indistinguishable in flat text, and mistaking
 * a received mail for the user's writing is the worst case); the body feeds
 * the analysis layer directly, which is what Mail wiring would reuse.
 */
const MAIL_FORMAL_BODY = [
  "Dear Anna,",
  "",
  "Thank you for the update on the Oslo lease. I have reviewed the terms and",
  "believe we should proceed with the September start date.",
  "",
  "Could you send the signed copy when you have a moment?",
  "",
  "Best regards,",
  "Magnus",
].join("\n");

const MAIL_WINDOW = {
  app: "Mail",
  bundleId: "com.apple.mail",
  title: "Oslo lease — terms",
  text: ["To:", "Anna Lindqvist", "Subject:", "Oslo lease — terms", MAIL_FORMAL_BODY].join("\n"),
};

// ---- extraction ----

describe("extractSentMessages", () => {
  test("a receipt marks the user's bubble; the other side is never harvested", () => {
    const sample = extractSentMessages(MESSAGES_CASUAL);
    expect(sample).toEqual({
      app: "Messages",
      recipient: "Ingrid Berg",
      messages: ["Yeah! I'll book the table for 7"],
    });
    expect(sample?.messages.join()).not.toContain("Are we still on");
  });

  test("Swedish receipts (Läst with a time) work the same way", () => {
    expect(extractSentMessages(MESSAGES_SWEDISH)).toEqual({
      app: "Messages",
      recipient: "Anna Lindqvist",
      messages: ["Hej! Ja det blir bra, vi ses vid tio"],
    });
  });

  test("emoji-heavy and terse messages come through verbatim", () => {
    expect(extractSentMessages(MESSAGES_EMOJI)?.messages).toEqual([
      "Let's gooo 🔥🔥 see you there 😅",
    ]);
    expect(extractSentMessages(MESSAGES_TERSE)?.messages).toEqual(["omw"]);
  });

  test("Slack yields nothing: no marker ties a line to the user", () => {
    expect(extractSentMessages(SLACK_DM)).toBeNull();
  });

  test("Mail yields nothing: compose and reading pane look alike in flat text", () => {
    expect(extractSentMessages(MAIL_WINDOW)).toBeNull();
  });

  test("a Messages window with no receipts yields nothing", () => {
    expect(
      extractSentMessages({
        ...MESSAGES_CASUAL,
        text: "Ingrid Berg\nAre we still on for Friday?\nSounds good",
      }),
    ).toBeNull();
  });

  test("the app's own window title is not a correspondent", () => {
    expect(extractSentMessages({ ...MESSAGES_CASUAL, title: "Messages" })).toBeNull();
    expect(extractSentMessages({ ...MESSAGES_CASUAL, title: "•" })).toBeNull();
  });

  test('a bare "Read" line is a message, not a marker — receipts carry a time', () => {
    // Someone answering "Read" to "did you read my doc?" must not turn the
    // question above it into the user's own words.
    expect(
      extractSentMessages({
        ...MESSAGES_CASUAL,
        text: "Ingrid Berg\ndid you read my doc?\nRead\nToday 14:02",
      }),
    ).toBeNull();
  });

  test("chrome directly above a receipt is not a message", () => {
    expect(
      extractSentMessages({
        ...MESSAGES_CASUAL,
        text: "Ingrid Berg\niMessage\nToday 14:02\nDelivered",
      }),
    ).toBeNull();
  });

  test("a receipt repeated under the same text counts the message once", () => {
    const sample = extractSentMessages({
      ...MESSAGES_CASUAL,
      text: "Ingrid Berg\nsee you soon\nDelivered\nsee you soon\nRead 14:05",
    });
    expect(sample?.messages).toEqual(["see you soon"]);
  });
});

// ---- per-message analysis ----

describe("analyzeMessage", () => {
  test("a formal email: greeting, sign-off, length, language", () => {
    const traits = analyzeMessage(MAIL_FORMAL_BODY);
    expect(traits.greeting).toBe("dear");
    expect(traits.signoff).toBe("best regards");
    expect(traits.language).toBe("en");
    expect(traits.emoji).toEqual([]);
    expect(traits.chars).toBeGreaterThan(200);
  });

  test("a casual Swedish message: greeting and language", () => {
    const traits = analyzeMessage("Hej! Ja det blir bra, vi ses vid tio");
    expect(traits.greeting).toBe("hej");
    expect(traits.signoff).toBeNull();
    expect(traits.language).toBe("sv");
  });

  test("emoji are collected once each", () => {
    const traits = analyzeMessage("Let's gooo 🔥🔥 see you there 😅");
    expect(traits.emoji.sort()).toEqual(["🔥", "😅"]);
    expect(traits.language).toBe("en");
  });

  test("a terse one-liner claims nothing it cannot know", () => {
    const traits = analyzeMessage("omw");
    expect(traits).toEqual({ greeting: null, signoff: null, chars: 3, emoji: [], language: null });
  });

  test('a lone "thanks!" is the whole message, not a sign-off habit', () => {
    expect(analyzeMessage("thanks!").signoff).toBeNull();
    expect(analyzeMessage("Can you send it over?\nThanks!").signoff).toBe("thanks");
  });

  test('"hej" must be a word, not a prefix of one', () => {
    expect(analyzeMessage("hejdå-fest på fredag").greeting).toBeNull();
    expect(analyzeMessage("hej, hur går det?").greeting).toBe("hej");
  });
});

// ---- folding and rendering ----

describe("the running register", () => {
  const citation = "sources/2026-08-18/1400-messages.md#1";

  test("folding the same message twice counts it once", () => {
    const state = emptyRegister("Messages", "Ingrid Berg");
    expect(foldMessage(state, "see you soon", citation, "2026-08-18")).toBe(true);
    expect(foldMessage(state, "see  you   soon", citation, "2026-08-19")).toBe(false);
    expect(state.messages).toBe(1);
    expect(state.updated).toBe("2026-08-18");
    expect(messageHash("see you soon")).toBe(messageHash("  see  you soon "));
  });

  test("the rendered section reports what was measured, and only that", () => {
    const state = emptyRegister("Messages", "Anna Lindqvist");
    foldMessage(state, "Hej! Ja det blir bra, vi ses vid tio", citation, "2026-08-18");
    foldMessage(state, "Hej, kan du ta det imorgon?", citation, "2026-08-18");
    foldMessage(state, "perfekt, tack! 😅", citation, "2026-08-18");
    const section = renderRegister(state);
    expect(section).toStartWith("## Register");
    expect(section).toContain("3 sent messages");
    expect(section).toContain('"hej" (2 of 3)');
    expect(section).toContain("Swedish");
    expect(section).toContain("😅");
    expect(section).toContain("short —");
    expect(section).toContain("Sign-off: none observed");
  });

  test("an empty-habit register says so instead of guessing", () => {
    const state = emptyRegister("Messages", "Sam Öberg");
    foldMessage(state, "omw", citation, "2026-08-18");
    const section = renderRegister(state);
    expect(section).toContain("none — they open mid-thought");
    expect(section).toContain("none observed");
    expect(section).toContain("unclear from short messages");
  });

  test("the section stays small enough to ride a 4000-char style-page read", () => {
    const state = emptyRegister("Messages", "Ingrid Berg");
    for (let i = 0; i < 80; i++) {
      foldMessage(state, `Hej nummer ${i} 🔥🎉😅🚀🥳❤️👍🙈☕️🍕 med lite text`, citation, "2026-08-18");
    }
    expect(renderRegister(state).length).toBeLessThan(1000);
    expect(state.hashes.length).toBeLessThanOrEqual(64);
    expect(Object.keys(state.emoji).length).toBeLessThanOrEqual(12);
  });

  test("upsert inserts before the first heading and replaces in place", () => {
    const body = "# Style — Messages — Ingrid\n\nIntro prose.\n\n## Observations\n\n- warm tone\n";
    const inserted = upsertRegisterSection(body, "## Register\n\n- Greeting: none");
    expect(inserted.indexOf("## Register")).toBeLessThan(inserted.indexOf("## Observations"));
    expect(inserted).toContain("Intro prose.");
    expect(inserted).toContain("- warm tone");

    const replaced = upsertRegisterSection(inserted, "## Register\n\n- Greeting: \"hej\"");
    expect(replaced).toContain('- Greeting: "hej"');
    expect(replaced).not.toContain("- Greeting: none");
    expect(replaced.match(/## Register/g)).toHaveLength(1);
    expect(replaced).toContain("- warm tone");
  });

  test("upsert appends when the body has no headings at all", () => {
    const result = upsertRegisterSection("Just prose.", "## Register\n\n- Greeting: none");
    expect(result).toBe("Just prose.\n\n## Register\n\n- Greeting: none");
  });
});

describe("sanitizeRegisters", () => {
  test("round-trips a real state and drops garbage entry-wise", () => {
    const state = emptyRegister("Messages", "Ingrid Berg");
    foldMessage(state, "see you soon", "sources/2026-08-18/1400-messages.md#1", "2026-08-18");
    const clean = sanitizeRegisters({
      "Style — Messages — Ingrid Berg": JSON.parse(JSON.stringify(state)),
      broken: { app: 7 },
      alsoBroken: "nope",
    });
    expect(clean).toEqual({ "Style — Messages — Ingrid Berg": state });
    expect(sanitizeRegisters("not a record")).toBeNull();
    expect(sanitizeRegisters(["not", "a", "record"])).toBeNull();
  });
});

// ---- the write path, against a real Memory in a scratch dir ----

describe("updateVoiceRegisters", () => {
  function makeMemory(): { memory: Memory; root: string; dir: string } {
    const dir = mkdtempSync(join(tmpdir(), "minne-register-"));
    const root = join(dir, "memory");
    const memory = new Memory({ root, dataDir: dir });
    return { memory, root, dir };
  }

  const row = (fixture: typeof MESSAGES_CASUAL, citation: string) => ({
    ...fixture,
    citation,
  });

  test("writes a lint-clean style page the draft path finds by rule", () => {
    const { memory, root, dir } = makeMemory();
    try {
      const registers: Record<string, RegisterState> = {};
      const update = updateVoiceRegisters(
        memory,
        [row(MESSAGES_CASUAL, "sources/2026-08-18/1400-messages.md#1")],
        registers,
        () => {},
        () => new Date("2026-08-18T14:00:00"),
      );
      expect(update.folded).toBe(1);
      expect(update.pages).toEqual(["wiki/style/style-messages-ingrid-berg.md"]);

      // The page rides into draft prompts through the existing lookup.
      const style = findStylePage(memory, "Messages", "Ingrid Berg");
      expect(style?.path).toBe("wiki/style/style-messages-ingrid-berg.md");
      expect(style?.text).toContain("## Register");
      expect(style?.text).toContain("1 sent message");
      expect(style?.text.length).toBeLessThan(4_000);

      // And the wiki still satisfies its own schema, index entry included.
      const tree = loadWikiTree(root);
      expect(lintWiki(tree).errors).toEqual([]);
      expect(tree.files["index.md"]).toContain("[[Style — Messages — Ingrid Berg]]");
      expect(tree.files["wiki/style/style-messages-ingrid-berg.md"]).toContain(
        "sources: [sources/2026-08-18/1400-messages.md#1]",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("re-observing the same window changes nothing — no fold, no write", () => {
    const { memory, dir } = makeMemory();
    try {
      const registers: Record<string, RegisterState> = {};
      const rows = [row(MESSAGES_CASUAL, "sources/2026-08-18/1400-messages.md#1")];
      const clock = () => new Date("2026-08-18T14:00:00");
      updateVoiceRegisters(memory, rows, registers, () => {}, clock);
      const again = updateVoiceRegisters(
        memory,
        [row(MESSAGES_CASUAL, "sources/2026-08-18/1400-messages.md#2")],
        registers,
        () => {},
        clock,
      );
      expect(again).toEqual({ pages: [], folded: 0 });
      expect(registers["Style — Messages — Ingrid Berg"]?.messages).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("an agent-rewritten page keeps its prose; the register is re-inserted whole", () => {
    const { memory, root, dir } = makeMemory();
    try {
      const registers: Record<string, RegisterState> = {};
      const clock = () => new Date("2026-08-18T14:00:00");
      updateVoiceRegisters(
        memory,
        [row(MESSAGES_CASUAL, "sources/2026-08-18/1400-messages.md#1")],
        registers,
        () => {},
        clock,
      );
      // The sync agent rewrites the page and (against instructions) drops the
      // register section. The counters live in sync-state, so the next
      // observation restores the section with nothing forgotten.
      memory.writePage({
        type: "style",
        title: "Style — Messages — Ingrid Berg",
        summary: "Warm and brief with Ingrid.",
        body: "# Style — Messages — Ingrid Berg\n\n## Observations\n\n- warm tone\n",
      });
      const update = updateVoiceRegisters(
        memory,
        [
          {
            ...MESSAGES_CASUAL,
            text: "Ingrid Berg\nok, see you at 7\nDelivered",
            citation: "sources/2026-08-18/1500-messages.md#1",
          },
        ],
        registers,
        () => {},
        clock,
      );
      expect(update.folded).toBe(1);
      const page = loadWikiTree(root).files["wiki/style/style-messages-ingrid-berg.md"] as string;
      expect(page).toContain("summary: Warm and brief with Ingrid.");
      expect(page).toContain("- warm tone");
      expect(page).toContain("2 sent messages");
      expect(page.indexOf("## Register")).toBeLessThan(page.indexOf("## Observations"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("surfaces without an authorship signal write nothing at all", () => {
    const { memory, root, dir } = makeMemory();
    try {
      const update = updateVoiceRegisters(
        memory,
        [
          row(SLACK_DM, "sources/2026-08-18/1400-slack.md#1"),
          row(MAIL_WINDOW, "sources/2026-08-18/1400-mail.md#1"),
        ],
        {},
        () => {},
        () => new Date("2026-08-18T14:00:00"),
      );
      expect(update).toEqual({ pages: [], folded: 0 });
      expect(loadWikiTree(root).files["wiki/style/style-slack-ingrid-berg-dm.md"]).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("registers survive a sync-state round trip", () => {
    const dir = mkdtempSync(join(tmpdir(), "minne-register-"));
    try {
      const state = loadSyncState(syncStatePath(dir));
      state.registers = { "Style — Messages — Ingrid Berg": emptyRegister("Messages", "Ingrid Berg") };
      foldMessage(
        state.registers["Style — Messages — Ingrid Berg"] as RegisterState,
        "see you soon",
        "sources/2026-08-18/1400-messages.md#1",
        "2026-08-18",
      );
      saveSyncState(syncStatePath(dir), state);
      const reloaded = loadSyncState(syncStatePath(dir));
      expect(reloaded.registers?.["Style — Messages — Ingrid Berg"]?.messages).toBe(1);

      // A corrupted registers field degrades to absent, never to a crash.
      writeFileSync(syncStatePath(dir), JSON.stringify({ watermark: 3, registers: "junk" }));
      expect(loadSyncState(syncStatePath(dir))).toMatchObject({ watermark: 3 });
      expect(loadSyncState(syncStatePath(dir)).registers).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
