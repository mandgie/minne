// The ingestion job: what turns captures into memory without the user asking.
//
// Two passes, both driven by their own pi Agent over the same tools chat uses
// (memory-tools.ts) and the same signed-in model:
//
//   sync — read the snapshots the app has captured since the watermark, work
//          out which people, projects and topics they touch, write those pages
//          with citations, and append one log.md entry.
//   lint — run wiki-lint and hand the report to the agent to fix what it can
//          (orphans, stale summaries), then log what changed.
//
// Three properties this file is responsible for:
//
//   incremental — a pass only ever reads snapshots past the watermark, and
//                 advances it after each batch, so a crash mid-pass costs one
//                 batch and never re-digests what already landed.
//   idempotent  — a pass with nothing new past the watermark writes nothing and
//                 calls no model. That is checked before authentication is even
//                 looked at, because the cheapest pass is the one that stops at
//                 a `count(*)`.
//   contained   — one pass at a time (`busy` for a second request), a turn cap
//                 per batch, and a snapshot budget per pass; an ingestion job
//                 that can run away is an ingestion job that spends the user's
//                 subscription on nothing.
import { Agent } from "@earendil-works/pi-agent-core";
import type { AgentTool, StreamFn } from "@earendil-works/pi-agent-core";
import type { Api, Model } from "@earendil-works/pi-ai";
import type { TSchema } from "typebox";
import { isoLocal, localDate, type Memory } from "./memory";
import { memoryTools } from "./memory-tools";
import { foldDraftOutcome, type DraftOutcomePress } from "./editledger";
import { updateVoiceRegisters } from "./register";
import { distillGuidance, foldSteerPress, type SteerPress } from "./steer";
import { readSnapshotsAfter, snapshotBacklog, type SnapshotRow } from "./sources";
import {
  loadSyncState,
  saveSyncState,
  syncStatePath,
  type LintCounts,
  type LintPassSummary,
  type SyncPassSummary,
  type SyncState,
} from "./sync-state";
import { MAX_SUMMARY_CHARS, bootstrapWiki, loadWikiTree } from "./wiki";
import { formatLintReport, lintWiki } from "./wiki-lint";

/** The model to run a pass with, or the reason there is none. */
export type ModelResolution = { model: Model<Api> } | { unavailable: string };

export interface SyncEngineDeps {
  memory: Memory;
  /** app-support dir: holds minne.db (read) and sync-state.json (written) */
  dataDir: string;
  log: (...args: unknown[]) => void;
  /** the same provider/model selection chat uses; checked per pass, not cached */
  resolveModel: () => Promise<ModelResolution>;
  streamFn: StreamFn;
  now?: () => Date;
  settings?: Partial<SyncSettings>;
}

export interface SyncSettings {
  /** scheduled sync period, ms; 0 disables the timer */
  intervalMs: number;
  /** scheduled lint period, ms; 0 disables the timer */
  lintIntervalMs: number;
  /** snapshots per model turn */
  batchSize: number;
  /** turns (batches) per pass — the rest waits for the next one */
  maxBatches: number;
  /** characters of each capture sent to the model */
  snapshotChars: number;
  /** tool round trips the agent gets per batch before the pass stops it */
  maxTurns: number;
  /**
   * Delay before the next scheduled sync when a pass ingested its fill and
   * still left a backlog. Heavy days capture faster than one pass per
   * `intervalMs` can digest (a 2,600-snapshot day against a 48-per-pass
   * ceiling); chaining passes this closely drains the backlog while keeping
   * every individual pass at its bounded cost. Only an `ingested` pass chains
   * — a skipped or failed one waits the full interval, so a signed-out
   * provider is not polled every two minutes.
   */
  drainMs: number;
}

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  intervalMs: 30 * 60 * 1000,
  lintIntervalMs: 7 * 24 * 60 * 60 * 1000,
  batchSize: 12,
  maxBatches: 4,
  snapshotChars: 4_000,
  maxTurns: 12,
  drainMs: 2 * 60 * 1000,
};

