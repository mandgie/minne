// The five tools the agent gets over its memory, as pi `AgentTool`s.
//
// Thin on purpose: each tool validates nothing, resolves nothing and writes
// nothing itself — it calls one method on `Memory` (memory.ts) and renders the
// answer as text the model can read. Chat (US-013) and the ingestion pass
// (US-012) hand the same array to their Agent, which is the whole point: one
// interface to memory, one place where its rules live.
//
// Two conventions from pi's agent README:
//   - failures throw; the loop turns a thrown error into a tool result with
//     `isError: true`, which the model sees and can correct.
//   - `details` carries the structured result for logs and the UI, while
//     `content` carries the prose the model reads.
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type, type TSchema } from "typebox";
import { MAX_SUMMARY_CHARS, PAGE_TYPES, LOG_PASSES, type LogPass, type PageType } from "./wiki";
import {
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT,
  type IndexListing,
  type Memory,
  type MemoryScope,
  type MemorySearchResult,
  type PageContents,
} from "./memory";

/** Keeps each tool's parameter types while the array stays heterogeneous. */
function tool<T extends TSchema, D>(definition: AgentTool<T, D>): AgentTool<TSchema, unknown> {
  return definition as unknown as AgentTool<TSchema, unknown>;
}

function text(body: string): { type: "text"; text: string } {
  return { type: "text", text: body };
}

/**
 * Every memory tool, bound to one memory. Order is the order the model sees
 * them in: read before write.
 */
export function memoryTools(memory: Memory): AgentTool<TSchema, unknown>[] {
  return [
    searchMemoryTool(memory),
    readPageTool(memory),
    listIndexTool(memory),
    writePageTool(memory),
    appendLogTool(memory),
  ];
}

/**
 * The tools that only read. What the drafting key (US-018) gets: a draft is
 * something the user is waiting on in another app's text field, so it may
 * consult the memory but must never spend that moment rewriting it.
 */
export function readOnlyMemoryTools(memory: Memory): AgentTool<TSchema, unknown>[] {
  return [searchMemoryTool(memory), readPageTool(memory), listIndexTool(memory)];
}

function searchMemoryTool(memory: Memory) {
  return tool({
    name: "search_memory",
    label: "Search memory",
    description:
      "Search everything Minne remembers: the distilled wiki pages and the raw captures of " +
      "what was on screen. Words are ANDed and matched whole; end a word with * for a prefix " +
      "match. Wiki hits are what the agent has already understood; source hits are evidence, " +
      "cited as `sources/DATE/HHmm-app.md#N` — pass such a citation to read_page to see the " +
      "whole snapshot, and put it in a page's `sources` when you write what you learned.",
    parameters: Type.Object({
      query: Type.String({ description: "Words to look for, e.g. `oslo trip`." }),
      scope: Type.Optional(
        Type.Union([Type.Literal("all"), Type.Literal("wiki"), Type.Literal("sources")], {
          description: "Which layer to search. Default `all`.",
        }),
      ),
      limit: Type.Optional(
        Type.Integer({
          minimum: 1,
          maximum: MAX_SEARCH_LIMIT,
          description: `Most results per layer. Default ${DEFAULT_SEARCH_LIMIT}.`,
        }),
      ),
    }),
    execute: async (_id, params) => {
      const result = memory.search(params.query, {
        ...(params.scope === undefined ? {} : { scope: params.scope as MemoryScope }),
        ...(params.limit === undefined ? {} : { limit: params.limit }),
      });
      return { content: [text(renderSearch(result))], details: result };
    },
  });
}

function readPageTool(memory: Memory) {
  return tool({
    name: "read_page",
    label: "Read page",
    description:
      "Read one file of the memory in full, by its path relative to the memory root: a wiki " +
      "page (`wiki/oslo-trip.md`), `index.md`, `log.md`, `SCHEMA.md`, or a capture under " +
      "`sources/`. A citation like `sources/2026-08-17/1400-mail.md#3` returns that snapshot " +
      "alone. Read a page before rewriting it — write_page replaces what is there.",
    parameters: Type.Object({
      path: Type.String({
        description: "Memory-root-relative path, optionally ending in `#<snapshot number>`.",
      }),
    }),
    execute: async (_id, params) => {
      const page = memory.read(params.path);
      return { content: [text(renderPageContents(page))], details: page };
    },
  });
}

function listIndexTool(memory: Memory) {
  return tool({
    name: "list_index",
    label: "List index",
    description:
      "The map of the wiki: index.md as it stands, plus every page with its type, summary and " +
      "when it was last updated. Call this before creating a page — the subject may already " +
      "have one under a different name.",
    parameters: Type.Object({}),
    execute: async () => {
      const listing = memory.listIndex();
      return { content: [text(renderIndex(listing))], details: listing };
    },
  });
}

