// The draft prompt evals (US-107): a fixture suite over `buildDraftPrompt`
// and `cleanDraft`, so a prompt regression is caught by a test run instead of
// a user report.
//
// A fixture is one realistic press — real-shaped window text, titles and
// drafts — plus the measurable properties its prompt must have: which blocks
// it earns, the order they arrive in (mode instruction first, style last),
// the ceilings that keep a whole inbox out of one request, and the paths that
// let a draft be traced back to the memory that grounded it. The unit tests
// for each function live in draft.test.ts; this file deliberately only reads
// whole prompts, the way a reviewer would.
import { describe, expect, test } from "bun:test";
import {
  MAX_FIELD_CHARS,
  MAX_INDEX_MAP_CHARS,
  MAX_MEMORY_PAGES,
  MAX_MEMORY_PAGE_CHARS,
  MAX_WINDOW_CHARS,
  buildDraftPrompt,
  cleanDraft,
  type DraftContext,
  type MemoryGrounding,
  type StylePage,
} from "./draft";

// ---- ceilings ----

/** `findStylePage` reads its page with this cap (a literal in draft.ts). */
const STYLE_PAGE_CHARS = 4_000;
/** Everything that is not user text: instructions, labels, where-lines, steers. */
const OVERHEAD_CHARS = 2_000;
/**
 * What one press may send, in UTF-16 code units. Every user-supplied block is
 * clipped to its exported ceiling before it reaches the prompt, so the whole
 * prompt is bounded by the sum of those ceilings plus the fixed instruction
 * text around them — for any press, however big the window or the wiki.
 */
const PROMPT_CHAR_BUDGET =
  MAX_WINDOW_CHARS +
  2 * MAX_FIELD_CHARS + // the field and the selection
  MAX_FIELD_CHARS + // the previous draft, when the press reworks one
  MAX_MEMORY_PAGES * MAX_MEMORY_PAGE_CHARS +
  MAX_INDEX_MAP_CHARS +
  STYLE_PAGE_CHARS +
  OVERHEAD_CHARS;
/** A UTF-16 code unit encodes to at most 3 UTF-8 bytes, so this bound holds. */
const PROMPT_BYTE_CEILING = 3 * PROMPT_CHAR_BUDGET;

/** The instruction each mode must open the prompt with, verbatim. */
const OPENINGS: Record<DraftContext["mode"], string> = {
  rewrite: "Rewrite the selected passage below.",
  instruction: "The field currently holds an instruction to you",
  infer: "The field is empty.",
};

// ---- shared grounding ----

const INDEX_MAP = [
  "wiki/ingrid-berg.md — Ingrid Berg (person): Runs the Oslo office; leads the migration review.",
  "wiki/jonas-lie.md — Jonas Lie (person): Vendor contact at Acme for the contract renewal.",
  "wiki/oslo-migration.md — Oslo migration (project): Datacenter move; review every Thursday.",
  "wiki/style/style-mail.md — Style — Mail (style): How they write email.",
].join("\n");

const INGRID_PAGE = {
  path: "wiki/ingrid-berg.md",
  text: [
    "# Ingrid Berg",
    "",
    "Runs the Oslo office and leads the [[oslo-migration]] review. Prefers",
    "Norwegian in DMs. Agreed 2026-08-14: load-test results go to her before",
    "the Thursday review.",
  ].join("\n"),
};

const MIGRATION_PAGE = {
  path: "wiki/oslo-migration.md",
  text: [
    "# Oslo migration",
    "",
    "Datacenter move to the new cluster. Cutover gated on the load tests;",
    "review every Thursday, hard deadline Friday 2026-08-21.",
  ].join("\n"),
};

const MAIL_STYLE: StylePage = {
  path: "wiki/style/style-mail.md",
  text: "# Style — Mail\n\nOpens with 'Hei' or 'Hi', short paragraphs, signs off 'Mvh\\nMagnus'.",
};