/** Env overrides, so tests (and impatient dev runs) can retune the schedule. */
export function settingsFromEnv(env: Record<string, string | undefined>): Partial<SyncSettings> {
  const settings: Partial<SyncSettings> = {};
  const read = (name: string, key: keyof SyncSettings, min: number) => {
    const raw = env[name];
    if (raw === undefined || raw === "") return;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < min) return;
    settings[key] = value;
  };
  read("MINNE_SYNC_INTERVAL_MS", "intervalMs", 0);
  read("MINNE_LINT_INTERVAL_MS", "lintIntervalMs", 0);
  read("MINNE_SYNC_BATCH_SIZE", "batchSize", 1);
  read("MINNE_SYNC_MAX_BATCHES", "maxBatches", 1);
  read("MINNE_SYNC_SNAPSHOT_CHARS", "snapshotChars", 200);
  read("MINNE_SYNC_MAX_TURNS", "maxTurns", 1);
  read("MINNE_SYNC_DRAIN_MS", "drainMs", 1_000);
  return settings;
}

// ---- scheduling arithmetic (pure, so the restart behavior is testable) ----

/** An overdue pass fires this soon after launch, never in the launch stampede. */
export const OVERDUE_GRACE_MS = 30_000;

/**
 * When a scheduled pass is due and how long to wait for it. The stored due
 * time is honored as-is — a restart must not reset the clock, which is
 * exactly how the 7-day lint managed never to fire — and a due time already
 * in the past fires after a short grace instead of immediately. The grace is
 * clamped to the interval so millisecond-interval tests are not held to a
 * 30-second floor. No stored time means the schedule is starting fresh: one
 * full interval from now.
 */
export function scheduleDelay(
  storedDueAt: number | undefined,
  now: number,
  intervalMs: number,
): { dueAt: number; delayMs: number } {
  const dueAt = storedDueAt ?? now + intervalMs;
  const delayMs = dueAt > now ? dueAt - now : Math.min(OVERDUE_GRACE_MS, intervalMs);
  return { dueAt, delayMs };
}

/**
 * The next sync due time after a pass. A pass that ingested and still left a
 * backlog chains after `drainMs`; every other outcome — idle, skipped,
 * error — waits the full interval, so failure is backed off rather than
 * retried hot and a signed-out provider is not re-checked every two minutes.
 */
export function nextSyncDue(
  now: number,
  settings: Pick<SyncSettings, "intervalMs" | "drainMs">,
  lastStatus: SyncPassSummary["status"] | undefined,
  pending: number,
): number {
  const drain = lastStatus === "ingested" && pending > 0;
  return now + (drain ? settings.drainMs : settings.intervalMs);
}

/** Reported by `status`; rendered by Settings (US-015). */
export interface SyncStatus {
  state: "idle" | "running";
  /** which pass is running, when one is */
  pass?: "sync" | "lint";
  watermark: number;
  /** snapshots captured but not yet digested */
  pending: number;
  /** false when the app has not captured anything yet */
  indexAvailable: boolean;
  intervalMinutes: number;
  lintIntervalHours: number;
  lastSync: SyncPassSummary | null;
  lastLint: LintPassSummary | null;
}

/** Terminal result of an `ingest` request. */
export type PassResult =
  | ({ pass: "sync" } & SyncPassSummary)
  | ({ pass: "lint" } & LintPassSummary);

/** A second pass was asked for while one was running. */
export class SyncBusyError extends Error {
  constructor(readonly running: "sync" | "lint") {
    super(`a ${running} pass is already running`);
    this.name = "SyncBusyError";
  }
}

/** The model failed mid-pass; surfaces as a `provider_error`. */
export class SyncProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncProviderError";
  }
}

