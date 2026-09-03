# Memory extraction and storage audit — 2026-09-03

Three independent reviewers (Fable, Opus, Sonnet), working in silos, audited how
Minne extracts and stores memory and compared it with the 2025–2026 state of the
art. This document is the synthesis. Every live-wiki number below was re-measured
by the lead against `~/Minne` on 2026-09-03; every code pointer was re-read.

## Verdict

**The architecture is state of the art. The write path is not, and the live wiki
is visibly degrading after 13 days of use.**

All three reviewers reached the same shape of verdict independently. The
three-layer design (immutable cited sources, agent-owned markdown wiki,
human-owned schema, index, log, lint) is where the field converged in 2026:
Letta's Context Repositories (Feb 2026), Anthropic's memory tool, Claude Code
auto-memory, and Karpathy's LLM-wiki gist (Apr 2026) all landed on the same
shape. Minne additionally has per-claim provenance to immutable evidence, which
none of them have.

What is missing is everything between "a snapshot exists" and "a page is
written": no salience gate before the model, no update primitive, no
dedup/entity resolution, no temporal validity, no consolidation, and no index
over the wiki. Karpathy's own gist says the single `index.md` stops working past
a few hundred pages. Minne is at 241 pages and the thing that broke first is
exactly `index.md`.

## The live wiki, measured

| Measure | Value |
| --- | --- |
| Wiki pages | 241 (+12 daily, +12 style) |
| By type | 214 topic · 14 person · 13 project |
| Pages whose slug ends in a date | ~80 |
| Pages prefixed `kaggriculture` | 28 |
| `index.md` | 349 KB, one entry is 25.7 KB on a single line |
| `list_index` tool output (rows + index.md) | ~712 KB ≈ 178k tokens, called first in every batch |
| `log.md` | 1.3 MB, ~1,570 entries (one per batch by prompt design) |
| Summaries under 300 chars | 4 of 241 (schema says "one or two sentences") |
| Summaries over 2,000 chars | 17 |
| Pages over the 40 KB read cap | 43 (largest 47 KB) |
| Pages with leaked tool-call markup in the summary | 10 pages, 11 index entries |
| Snapshots in minne.db | ~19,950, 137 MB, 72% Chrome; `x.com/home` alone 2,267; `loginwindow` 215 |
| Repeat rate on 2026-09-02 | 2,786 snapshots for 1,065 distinct title+URL states (2.6×) |
| Live lint errors | 27 `broken_link`, all from one renamed page |

## Two bugs, not one

1. **Tool-call leak.** Seven pages have 9–26 KB summaries because a tool call was
   mis-parsed and the whole `body` argument, including literal
   `</summary> <sources>[…]</sources> <parameter name="body">`, landed in the
   `summary` field. `writePage` only checks non-empty and collapses whitespace
   (`brain/src/memory.ts:398`). Nothing validates shape or length. This is the
   bulk of the 349 KB index. Which provider/model produced it is not yet known
   and should be found from `log.md` timestamps.
2. **Summary bloat regardless.** Even without the leak, 237 of 241 summaries
   exceed 300 chars. The prompt asks for two sentences; the code enforces
   nothing; the model writes paragraphs.

## Weaknesses all three reviewers found (verified)

- **The index is the cost bomb.** `renderIndex` (`memory-tools.ts:252-273`)
  emits every page's summary twice. The sync prompt says "Call list_index first"
  (`ingest.ts:216`). Every batch opens with ~178k tokens of overhead before it
  reads a capture. The draft key gets the same index clipped to 4,000 chars
  (`draft.ts:258`), i.e. roughly the first five pages alphabetically.
- **Whole-body replace with a read cap is a data-loss path.** `MAX_READ_CHARS`
  is 40,000 (`memory.ts:183`); 43 pages exceed it; `write_page` replaces the
  body wholesale (`memory.ts:556`). A model that reads a truncated page and
  rewrites it drops the tail. There is no `str_replace`/`insert`/append.
- **Fragmentation instead of consolidation.** 214 topic pages vs 14 people and
  13 projects; 80 dated event slugs; 28 Kaggriculture pages. This is Matuschak's
  named failure of source-oriented notes ("there's no accumulation"). Nothing
  retrieves similar pages before a create; `aliases` is used by zero pages; lint
  has no duplicate-subject or oversized-page check.
- **Rename breaks links silently.** `introducedIssues` is filtered to the
  written page and `index.md` (`memory.ts:423-425`), so a title change passes
  while every other page's links to the old title break. The 27 live errors
  are this. Slug truncation at 60 chars (`wiki.ts:143`) also lets long titles
  collide on one file.
