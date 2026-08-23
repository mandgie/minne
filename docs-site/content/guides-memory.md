---
title: Your memory folder
description: What Minne writes to ~/Minne, in what shape, and why the folder is arranged the way it is.
---

Everything Minne remembers is a markdown file in `~/Minne`. There is no
database of notes, no proprietary container, no export step. The folder is the
product: open it in Finder, grep it, edit it, delete it.

It has two layers. `sources/` is the raw capture — the text of the windows you
worked in, written as it was seen and never touched again. `wiki/` is what the
agent made of that: a few dozen pages about the people, projects and topics
that keep coming back, each one citing the captures it came from. The first
layer expires. The second does not.

The rules the agent works to are in `~/Minne/SCHEMA.md`, and that file is
yours to change — see [Steering with SCHEMA.md](/guides/schema).

## Two roots, one of them yours

```
~/Minne/
  SCHEMA.md              the contract — human-owned
  index.md               the front door
  log.md                 what the agent did, newest last
  sources/2026-08-17/1400-safari.md
  wiki/ingrid-berg.md
  wiki/daily/2026-08-17.md
  wiki/style/style-mail.md
```

A second root holds what is derived or secret:
`~/Library/Application Support/Minne/`, created mode `0700`. That is where
`minne.db` (the search index), `sync-state.json`, `auth.json` and `config.json`
live. Nothing there is memory, and nothing there is meant to be read by hand.
The split is deliberate: your markdown stays free of machinery, and a
credential never lands in a folder you might sync to Dropbox.

Both roots move with an environment variable — `MINNE_MEMORY_ROOT` and
`MINNE_APP_SUPPORT_DIR`. See [CLI and environment](/reference/cli).

## `sources/` — the raw captures

One file per app per hour:

```
sources/YYYY-MM-DD/HHmm-<app-slug>.md
```

`HHmm` is the *start* of the hour bucket, in local time. Every capture from
Safari between 14:00 and 14:59 lands in `1400-safari.md`. The app slug comes
from the app's own name, folded to lowercase, non-alphanumerics collapsed to
hyphens, cut at 48 characters.

Each file opens with frontmatter written once, when the file is created:

```yaml
---
type: source
app: "Safari"
bundle_id: "com.apple.Safari"
date: 2026-08-17
hour: "1400"
started: 2026-08-17T14:03:12+02:00
---
```

Every capture then appends one section:

````markdown
## Snapshot 3 — 14:31:07

```yaml
time: 2026-08-17T14:31:07+02:00
window: "Minne — a local memory"
url: "https://example.com/minne"
```

```text
…the captured text…
```
````

The window title and the URL sit in the section rather than the header because
they change from capture to capture, while the header, written once, cannot.
`truncated: true` marks a capture cut off at the size cap. `redactions: N`
counts the sensitive spans — card numbers, personal identity numbers, IBANs —
replaced with `▮▮▮`. That masking happens before anything is written, so the
unredacted text never reaches this folder, and therefore never reaches a model
either. See [What leaves your Mac](/privacy).

The format is append-only by design. A section is written once and never
edited, so the file survives being produced a piece at a time by a process that
may be killed between any two of them.

## `wiki/` — what was worth keeping

One page per subject, named by its slug: lowercase, accents folded away,
non-alphanumerics collapsed to hyphens, cut at 60 characters.

```
wiki/ingrid-berg.md          person
wiki/oslo-trip.md            project
wiki/typescript-tooling.md   topic
wiki/daily/2026-08-17.md     daily
wiki/style/style-mail.md     style
```

Daily logs and style pages are the two nested types. Everything else sits
directly in `wiki/` so links stay short.

### The five page types

| Type | What it holds |
| --- | --- |
| `person` | Someone you work or correspond with: what they do, how they relate to you, what is open with them. |
| `project` | A piece of work with a beginning and an end: state, decisions, open questions, who is involved. |
| `topic` | A subject that keeps coming back but is not a project — a technology, a place, a recurring question. |
| `daily` | One page per day, in `wiki/daily/YYYY-MM-DD.md`, linking to what that day touched. |
| `style` | How you write in one context. Minne's draft key reads these so a generated reply sounds like you. |