const SYNC_SYSTEM_PROMPT = `You are Minne's ingestion pass: the part of a local memory
companion that turns raw screen captures into a wiki, unattended, while the user
is doing something else.

You are handed a batch of new snapshots — the text of what was on the user's
screen, each with a citation of the form \`sources/DATE/HHmm-app.md#N\`. Your job
is to decide what in them is worth remembering and to fold it into the wiki at
~/Minne. The rules of that wiki are in SCHEMA.md; read it with read_page if you
are unsure. In short:

- Pages live in wiki/ and come in five types: person, project, topic, daily
  (wiki/daily/YYYY-MM-DD.md, one per day, linking to what that day touched), and
  style (wiki/style/, one per app the user writes in).
- Every page needs a summary of one or two sentences — at most ${MAX_SUMMARY_CHARS}
  characters, plain prose, no markup — and cites the snapshots it was derived
  from. The summary is the line the index shows; write_page refuses a longer
  one, so put every detail in the body. Every claim you write must come from a
  capture you actually read; cite it inline in backticks when the claim is
  specific.
- Links are [[Title]] and must resolve, so write the page you link to first.
- Never invent. If a capture is ambiguous, write less.

How to work:

1. Call list_index first. The subject usually already has a page, possibly under
   a name you would not have chosen; updating it is almost always right and a
   near-duplicate page is the one mistake this pass must not make.
2. read_page any page you are about to change. write_page replaces the body you
   pass, so you need to know what is already there and keep what still holds.
3. Write the pages. Prefer few, substantial updates over many thin ones. Most
   batches touch one to three pages. Passing chatter, UI chrome, menus, and
   navigation are not memory — skip them and skip the batch entirely if there is
   nothing durable in it.
4. Update or create today's daily page when the batch says something about what
   the user actually worked on.
5. When a capture contains something the user themselves wrote — a message they
   sent, a mail they composed, a comment they left — add one observation to the
   style page for that app: title "Style — <App>", or "Style — <App> —
   <Recipient>" when they clearly write differently to one person or channel.
   Observe only what is on the page in front of you: greeting and sign-off,
   typical length, formality, language, phrases they reach for. Never guess, and
   never write a style page from text they only read. These pages are what
   Minne's drafting key writes in the user's voice, so a wrong observation is
   worse than a missing one — most batches add nothing here. Some style pages
   carry a "## Register" section that Minne maintains mechanically from the
   user's sent messages; when you rewrite such a page, keep that section
   exactly as it is.
6. Finish with exactly one append_log entry, pass "sync": a sentence or two
   naming the pages you touched as [[links]], or saying that you found nothing
   worth keeping.

Then stop. Do not reply with prose to the user — nobody is reading it; the log
entry is your report.`;

const LINT_SYSTEM_PROMPT = `You are Minne's maintenance pass: you keep the memory
wiki at ~/Minne honest against its own contract, SCHEMA.md.

You are handed a wiki-lint report. Work through it with your tools and fix what
can be fixed from what the wiki already knows:

- orphan — a page nothing links to. It is unreachable and so it is not memory.
  Give it a home: write_page adds its index.md entry back, and where it belongs
  under another page (a person on their project, a day on what it touched), add
  the [[link]] there too.
- no_sources — a page citing nothing. Search memory for what it is about and add
  the citations you find; if there is genuinely nothing behind it, say so in the
  summary rather than inventing a source.
- a summary that no longer describes the page's body is stale — rewrite the
  summary to match what the page now says, and refresh nothing else.
- summary_invalid — the summary is too long or carries markup. Read the page and
  write_page it again with a one- or two-sentence summary (at most
  ${MAX_SUMMARY_CHARS} characters), keeping the body and citations as they are.
- broken_link — either create the page that is missing, or reword the sentence
  so it does not link to something that does not exist.

Do not invent facts, do not delete pages, and leave anything the report does not
mention alone. Read a page before rewriting it. Finish with exactly one
append_log entry, pass "lint", naming what you fixed. Then stop.`;

/**
 * Runs the two passes and owns everything they remember.
 *
 * One instance per brain. It holds no LLM state between passes: each batch gets
 * a fresh Agent, so a long backlog cannot grow one transcript until it costs
 * more than it digests.
 */
export class SyncEngine {
  private readonly memory: Memory;
  private readonly dataDir: string;
  private readonly statePath: string;
  private readonly log: (...args: unknown[]) => void;
  private readonly resolveModel: () => Promise<ModelResolution>;
  private readonly streamFn: StreamFn;
  private readonly clock: () => Date;
  readonly settings: SyncSettings;

  private state: SyncState;
  /** the pass in flight, if any — a second one is refused, not queued */
  private running: "sync" | "lint" | null = null;
  private aborter: AbortController | null = null;
  private scheduled: Partial<Record<"sync" | "lint", ReturnType<typeof setTimeout>>> = {};
  /** bumped by stopTimers, so a pass in flight cannot re-arm a stopped schedule */
  private timerEpoch = 0;

  constructor(deps: SyncEngineDeps) {
    this.memory = deps.memory;
    this.dataDir = deps.dataDir;
    this.statePath = syncStatePath(deps.dataDir);
    this.log = deps.log;
    this.resolveModel = deps.resolveModel;
    this.streamFn = deps.streamFn;
    this.clock = deps.now ?? (() => new Date());
    this.settings = { ...DEFAULT_SYNC_SETTINGS, ...deps.settings };
    this.state = loadSyncState(this.statePath);
  }

