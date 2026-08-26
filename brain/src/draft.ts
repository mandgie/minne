// The Minne key's other half: turning what the Swift app read at the caret
// into the text it will insert there.
//
// The split is FR-6's, exactly: Swift owns Accessibility and so it is Swift
// that knows what is in the field, what is selected, and what the window says.
// The brain owns the model, so it is the brain that decides what to say. This
// file is everything in between — which prompt those three modes get, and which
// `style/` page the user's own tone comes from.
//
// Everything here except `runDraft` is pure, because a prompt is the part of an
// LLM feature that can actually be tested: `buildDraftPrompt` takes values and
// returns a string, and `draft.test.ts` reads that string.
import { Agent } from "@earendil-works/pi-agent-core";
import type { AgentTool, StreamFn } from "@earendil-works/pi-agent-core";
import type { Api, AssistantMessage, Model } from "@earendil-works/pi-ai";
import { Type, type TSchema } from "typebox";
import { NotFoundError, type Memory } from "./memory";
import { readOnlyMemoryTools } from "./memory-tools";
import { EmptyQueryError } from "./sources";
import { stylePagePaths } from "./wiki";

/**
 * Which of the three things the user asked for, decided by the app from the
 * Accessibility state at the moment the key was pressed (see
 * `DraftMode.detect` in app/Sources/Minne/DraftContext.swift):
 *
 *   rewrite     — there is a selection; it is replaced by a better version.
 *   instruction — the field holds an instruction; it is replaced by the result.
 *   infer       — the field is empty; the reply comes from the window and memory.
 */
export const DRAFT_MODES = ["instruction", "rewrite", "infer"] as const;
export type DraftMode = (typeof DRAFT_MODES)[number];

/** What the app read at the caret, as the brain receives it. */
export interface DraftContext {
  mode: DraftMode;
  /** the whole field's text; the instruction, in instruction mode */
  fieldText: string;
  /** the selected text, in rewrite mode */
  selection: string;
  /** the rest of the window, read via AX at press time */
  windowText: string;
  /** the app's own name, e.g. "Mail" — also the style page's context */
  app: string;
  bundleId?: string;
  windowTitle?: string;
  /**
   * The page's address for web content, query/fragment already stripped by
   * the app. "Google Chrome" says nothing about register; x.com vs github.com
   * is the context that matters — so the domain outranks the browser as the
   * style page's context, and the prompt states the page outright.
   */
  url?: string;
  /** person or channel being written to, when the app's title gives one away */
  recipient?: string;
  /**
   * The draft the user is looking at, when this press reworks it. Every draft
   * is a fresh Agent with no transcript, so a rework only knows what it wrote
   * last time because the app sends it back.
   */
  previousDraft?: string;
  /** the user's steers so far, oldest first; the last one is the new one */
  guidance?: string[];
  /** the user asked for another take, not a revision */
  regenerate?: boolean;
}

/** The style page a draft is written to sound like. */
export interface StylePage {
  /** memory-root-relative path, cited in the prompt */
  path: string;
  text: string;
}

/** A wiki page prefetched into the prompt, cited by path. */
export interface MemoryExcerpt {
  path: string;
  text: string;
}

/**
 * What the prompt is grounded in beyond the press itself: pages about the
 * correspondent, prefetched so the common case needs no tool round trip, and
 * a map of the wiki so the model knows what a search could find. Both come
 * from local file reads — grounding a draft this way costs milliseconds,
 * where a tool turn costs a whole model round trip.
 */
export interface MemoryGrounding {
  /** one line per wiki page; null when the memory has no pages yet */
  indexMap: string | null;
  pages: MemoryExcerpt[];
}

const NO_GROUNDING: MemoryGrounding = { indexMap: null, pages: [] };

export interface DraftResult {
  mode: DraftMode;
  text: string;
  model: string;
  stopReason: string;
  /** the style page the prompt cited, or null when the user has none yet */
  stylePage: string | null;
  /** wiki pages prefetched into the prompt for the correspondent */
  memoryPages: string[];
  usage: { input: number; output: number; totalTokens: number };
}

/** The model failed, or refused; surfaces as a `provider_error`. */
export class DraftFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DraftFailedError";
  }
}

