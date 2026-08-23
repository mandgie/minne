---
title: Chat
description: A window that can search and read your whole memory — for the questions that are not about writing anything.
---

Press `⌥Space` anywhere and a small panel opens: *Ask your memory*. It answers
from the wiki Minne keeps of what you have been working on, and from the raw
captures underneath it.

This is the half of Minne that is not about drafting. What was agreed. When that
landed. Who asked for it. What you did on Tuesday.

## Opening it

`⌥Space` from any app, or **Open Chat** in the menu bar. The shortcut toggles:
it summons the panel to wherever you are, and closes it when it is already in
front of you. Escape closes it too.

It follows you across Spaces and floats over fullscreen apps, and it remembers
where you put it and how big you made it.

:::note
Chat is the one part of Minne that works with **no Accessibility grant at all**.
`⌥Space` is registered through Carbon, chosen precisely because it needs no
permission. Without the grant Minne captures nothing new — but everything it
already knows is still answerable.
:::

If another app already owns `⌥Space`, Minne cannot register it and says so in
Settings rather than leaving you pressing a dead key. Open chat from the menu
bar instead, or turn the shortcut off in
[Settings → General](/reference/settings#general).

## What it can do

The assistant has five tools over your memory, and it is told to search before
it answers rather than guessing:

| Tool | What it does |
| --- | --- |
| **Search memory** | Searches the wiki pages *and* the raw captures. Words are ANDed and matched whole; end a word with `*` for a prefix match. |
| **Read page** | Reads one file in full — a wiki page, `index.md`, `log.md`, `SCHEMA.md`, or one snapshot of a capture. |
| **List index** | The map of the wiki: every page with its type, summary and last update. |
| **Write page** | Creates or replaces one wiki page, and files it in the index. |
| **Append to log** | Records what it did in `log.md`. |

You can watch it work: a small line above the answer says *Searching memory for
"oslo trip"…*, *Reading wiki/ingrid-berg.md*, *Updating wiki/oslo-trip.md*, and
switches to the past tense when it is done.

## Yes, it can write to your memory

This is the difference between chat and the Minne key. The drafting key gets
search, read and list only — a draft may consult your memory but must never
rewrite it. Chat gets all five.

The instruction it works under: *when the conversation establishes something
durable about a person, a project or a topic, record it — passing chatter is not
memory.* So it will not write a page because you said hello, and it will not
usually volunteer one for small talk.

The practical consequences:

- **Correcting Minne is a conversation.** "Ingrid moved to the platform team,
  not infra" — ask it to update the page and it will, and log that it did.
- **You can dictate memory.** "Remember that the Oslo trip is now the week of
  the 14th" gets written down.
- **If it does not write something you wanted written, ask directly.** The
  threshold for volunteering is deliberately high.

Everything it writes is subject to the same rules as the sync pass: only `wiki/`
is writable, `index.md` is updated for it, and a page carrying a link that
resolves to nothing is refused outright. See
[Your memory folder](/guides/memory).

## The conversation itself

The transcript lives in the running app and is **not saved to disk**. Quit Minne
or let the brain restart and the conversation is gone; what it wrote into your
wiki is not.

**New chat** (the pencil icon) clears it deliberately. A turn that failed is
rolled out of the transcript on both sides, so a retry starts clean rather than
inheriting the wreckage.

One answer streams at a time. The stop button keeps whatever arrived before you
pressed it.

## Where the answers come from

The same memory everything else uses, and nothing else. If your wiki does not
know something, chat does not know it — it is instructed to say so plainly
rather than fill the gap.

Two things follow from that:

- **A brand-new install knows nothing**, because nothing has been distilled yet.
  Captures accumulate immediately; they become wiki pages when the sync pass
  runs, every 30 minutes.
- **What it can find is what has been written down.** The raw captures are
  searchable for as long as they are kept — 90 days by default — and the wiki
  outlives them.

## When something goes wrong

Errors render inline with a **Retry** button that drops the failed exchange and
resends. The ones you will actually see:

| Message | What it means |
| --- | --- |
| *You're not signed in to an AI provider yet* | [Choose your AI](/start/provider). |
| *Another answer is still streaming* | One turn at a time. Stop it or wait. |
| *Minne's brain isn't running. It restarts on its own — try again.* | The sidecar is restarting. It comes back by itself. |

## Reading your memory from somewhere else

If you would rather ask these questions inside Claude Desktop or another MCP
client, Minne can serve the same memory read-only over local stdio. See
[Minne in Claude Desktop](/guides/mcp).
