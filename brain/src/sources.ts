// Read-only full-text search over the raw captures.
//
// The Swift app is the only writer of minne.db (see
// app/Sources/Minne/SnapshotIndex.swift for the schema — keep the two in sync);
// the brain opens it read-only and never so much as creates a table. The file
// lives next to auth.json in the app-support dir so it stays out of the user's
// markdown, which is theirs.
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface SourceHit {
  /** `sources/2026-08-17/1400-safari.md#3` — the citation form used in the wiki */
  source: string;
  capturedAt: string;
  app: string;
  title: string;
  url?: string;
  /** matching text with `**highlights**` and `…` elisions */
  snippet: string;
  /** relevance, higher is better */
  score: number;
}

export interface SearchResult {
  query: string;
  /** false when nothing has been captured yet — no database on disk */
  available: boolean;
  /** total snapshots in the index, not just the matches */
  indexed: number;
  results: SourceHit[];
}

/** One indexed capture, as the ingestion pass reads it. */
export interface SnapshotRow {
  /** the app's rowid — what the sync watermark counts in */
  id: number;
  /** `sources/2026-08-17/1400-safari.md#3` — the citation form used in the wiki */
  citation: string;
  capturedAt: string;
  app: string;
  bundleId: string;
  title: string;
  url?: string;
  text: string;
}

/** How much is waiting past a watermark, and how far the index reaches. */
export interface SnapshotBacklog {
  /** false when nothing has been captured yet — no database on disk */
  available: boolean;
  /** highest snapshot id in the index; 0 when it is empty */
  maxId: number;
  /** snapshots with an id greater than the watermark */
  pending: number;
}

/** Raised for a query FTS5 cannot be asked; surfaces as an `invalid_request`. */
export class EmptyQueryError extends Error {}

export const MAX_LIMIT = 50;
export const DEFAULT_LIMIT = 10;

export function databasePath(dataDir: string): string {
  return join(dataDir, "minne.db");
}

/**
 * The words of a query, in FTS5's terms: runs of letters, digits and `_`,
 * each optionally ending in `*` for a prefix match. Everything else — quotes,
 * colons, `AND` as punctuation — is separator. Shared with the wiki search in
 * memory.ts so both halves of `search_memory` split a query the same way.
 */
export function queryTerms(query: string): string[] {
  const terms = query.match(/[\p{L}\p{N}_]+\*?/gu) ?? [];
  if (terms.length === 0) {
    throw new EmptyQueryError(`no searchable terms in query "${query}"`);
  }
  return terms;
}

/**
 * Turns a user (or agent) query into an FTS5 MATCH expression.
 *
 * Everything is quoted term by term, so FTS5 operators typed by accident —
 * `AND`, `-`, a stray quote, a colon — are searched for rather than executed
 * and the query can never be a syntax error. The one operator kept is a
 * trailing `*` for prefix matching. Terms are ANDed, which is FTS5's default.
 */
export function toMatchExpression(query: string): string {
  return queryTerms(query)
    .map((term) =>
      term.endsWith("*") ? `"${term.slice(0, -1)}"*` : `"${term}"`,
    )
    .join(" ");
}

/**
 * What is waiting to be ingested. Cheap enough to call on every `status` and
 * on every scheduler tick — which is the point: a tick that finds `pending: 0`
 * skips the pass without ever reaching a model.
 */
export function snapshotBacklog(dataDir: string, watermark: number): SnapshotBacklog {
  const path = databasePath(dataDir);
  if (!existsSync(path)) return { available: false, maxId: 0, pending: 0 };
  const db = new Database(path, { readonly: true });
  try {
    const row = db
      .query("SELECT count(*) AS n, coalesce(max(id), 0) AS maxId FROM snapshots WHERE id > ?")
      .get(watermark) as { n: number; maxId: number } | null;
    const highest = (
      db.query("SELECT coalesce(max(id), 0) AS maxId FROM snapshots").get() as { maxId: number } | null
    )?.maxId ?? 0;
    return { available: true, maxId: highest, pending: row?.n ?? 0 };
  } finally {
    db.close();
  }
}