function writePageTool(memory: Memory) {
  return tool({
    name: "write_page",
    label: "Write page",
    description:
      "Create or replace one wiki page, and add it to index.md. The frontmatter is written for " +
      "you from these arguments — including `last_updated`, which is always now — so `body` is " +
      "the markdown *after* the frontmatter, starting at the `# Heading`. Omitting `body` on an " +
      "existing page keeps its text and updates only the summary and citations. Cite what you " +
      "learned from: every entry in `sources` must be a `sources/DATE/HHmm-app.md#N` citation. " +
      "Only `wiki/` is writable; a page whose [[links]] do not resolve is refused, so create " +
      "the page you link to first.",
    parameters: Type.Object({
      type: Type.Union(
        PAGE_TYPES.map((type) => Type.Literal(type)),
        { description: "person, project, topic, or daily." },
      ),
      title: Type.String({
        description: "The subject's name, unique in the wiki — this is what [[links]] resolve to.",
      }),
      summary: Type.String({
        maxLength: MAX_SUMMARY_CHARS,
        description:
          `One or two sentences, at most ${MAX_SUMMARY_CHARS} characters, plain prose. This is ` +
          "the line the index and search show; everything else belongs in `body`.",
      }),
      sources: Type.Optional(
        Type.Array(Type.String(), {
          description:
            "Citations this page rests on, e.g. `sources/2026-08-17/1400-mail.md#3`. " +
            "Omitted on an existing page keeps the ones it has.",
        }),
      ),
      body: Type.Optional(
        Type.String({
          description: "Markdown body without frontmatter. Omitted keeps the existing body.",
        }),
      ),
      date: Type.Optional(
        Type.String({ description: "`YYYY-MM-DD`; required for a daily page." }),
      ),
      path: Type.Optional(
        Type.String({
          description:
            "Override the path, which otherwise follows from the title (`wiki/<slug>.md`). " +
            "Use it to update a page search found under a different slug.",
        }),
      ),
    }),
    execute: async (_id, params) => {
      const result = memory.writePage({
        type: params.type as PageType,
        title: params.title,
        summary: params.summary,
        ...(params.sources === undefined ? {} : { sources: params.sources }),
        ...(params.body === undefined ? {} : { body: params.body }),
        ...(params.date === undefined ? {} : { date: params.date }),
        ...(params.path === undefined ? {} : { path: params.path }),
      });
      const lines = [
        `${result.created ? "Created" : "Updated"} ${result.path} (last_updated ${result.lastUpdated}).`,
        `index.md entry ${result.indexEntry}.`,
        ...result.warnings.map((warning) => `warning: ${warning}`),
      ];
      return { content: [text(lines.join("\n"))], details: result };
    },
  });
}

function appendLogTool(memory: Memory) {
  return tool({
    name: "append_log",
    label: "Append to log",
    description:
      "Add one entry to log.md, the diary of what you did to this memory. The timestamp and " +
      "the heading are written for you. Write a sentence or two in plain prose, with [[links]] " +
      "to the pages you touched — links must resolve, so write the pages first.",
    parameters: Type.Object({
      pass: Type.Union(
        LOG_PASSES.map((pass) => Type.Literal(pass)),
        { description: "What kind of pass this was: sync, lint, chat, or bootstrap." },
      ),
      message: Type.String({ description: "What you did, in prose." }),
    }),
    execute: async (_id, params) => {
      const result = memory.appendLog(params.pass as LogPass, params.message);
      const lines = [
        `Logged "${result.timestamp} — ${result.pass}" to ${result.path}.`,
        ...result.warnings.map((warning) => `warning: ${warning}`),
      ];
      return { content: [text(lines.join("\n"))], details: result };
    },
  });
}

// ---- rendering ----

export function renderSearch(result: MemorySearchResult): string {
  const wiki = result.results.filter((hit) => hit.kind === "wiki");
  const sources = result.results.filter((hit) => hit.kind === "source");
  const header =
    `"${result.query}": ${wiki.length} wiki page${wiki.length === 1 ? "" : "s"} of ` +
    `${result.scannedPages} scanned, ${sources.length} snapshot${sources.length === 1 ? "" : "s"} of ` +
    `${result.indexedSnapshots} captured` +
    (result.scope === "all" || result.sourcesAvailable ? "" : " (nothing captured yet)");
  const lines = [header];
  for (const hit of result.results) {
    if (hit.kind === "wiki") {
      lines.push("", `[wiki] ${hit.path} — ${hit.title} (${hit.type})`, `  ${hit.summary}`);
      if (hit.snippet !== "") lines.push(`  ${hit.snippet}`);
    } else {
      lines.push(
        "",
        `[source] ${hit.source} — ${hit.app} · ${hit.title} · ${hit.capturedAt}`,
        `  ${hit.snippet}`,
      );
    }
  }
  if (result.results.length === 0) lines.push("", "No matches.");
  return lines.join("\n");
}

export function renderPageContents(page: PageContents): string {
  return `${page.path} (${page.kind})\n\n${page.text}`;
}

export function renderIndex(listing: IndexListing): string {
  if (listing.index === null && listing.pages.length === 0) {
    return "This memory has no wiki yet — no index.md, no pages.";
  }
  const summary = Object.entries(listing.counts)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");
  const rows = listing.pages.map(
    (page) =>
      `${page.path} — ${page.title ?? "(no title)"} (${page.type ?? "?"}, ${page.sources} ` +
      `citation${page.sources === 1 ? "" : "s"}, updated ${page.lastUpdated ?? "never"})\n` +
      `  ${page.summary ?? ""}`,
  );
  return [
    `${listing.pages.length} pages${summary === "" ? "" : `: ${summary}`}`,
    "",
    ...(rows.length === 0 ? ["(no pages yet)"] : rows),
    "",
    "--- index.md ---",
    listing.index ?? "(missing)",
  ].join("\n");
}