  /**
   * Starts the scheduled passes. Not called from the constructor: tests and
   * one-shot uses construct an engine to run a pass on demand and must not
   * inherit a timer with it.
   *
   * The schedule is persisted, not held in a timer: each pass's next due time
   * lives in sync-state.json and a launch resumes it. This is what makes the
   * 7-day lint reachable at all on a machine that restarts the app daily, and
   * what closes the restart hole where every launch pushed sync a full
   * interval out while captures piled up.
   */
  startTimers(): void {
    this.stopTimers();
    this.arm("sync");
    this.arm("lint");
  }

  stopTimers(): void {
    this.timerEpoch++;
    for (const timer of Object.values(this.scheduled)) clearTimeout(timer);
    this.scheduled = {};
  }

  /** Schedules one pass from its persisted due time, establishing one if absent. */
  private arm(pass: "sync" | "lint"): void {
    const intervalMs = pass === "sync" ? this.settings.intervalMs : this.settings.lintIntervalMs;
    if (intervalMs <= 0) return;
    const stored = pass === "sync" ? this.state.nextSyncAt : this.state.nextLintAt;
    const { dueAt, delayMs } = scheduleDelay(stored, this.clock().getTime(), intervalMs);
    if (stored !== dueAt) {
      if (pass === "sync") this.state.nextSyncAt = dueAt;
      else this.state.nextLintAt = dueAt;
      saveSyncState(this.statePath, this.state);
    }
    const epoch = this.timerEpoch;
    const timer = setTimeout(() => {
      void this.tick(pass)
        .catch((err: unknown): boolean => {
          this.log(`scheduled ${pass} failed:`, err);
          return true;
        })
        .then((ran) => this.rearm(pass, epoch, ran));
    }, delayMs);
    // The brain exits when stdin closes; a timer must never be what keeps it
    // alive (stop() covers the orderly path, this covers the rest).
    timer.unref?.();
    this.scheduled[pass] = timer;
  }

  /**
   * After a pass: persist when the next one is due, then schedule it. A tick
   * that never ran (the other pass held the lock) retries after `drainMs`
   * rather than a full interval — otherwise a lint due that collides with a
   * running sync would be pushed a whole week without having run.
   */
  private rearm(pass: "sync" | "lint", epoch: number, ran: boolean): void {
    if (epoch !== this.timerEpoch) return;
    const now = this.clock().getTime();
    if (!ran) {
      const retryAt = now + this.settings.drainMs;
      if (pass === "sync") this.state.nextSyncAt = retryAt;
      else this.state.nextLintAt = retryAt;
    } else if (pass === "sync") {
      const pending = snapshotBacklog(this.dataDir, this.state.watermark).pending;
      this.state.nextSyncAt = nextSyncDue(
        now,
        this.settings,
        this.state.lastSync?.status,
        pending,
      );
    } else {
      this.state.nextLintAt = now + this.settings.lintIntervalMs;
    }
    saveSyncState(this.statePath, this.state);
    this.arm(pass);
  }

  /** Cancels a pass in flight (used by `abort` and at shutdown). */
  abort(): void {
    this.aborter?.abort();
  }

  /**
   * The app rebuilt the index and every row on disk now counts as digested:
   * move the watermark to the rebuilt max id. Refused while a pass runs — the
   * pass advances the same watermark, and last-writer-wins between the two
   * would silently re-ingest or skip a batch.
   */
  markIngested(watermark: number): { watermark: number } {
    if (this.running !== null) throw new SyncBusyError(this.running);
    this.state.watermark = watermark;
    saveSyncState(this.statePath, this.state);
    this.log(`watermark moved to ${watermark} (index rebuilt by the app)`);
    return { watermark };
  }

  /**
   * A scheduled pass: same work as an on-demand one, minus the complaints.
   * Returns whether it actually ran, so `rearm` can retry a skipped one soon.
   */
  private async tick(pass: "sync" | "lint"): Promise<boolean> {
    if (this.running !== null) {
      this.log(`scheduled ${pass} skipped: a ${this.running} pass is running`);
      return false;
    }
    const result = pass === "sync" ? await this.runSync() : await this.runLint();
    this.log(`scheduled ${pass}: ${result.status}${result.reason ? ` (${result.reason})` : ""}`);
    return true;
  }

