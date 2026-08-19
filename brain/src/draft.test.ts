// The drafting key's brain half: what goes into the prompt, which style page it
// cites, and what comes back over the protocol.
//
// The prompt tests are pure; the protocol tests run a real brain subprocess
// against the deterministic mock provider. Two of them deliberately leave
// MINNE_MOCK_REPLY unset so the mock echoes the prompt it was given — which is
// the only way, short of a network capture, to prove what the model actually
// received.
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  MAX_WINDOW_CHARS,
  buildDraftPrompt,
  cleanDraft,
  domainOf,
  findMemoryPages,
  findStylePage,
  memoryIndexMap,
  type DraftContext,
} from "./draft";
import { Memory } from "./memory";
import { MOCK_LOGIN_CODE } from "./mock-provider";
import { decodeRequest, type BrainEvent } from "./protocol";
import { BrainSession, hello } from "./test-support";
import { pagePath, stylePagePaths, styleTitle } from "./wiki";

let dirs: string[] = [];
let sessions: BrainSession[] = [];

afterEach(async () => {
  for (const session of sessions) await session.close().catch(() => 0);
  sessions = [];
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "minne-draft-"));
  dirs.push(dir);
  return dir;
}

function context(overrides: Partial<DraftContext> = {}): DraftContext {
  return {
    mode: "infer",
    fieldText: "",
    selection: "",
    windowText: "",
    app: "Mail",
    ...overrides,
  };
}