/** Ceilings on what one press may send. A window can hold a whole inbox. */
export const MAX_WINDOW_CHARS = 6_000;
export const MAX_FIELD_CHARS = 4_000;
/** Wiki pages prefetched for the correspondent, and how much of each. */
export const MAX_MEMORY_PAGES = 2;
export const MAX_MEMORY_PAGE_CHARS = 2_000;
/** The index map's ceiling — one line per page, a big wiki still fits. */
export const MAX_INDEX_MAP_CHARS = 4_000;
/**
 * Tool round trips a draft gets. Enough to search and read a handful of
 * pages — the user has said a right draft beats a fast one — but still a
 * bound: it is a reply, not a research project.
 */
export const MAX_DRAFT_TURNS = 10;

const DRAFT_SYSTEM_PROMPT = `You are Minne's drafting key. The user pressed a key in a text
field somewhere on their Mac and you are writing the text that will be inserted
into that field, in their voice.

Deliver the draft by calling submit_draft with exactly the text to insert —
that text alone reaches the field, verbatim. Nothing else you write is ever
shown to the user, so think in plain text as freely as you like, then submit.
So:

- Submit only the text that belongs in the field. No preamble, no "here is a
  draft", no explanation, no sign-off from you, no surrounding quotes and no
  markdown code fences.
- Match the register of where it is going. A chat message is not an email; a
  commit message is not a paragraph. Length follows the context, and short is
  almost always right.
- Write in the language of the surrounding text.
- If a style page for this context is quoted below, it is the record of how this
  user actually writes. Follow it over your own instincts.

You have read-only tools over the user's memory (a markdown wiki of people,
projects and topics distilled from what has been on their screen), and the
prompt below may quote pages from it, along with a map of every page it holds.
This user prefers a right draft over a fast one: when the draft turns on a
fact — who someone is, what a project's state is, what was agreed, what
happened last time — and the quoted pages do not settle it, look it up before
writing, and read the page rather than trusting a search snippet. Never invent
a fact about a person or a commitment on the user's behalf: if memory cannot
settle it either, write the sentence so it does not need to be known.`;

/**
 * The registrable part of a sanitized page URL — "x.com" from
 * "https://www.x.com/foo" — or null when there is no usable host. The `www.`
 * prefix is dropped because it never distinguishes a register.
 */
export function domainOf(url?: string): string | null {
  if (url === undefined) return null;
  let host: string | undefined;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  const domain = host.replace(/^www\./, "");
  return domain === "" ? null : domain;
}

/**
 * The style page for this context, most specific first: the domain narrowed
 * to this recipient, the domain, the app narrowed to the recipient, the app.
 *
 * The domain outranks the app for web content because a browser is not a
 * register — how the user writes on x.com and on github.com differ the way
 * Slack and Mail differ, while "Google Chrome" lumps them together.
 *
 * Reading rather than searching is deliberate — the page's name follows from
 * the context by rule (`stylePagePaths`), so there is nothing to search for,
 * and a draft must not spend a tool call on it.
 */
export function findStylePage(
  memory: Memory,
  app: string,
  recipient?: string,
  domain?: string | null,
): StylePage | null {
  const paths =
    domain === undefined || domain === null
      ? stylePagePaths(app, recipient)
      : [...stylePagePaths(domain, recipient), ...stylePagePaths(app, recipient)];
  for (const path of paths) {
    try {
      const page = memory.read(path, { maxChars: 4_000 });
      return { path: page.path, text: page.text };
    } catch (err) {
      if (err instanceof NotFoundError) continue;
      throw err;
    }
  }
  return null;
}

/**
 * The wiki pages about the person being written to, prefetched by searching
 * the recipient's name.
 *
 * Unlike the style page there is no path rule for "the page about Ingrid" —
 * her page is named whatever the wiki named it — so this is the one prefetch
 * that searches. Style pages are skipped: `findStylePage` already injects the
 * right one by rule, and a name search would surface them again. A recipient
 * whose name has no searchable words ("…", an emoji) is simply nobody to look
 * up, not an error.
 */
export function findMemoryPages(memory: Memory, recipient?: string): MemoryExcerpt[] {
  if (recipient === undefined || recipient.trim() === "") return [];
  let hits;
  try {
    hits = memory.search(recipient, { scope: "wiki", limit: MAX_MEMORY_PAGES + 1 }).results;
  } catch (err) {
    if (err instanceof EmptyQueryError) return [];
    throw err;
  }
  const excerpts: MemoryExcerpt[] = [];
  for (const hit of hits) {
    if (excerpts.length >= MAX_MEMORY_PAGES) break;
    if (hit.kind !== "wiki" || hit.path.startsWith("wiki/style/")) continue;
    try {
      const page = memory.read(hit.path, { maxChars: MAX_MEMORY_PAGE_CHARS });
      excerpts.push({ path: page.path, text: page.text });
    } catch (err) {
      if (err instanceof NotFoundError) continue;
      throw err;
    }
  }
  return excerpts;
}