There are five, and only five. `index` and `log` are the types of the two root
pages, which are navigation rather than memory.

### Frontmatter

Every page opens with a small, flat block:

```yaml
---
title: Ingrid Berg
type: person
summary: Colleague at Nordfjord; runs the Oslo migration.
sources: [sources/2026-08-17/1400-mail.md#3, sources/2026-08-18/0900-slack.md#1]
last_updated: 2026-08-18
---
```

`title`, `type`, `summary`, `sources` and `last_updated` are required on every
page; a `daily` page also needs `date`. This is a hand-parsed subset of YAML,
not YAML: flat `key: value` pairs only. Nesting is an error, an indented line
is an error, and a duplicate key is an error. The narrowness is the point —
the frontmatter stays greppable and cannot be read two ways.

Two fields are load-bearing. `title` must be unique across the wiki, because it
is what `[[wikilinks]]` resolve to. `last_updated` is always stamped from the
clock when the page is written, never taken from the model, so "the agent
forgot to bump the date" is not a failure mode that exists.

Some types carry optional fields by convention: `aliases` on a person, `status`
on a project (`active`, `paused`, `done`). Minne preserves them when it
rewrites a page, but nothing reads them.

### Links

Pages link with `[[Title]]`, or `[[Title|other words]]` when the sentence needs
different wording. A link resolves against the page's title, its slug, or its
path without the `.md` — case-insensitively. Those are the three forms Obsidian
accepts, so a memory opened there behaves the same way it does inside Minne.

Two rules follow. Every page must be reachable from `index.md`, directly or
through other pages: a page nothing links to cannot be found, and does not
count as memory. And every link must resolve, which is why the agent is told to
write the page it is about to link to first.

### Style pages have two machine-owned sections

A style page is titled `Style — <App>`, or `Style — <App> — <Recipient>` when
you write differently to one person or channel. Most of it is ordinary prose
the agent writes from what it observed. Two sections are not:

- **`## Register`** — how you actually write to that recipient in that app:
  greeting, sign-off, typical length, emoji, language. Measured from messages
  you sent, not messages you read.
- **`## Standing guidance`** — at most eight rules, distilled from steers you
  have repeated while drafting and from how you edit drafts before sending.

Both are rewritten in place on each pass. Their counters live in
`sync-state.json` rather than on the page, so an agent rewriting the page
around them cannot erase what has been learned. Delete a section by hand and it
stays gone until the habit recurs — which is the feature. You asked again.

## Citing a capture

There is exactly one citation form: a source file plus a 1-based snapshot
number.

```
sources/2026-08-17/1400-safari.md#3
```

It appears in the `sources:` frontmatter of a page and inline, in backticks,
wherever a specific claim comes from a specific capture. Nothing cites a whole
day, a whole app or a range — only the snapshots that were actually read.

Sources expire and pages do not, so a citation can outlive the file it points
at. That is a warning, not an error: the page kept what mattered, which is the
whole point of distilling.

## `index.md` and `log.md`

`index.md` is the map. Every page is listed under one of five headings —
People, Projects, Topics, Daily logs, Writing style — as a single line:

```markdown
- [[Ingrid Berg]] — Colleague at Nordfjord; runs the Oslo migration.
```

That line is maintained mechanically as a side effect of every page write. A
renamed page has its line moved; a page that changes type is re-filed under the
right heading. **Everything else in the file is left exactly as it is** — your
own prose, your extra sections, your ordering. It is safe to edit.

`log.md` is append-only and written only by the agent's `append_log` tool. Each
entry is an ISO timestamp with your local offset, an em dash, and the kind of
pass:

```markdown
## 2026-08-17T14:31:07+02:00 — sync

Read 12 snapshots. Updated [[Oslo Trip]], created [[Ingrid Berg]].
```

The pass is one of `bootstrap`, `sync`, `lint` or `chat`. It is the shortest
honest account of what happened to your memory, and it is worth reading when a
page changes in a way you did not expect.

## How the pages get written