function write(root: string, relative: string, text: string): void {
  const path = join(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function stylePage(title: string, body: string): string {
  return [
    "---",
    `title: ${title}`,
    "type: style",
    "summary: How they write here.",
    "sources: [sources/2026-08-17/1400-mail.md#1]",
    "last_updated: 2026-08-17",
    "---",
    "",
    `# ${title}`,
    "",
    body,
    "",
  ].join("\n");
}

// ---- naming ----

describe("style page names", () => {
  test("a context's page name follows from the app and the recipient", () => {
    expect(styleTitle("Mail")).toBe("Style — Mail");
    expect(styleTitle("Slack", "Ingrid Berg")).toBe("Style — Slack — Ingrid Berg");
    expect(pagePath("style", styleTitle("Mail"))).toBe("wiki/style/style-mail.md");
    expect(stylePagePaths("Slack", "Ingrid Berg")).toEqual([
      "wiki/style/style-slack-ingrid-berg.md",
      "wiki/style/style-slack.md",
    ]);
  });

  /** No recipient means one candidate, not a page named after an empty string. */
  test("an unknown recipient leaves only the app's page", () => {
    expect(stylePagePaths("Mail")).toEqual(["wiki/style/style-mail.md"]);
    expect(stylePagePaths("Mail", "   ")).toEqual(["wiki/style/style-mail.md"]);
  });
});

describe("findStylePage", () => {
  function memoryWith(pages: Record<string, string>): Memory {
    const root = scratch();
    for (const [relative, text] of Object.entries(pages)) write(root, relative, text);
    return new Memory({ root, dataDir: root });
  }

  test("prefers the recipient's page over the app's", () => {
    const memory = memoryWith({
      "wiki/style/style-slack.md": stylePage("Style — Slack", "Lowercase, no greeting."),
      "wiki/style/style-slack-ingrid-berg.md": stylePage(
        "Style — Slack — Ingrid Berg",
        "Norwegian, warmer.",
      ),
    });
    const found = findStylePage(memory, "Slack", "Ingrid Berg");
    expect(found?.path).toBe("wiki/style/style-slack-ingrid-berg.md");
    expect(found?.text).toContain("Norwegian, warmer.");
  });

  test("falls back to the app's page when the recipient has none", () => {
    const memory = memoryWith({
      "wiki/style/style-slack.md": stylePage("Style — Slack", "Lowercase, no greeting."),
    });
    expect(findStylePage(memory, "Slack", "Someone Else")?.path).toBe("wiki/style/style-slack.md");
  });

  test("no style page at all is null, not an error", () => {
    expect(findStylePage(memoryWith({}), "Mail")).toBeNull();
  });

  test("the domain outranks the browser as the style context", () => {
    const memory = memoryWith({
      "wiki/style/style-google-chrome.md": stylePage("Style — Google Chrome", "Neutral prose."),
      "wiki/style/style-x-com.md": stylePage("Style — x.com", "Lowercase, blunt, no hashtags."),
    });
    expect(findStylePage(memory, "Google Chrome", undefined, "x.com")?.path).toBe(
      "wiki/style/style-x-com.md",
    );
  });

  test("a domain with no page falls back to the browser's page", () => {
    const memory = memoryWith({
      "wiki/style/style-google-chrome.md": stylePage("Style — Google Chrome", "Neutral prose."),
    });
    expect(findStylePage(memory, "Google Chrome", undefined, "x.com")?.path).toBe(
      "wiki/style/style-google-chrome.md",
    );
  });

  test("the domain narrowed to the recipient beats everything", () => {
    const memory = memoryWith({
      "wiki/style/style-x-com.md": stylePage("Style — x.com", "Lowercase."),
      "wiki/style/style-x-com-nick-huber.md": stylePage(
        "Style — x.com — Nick Huber",
        "Contrarian, numbers-forward.",
      ),
    });
    expect(findStylePage(memory, "Google Chrome", "Nick Huber", "x.com")?.path).toBe(
      "wiki/style/style-x-com-nick-huber.md",
    );
  });
});

describe("domainOf", () => {
  test("host without www, or null when there is nothing usable", () => {
    expect(domainOf("https://www.x.com/sweatystartup/status/1")).toBe("x.com");
    expect(domainOf("https://github.com/mandgie/minne/pull/2")).toBe("github.com");
    expect(domainOf("not a url")).toBeNull();
    expect(domainOf(undefined)).toBeNull();
  });
});

function personPage(name: string, body: string): string {
  return [
    "---",
    `title: ${name}`,
    "type: person",
    `summary: What Minne knows about ${name}.`,
    "sources: [sources/2026-08-17/1400-slack.md#1]",
    "last_updated: 2026-08-17",
    "---",
    "",
    `# ${name}`,
    "",
    body,
    "",
  ].join("\n");
}

describe("findMemoryPages", () => {
  function memoryWith(pages: Record<string, string>): Memory {
    const root = scratch();
    for (const [relative, text] of Object.entries(pages)) write(root, relative, text);
    return new Memory({ root, dataDir: root });
  }

  test("the recipient's wiki page is prefetched, cited by path", () => {
    const memory = memoryWith({
      "wiki/ingrid-berg.md": personPage("Ingrid Berg", "Runs the Oslo office."),
    });
    const pages = findMemoryPages(memory, "Ingrid Berg");
    expect(pages.map((page) => page.path)).toEqual(["wiki/ingrid-berg.md"]);
    expect(pages[0]?.text).toContain("Runs the Oslo office.");
  });

  test("style pages are skipped — findStylePage already injects them by rule", () => {
    const memory = memoryWith({
      "wiki/style/style-slack-ingrid-berg.md": stylePage(
        "Style — Slack — Ingrid Berg",
        "Norwegian, warmer.",
      ),
      "wiki/ingrid-berg.md": personPage("Ingrid Berg", "Runs the Oslo office."),
    });
    const pages = findMemoryPages(memory, "Ingrid Berg");
    expect(pages.map((page) => page.path)).toEqual(["wiki/ingrid-berg.md"]);
  });

  test("a recipient with no searchable words is nobody to look up, not an error", () => {
    const memory = memoryWith({
      "wiki/ingrid-berg.md": personPage("Ingrid Berg", "Runs the Oslo office."),
    });
    expect(findMemoryPages(memory, "…")).toEqual([]);
  });

  test("no recipient, no hits, no pages", () => {
    const memory = memoryWith({
      "wiki/ingrid-berg.md": personPage("Ingrid Berg", "Runs the Oslo office."),
    });
    expect(findMemoryPages(memory)).toEqual([]);
    expect(findMemoryPages(memory, "Nobody Known")).toEqual([]);
  });
});

describe("memoryIndexMap", () => {
  test("one line per page, with path, type and summary", () => {
    const root = scratch();
    write(root, "wiki/ingrid-berg.md", personPage("Ingrid Berg", "Runs the Oslo office."));
    const map = memoryIndexMap(new Memory({ root, dataDir: root }));
    expect(map).toContain("wiki/ingrid-berg.md");
    expect(map).toContain("(person)");
    expect(map).toContain("What Minne knows about Ingrid Berg.");
  });

  test("an empty wiki has no map — the prompt earns no block", () => {
    const root = scratch();
    expect(memoryIndexMap(new Memory({ root, dataDir: root }))).toBeNull();
  });
});

// ---- prompt assembly ----

describe("buildDraftPrompt", () => {
  test("rewrite mode hands over the selection and asks for a replacement", () => {
    const prompt = buildDraftPrompt(
      context({ mode: "rewrite", selection: "i cant make it", fieldText: "hi — i cant make it" }),
      null,
    );
    expect(prompt).toContain("Rewrite the selected passage");
    expect(prompt).toContain("i cant make it");
    expect(prompt).toContain("The whole field it sits in");
  });

  /** The field is the instruction, and must never be described as the user's text. */
  test("instruction mode presents the field as an instruction to carry out", () => {
    const prompt = buildDraftPrompt(
      context({ mode: "instruction", fieldText: "decline politely, suggest thursday" }),
      null,
    );
    expect(prompt).toContain("holds an instruction");
    expect(prompt).toContain("decline politely, suggest thursday");
    expect(prompt).not.toContain("Rewrite the selected passage");
  });

  test("infer mode leans on the window and says the field is empty", () => {
    const prompt = buildDraftPrompt(
      context({ mode: "infer", windowText: "From: Ingrid\nCan you review the migration doc?" }),
      null,
    );
    expect(prompt).toContain("The field is empty");
    expect(prompt).toContain("Can you review the migration doc?");
  });

  test("the style page is quoted and cited by path", () => {
    const prompt = buildDraftPrompt(context(), {
      path: "wiki/style/style-mail.md",
      text: "Signs off with 'M.'",
    });
    expect(prompt).toContain("`wiki/style/style-mail.md`");
    expect(prompt).toContain("Signs off with 'M.'");
    expect(prompt).not.toContain("no style page for this context");
  });

  test("without one, the prompt says so rather than inventing a voice", () => {
    expect(buildDraftPrompt(context(), null)).toContain("no style page for this context");
  });

  test("app, window title and recipient reach the model", () => {
    const prompt = buildDraftPrompt(
      context({ app: "Slack", windowTitle: "#oslo-migration", recipient: "Ingrid Berg" }),
      null,
    );
    expect(prompt).toContain("Application: Slack");
    expect(prompt).toContain("Window: #oslo-migration");
    expect(prompt).toContain("Writing to: Ingrid Berg");
  });

  test("the page URL reaches the model for web content, and only then", () => {
    const prompt = buildDraftPrompt(
      context({ app: "Google Chrome", url: "https://x.com/sweatystartup/status/1" }),
      null,
    );
    expect(prompt).toContain("Page: https://x.com/sweatystartup/status/1");
    expect(buildDraftPrompt(context(), null)).not.toContain("Page:");
  });

  /**
   * Regenerate's whole job. The context that produced the first draft has not
   * changed, so without the draft itself in front of it the model writes the
   * same sentences again.
   */
  test("a regenerate hands the previous draft over as the thing to avoid", () => {
    const prompt = buildDraftPrompt(
      context({
        previousDraft: "Torsdag passer fint for meg.",
        regenerate: true,
      }),
      null,
    );
    expect(prompt).toContain("another take");
    expect(prompt).toContain("meaningfully different");
    expect(prompt).toContain("do not repeat it");
    expect(prompt).toContain("Torsdag passer fint for meg.");
    expect(prompt).not.toContain("How the user wants it changed");
  });

  /** Guidance revises; it does not restart. */
  test("guidance asks for a revision of the previous draft, not a new one", () => {
    const prompt = buildDraftPrompt(
      context({
        previousDraft: "Torsdag passer fint for meg.",
        guidance: ["warmer"],
      }),
      null,
    );
    expect(prompt).toContain("Revise");
    expect(prompt).toContain("keep everything it did not object to");
    expect(prompt).toContain("Torsdag passer fint for meg.");
    expect(prompt).toContain("- warmer");
    expect(prompt).not.toContain("meaningfully different");
  });

  test("every steer so far is still in force, oldest first", () => {
    const prompt = buildDraftPrompt(
      context({
        previousDraft: "Torsdag passer fint.",
        guidance: ["shorter", "mention the Friday deadline"],
      }),
      null,
    );
    expect(prompt).toContain("the last line is the new one");
    expect(prompt.indexOf("- shorter")).toBeLessThan(
      prompt.indexOf("- mention the Friday deadline"),
    );
  });

  /** A user who steered and then asked for another take wants both. */
  test("a regenerate keeps the steers the user already gave", () => {
    const prompt = buildDraftPrompt(
      context({ previousDraft: "Torsdag passer fint.", guidance: ["warmer"], regenerate: true }),
      null,
    );
    expect(prompt).toContain("still apply");
    expect(prompt).toContain("- warmer");
  });

  /** Empty steers are the user pressing Return on an empty field. */
  test("blank guidance and no previous draft leave the prompt as it was", () => {
    const plain = buildDraftPrompt(context(), null);
    expect(buildDraftPrompt(context({ guidance: ["  ", ""] }), null)).toBe(plain);
    expect(buildDraftPrompt(context({ previousDraft: "" }), null)).toBe(plain);
  });

  /** A window can hold an entire inbox; one press must not send all of it. */
  test("an enormous window is clipped", () => {
    const prompt = buildDraftPrompt(
      context({ windowText: "x\n".repeat(MAX_WINDOW_CHARS) }),
      null,
    );
    expect(prompt.length).toBeLessThan(MAX_WINDOW_CHARS + 2_000);
    expect(prompt).toContain("…");
  });
});

describe("buildDraftPrompt grounding", () => {
  const grounding = {
    indexMap: "wiki/ingrid-berg.md — Ingrid Berg (person): Runs the Oslo office.",
    pages: [{ path: "wiki/ingrid-berg.md", text: "# Ingrid Berg\n\nRuns the Oslo office." }],
  };

  test("prefetched pages are quoted and cited by path", () => {
    const prompt = buildDraftPrompt(context({ recipient: "Ingrid Berg" }), null, grounding);
    expect(prompt).toContain("What memory holds about this correspondent, from `wiki/ingrid-berg.md`");
    expect(prompt).toContain("Runs the Oslo office.");
  });

  test("the index map rides along so the model knows what it can look up", () => {
    const prompt = buildDraftPrompt(context(), null, grounding);
    expect(prompt).toContain("Every page in the user's memory");
    expect(prompt).toContain("wiki/ingrid-berg.md — Ingrid Berg (person)");
  });

  test("no grounding leaves the prompt exactly as it was", () => {
    const bare = buildDraftPrompt(context(), null);
    expect(bare).toBe(buildDraftPrompt(context(), null, { indexMap: null, pages: [] }));
    expect(bare).not.toContain("What memory holds");
    expect(bare).not.toContain("Every page in the user's memory");
  });
});

describe("cleanDraft", () => {
  test("strips a fence that wraps the whole answer", () => {
    expect(cleanDraft("```\nHei Ingrid,\n\nTorsdag passer fint.\n```")).toBe(
      "Hei Ingrid,\n\nTorsdag passer fint.",
    );
    expect(cleanDraft("```markdown\nHello\n```")).toBe("Hello");
  });

  test("strips quotes around the whole answer, but not a real quotation", () => {
    expect(cleanDraft('"Thursday works."')).toBe("Thursday works.");
    expect(cleanDraft('She said "no", so I asked again.')).toBe('She said "no", so I asked again.');
  });

  test("leaves an ordinary draft alone apart from trimming", () => {
    expect(cleanDraft("  Thursday works for me.\n\n")).toBe("Thursday works for me.");
  });
});

// ---- protocol ----

describe("draft requests are validated", () => {
  test("mode is required and closed", () => {
    expect(decodeRequest(JSON.stringify({ type: "draft", id: "d1" }))).toMatchObject({
      ok: false,
      error: { code: "invalid_request" },
    });
    expect(
      decodeRequest(JSON.stringify({ type: "draft", id: "d1", mode: "improvise" })),
    ).toMatchObject({ ok: false, error: { code: "invalid_request" } });
    expect(decodeRequest(JSON.stringify({ type: "draft", id: "d1", mode: "infer" }))).toMatchObject(
      { ok: true, request: { type: "draft", mode: "infer" } },
    );
  });

  test("the context fields are optional strings", () => {
    expect(
      decodeRequest(JSON.stringify({ type: "draft", id: "d1", mode: "infer", app: 7 })),
    ).toMatchObject({ ok: false, error: { code: "invalid_request" } });
    expect(
      decodeRequest(
        JSON.stringify({
          type: "draft",
          id: "d1",
          mode: "rewrite",
          selection: "hi",
          app: "Mail",
          url: "https://x.com/a/status/1",
          recipient: "Ingrid",
        }),
      ),
    ).toMatchObject({
      ok: true,
      request: {
        type: "draft",
        mode: "rewrite",
        selection: "hi",
        app: "Mail",
        url: "https://x.com/a/status/1",
      },
    });
    expect(
      decodeRequest(JSON.stringify({ type: "draft", id: "d1", mode: "infer", url: 7 })),
    ).toMatchObject({ ok: false, error: { code: "invalid_request" } });
  });

  test("the rework fields are an optional string, string array and boolean", () => {
    expect(
      decodeRequest(
        JSON.stringify({
          type: "draft",
          id: "d1",
          mode: "infer",
          previousDraft: "Torsdag passer fint.",
          guidance: ["warmer", "shorter"],
          regenerate: false,
        }),
      ),
    ).toMatchObject({
      ok: true,
      request: { guidance: ["warmer", "shorter"], previousDraft: "Torsdag passer fint." },
    });
    for (const bad of [
      { guidance: "warmer" },
      { guidance: [1] },
      { previousDraft: 3 },
      { regenerate: "yes" },
    ]) {
      expect(
        decodeRequest(JSON.stringify({ type: "draft", id: "d1", mode: "infer", ...bad })),
      ).toMatchObject({ ok: false, error: { code: "invalid_request" } });
    }
  });
});

describe("draft over the protocol", () => {
  function makeSession(env: Record<string, string | undefined> = {}): {
    session: BrainSession;
    memoryRoot: string;
  } {
    const dir = scratch();
    const memoryRoot = join(dir, "memory");
    const session = new BrainSession(dir, {
      ANTHROPIC_API_KEY: undefined,
      OPENAI_API_KEY: undefined,
      MINNE_MEMORY_ROOT: memoryRoot,
      ...env,
    });
    sessions.push(session);
    return { session, memoryRoot };
  }

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

  test("a draft comes back whole, with no deltas to insert half of", async () => {
    const { session } = makeSession({ MINNE_MOCK_REPLY: "Torsdag passer fint. — M." });
    await hello(session);
    await signIn(session);

    const events = await session.request({
      type: "draft",
      id: "d1",
      mode: "instruction",
      fieldText: "decline politely, suggest thursday",
      app: "Mail",
    });
    expect(events.some((event) => event.type === "text_delta")).toBe(false);
    expect(events.at(-1)).toMatchObject({
      type: "done",
      id: "d1",
      result: {
        mode: "instruction",
        text: "Torsdag passer fint. — M.",
        model: "mock-model",
        stylePage: null,
      },
    });
  });

  /**
   * The mock echoes the prompt it was handed, so this asserts on what the model
   * received — the style page's own words, and its path as the citation.
   */
  test("the style page for the app reaches the model", async () => {
    const { session, memoryRoot } = makeSession();
    write(
      memoryRoot,
      "wiki/style/style-mail.md",
      stylePage("Style — Mail", "Opens with 'Hei', signs off 'M.'"),
    );
    await hello(session);
    await signIn(session);

    const events = await session.request({
      type: "draft",
      id: "d1",
      mode: "infer",
      windowText: "From: Ingrid Berg\nSubject: Thursday?",
      app: "Mail",
      recipient: "Ingrid Berg",
    });
    const done = events.at(-1);
    expect(done).toMatchObject({ type: "done", result: { stylePage: "wiki/style/style-mail.md" } });
    const echoed = (done as Extract<BrainEvent, { type: "done" }>).result as { text: string };
    expect(echoed.text).toContain("Opens with 'Hei', signs off 'M.'");
    expect(echoed.text).toContain("`wiki/style/style-mail.md`");
    expect(echoed.text).toContain("From: Ingrid Berg");
  });

  /**
   * The echoing mock again: this is what proves the steer and the draft being
   * revised really travelled over the wire and into the prompt, rather than
   * being dropped somewhere between the panel and the model.
   */
  test("a guided draft carries the steer and the draft it is revising", async () => {
    const { session } = makeSession();
    await hello(session);
    await signIn(session);

    const events = await session.request({
      type: "draft",
      id: "d1",
      mode: "rewrite",
      selection: "i cant make it",
      fieldText: "hi — i cant make it",
      app: "Slack",
      previousDraft: "I can't make it, sorry.",
      guidance: ["warmer", "mention the Friday deadline"],
    });
    const done = events.at(-1);
    expect(done).toMatchObject({ type: "done", id: "d1", result: { mode: "rewrite" } });
    const echoed = (done as Extract<BrainEvent, { type: "done" }>).result as { text: string };
    expect(echoed.text).toContain("I can't make it, sorry.");
    expect(echoed.text).toContain("- warmer");
    expect(echoed.text).toContain("- mention the Friday deadline");
    expect(echoed.text).toContain("Revise");
    // The mode and the context the first press established are untouched.
    expect(echoed.text).toContain("Rewrite the selected passage");
    expect(echoed.text).toContain("i cant make it");
    expect(echoed.text).toContain("Application: Slack");
  });

  test("another take is told what not to repeat", async () => {
    const { session } = makeSession();
    await hello(session);
    await signIn(session);

    const events = await session.request({
      type: "draft",
      id: "d1",
      mode: "infer",
      app: "Mail",
      previousDraft: "Torsdag passer fint for meg.",
      regenerate: true,
    });
    const echoed = (events.at(-1) as Extract<BrainEvent, { type: "done" }>).result as {
      text: string;
    };
    expect(echoed.text).toContain("meaningfully different");
    expect(echoed.text).toContain("Torsdag passer fint for meg.");
  });

  /** The whole round trip the overlay makes: draft, steer, revised draft. */
  test("a draft can be steered and comes back revised", async () => {
    const { session } = makeSession({ MINNE_MOCK_REPLY: "Torsdag passer supert — gleder meg!" });
    await hello(session);
    await signIn(session);

    const first = await session.request({
      type: "draft",
      id: "d1",
      mode: "infer",
      windowText: "From: Ingrid\nThursday?",
      app: "Mail",
    });
    expect(first.at(-1)).toMatchObject({ type: "done", result: { mode: "infer" } });

    const second = await session.request({
      type: "draft",
      id: "d2",
      mode: "infer",
      windowText: "From: Ingrid\nThursday?",
      app: "Mail",
      previousDraft: "Torsdag passer fint.",
      guidance: ["warmer"],
    });
    expect(second.at(-1)).toMatchObject({
      type: "done",
      id: "d2",
      result: { mode: "infer", text: "Torsdag passer supert — gleder meg!" },
    });
  });

  test("a draft may read memory, and says so as it goes", async () => {
    const { session, memoryRoot } = makeSession({
      MINNE_MOCK_SCRIPT: 'TOOL: search_memory {"query":"ingrid"}',
    });
    write(
      memoryRoot,
      "wiki/ingrid-berg.md",
      [
        "---",
        "title: Ingrid Berg",
        "type: person",
        "summary: Runs the Oslo migration.",
        "sources: []",
        "last_updated: 2026-08-17",
        "---",
        "",
        "# Ingrid Berg",
        "",
        "Colleague on the Oslo migration.",
        "",
      ].join("\n"),
    );
    await hello(session);
    await signIn(session);

    const events = await session.request({
      type: "draft",
      id: "d1",
      mode: "infer",
      windowText: "From: Ingrid",
      app: "Mail",
    });
    expect(events).toContainEqual(
      expect.objectContaining({ type: "tool_call", id: "d1", name: "search_memory" }),
    );
    expect(events.at(-1)).toMatchObject({ type: "done", id: "d1" });
  });

  /**
   * The draft agent must not be able to rewrite the wiki while the user waits.
   * Asserted on disk rather than on the tool list: the agent loop reports a
   * call to a tool it does not have as a failed call, so the absence of the
   * page is the property that matters.
   */
  test("a draft cannot write to the wiki", async () => {
    const { session, memoryRoot } = makeSession({
      MINNE_MOCK_SCRIPT: 'TOOL: write_page {"type":"topic","title":"Nope","summary":"no"}',
    });
    await hello(session);
    await signIn(session);

    const events = await session.request({
      type: "draft",
      id: "d1",
      mode: "infer",
      app: "Mail",
    });
    expect(events.at(-1)?.type).toBe("done");
    expect(existsSync(join(memoryRoot, "wiki/nope.md"))).toBe(false);
  });

  test("a draft without a signed-in provider is not_authenticated", async () => {
    const { session } = makeSession();
    await hello(session);
    const events = await session.request({ type: "draft", id: "d1", mode: "infer", app: "Mail" });
    expect(events.at(-1)).toMatchObject({ type: "error", id: "d1", code: "not_authenticated" });
  });

  test("a provider failure is a provider_error, not a crash", async () => {
    const { session } = makeSession();
    await hello(session);
    await signIn(session);
    const events = await session.request({
      type: "draft",
      id: "d1",
      mode: "instruction",
      fieldText: "FAIL: no quota",
      app: "Mail",
    });
    expect(events.at(-1)).toMatchObject({
      type: "error",
      id: "d1",
      code: "provider_error",
      message: expect.stringContaining("no quota"),
    });
  });
});
