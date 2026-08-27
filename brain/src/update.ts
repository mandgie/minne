// The update check: at most once a day, ask the release host whether a newer
// version than the running one exists. The check sends nothing about the user —
// it is one anonymous GET for the latest release tag — and every failure is a
// silent no-op: the menu simply keeps saying nothing, never an error.
//
// The cadence is persisted (`update-state.json`, same discipline as
// sync-state.ts): the brain restarts with the app, so an in-memory "daily"
// timer would reset on every launch and a restart-heavy day would check many
// times — or never. The app pokes `update_check` whenever it likes (startup,
// menu open, a slow timer); the stored next-due time is what makes all of
// those cost a cache read except the first one each day.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface UpdateSettings {
  /** Where the latest release is asked for; a GitHub `releases/latest` API URL. */
  url: string;
  /** How often a poke may actually hit the network. 0 disables checking. */
  intervalMs: number;
  /** Fetch deadline — a hung host must not wedge the request loop's caller. */
  timeoutMs: number;
}

export const DEFAULT_UPDATE_SETTINGS: UpdateSettings = {
  url: "https://api.github.com/repos/mandgie/minne/releases/latest",
  intervalMs: 24 * 60 * 60 * 1000,
  timeoutMs: 10_000,
};

/** Env overrides, so tests never hit the real network and dev runs can retune. */
export function updateSettingsFromEnv(
  env: Record<string, string | undefined>,
): Partial<UpdateSettings> {
  const settings: Partial<UpdateSettings> = {};
  const url = env["MINNE_UPDATE_CHECK_URL"];
  if (url !== undefined && url !== "") settings.url = url;
  const read = (name: string, key: "intervalMs" | "timeoutMs", min: number) => {
    const raw = env[name];
    if (raw === undefined || raw === "") return;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < min) return;
    settings[key] = value;
  };
  read("MINNE_UPDATE_INTERVAL_MS", "intervalMs", 0);
  read("MINNE_UPDATE_TIMEOUT_MS", "timeoutMs", 1);
  return settings;
}

/**
 * A release tag as a dotted version, or null for anything that is not one.
 * Tags are `v0.1.9`; the VERSION file is `0.1.9` — both normalize to the same
 * string, which is what makes them comparable.
 */
export function normalizeVersion(tag: string): string | null {
  const match = /^v?(\d+(?:\.\d+){0,3})$/.exec(tag.trim());
  return match ? match[1]! : null;
}

/** Numeric segment-wise compare of two normalized versions: <0, 0, >0. */
export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** What `update_check` answers, cached or fresh. */
export interface UpdateReport {
  /** the running brain (and app) version */
  version: string;
  updateAvailable: boolean;
  /** newest release seen, when a check has ever succeeded */
  latest?: string;
  /** the release page to open */
  url?: string;
  /** ISO 8601 time of the last successful check */
  checkedAt?: string;
}

interface UpdateState {
  /** epoch ms before which a poke answers from cache */
  nextCheckAt?: number;
  latest?: { version: string; url: string; checkedAt: string };
}

export function updateStatePath(dataDir: string): string {
  return join(dataDir, "update-state.json");
}

/** Missing, corrupt or partial state reads as empty — worst case, one extra check. */
function loadUpdateState(path: string): UpdateState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const raw = parsed as Record<string, unknown>;
  const state: UpdateState = {};
  const nextCheckAt = raw["nextCheckAt"];
  if (typeof nextCheckAt === "number" && Number.isInteger(nextCheckAt) && nextCheckAt > 0) {
    state.nextCheckAt = nextCheckAt;
  }
  const latest = raw["latest"];
  if (typeof latest === "object" && latest !== null && !Array.isArray(latest)) {
    const fields = latest as Record<string, unknown>;
    const version = fields["version"];
    const url = fields["url"];
    const checkedAt = fields["checkedAt"];
    if (
      typeof version === "string" &&
      normalizeVersion(version) !== null &&
      typeof url === "string" &&
      typeof checkedAt === "string"
    ) {
      state.latest = { version, url, checkedAt };
    }
  }
  return state;
}