const SLACK_INGRID_STYLE: StylePage = {
  path: "wiki/style/style-slack-ingrid-berg.md",
  text: "# Style — Slack — Ingrid Berg\n\nNorwegian with her, lowercase, no greeting, at most one emoji.",
};

const JONAS_REPLY_WINDOW = [
  "From: Jonas Lie <jonas.lie@acme.example>",
  "Subject: Re: Contract renewal",
  "",
  "Could we meet Tuesday to walk through the quote? The numbers moved a bit",
  "since the spring.",
].join("\n");

/** An inbox list view, three times the window ceiling, with a marked last row. */
const OVERSIZED_WINDOW = [
  ...Array.from(
    { length: 220 },
    (_, i) =>
      `Ingrid Berg — Re: load test, run ${i + 1} — "run ${i + 1} looks clean, full report attached" — 08:${String(i % 60).padStart(2, "0")}`,
  ),
  "noreply@calendar.example — Declined: platform sync — automatic reply",
].join("\n");

// ---- fixtures ----

interface Fixture {
  name: string;
  context: DraftContext;
  style: StylePage | null;
  grounding?: MemoryGrounding;
  /** markers the prompt must carry, in this order; the last one is the closer */
  sections: string[];
  /** what this press must NOT put in front of the model */
  absent: string[];
}

const slackReply: Fixture = {
  name: "a Slack DM reply, grounded in the recipient's pages",
  context: {
    mode: "infer",
    fieldText: "",
    selection: "",
    windowText: [
      "Ingrid Berg  10:42",
      "hei! hvordan gikk load-testen på det nye clusteret?",
      "Ingrid Berg  10:43",
      "og — står torsdagsreviewet fortsatt?",
    ].join("\n"),
    app: "Slack",
    bundleId: "com.tinyspeck.slackmacgap",
    windowTitle: "Ingrid Berg (DM) - Acme - Slack",
    recipient: "Ingrid Berg",
  },
  style: SLACK_INGRID_STYLE,
  grounding: { indexMap: INDEX_MAP, pages: [INGRID_PAGE, MIGRATION_PAGE] },
  sections: [
    "The field is empty.",
    "Where this is being typed:",
    "- Writing to: Ingrid Berg",
    "What the rest of the window says",
    "What memory holds about this correspondent, from `wiki/ingrid-berg.md`",
    "What memory holds about this correspondent, from `wiki/oslo-migration.md`",
    "Every page in the user's memory",
    "How this user writes here, from `wiki/style/style-slack-ingrid-berg.md`",
  ],
  absent: ["no style page for this context", "Selected passage", "holds an instruction"],
};

const mailCompose: Fixture = {
  name: "a fresh Mail compose with no recipient hint",
  context: {
    mode: "infer",
    fieldText: "",
    selection: "",
    windowText: "To: jonas.lie@acme.example\nSubject: Contract renewal\n",
    app: "Mail",
    bundleId: "com.apple.mail",
    windowTitle: "New Message",
  },
  style: MAIL_STYLE,
  grounding: { indexMap: INDEX_MAP, pages: [] },
  sections: [
    "The field is empty.",
    "Where this is being typed:",
    "- Window: New Message",
    "What the rest of the window says",
    "Every page in the user's memory",
    "How this user writes here, from `wiki/style/style-mail.md`",
  ],
  absent: ["Writing to:", "What memory holds about this correspondent"],
};

