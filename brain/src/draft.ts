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
import type { StreamFn } from "@earendil-works/pi-agent-core";
import type { Api, Model } from "@earendil-works/pi-ai";
import { NotFoundError, type Memory } from "./memory";
import { readOnlyMemoryTools } from "./memory-tools";
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

export interface DraftResult {
  mode: DraftMode;
  text: string;
  model: string;
  stopReason: string;
  /** the style page the prompt cited, or null when the user has none yet */
  stylePage: string | null;
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
/** Tool round trips a draft gets. It is a reply, not a research project. */
export const MAX_DRAFT_TURNS = 6;

const DRAFT_SYSTEM_PROMPT = `You are Minne's drafting key. The user pressed a key in a text
field somewhere on their Mac and you are writing the text that will be inserted
into that field, in their voice.

Your entire reply is inserted verbatim. So:

- Write only the text that belongs in the field. No preamble, no "here is a
  draft", no explanation, no sign-off from you, no surrounding quotes and no
  markdown code fences.
- Match the register of where it is going. A chat message is not an email; a
  commit message is not a paragraph. Length follows the context, and short is
  almost always right.
- Write in the language of the surrounding text.
- If a style page for this context is quoted below, it is the record of how this
  user actually writes. Follow it over your own instincts.

You have read-only tools over the user's memory (a markdown wiki of people,
projects and topics distilled from what has been on their screen). Use them when
the draft turns on a fact you do not have — who someone is, what a project's
state is, what was decided. One or two searches at most; a draft the user is
waiting on is not the place for a research pass. Never invent a fact about a
person or a commitment on the user's behalf: if you do not know, write the
sentence so it does not need to be known.`;

/**
 * The style page for this context, most specific first: the one for this app
 * and this recipient, else the one for the app.
 *
 * Reading rather than searching is deliberate — the page's name follows from
 * the context by rule (`stylePagePaths`), so there is nothing to search for,
 * and a draft must not spend a tool call on it.
 */
export function findStylePage(
  memory: Memory,
  app: string,
  recipient?: string,
): StylePage | null {
  for (const path of stylePagePaths(app, recipient)) {
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
      "not mentioned are fine as they are. Return the revised text only.",
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
export function buildDraftPrompt(context: DraftContext, style: StylePage | null): string {
  const where = [`Application: ${context.app}`];
  if (context.windowTitle !== undefined && context.windowTitle.trim() !== "") {
    where.push(`Window: ${context.windowTitle}`);
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
          "from; improve how it reads. Return the replacement passage only.",
      );
      lines.push(...block("Selected passage", selection));
      if (field.trim() !== "" && field.trim() !== selection.trim()) {
        lines.push(...block("The whole field it sits in", field));
      }
      break;
    case "instruction":
      lines.push(
        "The field currently holds an instruction to you, not text the user " +
          "wants to keep. Carry it out and return what should replace it.",
      );
      lines.push(...block("Instruction", field));
      break;
    case "infer":
      lines.push(
        "The field is empty. Write what the user would plausibly type here " +
          "next, inferred from what is on screen around it and from your " +
          "memory of them. Return that text only.",
      );
      break;
  }

  lines.push(...reworkLines(context));
  lines.push("", "Where this is being typed:", ...where.map((line) => `- ${line}`));
  if (window.trim() !== "") {
    lines.push(...block("What the rest of the window says", window));
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
  const style = findStylePage(deps.memory, context.app, context.recipient);
  let turns = 0;
  const agent = new Agent({
    initialState: {
      systemPrompt: DRAFT_SYSTEM_PROMPT,
      model: deps.model,
      tools: readOnlyMemoryTools(deps.memory),
    },
    streamFn: deps.streamFn,
    shouldStopAfterTurn: () => ++turns >= MAX_DRAFT_TURNS,
  });
  if (deps.onTool !== undefined) {
    const onTool = deps.onTool;
    agent.subscribe((event) => {
      if (event.type === "tool_execution_start") onTool(event.toolName);
    });
  }
  const stop = () => agent.abort();
  deps.signal?.addEventListener("abort", stop, { once: true });
  try {
    deps.signal?.throwIfAborted();
    await agent.prompt(buildDraftPrompt(context, style));
  } finally {
    deps.signal?.removeEventListener("abort", stop);
  }

  // Provider failures do not reject `prompt()`; they arrive as a final
  // assistant message with stopReason "error" (GOTCHAS, US-004).
  const last = agent.state.messages.at(-1);
  if (last === undefined || !("role" in last) || last.role !== "assistant") {
    throw new DraftFailedError("the model produced no message");
  }
  if (last.stopReason === "error") {
    throw new DraftFailedError(last.errorMessage ?? "provider request failed");
  }
  if (last.stopReason === "aborted") {
    throw new DraftFailedError(last.errorMessage ?? "draft aborted");
  }

  let text = "";
  for (const message of agent.state.messages) {
    if (message.role !== "assistant") continue;
    for (const part of message.content) {
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
    usage: {
      input: last.usage.input,
      output: last.usage.output,
      totalTokens: last.usage.totalTokens,
    },
  };
}