/**
 * The next `limit` unprocessed snapshots in capture order, oldest first, so a
 * batch reads as a stretch of the user's day. `maxChars` truncates each
 * snapshot's text: a 50 KB capture of a spreadsheet is mostly chrome, and the
 * pass pays for every character it sends.
 */
export function readSnapshotsAfter(
  dataDir: string,
  watermark: number,
  limit: number,
  maxChars = 4_000,
): SnapshotRow[] {
  const path = databasePath(dataDir);
  if (!existsSync(path)) return [];
  const db = new Database(path, { readonly: true });
  try {
    const rows = db
      .query(
        `SELECT id, captured_at, app, bundle_id, title, url, source_path, section, text
         FROM snapshots
         WHERE id > ?
         ORDER BY id
         LIMIT ?`,
      )
      .all(watermark, Math.max(1, limit)) as SnapshotSelection[];
    return rows.map((row) => ({
      id: row.id,
      citation: `${row.source_path}#${row.section}`,
      capturedAt: new Date(row.captured_at * 1000).toISOString(),
      app: row.app,
      bundleId: row.bundle_id,
      title: row.title,
      ...(row.url === null ? {} : { url: row.url }),
      text:
        row.text.length > maxChars
          ? `${row.text.slice(0, maxChars)}\n…(capture truncated at ${maxChars} characters)`
          : row.text,
    }));
  } finally {
    db.close();
  }
}

interface SnapshotSelection {
  id: number;
  captured_at: number;
  app: string;
  bundle_id: string;
  title: string;
  url: string | null;
  source_path: string;
  section: number;
  text: string;
}

interface Row {
  captured_at: number;
  app: string;
  title: string;
  url: string | null;
  source_path: string;
  section: number;
  snippet: string;
  rank: number;
}

/**
 * Searches the index at `dataDir/minne.db`.
 *
 * The database is opened per call rather than held: it is written by another
 * process, may not exist yet when the brain starts, and search is not a hot
 * path. Opening fresh also means a database created after launch is picked up
 * without a restart.
 */
export function searchSources(
  dataDir: string,
  query: string,
  limit: number = DEFAULT_LIMIT,
): SearchResult {
  const match = toMatchExpression(query);
  const path = databasePath(dataDir);
  if (!existsSync(path)) {
    return { query, available: false, indexed: 0, results: [] };
  }
  const db = new Database(path, { readonly: true });
  try {
    const indexed = (
      db.query("SELECT count(*) AS n FROM snapshots").get() as { n: number } | null
    )?.n ?? 0;
    // Column order in snapshots_fts is (text, title, app, url); a hit in the
    // window title is worth more than one in the app name, which is the same
    // for thousands of snapshots.
    const rows = db
      .query(
        `SELECT s.captured_at, s.app, s.title, s.url, s.source_path, s.section,
                snippet(snapshots_fts, 0, '**', '**', '…', 12) AS snippet,
                bm25(snapshots_fts, 1.0, 2.0, 0.25, 0.25) AS rank
         FROM snapshots_fts
         JOIN snapshots s ON s.id = snapshots_fts.rowid
         WHERE snapshots_fts MATCH ?
         ORDER BY rank, s.captured_at DESC
         LIMIT ?`,
      )
      .all(match, Math.min(Math.max(1, limit), MAX_LIMIT)) as Row[];
    return {
      query,
      available: true,
      indexed,
      results: rows.map((row) => ({
        source: `${row.source_path}#${row.section}`,
        capturedAt: new Date(row.captured_at * 1000).toISOString(),
        app: row.app,
        title: row.title,
        ...(row.url === null ? {} : { url: row.url }),
        snippet: row.snippet,
        // bm25 counts down from zero; flip it so higher means better. Left
        // unrounded on purpose: FTS5 clamps the inverse document frequency at
        // 1e-6, so on a young index every score is a rounding error away from
        // every other one and only the ordering carries information.
        score: -row.rank,
      })),
    };
  } finally {
    db.close();
  }
}
