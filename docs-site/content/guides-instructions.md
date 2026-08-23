---
title: Telling it what you want
description: There is no syntax to learn. Type the instruction, or steer the draft in plain words — and the things you keep asking for become rules.
---

Minne has no sigil, no slash command, no magic prefix. There are three ways to
say what you want, and all three are ordinary English.

## Type the instruction into the field

Put what you want in the field itself and tap the key. Because there is text and
nothing selected, Minne reads it as an instruction to carry out and replaces the
whole field with the result.

```
say yes but push it to Thursday
```

```
three bullets on where the migration stands, for Ada
```

```
polite decline — I'm out that week
```

The instruction never survives; the answer takes its place.

:::warn
Any text sitting in an unselected field is read as an instruction. If you have a
half-written draft in there and you want it improved rather than replaced,
**select it first** — a selection means rewrite, and only the selection is
touched.
:::

## Steer the draft once you can see it

When the panel says **Draft ready**, press `⇥` (or click the field at the bottom
of the panel) and say what to change:

```
shorter
```

```
warmer, and mention the Thursday deadline
```

```
in Swedish
```

```
drop the apology
```

Return submits it. Shift-Return gives you a newline. Escape closes the field and
leaves the draft as it stands.

**Steers accumulate.** Ask for *shorter*, then *warmer*, and you get both — the
ones in force are shown as chips above the field. What the model is told is to
revise the draft it already wrote: change what you asked for, and leave the
wording, the facts and the length you did not mention alone.

### Steering is not the same as another take

`⌘R` — another take — asks for a *different* draft: a different angle, a
different opening, a different shape, explicitly not a paraphrase of the one you
just read. Earlier steers still apply, and a regenerate never counts as a new
instruction.

Use `⌘R` when the draft is wrong. Use `⇥` when it is nearly right.

## Edit it yourself

`⌘E`, or a click on the draft text, turns the panel into an editor with the
whole draft in it. Return inserts what is on screen — as edited. Shift-Return is
a newline, Escape leaves the editor and keeps your changes.

Everything downstream works on the edited text: press `⌘R` after editing and
Minne writes another take on *your* version, not on its own.

This matters more than it looks, because of what happens next.

## What you keep asking for becomes a rule

Minne counts. Not the words of your drafts — those are compared once and
forgotten — but the *shape* of what you keep correcting, per context.

**Repeated steers.** Ask for `shorter` three times on the same site or in the
same app and it becomes a standing rule on that context's style page, written in
your own words:

```markdown
## Standing guidance

- Shorter — asked 3 times
```

From then on it rides into every draft for that context, and you stop typing it.

**Repeated edits.** When you edit a draft before inserting it, Minne compares
what it wrote against what you actually sent and records the difference as a
feature from a fixed vocabulary of ten — trimmed, grew, greeting removed,
sign-off added, exclamations removed, switched to Swedish, and so on. Never the
text; only which of those ten it was. A feature that has been corrected three
times **and** happens more often than you accept drafts untouched becomes a rule
in the same section.

Three trims against ten clean inserts is taste, not a rule. Accepting drafts as
they come retires rules that no longer hold.

### The context a rule belongs to

The domain when the press had a URL, otherwise the app — narrowed by recipient
when the window title names one. So a rule you set while writing on x.com does
not follow you into Mail, and how you write to one person in Slack can differ
from how you write in the channel.

### Where those rules live, and how to change them

In `## Standing guidance` on `wiki/style/style-<context>.md`. They are written
deterministically — never paraphrased by a model — and there are at most eight
per page.

Edit the section by hand and Minne works with what it finds. Delete a rule you
disagree with and it stays gone **until the habit recurs**, which is the
feature: you asked again.

The counters themselves live outside the wiki, in
`~/Library/Application Support/Minne/sync-state.json`, so an agent rewriting a
style page cannot erase what has been learned.

:::note
Normalisation is mechanical: lowercase, collapse whitespace, drop trailing
punctuation. `Shorter.` and `shorter` pool together; `shorter please` is a
different steer. Phrase a habit the same way each time and it reaches the
threshold sooner. A steer over 200 characters is treated as a one-off and never
counted.
:::

## Steering the whole memory instead

Everything above is per-context and learned. To change what Minne keeps in the
first place — what is worth a page, how pages should be shaped, what to ignore
entirely — edit `SCHEMA.md`, which is yours and which Minne never rewrites. See
[Steering with SCHEMA.md](/guides/schema).