  status(): SyncStatus {
    const backlog = snapshotBacklog(this.dataDir, this.state.watermark);
    return {
      state: this.running === null ? "idle" : "running",
      ...(this.running === null ? {} : { pass: this.running }),
      watermark: this.state.watermark,
      pending: backlog.pending,
      indexAvailable: backlog.available,
      intervalMinutes: Math.round(this.settings.intervalMs / 60_000),
      lintIntervalHours: Math.round(this.settings.lintIntervalMs / 3_600_000),
      lastSync: this.state.lastSync,
      lastLint: this.state.lastLint,
    };
  }

  /**
   * US-204: one draft request's worth of steer, counted the moment it arrives.
   * Same discipline as the voice registers: the counters live in
   * sync-state.json and are persisted immediately — before any model runs —
   * so a draft that fails still remembers what the user asked for, and a
   * retried one cannot count it twice (the steer+draft hash in `foldSteerPress`).
   */
  recordSteer(press: SteerPress): void {
    this.state.steers ??= {};
    if (foldSteerPress(this.state.steers, press, localDate(this.clock()))) {
      saveSyncState(this.statePath, this.state);
    }
  }

  /**
   * US-205: one draft's settled outcome, counted the moment it arrives and
   * persisted at once, same as the steers — the edit is a byte-exact
   * correction and must survive whatever the next pass does. The texts are
   * compared here and forgotten; only feature counters are stored.
   */
  recordDraftOutcome(press: DraftOutcomePress): void {
    this.state.edits ??= {};
    if (foldDraftOutcome(this.state.edits, press, localDate(this.clock()))) {
      saveSyncState(this.statePath, this.state);
    }
  }

  // ---- sync ----