function saveUpdateState(path: string, state: UpdateState): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  renameSync(tmp, path);
}

/**
 * Structural — Bun's `typeof fetch` carries a `preconnect` member a test stub
 * cannot satisfy (the same typing trap as Bun.spawn, see GOTCHAS US-003).
 */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface UpdateCheckerDeps {
  dataDir: string;
  /** the running version, from the VERSION file */
  version: string;
  log: (...args: unknown[]) => void;
  settings?: Partial<UpdateSettings>;
  /** injectable for tests; defaults to global fetch */
  fetchFn?: FetchLike;
  /** injectable clock for tests */
  now?: () => number;
}

export class UpdateChecker {
  readonly settings: UpdateSettings;
  private readonly statePath: string;
  private readonly version: string;
  private readonly log: (...args: unknown[]) => void;
  private readonly fetchFn: FetchLike;
  private readonly now: () => number;
  private state: UpdateState;
  /** One network check at a time; concurrent pokes await the same one. */
  private inFlight: Promise<UpdateReport> | null = null;

  constructor(deps: UpdateCheckerDeps) {
    this.settings = { ...DEFAULT_UPDATE_SETTINGS, ...deps.settings };
    this.statePath = updateStatePath(deps.dataDir);
    this.version = normalizeVersion(deps.version) ?? deps.version;
    this.log = deps.log;
    this.fetchFn = deps.fetchFn ?? fetch;
    this.now = deps.now ?? Date.now;
    this.state = loadUpdateState(this.statePath);
  }

  /** The cached answer, no network. */
  report(): UpdateReport {
    const latest = this.state.latest;
    if (latest === undefined) return { version: this.version, updateAvailable: false };
    const current = normalizeVersion(this.version);
    const available =
      current !== null && compareVersions(latest.version, current) > 0;
    return {
      version: this.version,
      updateAvailable: available,
      latest: latest.version,
      url: latest.url,
      checkedAt: latest.checkedAt,
    };
  }

  /**
   * The cached answer — refreshed over the network first when a check is due.
   * Never throws and never reports failure: an unreachable host, a rate limit
   * or a malformed answer is logged to stderr, backed off a full interval, and
   * the caller gets whatever the cache last knew.
   */
  async check(): Promise<UpdateReport> {
    if (this.settings.intervalMs === 0) return this.report();
    const now = this.now();
    if (this.state.nextCheckAt !== undefined && now < this.state.nextCheckAt) {
      return this.report();
    }
    if (this.inFlight !== null) return this.inFlight;
    this.inFlight = this.performCheck(now).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async performCheck(now: number): Promise<UpdateReport> {
    try {
      const response = await this.fetchFn(this.settings.url, {
        signal: AbortSignal.timeout(this.settings.timeoutMs),
        headers: { accept: "application/vnd.github+json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = (await response.json()) as Record<string, unknown>;
      const tag = body["tag_name"];
      if (typeof tag !== "string") throw new Error("release has no tag_name");
      const version = normalizeVersion(tag);
      if (version === null) throw new Error(`release tag "${tag}" is not a version`);
      const url = typeof body["html_url"] === "string" ? (body["html_url"] as string) : this.settings.url;
      this.state.latest = { version, url, checkedAt: new Date(now).toISOString() };
      this.log(
        `update check: latest v${version}` +
          (compareVersions(version, this.version) > 0
            ? ` — newer than the running v${this.version}`
            : " — up to date"),
      );
    } catch (err) {
      // Offline, rate-limited, a dead host: all fine. Say so on stderr and
      // wait a full interval before asking again.
      this.log("update check failed (harmless, will retry later):", err);
    }
    this.state.nextCheckAt = now + this.settings.intervalMs;
    try {
      saveUpdateState(this.statePath, this.state);
    } catch (err) {
      this.log("update state could not be saved:", err);
    }
    return this.report();
  }
}