A sync pass runs every 30 minutes by default, and a lint pass weekly. **Sync
Now** in Settings → Memory forces one. Both are configurable with
`MINNE_SYNC_INTERVAL_MS` and `MINNE_LINT_INTERVAL_MS`.

One pass reads at most four batches of twelve snapshots, 4 000 characters of
each. It has three properties worth knowing about:

- **Incremental.** A watermark in `sync-state.json` records how far it got. A
  pass only reads past that mark, and advances it after each batch, so a crash
  costs one batch and never re-digests what already landed.
- **Idempotent.** A pass with nothing new writes nothing and calls no model at
  all. The backlog is counted before credentials are so much as looked at — the
  cheapest pass is the one that stops at a `count(*)`.
- **Contained.** One pass at a time, a turn cap per batch, and a snapshot
  budget per pass.

The agent is told to call `list_index` before anything else, because the
subject usually already has a page under a name it would not have chosen, and a
near-duplicate page is the one mistake the pass must not make. It is told to
prefer few substantial updates over many thin ones, to skip UI chrome, menus
and passing chatter, and to finish with exactly one log entry.

Every write is checked before it lands. A write that would introduce a lint
*error* on that page or on `index.md` is refused outright; a *warning* goes
through and is reported back to the model. Problems elsewhere in the tree are
ignored on purpose — a wiki you have already broken somewhere else should not
stop the agent working here.

The lint rules you are most likely to meet:

| Code | Severity | Meaning |
| --- | --- | --- |
| `broken_link` | error | A `[[link]]` resolves to nothing. |
| `duplicate_title` | error | Two pages claim the same title, so links cannot resolve. |
| `orphan` | warning | No path of links leads here from `index.md`. |
| `no_sources` | warning | The page cites nothing. |
| `citation_missing` | warning | A cited source is no longer on disk — usually retention. |

:::note
The agent has no delete tool and no rename tool. Nothing in the wiki is ever
removed by Minne. If a page is gone, a person removed it.
:::

## Retention: sources expire, the wiki does not

Raw captures older than the retention window are deleted, whole day-directories
at a time, along with their rows in the search index. The default is 90 days;
Settings → Privacy takes any number, and `0` means forever. See
[Settings → Privacy](/reference/settings#privacy).

The wiki is never pruned. That is the bargain the whole design rests on: the
distilled pages outlive the captures they came from, so a year-old project page
still says what was decided long after the windows it was read from are gone.

## Editing it by hand

You may edit anything in the folder. What that costs, file by file:

| File | Verdict |
| --- | --- |
| `SCHEMA.md` | Yours entirely. Minne writes it once and never rewrites it. |
| `index.md` | Safe. Only the one entry line per page is machine-touched. |
| `wiki/*.md` | Safe, with one caveat below. |
| `log.md` | Append-only by convention; nothing enforces it. |
| `sources/**` | **Do not edit.** |

The caveat on wiki pages: a page the sync pass is actively updating can have
its body replaced wholesale when the model passes a new one, and the two
machine sections on a style page are replaced in place. Edits to a page nobody
is currently writing to survive fine.

Sources are the exception because snapshot numbering is derived from the
highest `## Snapshot N` heading in the file. Edit that and you can break every
citation pointing into it.

Deleting a wiki page leaves its entry line behind in `index.md` as a broken
link, which the next lint pass will notice and try to repair. Deleting
`index.md`, `log.md` or `SCHEMA.md` gets you a fresh seeded copy.

## Obsidian, git, and backups

`~/Minne` is an Obsidian vault as it stands — point Obsidian at the folder and
the wikilinks, the daily notes and the frontmatter all work, because the link
resolution rules were chosen to match. It is also plain enough to put under
git, which gives you a history of what the agent changed and a way back from an
edit you regret.

:::warn
Quit Minne before copying or editing `~/Minne` wholesale. The app appends to
source files with an open handle and caches the next snapshot number per file
in memory, so a copy taken mid-run can drift from what the app believes is
there.
:::

Full-text search over the captures lives in `minne.db`, not in the folder, and
it cannot be rebuilt — see [Files and paths](/reference/files) before you delete
anything in Application Support.