const rewriteSelection: Fixture = {
  name: "a rewrite of a selected sentence inside a longer reply",
  context: {
    mode: "rewrite",
    fieldText:
      "Hi Jonas,\n\ni cant do tuesday, what about wed or thu instead\n\nBest,\nMagnus",
    selection: "i cant do tuesday, what about wed or thu instead",
    windowText: JONAS_REPLY_WINDOW,
    app: "Mail",
    bundleId: "com.apple.mail",
    windowTitle: "Re: Contract renewal — Jonas Lie",
  },
  style: MAIL_STYLE,
  sections: [
    "Rewrite the selected passage below.",
    "Selected passage",
    "The whole field it sits in",
    "Where this is being typed:",
    "What the rest of the window says",
    "How this user writes here, from `wiki/style/style-mail.md`",
  ],
  absent: [
    "The field is empty",
    "holds an instruction",
    "What memory holds about this correspondent",
    "Every page in the user's memory",
  ],
};

const instructionPress: Fixture = {
  name: "an instruction typed into the field",
  context: {
    mode: "instruction",
    fieldText: "decline the tuesday slot politely and offer thursday afternoon instead",
    selection: "",
    windowText: JONAS_REPLY_WINDOW,
    app: "Mail",
    bundleId: "com.apple.mail",
    windowTitle: "Re: Contract renewal — Jonas Lie",
  },
  style: MAIL_STYLE,
  grounding: { indexMap: INDEX_MAP, pages: [] },
  sections: [
    "The field currently holds an instruction to you",
    "Instruction:",
    "decline the tuesday slot politely and offer thursday afternoon instead",
    "Where this is being typed:",
    "What the rest of the window says",
    "Every page in the user's memory",
    "How this user writes here, from `wiki/style/style-mail.md`",
  ],
  absent: ["Selected passage", "Rewrite the selected passage", "The field is empty"],
};

const emptyWiki: Fixture = {
  name: "a first-run infer with nothing in memory yet",
  context: {
    mode: "infer",
    fieldText: "",
    selection: "",
    windowText: "Mamma: Kommer du på söndag? Jag gör lax.",
    app: "Messages",
    bundleId: "com.apple.MobileSMS",
    windowTitle: "Mamma",
    recipient: "Mamma",
  },
  style: null,
  grounding: { indexMap: null, pages: [] },
  sections: [
    "The field is empty.",
    "Where this is being typed:",
    "- Writing to: Mamma",
    "What the rest of the window says",
    "Minne has no style page for this context yet",
  ],
  absent: [
    "What memory holds about this correspondent",
    "Every page in the user's memory",
    "How this user writes here",
  ],
};

const regeneratePress: Fixture = {
  name: "a regenerate, with the previous draft as the thing to avoid",
  context: {
    mode: "infer",
    fieldText: "",
    selection: "",
    windowText: JONAS_REPLY_WINDOW,
    app: "Mail",
    bundleId: "com.apple.mail",
    windowTitle: "Re: Contract renewal — Jonas Lie",
    previousDraft:
      "Hei Jonas,\n\nTirsdag går dessverre ikke. Passer torsdag ettermiddag?\n\nMvh\nMagnus",
    regenerate: true,
  },
  style: MAIL_STYLE,
  sections: [
    "The field is empty.",
    "asked for another take",
    "The draft you already wrote — do not repeat it",
    "Tirsdag går dessverre ikke.",
    "Where this is being typed:",
    "What the rest of the window says",
    "How this user writes here, from `wiki/style/style-mail.md`",
  ],
  absent: ["How the user wants it changed", "the user has steered it"],
};

const guidedRework: Fixture = {
  name: "a guided rework carrying every steer so far, oldest first",
  context: {
    mode: "infer",
    fieldText: "",
    selection: "",
    windowText: [
      "Ingrid Berg  10:42",
      "hei! hvordan gikk load-testen på det nye clusteret?",
    ].join("\n"),
    app: "Slack",
    bundleId: "com.tinyspeck.slackmacgap",
    windowTitle: "Ingrid Berg (DM) - Acme - Slack",
    recipient: "Ingrid Berg",
    previousDraft: "hei! load-testen gikk fint, alle nodene grønne. torsdag står fortsatt 🎉",
    guidance: ["shorter", "mention the friday deadline", "drop the emoji"],
  },
  style: SLACK_INGRID_STYLE,
  grounding: { indexMap: INDEX_MAP, pages: [INGRID_PAGE] },
  sections: [
    "The field is empty.",
    "the user has steered it",
    "The draft so far",
    "alle nodene grønne",
    "How the user wants it changed, oldest first — the last line is the new one:",
    "- shorter",
    "- mention the friday deadline",
    "- drop the emoji",
    "Where this is being typed:",
    "What the rest of the window says",
    "What memory holds about this correspondent, from `wiki/ingrid-berg.md`",
    "Every page in the user's memory",
    "How this user writes here, from `wiki/style/style-slack-ingrid-berg.md`",
  ],
  absent: ["another take", "do not repeat it"],
};

