// What the ingestion pass remembers between runs: the watermark, and what the
// last sync and lint passes did.
//
// It lives in its own file (`sync-state.json`) in the app-support dir rather
// than in `minne.db`, because that database is the Swift app's — the app owns
// its schema and the brain opens it read-only (see sources.ts). One integer and
// two small records do not justify a second sqlite file either, so this is the
// same shape as config.json: a JSON document, written atomically, defaults on
// anything unreadable.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { sanitizeRegisters, type RegisterState } from "./register";

/** Outcome of one ingestion pass, as `status` reports it and Settings shows it. */
export interface SyncPassSummary {
  /** ISO 8601 local time the pass finished */
  at: string;
  /**
   * `ingested` — snapshots were digested into the wiki.
   * `idle`     — nothing new past the watermark; no model was called.
   * `skipped`  — there was work but no signed-in provider (`reason` says so).
   * `error`    — the pass failed; `reason` carries the message.
   */
  status: "ingested" | "idle" | "skipped" | "error";
  reason?: string;
  /** snapshots read in this pass */
  snapshots: number;
  /** model turns spent — one per batch */
  batches: number;
  /** wiki pages the pass created or updated */
  pagesTouched: string[];
  /** snapshots still waiting past the watermark when the pass ended */
  remaining: number;
}

/** Outcome of one lint pass. */
export interface LintPassSummary {
  at: string;
  /**
   * `clean` — wiki-lint found nothing to fix (no model was called).
   * `fixed` — the agent was handed the report and worked through it.
   * `skipped` / `error` as for a sync pass.
   */
  status: "clean" | "fixed" | "skipped" | "error";
  reason?: string;
  before: LintCounts;
  after: LintCounts;
  pagesTouched: string[];
}

export interface LintCounts {
  errors: number;
  warnings: number;
}

export interface SyncState {
  /**
   * Highest `snapshots.id` (the app's rowid) that has been digested. Zero on a
   * memory that has never been synced; every snapshot with a larger id is
   * unprocessed. Ids are assigned in capture order and retention only ever
   * deletes the oldest rows, so the mark stays meaningful as the index is
   * pruned underneath it.
   */
  watermark: number;
  lastSync: SyncPassSummary | null;
  lastLint: LintPassSummary | null;
  /**
   * US-109's per-recipient voice registers, keyed by style-page title
   * (`Style — Messages — Ingrid Berg`). Absent until the first sent message is
   * observed; the counters live here rather than on the style page so an agent
   * rewriting the page cannot erase what has been learned, and re-observation
   * stays deduplicated across restarts.
   */
  registers?: Record<string, RegisterState>;
}

export const EMPTY_SYNC_STATE: SyncState = { watermark: 0, lastSync: null, lastLint: null };

export function syncStatePath(dataDir: string): string {
  return join(dataDir, "sync-state.json");
}

/** Reads sync-state.json; a missing, corrupt or partial file reads as empty. */
export function loadSyncState(path: string): SyncState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return structuredClone(EMPTY_SYNC_STATE);
  }
  const state = structuredClone(EMPTY_SYNC_STATE);
  if (typeof parsed !== "object" || parsed === null) return state;
  const raw = parsed as Record<string, unknown>;
  const watermark = raw["watermark"];
  if (typeof watermark === "number" && Number.isInteger(watermark) && watermark >= 0) {
    state.watermark = watermark;
  }
  if (isRecord(raw["lastSync"])) state.lastSync = raw["lastSync"] as unknown as SyncPassSummary;
  if (isRecord(raw["lastLint"])) state.lastLint = raw["lastLint"] as unknown as LintPassSummary;
  const registers = sanitizeRegisters(raw["registers"]);
  if (registers !== null) state.registers = registers;
  return state;
}

export function saveSyncState(path: string, state: SyncState): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  renameSync(tmp, path);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
