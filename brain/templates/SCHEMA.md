# SCHEMA.md — how Minne's memory is organised

This file is the contract between you and the agent that maintains this
wiki. It is **human-owned**: Minne writes it once, when the memory is
created, and never edits it again. Change anything here and the agent
follows the new rules.

## Three layers

| Layer | Path | Owner | Rule |
| --- | --- | --- | --- |
| Sources | `sources/` | the app | Immutable. Append-only, never edited or rewritten. |
| Wiki | `wiki/`, `index.md`, `log.md` | the agent | Distilled, interlinked pages that cite sources. |
| Schema | `SCHEMA.md` | you | The rules the agent works to. |

Everything is plain markdown: open this folder in Obsidian, grep it,
edit it, or delete it. Nothing here is a Minne-private format.

## Sources — raw capture

Minne captures the text of your foreground window (never screenshots)
and writes it to one file per app per hour:

```
sources/YYYY-MM-DD/HHmm-<app-slug>.md
```

`HHmm` is the *start of the hour bucket* in local time — every capture
from Safari between 14:00 and 14:59 lands in `1400-safari.md`.

Each file opens with YAML frontmatter describing the bucket, written
when the file is created:

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

Every capture then **appends** one section — existing sections are never
touched, so a source file only ever grows:

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

The window title and URL live in the section rather than the
frontmatter because they change from capture to capture while the file
header, written once, cannot.

`truncated: true` marks a capture cut off at the size cap;
`redactions: N` counts sensitive spans replaced with `▮▮▮` before
anything was written. Masking happens before persistence — the
unredacted text never reaches this folder.

### Citing a source

A snapshot is cited by its file path and its snapshot number:

```
sources/2026-08-17/1400-safari.md#3
```

That is the only citation form. It appears in a page's `sources:`
frontmatter and inline, in backticks, wherever a specific claim comes
from a specific capture. Never cite a whole day, an app, or a range —
cite the snapshots you actually read.

Sources expire (see *Retention*), so a citation can outlive the file it
points at. A citation whose file is gone is not an error: the page kept
what mattered, which is the point of distilling.

## Wiki — distilled memory

`index.md` is the front door, `log.md` is the diary, and every other
page lives in `wiki/`. The agent owns all three; you may edit them
freely and the agent will work with what it finds.

### Page files

One page per subject, named by its slug — lowercase, ASCII, words
joined by hyphens:

```
wiki/ingrid-berg.md          person
wiki/oslo-trip.md            project
wiki/typescript-tooling.md   topic
wiki/daily/2026-08-17.md     daily log
```

Daily logs are the one nested type; everything else sits directly in
`wiki/` so links stay short.

### Frontmatter

Every page opens with frontmatter. It is a deliberately small subset of
YAML — flat `key: value` pairs, no nesting — so it stays greppable and
unambiguous:

```yaml
---
title: Ingrid Berg
type: person
summary: Colleague at Nordfjord; runs the Oslo migration.
sources: [sources/2026-08-17/1400-mail.md#3, sources/2026-08-18/0900-slack.md#1]
last_updated: 2026-08-18
---
```

Required on every page: `title`, `type`, `summary`, `sources`,
`last_updated`.

| Field | Value |
| --- | --- |
| `title` | Human name of the subject. Unique across the wiki — it is what `[[wikilinks]]` resolve to. |
| `type` | One of `person`, `project`, `topic`, `daily`. (`index` and `log` are used by the two root pages.) |
| `summary` | One or two sentences. This is what retrieval shows before opening the page. |
| `sources` | List of citations the page was derived from. A list, even with one entry; `[]` while a page has no citations yet. |
| `last_updated` | `YYYY-MM-DD` (or a full ISO 8601 timestamp) of the last time the agent revised the page. `null` on a freshly bootstrapped `index.md`, which nothing has been written to yet. |

Lists are written inline (`[a, b]`) or as `- ` items on following
lines; both are read the same way. Values that contain `:` or `#`, or
that start with a quote or a bracket, are double-quoted.

Optional fields per type, when the agent knows them: `aliases` (person,
list of other names to match), `status` (project: `active`, `paused`,
`done`), `date` (daily: `YYYY-MM-DD`, required for daily logs).

### Page types

- **person** — someone the user works or corresponds with. What they do,
  how they relate to the user, what is open with them.
- **project** — a piece of work with a beginning and an end. State,
  decisions, open questions, who is involved.
- **topic** — a subject that keeps coming back but is not a project:
  a technology, a place, a recurring question.
- **daily** — one page per day in `wiki/daily/YYYY-MM-DD.md`: what the
  user worked on that day, linking to the pages it touched.

Templates for each type ship with Minne; a new page starts from one.

### Links

Pages link to each other with `[[Title]]`, or `[[Title|other words]]`
when the sentence needs different wording. The target is a page's
`title`, matched case-insensitively; a page's slug works too, so
`[[2026-08-17]]` finds that day's log.

Two rules follow from this:

1. **Every page is reachable from `index.md`**, directly or through
   other pages. A page nothing links to cannot be found and does not
   count as memory.
2. **Every link resolves.** Writing `[[Some Page]]` before that page
   exists leaves a dangling link; create the page in the same pass or
   don't write the link.

### `index.md`

The map of the memory. It lists every page, grouped by type, each with
its one-line summary. When the agent creates a page it adds the entry
here in the same pass.

### `log.md`

An append-only diary of what the agent did, newest last. One entry per
pass:

```markdown
## 2026-08-17T14:31:07+02:00 — sync

Read 12 snapshots. Updated [[Oslo Trip]], created [[Ingrid Berg]].
```

The heading is the entry: an ISO 8601 timestamp, an em dash, and the
kind of pass — `sync` (ingesting new sources), `lint` (fixing the wiki
against this schema), `chat` (a change the user asked for while
talking), or `bootstrap` (the memory being created). The body is a
sentence or two in plain prose, with `[[wikilinks]]` to the pages
touched.

## Retention

Raw sources older than the retention window (90 days by default) are
deleted automatically, together with their entries in the search index.
**The wiki is never pruned** — that is the point of distilling: the
pages outlive the captures they came from.