- **No temporal model.** Only `last_updated`. No `valid_from`/`valid_to`, no
  supersession, no created date. Batch timestamps are rendered in UTC
  (`sources.ts:148`) while everything else is local.
- **Noise reaches the model unfiltered.** Capture dedup compares only against
  the previous text of the same window (`CaptureScheduler.swift:167-172`).
  Snapshot truncation keeps the head (`sources.ts:153-156`), which for X is
  nav chrome. The lock screen is captured. The only salience gate is a prompt
  instruction inside the expensive call it should protect.
- **Keyword-only retrieval, never fused.** Wiki search is a whole-word regex
  scan with fixed weights (`memory.ts:253-295`); FTS5 has no stemmer; the two
  result lists are deliberately never interleaved (`memory.ts:96-99`).
- **Lint is structural, weekly, and partly dead.** The orphan walk starts at
  `index.md` and every agent write adds an index entry, so agent-written pages
  can never be orphans (`wiki-lint.ts:388-402`). No staleness, contradiction,
  duplicate-subject, size or summary-length checks. Heading anchors in
  `[[Page#Heading]]` are discarded (`wiki-lint.ts:372`).
- **No batch-to-batch memory.** Each batch is a fresh Agent; the log shows
  repeated "already covered" entries and near-identical successive edits.
- **Per-write cost.** Each write reloads the tree and lints twice (~166 ms);
  `append_log` re-parses 1.3 MB line by line. `log.md` is never rotated and
  `read_page` returns its oldest 40 KB, so the agent never sees recent entries.

## Where the reviewers diverged, and the lead's call

- **Embeddings now vs later.** Sonnet ranked embedding retrieval second. Fable
  and Opus both said keyword first: on MemoryAgentBench plain BM25 (60.5) beats
  text-embedding-3-large (54.6) and every commercial memory product; the
  recurring failure of embed-everything PKM products is keeping a vector index
  fresh over a live user-edited vault; Obsidian's own agent tooling ships with
  no embeddings. **Call: FTS5 over the wiki + reciprocal rank fusion first.
  Embeddings later, flat `sqlite-vec` with no ANN, if evals show a gap.**
- **Knowledge graph.** Nobody recommended one, and Opus's research explains
  why: graph memory lost to flat on LongMemEval (0.417 vs 0.468 F1) and a
  similarity-linked graph is worse than no graph. Minne's `[[links]]` are a
  concept graph already; link-graph expansion at retrieval is an open lane.
- **Conflict detection.** Opus's most useful caution: embedding similarity
  cannot detect contradiction (MemStrata, AUROC 0.59). Use a deterministic key
  (page, attribute) and invalidate rather than delete (TEPA: last-write-wins
  0.21 vs supersession 0.95). Sonnet's "lightweight superseded marker" and
  Fable's frontmatter `valid_from/valid_to/superseded_by` are the same idea.
- **Git-backing `~/Minne`.** Only Fable proposed it (Letta does this). Cheap,
  gives the user a diff of what Minne learned, protects hand edits from
  last-writer-wins between chat and sync. Worth doing.