/**
 * One line per wiki page — path, title, type, summary — so the model can see
 * what memory holds without spending a turn on `list_index`. Null when the
 * wiki has no pages yet: an empty map teaches nothing and earns no block.
 */
export function memoryIndexMap(memory: Memory): string | null {
  const listing = memory.listIndex();
  if (listing.pages.length === 0) return null;
  const rows = listing.pages.map(
    (page) =>
      `${page.path} — ${page.title ?? "(no title)"} (${page.type ?? "?"}): ${page.summary ?? ""}`,
  );
  return clip(rows.join("\n"), MAX_INDEX_MAP_CHARS);
}

/** Trims to `limit` characters on a line boundary where it can. */
function clip(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const newline = cut.lastIndexOf("\n");
  return `${newline > limit / 2 ? cut.slice(0, newline) : cut}\n…`;
}

/** A fenced block, so the model can tell the user's text from our instructions. */
function block(label: string, text: string): string[] {
  return ["", `${label}:`, "```", text, "```"];
}

/**
 * The part of the prompt that exists because the user has seen a draft already
 * and asked for something else.
 *
 * Two jobs, and keeping them apart is the whole point. **Regenerate** wants a
 * genuinely different attempt, so the previous draft goes in as the thing to
 * avoid; without it the model writes the same sentences again, because the
 * context that produced them has not changed. **Guidance** wants the draft it
 * already has, changed in one respect — so the previous draft goes in as the
 * thing to keep, and the steer says what to move. Any earlier steers are still
 * in force in both cases: a user who asked for "shorter" and then "warmer"
 * wants both.
 */
function reworkLines(context: DraftContext): string[] {
  const previous = clip(context.previousDraft ?? "", MAX_FIELD_CHARS).trim();
  const steers = (context.guidance ?? []).map((line) => line.trim()).filter((line) => line !== "");
  if (previous === "" && steers.length === 0) return [];

  const lines: string[] = [];
  if (previous === "") {
    // No draft to work from — the steers are simply extra instructions.
    lines.push("", "The user also asked for this, and it applies to what you write:");
    lines.push(...steers.map((steer) => `- ${steer}`));
    return lines;
  }

  if (context.regenerate === true) {
    lines.push(
      "",
      "You already wrote the draft below and the user asked for another take. " +
        "Write a meaningfully different one: a different angle, a different " +
        "opening, a different shape. Do not repeat it or paraphrase it back. " +
        "It must still do the same job for the same reader.",
    );
    lines.push(...block("The draft you already wrote — do not repeat it", previous));
    if (steers.length > 0) {
      lines.push("", "These instructions from the user still apply:");
      lines.push(...steers.map((steer) => `- ${steer}`));
    }
    return lines;
  }

  lines.push(
    "",
    "You already wrote the draft below and the user has steered it. Revise " +
      "that draft: change what the guidance asks for and keep everything it " +
      "did not object to — the wording, the facts and the length that were " +
      "not mentioned are fine as they are. Submit the revised text.",
  );
  lines.push(...block("The draft so far", previous));
  lines.push(
    "",
    steers.length === 1
      ? "How the user wants it changed:"
      : "How the user wants it changed, oldest first — the last line is the new one:",
  );
  lines.push(...steers.map((steer) => `- ${steer}`));
  return lines;
}

/**
 * The user turn for one press. What varies between the modes is not the tone
 * but the *job*, so each mode gets its own instruction and its own idea of what
 * the field text means — an instruction to follow, a passage to rewrite, or
 * nothing at all.
 */