const oversizedWindow: Fixture = {
  name: "a press in an inbox list three times the window ceiling",
  context: {
    mode: "infer",
    fieldText: "",
    selection: "",
    windowText: OVERSIZED_WINDOW,
    app: "Mail",
    bundleId: "com.apple.mail",
    windowTitle: "Inbox — 2 341 messages",
  },
  style: null,
  sections: [
    "The field is empty.",
    "Where this is being typed:",
    "What the rest of the window says",
    "Minne has no style page for this context yet",
  ],
  absent: ["noreply@calendar.example"],
};

const FIXTURES: Fixture[] = [
  slackReply,
  mailCompose,
  rewriteSelection,
  instructionPress,
  emptyWiki,
  regeneratePress,
  guidedRework,
  oversizedWindow,
];

function promptFor(fixture: Fixture): string {
  return buildDraftPrompt(fixture.context, fixture.style, fixture.grounding);
}

// ---- properties every fixture must hold ----

describe("draft prompt evals", () => {
  for (const fixture of FIXTURES) {
    describe(fixture.name, () => {
      const prompt = promptFor(fixture);

      test("opens with its mode's instruction", () => {
        expect(prompt.startsWith(OPENINGS[fixture.context.mode])).toBe(true);
      });

      test("carries its sections in order, and nothing it did not earn", () => {
        for (const marker of fixture.sections) expect(prompt).toContain(marker);
        const positions = fixture.sections.map((marker) => prompt.indexOf(marker));
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
        for (const marker of fixture.absent) expect(prompt).not.toContain(marker);
      });

      /** Style is the last word: the record of the user's voice outranks ours. */
      test("closes with the style section", () => {
        const closer =
          fixture.style === null
            ? "match the tone of the surrounding text instead."
            : "```";
        expect(prompt.endsWith(closer)).toBe(true);
        if (fixture.style !== null) {
          expect(prompt).toContain(`How this user writes here, from \`${fixture.style.path}\``);
        }
      });

      test("stays under the press ceilings", () => {
        expect(prompt.length).toBeLessThanOrEqual(PROMPT_CHAR_BUDGET);
        expect(Buffer.byteLength(prompt, "utf8")).toBeLessThanOrEqual(PROMPT_BYTE_CEILING);
      });
    });
  }
});

// ---- pointed properties ----

describe("grounding in the prompt", () => {
  test("a page's own words reach the model, not just its path", () => {
    const prompt = promptFor(slackReply);
    expect(prompt).toContain("load-test results go to her before");
    expect(prompt).toContain("hard deadline Friday 2026-08-21");
  });

  test("the window's words reach the model verbatim", () => {
    const prompt = promptFor(slackReply);
    expect(prompt).toContain("hvordan gikk load-testen på det nye clusteret?");
  });
});