- **Extraction unit.** Opus pushed hardest on changing the unit from episode to
  concept (A-MEM style: atomic notes with generated keywords/context, and
  "memory evolution" that revises neighbours' metadata). Fable framed it as
  importance + monthly reflection (Generative Agents / ChatGPT "dreaming").
  Both are right; the cheap version is a consolidation pass that folds dated
  topic pages into their project/person page.

## What to keep (unanimous)

- Per-claim provenance to immutable sources, validated on disk by lint. No
  mainstream system does this; consolidation is a hallucination surface and
  citations are the defence.
- Schema enforced in code, not prompt: tool-rendered frontmatter, clock-stamped
  `last_updated`, writes refused on introduced lint errors, diff-against-
  baseline so a user-broken wiki never blocks the agent.
- Cost discipline: rowid watermark, idle check before auth, batch/turn caps,
  persisted schedule, drain chaining, single-pass lock. It only needs pointing
  at the real cost driver (index size, not batch count).
- Deterministic pre-model distillation (`register.ts`, `steer.ts`,
  `editledger.ts`) with a real habit threshold. This is where a salience gate
  belongs too.
- Privacy defaults: masking before persistence, app/domain blacklists,
  no screenshots, read-only MCP, plain markdown the user owns.
- Lexical + realpath path containment (`memory-path.ts`).
- The typed page split (person/project/topic/daily/style). Fix is to use
  person/project pages more, not to flatten.

## Recommended plan

**Phase 0 — stop the bleeding (about a day).**
1. Reject summaries over ~300 chars, or containing newlines or angle-bracket
   tags, as a `SchemaViolationError` at `memory.ts:398`. Add a
   `summary_too_long` lint code.
2. Cap `list_index`: one line per page grouped by type, no `index.md` prose,
   hard budget around 25 KB / 200 lines, with `type`/`since`/`query` filters.
3. Refuse a whole-body write on a page larger than the read cap unless the
   caller passes a flag; lift or page the read cap.
4. Widen `introducedIssues` to the whole tree on title change; refuse slug
   collisions.
5. Rotate `log.md`; log once per pass instead of per batch.
6. One-off repair: strip the leaked markup from the 10 pages / 11 index
   entries and re-summarize them. Find which provider produced the leak.

**Phase 1 — extraction quality (about a week).**
7. Pre-model gating in Swift: hash normalized text across all windows for the
   last N minutes, drop `loginwindow`, diff same-URL captures and keep the
   delta. In the brain: collapse a batch to distinct title+URL states,
   truncate from the middle not the head.
8. `edit_page` with exact-string replace and section append (Letta /
   Anthropic memory tool command set) so updates stop being lossy rewrites.
9. Retrieve-then-decide: `write_page` searches title/aliases/summary before a
   create and returns candidates; require `create: true` past a threshold;
   make `aliases` first-class; add `merge_pages`.
10. Carry a ~500-token rolling summary of the previous batch into the next.
11. Local-time timestamps in batches.

**Phase 2 — consolidation and time (about a week).**
12. Optional `valid_from`, `valid_to`, `superseded_by` in frontmatter; prompt
    the pass to mark superseded claims, never overwrite; deterministic
    (page, attribute) supersession.
13. Consolidation pass (monthly, or importance-triggered): rewrite the person
    profile and each active project's "State" section from dated topic pages,
    then archive those pages. Concept-oriented, not session-oriented.
14. Lint upgrades: exclude `index.md` from the orphan walk; near-duplicate
    detection (content hash → normalized title → 3-gram Jaccard 0.9);
    oversized page; stale page linked from an active project; heading-anchor
    validation. Run lint daily, not weekly.
15. Initialize `~/Minne` as a git repo and commit after each pass.

**Phase 3 — retrieval (about a week).**
16. Brain-owned `wiki.db`: FTS5 with porter stemmer over page chunks; fuse
    with the sources ranking by reciprocal rank fusion, k=60. Replace the draft
    key's clipped index map with a search.
17. Time-aware query expansion and multi-key indexing (LongMemEval's cheap
    wins: +7–11% recall on temporal questions).
18. Embeddings only if evals show a gap: flat `sqlite-vec`, pinned version,
    EmbeddingGemma-300M or Qwen3-Embedding-0.6B at 256–512 dims. On macOS
    `bun:sqlite` uses Apple's SQLite which cannot load extensions; use
    `Database.setCustomSQLite` with a Homebrew libsqlite3.

**Before Phase 2 and 3:** build a small eval harness from the real wiki
(20–50 questions with known answers and citations) and fix the definition of a
correct hit before measuring. LoCoMo is unreliable (6.4% wrong labels);
LongMemEval is the better instrument.

## Out of scope but worth fixing

The Minne key (draft) path checks only the app blacklist
(`MinneKeyController.swift:323`), not the domain blacklist, so a draft
triggered in Chrome on a blacklisted domain still sends that page's text to
the model.

## Sources the reviewers leaned on (dated)

Mem0 (arXiv 2504.19413, Apr 2025; rewrite Apr 2026) · Zep/Graphiti (2501.13956,
Jan 2025) · MemGPT (2310.08560) · Letta sleep-time compute (2504.13171) and
Context Repositories (Feb 2026) · A-MEM (2502.12110) · Generative Agents
(2304.03442) · LangMem (Feb 2025) · Karpathy LLM-wiki gist (Apr 2026) · Nemori
(2508.03341) · RecMem (2605.16045) · LightMem (2510.18866) · BudgetMem
(2511.04919) · MemStrata (2606.26511) · TEPA (2608.07429) · MELD (2608.16357) ·
"Does Memory Need Graphs?" (2601.01280) · "Selective Forgetting" (2608.28978) ·
"Learning What to Remember" (2606.12945) · MemoryAgentBench (2507.05257) ·
LongMemEval (ICLR 2025) and V2 (2605.12493) · "Same Ranking, Different Winner"
(2605.24060) · Penfield Labs LoCoMo audit (Apr 2026) · QMD (Lütke, 2026) ·
OpenAI "Dreaming" (Jun 2026) · Anthropic memory tool and Claude Code auto-memory.
