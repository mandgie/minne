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
import {
  MAX_SUMMARY_CHARS,
  PAGE_TYPES,
  LOG_PASSES,
  pagePath,
  type LogPass,
  type PageType,
} from "./wiki";
import {
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT,
  type IndexEntry,
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
      "The map of the wiki: one line per page, grouped by type — the title and the first " +
      "sentence of its summary. Call this before creating a page — the subject may already " +
      "have one under a different name, and updating that page is almost always right. A page " +
      "whose file is not where its title would put it shows its path in brackets; pass that " +
      "as `path` to write_page. Pass `type` to see one kind of page only.",
    parameters: Type.Object({
      type: Type.Optional(
        Type.Union(
          PAGE_TYPES.map((type) => Type.Literal(type)),
          { description: "Only pages of this type. Default: every page." },
        ),
      ),
    }),
    execute: async (_id, params) => {
      const listing = memory.listIndex();
      const options = params.type === undefined ? {} : { type: params.type as string };
      return { content: [text(renderIndex(listing, options))], details: listing };
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

/** Group order in the map: who and what first, the diaries last. */
const INDEX_GROUP_ORDER: readonly string[] = ["person", "project", "topic", "style", "daily"];

/** Characters of summary shown per line in the map — a label, not the page. */
export const INDEX_LINE_CHARS = 160;

/**
 * The first sentence of a summary, cut to `INDEX_LINE_CHARS`. The map exists
 * to answer "is there a page for this already?", which the opening clause
 * settles; the rest of the summary is one read_page away.
 */
export function indexLabel(summary: string | null): string {
  if (summary === null) return "";
  const text = summary.replace(/\s+/g, " ").trim();
  const sentence = /^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text;
  const label = sentence.length >= 40 ? sentence : text;
  if (label.length <= INDEX_LINE_CHARS) return label;
  const cut = label.lastIndexOf(" ", INDEX_LINE_CHARS - 1);
  return `${label.slice(0, cut > 40 ? cut : INDEX_LINE_CHARS - 1).trimEnd()}…`;
}

/**
 * The map of the wiki as the model reads it: a count line, then one line per
 * page grouped by type — `- Title — first sentence`. The path is added only
 * when it cannot be derived from the title (a renamed page, a hand-made file),
 * because that is the one case write_page needs it. index.md is not repeated
 * here: it lists the same pages with the same summaries, and the model reads
 * this map before every ingestion batch, so every byte in it is paid for
 * hundreds of times a day. Wanting the human file is what read_page is for.
 */
export function renderIndex(listing: IndexListing, options: { type?: string } = {}): string {
  if (listing.index === null && listing.pages.length === 0) {
    return "This memory has no wiki yet — no index.md, no pages.";
  }
  const pages =
    options.type === undefined
      ? listing.pages
      : listing.pages.filter((page) => page.type === options.type);
  const summary = Object.entries(listing.counts)
    .sort(([a], [b]) => groupRank(a) - groupRank(b) || a.localeCompare(b))
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");
  const groups = new Map<string, IndexEntry[]>();
  for (const page of pages) {
    const type = page.type ?? "unknown";
    groups.set(type, [...(groups.get(type) ?? []), page]);
  }
  const sections = [...groups.entries()]
    .sort(([a], [b]) => groupRank(a) - groupRank(b) || a.localeCompare(b))
    .flatMap(([type, entries]) => [
      "",
      `## ${type} (${entries.length})`,
      ...entries
        .sort((a, b) => (a.title ?? a.path).localeCompare(b.title ?? b.path))
        .map((page) => indexLine(page)),
    ]);
  const head =
    options.type === undefined
      ? `${listing.pages.length} pages${summary === "" ? "" : `: ${summary}`}`
      : `${pages.length} of ${listing.pages.length} pages (type ${options.type})`;
  return [head, ...(pages.length === 0 ? ["", "(no pages)"] : sections)].join("\n");
}

function groupRank(type: string): number {
  const rank = INDEX_GROUP_ORDER.indexOf(type);
  return rank === -1 ? INDEX_GROUP_ORDER.length : rank;
}

function indexLine(page: IndexEntry): string {
  const title = page.title ?? "(no title)";
  const label = indexLabel(page.summary);
  const derivable =
    page.title !== null &&
    PAGE_TYPES.includes(page.type as PageType) &&
    pagePath(page.type as PageType, page.title) === page.path;
  const where = derivable ? "" : ` [${page.path}]`;
  return `- ${title}${label === "" ? "" : ` — ${label}`}${where}`;
}