  /**
   * One ingestion pass over everything captured since the watermark, in batches.
   *
   * Order matters for cost: the backlog is counted first, so an idle pass never
   * touches credentials, never constructs an Agent, and never reaches the
   * network. Only when there is something to digest do we ask what model to
   * spend on it.
   */
  async runSync(): Promise<SyncPassSummary> {
    if (this.running !== null) throw new SyncBusyError(this.running);
    this.running = "sync";
    this.aborter = new AbortController();
    // Outside the try so a pass that fails on its third batch still reports the
    // two it digested — they are on disk either way.
    const touched = new Set<string>();
    let snapshots = 0;
    let batches = 0;
    try {
      // US-204 + US-205: recurring steers and in-editor corrections become
      // standing rules on their context's style page. Deterministic and
      // model-free, so it runs before the idle check — a user who drafts a lot
      // while capturing nothing still gets their rules — and a failure is
      // logged, never allowed to fail the pass.
      try {
        const distilled = distillGuidance(
          this.memory,
          this.state.steers ?? {},
          this.state.edits ?? {},
          this.log,
        );
        if (distilled.length > 0) {
          for (const path of distilled) touched.add(path);
          saveSyncState(this.statePath, this.state);
        }
      } catch (err) {
        this.log("steer distillation failed:", err);
      }

      let backlog = snapshotBacklog(this.dataDir, this.state.watermark);
      // The index no longer reaches our mark: it was wiped or rebuilt (retention
      // prunes the oldest rows, never the newest, so this cannot be pruning).
      // Whatever is in there now has never been digested by this watermark, and
      // re-reading a snapshot costs a page rewrite at worst.
      if (backlog.available && backlog.maxId < this.state.watermark) {
        this.log(`watermark ${this.state.watermark} is past the index (max ${backlog.maxId}) — reset`);
        this.state.watermark = 0;
        saveSyncState(this.statePath, this.state);
        backlog = snapshotBacklog(this.dataDir, 0);
      }
      if (backlog.pending === 0) {
        // Still an idle pass — no snapshots, no model — but a distillation
        // that wrote pages reports them.
        return this.finishSync({
          ...this.blankSync(),
          status: "idle",
          pagesTouched: [...touched].sort(),
        });
      }

      const resolution = await this.resolveModel();
      if ("unavailable" in resolution) {
        return this.finishSync({
          ...this.blankSync(),
          status: "skipped",
          reason: resolution.unavailable,
          pagesTouched: [...touched].sort(),
        });
      }

      for (; batches < this.settings.maxBatches; batches++) {
        const rows = readSnapshotsAfter(
          this.dataDir,
          this.state.watermark,
          this.settings.batchSize,
          this.settings.snapshotChars,
        );
        if (rows.length === 0) break;
        // US-109: distill the user's own sent messages into per-recipient
        // voice registers, deterministically, before the model reads the
        // batch — the style page the agent then reads already carries the
        // section. The hashes are persisted at once so a batch that fails and
        // is re-read cannot double-count, and a register failure is logged,
        // never allowed to fail the pass.
        try {
          this.state.registers ??= {};
          const update = updateVoiceRegisters(
            this.memory,
            rows,
            this.state.registers,
            this.log,
            this.clock,
          );
          if (update.folded > 0) {
            for (const path of update.pages) touched.add(path);
            saveSyncState(this.statePath, this.state);
          }
        } catch (err) {
          this.log("voice register update failed:", err);
        }
        await this.runAgent(SYNC_SYSTEM_PROMPT, renderBatch(rows), touched, resolution.model);
        // Advance only after the batch's writes have landed: a pass that dies
        // between two batches re-reads the batch it was in the middle of, which
        // is a re-read, not a duplicate — write_page is an upsert on the page.
        this.state.watermark = rows[rows.length - 1]?.id ?? this.state.watermark;
        snapshots += rows.length;
        saveSyncState(this.statePath, this.state);
      }

      this.log(`sync: ${snapshots} snapshots in ${batches} batches, ${touched.size} pages touched`);
      return this.finishSync({
        ...this.blankSync(),
        status: snapshots === 0 ? "idle" : "ingested",
        snapshots,
        batches,
        pagesTouched: [...touched].sort(),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.log("sync failed:", err);
      return this.finishSync({
        ...this.blankSync(),
        status: "error",
        reason,
        snapshots,
        batches,
        pagesTouched: [...touched].sort(),
      });
    } finally {
      this.running = null;
      this.aborter = null;
    }
  }

  private blankSync(): SyncPassSummary {
    return {
      at: isoLocal(this.clock()),
      status: "ingested",
      snapshots: 0,
      batches: 0,
      pagesTouched: [],
      remaining: 0,
    };
  }

  /**
   * Records the pass and persists it. `remaining` is re-counted rather than
   * taken from the caller, so it is what is actually left in the index now —
   * including anything the app captured while the pass was running.
   */
  private finishSync(summary: SyncPassSummary): SyncPassSummary {
    const final: SyncPassSummary = {
      ...summary,
      at: isoLocal(this.clock()),
      remaining: snapshotBacklog(this.dataDir, this.state.watermark).pending,
    };
    this.state.lastSync = final;
    saveSyncState(this.statePath, this.state);
    return final;
  }

  // ---- lint ----

  /**
   * One maintenance pass. wiki-lint is pure and free, so it runs first and the
   * model is only paid for when it has something to say. Bootstrapping the
   * three root files is itself a fix — a memory missing index.md lints as an
   * error the agent has no tool to repair.
   */
  async runLint(): Promise<LintPassSummary> {
    if (this.running !== null) throw new SyncBusyError(this.running);
    this.running = "lint";
    this.aborter = new AbortController();
    try {
      const created = bootstrapWiki(this.memory.root);
      if (created.length > 0) this.log(`lint: bootstrapped ${created.join(", ")}`);
      const before = lintWiki(loadWikiTree(this.memory.root));
      if (before.issues.length === 0) {
        return this.finishLint({
          status: "clean",
          before: countsOf(before.errors.length, before.warnings.length),
          after: countsOf(before.errors.length, before.warnings.length),
          pagesTouched: [],
        });
      }

      const resolution = await this.resolveModel();
      if ("unavailable" in resolution) {
        return this.finishLint({
          status: "skipped",
          reason: resolution.unavailable,
          before: countsOf(before.errors.length, before.warnings.length),
          after: countsOf(before.errors.length, before.warnings.length),
          pagesTouched: [],
        });
      }

      const touched = new Set<string>();
      await this.runAgent(LINT_SYSTEM_PROMPT, renderLintPrompt(before.issues.length, formatLintReport(before)), touched, resolution.model);
      const after = lintWiki(loadWikiTree(this.memory.root));
      this.log(
        `lint: ${before.errors.length}/${before.warnings.length} -> ${after.errors.length}/${after.warnings.length} errors/warnings`,
      );
      return this.finishLint({
        status: "fixed",
        before: countsOf(before.errors.length, before.warnings.length),
        after: countsOf(after.errors.length, after.warnings.length),
        pagesTouched: [...touched].sort(),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.log("lint failed:", err);
      const now = lintWiki(loadWikiTree(this.memory.root));
      return this.finishLint({
        status: "error",
        reason,
        before: countsOf(now.errors.length, now.warnings.length),
        after: countsOf(now.errors.length, now.warnings.length),
        pagesTouched: [],
      });
    } finally {
      this.running = null;
      this.aborter = null;
    }
  }

  private finishLint(summary: Omit<LintPassSummary, "at">): LintPassSummary {
    const final: LintPassSummary = { at: isoLocal(this.clock()), ...summary };
    this.state.lastLint = final;
    saveSyncState(this.statePath, this.state);
    return final;
  }

  // ---- the agent ----

  /**
   * One agent run: fresh Agent, memory tools, a turn cap, and no streaming out
   * to the app — nothing about a background pass belongs in the chat window.
   * Pages the run wrote land in `touched`.
   */
  private async runAgent(
    systemPrompt: string,
    prompt: string,
    touched: Set<string>,
    model: Model<Api>,
  ): Promise<void> {
    let turns = 0;
    const agent = new Agent({
      initialState: {
        systemPrompt,
        model,
        tools: recordingTools(this.memory, touched),
      },
      streamFn: this.streamFn,
      shouldStopAfterTurn: () => ++turns >= this.settings.maxTurns,
    });
    const aborter = this.aborter;
    const stop = () => agent.abort();
    aborter?.signal.addEventListener("abort", stop, { once: true });
    try {
      aborter?.signal.throwIfAborted();
      await agent.prompt(prompt);
    } finally {
      aborter?.signal.removeEventListener("abort", stop);
    }

    // Provider failures do not reject `prompt()` — they arrive as a final
    // assistant message with stopReason "error" (see GOTCHAS, US-004).
    const last = agent.state.messages.at(-1);
    if (last !== undefined && "role" in last && last.role === "assistant") {
      if (last.stopReason === "error") {
        throw new SyncProviderError(last.errorMessage ?? "provider request failed");
      }
      if (last.stopReason === "aborted") {
        throw new SyncProviderError(last.errorMessage ?? "pass aborted");
      }
    }
    if (turns >= this.settings.maxTurns) {
      this.log(`pass stopped at the ${this.settings.maxTurns}-turn cap`);
    }
  }
}

/**
 * The memory tools, with a note taken of every page written.
 *
 * Wrapping `execute` rather than listening for the agent's tool events keeps
 * this honest: a page counts as touched when `Memory` says it wrote one, not
 * when the model says it meant to.
 */
function recordingTools(memory: Memory, touched: Set<string>): AgentTool<TSchema, unknown>[] {
  return memoryTools(memory).map((base) => ({
    ...base,
    execute: async (id, params, signal, onUpdate) => {
      const result = await base.execute(id, params, signal, onUpdate);
      if (base.name === "write_page") {
        const path = (result.details as { path?: unknown } | null)?.path;
        if (typeof path === "string") touched.add(path);
      }
      return result;
    },
  }));
}

/** The batch, as the model reads it: a citation, its metadata, its text. */
export function renderBatch(rows: SnapshotRow[]): string {
  const first = rows[0];
  const last = rows[rows.length - 1];
  const header =
    `${rows.length} new capture${rows.length === 1 ? "" : "s"} to digest` +
    (first !== undefined && last !== undefined
      ? `, from ${first.capturedAt} to ${last.capturedAt}.`
      : ".");
  const sections = rows.map((row) => {
    const meta = [`app: ${row.app}`, `window: ${row.title}`, `time: ${row.capturedAt}`];
    if (row.url !== undefined) meta.push(`url: ${row.url}`);
    return [`--- ${row.citation}`, meta.join(" · "), "", row.text].join("\n");
  });
  return [header, "", ...sections].join("\n\n");
}

function renderLintPrompt(issues: number, report: string): string {
  return [
    `wiki-lint found ${issues} issue${issues === 1 ? "" : "s"} in this memory. ` +
      `Fix what you can with your tools, then log the pass.`,
    "",
    report,
  ].join("\n");
}

function countsOf(errors: number, warnings: number): LintCounts {
  return { errors, warnings };
}