export function buildDraftPrompt(
  context: DraftContext,
  style: StylePage | null,
  grounding: MemoryGrounding = NO_GROUNDING,
): string {
  const where = [`Application: ${context.app}`];
  if (context.windowTitle !== undefined && context.windowTitle.trim() !== "") {
    where.push(`Window: ${context.windowTitle}`);
  }
  if (context.url !== undefined && context.url.trim() !== "") {
    where.push(`Page: ${context.url}`);
  }
  if (context.recipient !== undefined && context.recipient.trim() !== "") {
    where.push(`Writing to: ${context.recipient}`);
  }

  const lines: string[] = [];
  const field = clip(context.fieldText, MAX_FIELD_CHARS);
  const selection = clip(context.selection, MAX_FIELD_CHARS);
  const window = clip(context.windowText, MAX_WINDOW_CHARS);

  switch (context.mode) {
    case "rewrite":
      lines.push(
        "Rewrite the selected passage below. Keep what it means and who it is " +
          "from; improve how it reads. Submit the replacement passage.",
      );
      lines.push(...block("Selected passage", selection));
      if (field.trim() !== "" && field.trim() !== selection.trim()) {
        lines.push(...block("The whole field it sits in", field));
      }
      break;
    case "instruction":
      lines.push(
        "The field currently holds an instruction to you, not text the user " +
          "wants to keep. Carry it out and submit what should replace it.",
      );
      lines.push(...block("Instruction", field));
      break;
    case "infer":
      lines.push(
        "The field is empty. Write what the user would plausibly type here " +
          "next, inferred from what is on screen around it and from your " +
          "memory of them. Submit that text.",
      );
      break;
  }

  lines.push(...reworkLines(context));
  lines.push("", "Where this is being typed:", ...where.map((line) => `- ${line}`));
  if (window.trim() !== "") {
    lines.push(...block("What the rest of the window says", window));
  }
  for (const page of grounding.pages) {
    lines.push(
      "",
      `What memory holds about this correspondent, from \`${page.path}\` — use ` +
        "what is relevant, ignore the rest:",
      "```",
      page.text,
      "```",
    );
  }
  if (grounding.indexMap !== null) {
    lines.push(
      ...block(
        "Every page in the user's memory, so you know what the tools can look up",
        grounding.indexMap,
      ),
    );
  }
  if (style !== null) {
    lines.push(
      "",
      `How this user writes here, from \`${style.path}\` — follow it:`,
      "```",
      style.text,
      "```",
    );
  } else {
    lines.push(
      "",
      "Minne has no style page for this context yet, so match the tone of the " +
        "surrounding text instead.",
    );
  }
  return lines.join("\n");
}

/**
 * The delivery channel: the draft is what the model passes to this tool, and
 * nothing else. Free text turned out to be an unreliable deliverable — the
 * model reasons in prose exactly on the hard drafts ("Now I have the style.
 * … Let me check what he'd credibly claim", 2026-08-26, into a live X reply
 * box), and a prompt can only discourage that, not prevent it. A tool call
 * is a hard boundary: commentary stays commentary, and only the submitted
 * text can reach the field.
 */
function submitDraftTool(receive: (text: string) => void): AgentTool<TSchema, unknown> {
  const definition: AgentTool<ReturnType<typeof Type.Object>, unknown> = {
    name: "submit_draft",
    label: "Submit draft",
    description:
      "Deliver the finished draft. The `text` you pass is inserted into the user's field " +
      "verbatim, and it is the only thing that ever is — call this exactly once, when the " +
      "draft is ready.",
    parameters: Type.Object({
      text: Type.String({ description: "The exact text to insert into the field." }),
    }),
    execute: async (_id, params) => {
      receive(params["text"] as string);
      return { content: [{ type: "text", text: "Draft received." }], details: {} };
    },
  };
  return definition as unknown as AgentTool<TSchema, unknown>;
}

/**
 * Everything a model wraps a draft in that the field must not receive: a
 * markdown fence, or the whole answer in quotes. Only stripped when it wraps
 * the *entire* reply — a draft that legitimately opens with a quotation keeps
 * it.
 */
export function cleanDraft(raw: string): string {
  let text = raw.trim();
  const fence = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(text);
  if (fence) text = (fence[1] as string).trim();
  const quoted = /^"([\s\S]*)"$/.exec(text);
  if (quoted && !(quoted[1] as string).includes('"')) text = (quoted[1] as string).trim();
  return text;
}

export interface RunDraftDeps {
  memory: Memory;
  model: Model<Api>;
  streamFn: StreamFn;
  signal?: AbortSignal;
  /** called with each tool the draft reaches for, for the overlay's progress line */
  onTool?: (name: string) => void;
  log?: (...args: unknown[]) => void;
}

/**
 * One draft. A fresh Agent every time and read-only tools: a draft must never
 * inherit the chat session's transcript (it is a different job in a different
 * app) and must never write to the wiki (the user is waiting on a field, not on
 * a memory pass).
 */
