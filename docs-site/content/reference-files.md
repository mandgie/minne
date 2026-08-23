---
title: Files and paths
description: Every file Minne writes, where it lives, which half of the app owns it, and what happens if you delete it.
---

Minne writes to two directories and nowhere else. One holds your memory as
plain markdown; the other holds what is derived from it or must be kept
private.

## The two roots

| Root | Holds | Mode |
| --- | --- | --- |
| `~/Minne` | The memory: schema, wiki, raw captures. Plain markdown. | default |
| `~/Library/Application Support/Minne` | Search index, sync state, credentials, brain config. | `0700` |

Both are created on first run, and both can be moved:

| Variable | Overrides |
| --- | --- |
| `MINNE_MEMORY_ROOT` | `~/Minne` |
| `MINNE_APP_SUPPORT_DIR` | `~/Library/Application Support/Minne` |

The Swift app and the brain read the same two variables, because the two halves
must agree on where `minne.db` is. See [CLI and environment](/reference/cli).

## `~/Minne`

| Path | Written by | Notes |
| --- | --- | --- |
| `SCHEMA.md` | seeded once | Human-owned. Never rewritten. See [Steering with SCHEMA.md](/guides/schema). |
| `index.md` | the agent | One `- [[Title]] — summary` line per page, under five headings. The rest is yours. |
| `log.md` | the agent | Append-only. One `## <ISO timestamp> — <pass>` entry per pass. |
| `sources/YYYY-MM-DD/HHmm-<app>.md` | the app | Raw captures, one file per app per hour. Append-only. |
| `wiki/<slug>.md` | the agent | `person`, `project` and `topic` pages. |
| `wiki/daily/YYYY-MM-DD.md` | the agent | One per day. |
| `wiki/style/style-<app>[-<recipient>].md` | the agent and the brain | Prose from the agent; `## Register` and `## Standing guidance` maintained mechanically. |

`HHmm` is the start of the hour bucket in local time: a capture at 14:31 lands
in `1400-safari.md`.

The four log passes are `bootstrap`, `sync`, `lint` and `chat`. The five
`index.md` headings are People, Projects, Topics, Daily logs and Writing style.

## `~/Library/Application Support/Minne`

| Path | Written by | Contents |
| --- | --- | --- |
| `minne.db` | the app | SQLite FTS5 index over every snapshot. The brain opens it read-only. |
| `minne.db-wal`, `minne.db-shm` | SQLite | WAL sidecars. The database runs in WAL mode so a reader never blocks a capture. |
| `sync-state.json` | the brain | Sync watermark, last pass summaries, voice-register and steer counters. |
| `auth.json` | the brain | Provider credentials. Written atomically, `0600` in a `0700` directory. |
| `config.json` | the brain | Which provider and model you chose. No secrets. |

`minne.db` indexes the already-masked capture text, the window title, the app
name and the URL, plus the source path and section number that reconstruct a
citation. Nothing here is memory, and none of it is meant to be edited by hand.

App settings — blacklists, retention days, hotkey choices — are not in either
root. They live in `UserDefaults` under `sh.minne.app`; see
[Settings](/reference/settings#where-settings-are-stored).

## The search index cannot be rebuilt

:::warn
There is no reindex in the shipped build — no CLI flag, no menu item, no
protocol request. Deleting `minne.db` permanently loses full-text search over
everything captured so far.
:::

The code calls the index "rebuildable from the sources", and in principle it
is: every row can be derived from the markdown under `sources/`. No code does
it. What actually happens when the file goes missing is that a new, empty index
is created, new captures are indexed into it from that moment, and the earlier
snapshots stay on disk as markdown that nothing can search.

Your markdown and your wiki are untouched either way. The sync pass also
notices that its watermark now sits past the end of the index and resets it to
zero, so the surviving backlog is re-read rather than skipped.

## Naming rules

| Thing | Rule |
| --- | --- |
| Wiki slug | NFKD-folded, lowercased, runs of non-alphanumerics collapsed to `-`, cut at 60 characters. |
| Source app slug | The same folding, cut at 48 characters. Falls back to the bundle id, then to `app`. |
| Style page title | `Style — <App>`, or `Style — <App> — <Recipient>`. |
| Citation | `sources/YYYY-MM-DD/HHmm-<app>.md#N`, `N` 1-based. The only citation form. |
| Link target | A page's title, its slug, or its path without `.md`, matched case-insensitively. |

## Page frontmatter

Flat `key: value` pairs only. Nesting, indentation and duplicate keys are all
parse errors.

| Field | Required on | Value |
| --- | --- | --- |
| `title` | every page | Unique across the wiki; it is what `[[wikilinks]]` resolve to. |
| `type` | every page | `person`, `project`, `topic`, `daily` or `style`. `index` and `log` for the two root pages. |
| `summary` | every page | One or two sentences. Shown by retrieval before the page is opened. |
| `sources` | every page | List of citations, `[]` when there are none yet. |
| `last_updated` | every page | `YYYY-MM-DD` or an ISO timestamp. Always stamped from the clock. |
| `date` | `daily` | `YYYY-MM-DD`. |
| `aliases` | — | Optional, on a person. Preserved on write; nothing reads it. |
| `status` | — | Optional, on a project: `active`, `paused`, `done`. Preserved on write; nothing reads it. |

Source files carry a different, fixed header: `type: source`, `app`,
`bundle_id`, `date`, `hour`, `started`. Each appended snapshot section then
carries `time`, `window`, and optionally `url`, `truncated` and `redactions`.

## Editing by hand

| File | Verdict |
| --- | --- |
| `SCHEMA.md` | Yours. Edit freely. |
| `index.md` | Safe. Only the machine-maintained entry line is touched. |
| `wiki/**` | Safe, except that an active sync pass may replace a page body wholesale, and the two machine sections on a style page are replaced in place. |
| `log.md` | Append-only by convention. |
| `sources/**` | Do not edit. Snapshot numbering derives from the highest `## Snapshot N` heading, so an edit can break citations. |
| Application Support | Do not edit. |

Deleting a wiki page leaves a broken link in `index.md` for the next lint pass
to fix. Deleting `SCHEMA.md`, `index.md` or `log.md` gets a fresh seeded copy.

:::warn
Quit Minne before copying or editing `~/Minne` wholesale. The app appends to
source files with an open handle and caches the next snapshot number per file,
so a copy taken while it runs can drift.
:::

## Retention

Raw captures older than the retention window are deleted a whole day-directory
at a time, together with their rows in `minne.db`. The default window is 90
days; `0` means forever. The wiki is never pruned. See
[Settings → Privacy](/reference/settings#privacy).

## What a wipe removes

**Delete All Memory…** in Settings → Privacy removes:

- `~/Minne` in full, then re-seeds an empty memory
- `minne.db` and its `-wal` / `-shm` sidecars
- `sync-state.json`
- `auth.json` — you are signed out through the brain first

`config.json` survives. Which provider and model you picked is a preference,
not a memory. There is no undo and no copy anywhere else; see
[What leaves your Mac](/privacy).