describe("the oversized window", () => {
  const prompt = promptFor(oversizedWindow);

  /** The fixture must actually be oversized, or this suite proves nothing. */
  test("the fixture overflows the ceiling honestly", () => {
    expect(oversizedWindow.context.windowText.length).toBeGreaterThan(2 * MAX_WINDOW_CHARS);
  });

  test("is clipped on a line boundary, with the elision marked", () => {
    expect(prompt).toContain('"run 1 looks clean, full report attached"');
    expect(prompt).toContain("\n…");
  });

  test("cannot drag the prompt past the window ceiling", () => {
    expect(prompt.length).toBeLessThan(MAX_WINDOW_CHARS + OVERHEAD_CHARS);
    expect(Buffer.byteLength(prompt, "utf8")).toBeLessThan(3 * (MAX_WINDOW_CHARS + OVERHEAD_CHARS));
  });
});

// ---- cleanDraft properties ----

/** Realistic model replies: bare drafts and every wrapping the prompt forbids. */
const DRAFT_SAMPLES = [
  "Torsdag passer fint for meg. Sender utkastet i morgen.",
  "hei! load-testen gikk fint, alle nodene grønne 🎉",
  "Hi Jonas,\n\nTuesday is out for me — could we do Wednesday or Thursday?\n\nMvh\nMagnus",
  "```\nHei Jonas,\n\nTorsdag passer fint.\n```",
  "```text\nShort and sweet.\n```",
  "```markdown\ntorsdag funkar 👍\n```",
  '"Thursday works for me."',
  '```\n"Torsdag passer fint."\n```',
  'Ingrid said "ship it", so I did.',
  "Run this before the switchover:\n```\nkubectl drain node-7\n```",
  "  \n\nTrailing and leading whitespace.\n\n  ",
  "",
];

describe("cleanDraft evals", () => {
  test("strips a fence wrapping the whole reply, whatever its info string", () => {
    expect(cleanDraft("```\nHei Jonas,\n\nTorsdag passer fint.\n```")).toBe(
      "Hei Jonas,\n\nTorsdag passer fint.",
    );
    expect(cleanDraft("```text\nShort and sweet.\n```")).toBe("Short and sweet.");
    expect(cleanDraft("```markdown\ntorsdag funkar 👍\n```")).toBe("torsdag funkar 👍");
  });

  test("keeps a fence that is only part of the draft", () => {
    const draft = "Run this before the switchover:\n```\nkubectl drain node-7\n```";
    expect(cleanDraft(draft)).toBe(draft);
  });

  test("strips quotes around the whole reply, never a quotation inside it", () => {
    expect(cleanDraft('"Thursday works for me."')).toBe("Thursday works for me.");
    expect(cleanDraft('Ingrid said "ship it", so I did.')).toBe('Ingrid said "ship it", so I did.');
  });

  test("unwraps a fence and the quotes inside it in one pass", () => {
    expect(cleanDraft('```\n"Torsdag passer fint."\n```')).toBe("Torsdag passer fint.");
  });

  test("trims whitespace and nothing else from a bare draft", () => {
    expect(cleanDraft("  \n\nTrailing and leading whitespace.\n\n  ")).toBe(
      "Trailing and leading whitespace.",
    );
    expect(cleanDraft("")).toBe("");
  });

  test("is idempotent on every sample", () => {
    for (const sample of DRAFT_SAMPLES) {
      const once = cleanDraft(sample);
      expect(cleanDraft(once)).toBe(once);
    }
  });

  /**
   * Stripping is single-pass by design, so a doubly-wrapped reply — quotes
   * around a fence, a fence around a fence — sheds only the outer layer and
   * is NOT a fixed point. This pins the current behavior; if it ever changes,
   * decide on purpose (see Open Questions in tasks/prd-night-1.md, US-107).
   */
  test("a doubly-wrapped reply sheds only the outer layer", () => {
    expect(cleanDraft('"```\ncode\n```"')).toBe("```\ncode\n```");
  });

  test("every fixture's prompt is already clean — cleaning must not eat it", () => {
    for (const fixture of FIXTURES) {
      const prompt = promptFor(fixture);
      // A prompt contains fences but never *is* one, so cleanDraft must only trim.
      expect(cleanDraft(prompt)).toBe(prompt.trim());
    }
  });
});