export async function runDraft(
  context: DraftContext,
  deps: RunDraftDeps,
): Promise<DraftResult> {
  const style = findStylePage(deps.memory, context.app, context.recipient, domainOf(context.url));
  const grounding: MemoryGrounding = {
    indexMap: memoryIndexMap(deps.memory),
    pages: findMemoryPages(deps.memory, context.recipient),
  };
  let turns = 0;
  let submitted: string | null = null;
  const agent = new Agent({
    initialState: {
      systemPrompt: DRAFT_SYSTEM_PROMPT,
      model: deps.model,
      tools: [
        ...readOnlyMemoryTools(deps.memory),
        submitDraftTool((text) => {
          submitted = text;
        }),
      ],
    },
    streamFn: deps.streamFn,
    // The turn that submits is the last one — the draft is delivered, and
    // another turn could only spend tokens or resubmit.
    shouldStopAfterTurn: () => {
      turns++;
      return submitted !== null || turns >= MAX_DRAFT_TURNS;
    },
  });
  if (deps.onTool !== undefined) {
    const onTool = deps.onTool;
    agent.subscribe((event) => {
      if (event.type === "tool_execution_start") onTool(event.toolName);
    });
  }
  const stop = () => agent.abort();
  deps.signal?.addEventListener("abort", stop, { once: true });
  const prompt = buildDraftPrompt(context, style, grounding);
  // The exact user turn the provider receives, for verifying what a press
  // sends without a TLS proxy. Debug-only: the window text and memory
  // excerpts land in the log, so never default this on.
  if (process.env["MINNE_LOG_DRAFT_PROMPT"] === "1") {
    deps.log?.(`draft prompt as sent:\n${prompt}`);
  }
  const lastAssistant = () =>
    agent.state.messages.findLast(
      (message): message is AssistantMessage => "role" in message && message.role === "assistant",
    );
  let beforeRecovery: AssistantMessage | undefined;
  try {
    deps.signal?.throwIfAborted();
    await agent.prompt(prompt);
    beforeRecovery = lastAssistant();
    // No submission yet — the model finished talking without the tool, or the
    // turn cap cut it off mid-exploration. One recovery turn: with the cap
    // already spent, shouldStopAfterTurn ends the loop after exactly one more
    // model reply, so this is a single bounded round trip, not a second loop.
    // The recovery reply itself is never a fallback text source — only a
    // submission from it counts, else the pre-recovery message decides.
    if (submitted === null && !["error", "aborted"].includes(beforeRecovery?.stopReason ?? "")) {
      deps.signal?.throwIfAborted();
      await agent.prompt(
        "You have not called submit_draft, so nothing has reached the user's " +
          "field. Call submit_draft now with exactly the final text to insert, " +
          "written from what you already know — no other tools, no prose.",
      );
    }
  } finally {
    deps.signal?.removeEventListener("abort", stop);
  }

  // Provider failures do not reject `prompt()`; they arrive as a final
  // assistant message with stopReason "error" (GOTCHAS, US-004). When the
  // loop stopped right after a submit, the transcript ends on that tool's
  // result instead, so the assistant message is found, not assumed last.
  const last = lastAssistant();
  if (last === undefined) {
    throw new DraftFailedError("the model produced no message");
  }
  if (last.stopReason === "error") {
    throw new DraftFailedError(last.errorMessage ?? "provider request failed");
  }
  if (last.stopReason === "aborted") {
    throw new DraftFailedError(last.errorMessage ?? "draft aborted");
  }

  // The draft is what the model submitted — the tool is the only channel into
  // the field, so plan prose can never ride along with the draft. Without a
  // submission, a plain-text answer is honored only from the message the
  // model *finished* before the recovery nudge (stopReason "stop"): that
  // message is its answer. A draft still mid-tool-use there ran out of turns,
  // and its text is a plan, not a draft — "Let me check the snapshots between
  // 17:58 and now" went into a live field that way (2026-08-26) — so it
  // fails instead of inserting reasoning.
  let text: string = submitted ?? "";
  if (text === "") {
    if (beforeRecovery === undefined || beforeRecovery.stopReason !== "stop") {
      throw new DraftFailedError(
        "the draft spent all its turns reading memory and never submitted any text",
      );
    }
    for (const part of beforeRecovery.content) {
      if (part.type === "text") text += part.text;
    }
  }
  const draft = cleanDraft(text);
  if (draft === "") throw new DraftFailedError("the model returned an empty draft");
  return {
    mode: context.mode,
    text: draft,
    model: last.model,
    stopReason: last.stopReason,
    stylePage: style?.path ?? null,
    memoryPages: grounding.pages.map((page) => page.path),
    usage: {
      input: last.usage.input,
      output: last.usage.output,
      totalTokens: last.usage.totalTokens,
    },
  };
}
