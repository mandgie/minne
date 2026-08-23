---
title: Steering with SCHEMA.md
description: SCHEMA.md is the one file in your memory that Minne never rewrites, and the place to say what the agent should keep, ignore and call things.
---

`~/Minne/SCHEMA.md` is the contract between you and the agent that maintains
your wiki. Minne writes it once, when the memory is created, and never touches
it again. Everything else in the folder is either the app's or the agent's;
this file is yours.

It ships as a readable description of how the memory is organised — the three
layers, the page types, the frontmatter, the citation form. That is the part
you can leave alone. What makes it worth opening is the part you add: the
standing instructions about your own work that no default could know.

## Who reads it, and when

Three agents work on your memory: the sync pass that digests captures, the
weekly lint pass that repairs the wiki, and chat. All three are told the same
thing — the rules of this wiki are in `SCHEMA.md`, read it when you are unsure.

That is a deliberate design, and it has a consequence worth knowing. The file
is not pasted into every prompt; the agent reads it with its own `read_page`
tool when it needs it. So rules land best when they are phrased as the kind of
thing an agent goes looking for: how pages are named, what a page of this type
should contain, what is not worth a page at all. A rule buried in a long aside
is a rule that may not get read.

Keep the file short for the same reason. A page of clear conventions is worth
more than five pages of prose.

## What an edit cannot change

This is the caveat to state before anything else.

:::warn
Editing `SCHEMA.md` changes what the *model* is told. It does not change what
the *linter* enforces. The structural rules are compiled constants in the
brain, and they win.
:::

Invent a sixth page type in `SCHEMA.md` — `meeting`, say — and the agent may
well try to use it. `write_page` will reject it, because the five types are a
list in the code. The same goes for the rest of the structure:

| Fixed in code, not in the file |
| --- |
| The five page types: `person`, `project`, `topic`, `daily`, `style` |
| The required frontmatter fields, and the fact that they are required |
| The frontmatter grammar — flat `key: value`, no nesting, no duplicate keys |
| The citation form `sources/YYYY-MM-DD/HHmm-app.md#N` |
| Where a page of each type lives on disk, and how its slug is derived |
| The `- [[Title]] — summary` entry line in `index.md` |
| The log entry heading, and the four pass names |
| Every lint rule and its severity |

None of that is a limitation of the schema file so much as the reason it can be
edited safely: you cannot write a rule that leaves the wiki structurally
broken, because the write that would break it is refused before it lands.

## What an edit genuinely steers

Everything above the structure and inside it. In practice, five things:

- **What is worth keeping.** The agent's default judgement about what counts as
  durable memory is generic. Yours is not.
- **What to ignore.** The strongest instructions in most people's schema files
  are the negative ones.
- **How pages should be shaped.** Which sections a project page carries, how
  long a summary runs, what a person page should always answer.
- **Naming and tone.** How subjects are titled, which language pages are
  written in, what a summary may assume the reader knows.
- **What to leave alone.** Pages or whole directories you maintain yourself.

## Three edits worth making

### Say what is not memory

The most useful section in a schema file is usually a list of things never
worth a page. Add it under a heading the agent will recognise:

```markdown
## Not memory

Never write a page about:

- Recruiter mail and cold outreach, however specific.
- Documentation, articles or reference material I only read. A page is for
  what I am doing, not what I looked at.
- Job adverts, newsletters, and anything from a mailing list.
- One-off support conversations with a vendor, unless a decision came out of
  it that changes a project.

When a capture is only navigation — menus, settings panes, a file browser —
skip it. Skip the whole batch if that is all it holds.
```

This is worth more than any positive instruction. The pass errs towards
writing, and telling it where not to is what keeps the wiki small enough to be
worth reading.

### Fix your naming conventions

The one mistake the sync pass must not make is a near-duplicate page — the same
person under two spellings, the same project under two names. It already
checks the index before writing. Naming rules make that check reliable:

```markdown
## Naming

- People are titled by the name they sign their own mail with, not the name in
  the From header. Put other spellings in `aliases`.
- Client work gets one project page per engagement, titled
  `<Client> — <Engagement>`, never one page per client.
- Internal tools keep their real name, lowercase as we write it: `kestrel`,
  not `Kestrel`.
- Norwegian names keep their diacritics in the title. The slug will fold them.
```

### Shape the pages you actually use

If you read project pages to answer "what now?", say so:

```markdown
## Project pages

Every project page carries a `## Next` section holding one line: the single
next action, in the imperative. Rewrite it on every pass — a stale next action
is worse than none.

Summaries never repeat the title. "The Oslo migration" says nothing that
`title: Oslo Migration` did not.

## Hands off

`wiki/reading/` is mine. Do not create, edit, or re-file anything under it,
and do not link into it from a daily page.
```

A rule like the last one is honoured because the agent follows the contract,
not because anything enforces it. Nothing in the wiki is off limits to
`write_page` except `sources/`, `SCHEMA.md` and the two root pages.

## Writing a rule the model can follow

The rules that work read like the ones already in the file: short, concrete,
addressed to the agent, and stating the consequence.

- **Say what to do, not how you feel about it.** "Cite the snapshot inline when
  the claim is specific" beats "citations are important to me".
- **Give the reason when the reason is the rule.** "Prefer updating an existing
  page — a near-duplicate is worse than a thin update" tells the agent how to
  break a tie you did not anticipate.
- **Put it under a heading.** The file is read whole but skimmed by structure.
- **Do not restate the defaults.** Everything already in the shipped file is
  already in force.
- **Do not contradict the structure.** A rule that fights the linter produces a
  refused write and a confused pass, not a new behaviour.

## Checking that a change took

Nothing validates `SCHEMA.md` — it has no frontmatter and no required shape;
the only thing the linter says about it is that a memory missing the file has
no contract at all. So test a change by watching what happens next:

1. Make the edit and save.
2. Run **Sync Now** in Settings → Memory, with something in the backlog.
3. Read the new entry at the bottom of `~/Minne/log.md`, then open the pages it
   names.

If the pass ignored a rule, the usual cause is that the rule was ambiguous
rather than unread. Rewrite it as an instruction with a subject and a verb, and
run another pass. See [Your memory folder](/guides/memory) for what a pass does
and how much it reads.

## If you delete it

Deleting `SCHEMA.md` gets you a fresh seeded copy — the app re-creates the file
along with `index.md` and `log.md` whenever it finds one missing. Nothing is
merged, so a copy of your edits is worth keeping if you have written a lot into
it. Putting `~/Minne` under git is the cheap version of that.

Until it is re-created, the wiki lints with a warning saying the memory has no
contract, and the agent falls back on what its prompt tells it — which is the
shipped rules in summary, and nothing of yours.
