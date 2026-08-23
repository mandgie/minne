---
title: Introduction
description: Minne is a memory for your Mac — it remembers what you work on and writes from it wherever you type.
---

Minne is a menu-bar app for macOS. It reads the text of the window you are
working in through the Accessibility APIs — the words, never a picture of your
screen — and distils what it sees into a wiki of plain markdown notes in
`~/Minne`. Then it writes from that memory: tap one key in any text field and
the reply, the summary or the answer arrives already knowing the context you
would otherwise have gone digging for.

Two things make it different from most of its neighbours. There is no Minne
account and no Minne server — the memory is a folder on your disk that you can
open in Obsidian, edit by hand, or delete. And the intelligence is whichever AI
you already pay for: sign in with Claude or ChatGPT, bring an API key, or point
it at a model running on your own machine.

*Minne* is Swedish and Norwegian for *memory*.

:::note
These docs describe Minne **0.1.5**. It is early software, developed in the
open — [the source](https://github.com/mandgie/minne) is the final word on
anything written here.
:::

## Start here

<ul class="cards">
<li><a href="/start/install"><strong>Install</strong><span>Download, open past the quarantine warning, grant the one permission Minne needs.</span></a></li>
<li><a href="/start/first-run"><strong>First run</strong><span>What onboarding asks you, and what Minne does in its first hour.</span></a></li>
<li><a href="/start/provider"><strong>Choose your AI</strong><span>Claude, ChatGPT, an API key, or a local model. The trade-offs of each.</span></a></li>
<li><a href="/guides/minne-key"><strong>The Minne key</strong><span>The whole product in one keypress. Start here once it is running.</span></a></li>
</ul>

## What it does

**The Minne key.** Tap right-Option in any text field. Minne reads the field,
the window around it and the notes it recalls, then writes a draft in a panel
by the caret. Nothing is typed into your document until you press Insert.

**Plain-words control.** Type what you want instead of what you mean — *"say
yes but push it to Thursday"* — and Minne replaces the instruction with the
thing itself. Steer a draft you can see in the same plain words, and the
corrections you keep making quietly become rules.

**Chat.** A window that can search and read your whole memory, for the
questions that are not about writing anything: what was agreed, when did that
land, who asked for it.

**The memory.** Not a black box. `~/Minne/wiki/` is one markdown page per
person, project and topic, `~/Minne/sources/` is the raw captures they were
built from, and `SCHEMA.md` is the file *you* own that tells the agent what to
keep.

## Where the rest is

<ul class="cards">
<li><a href="/guides/memory"><strong>Your memory folder</strong><span>The on-disk format, page by page and field by field.</span></a></li>
<li><a href="/privacy"><strong>What leaves your Mac</strong><span>Every byte that goes anywhere, per feature, and what never does.</span></a></li>
<li><a href="/reference/settings"><strong>Settings</strong><span>Every control in the app, its default, and what changing it does.</span></a></li>
<li><a href="/troubleshooting"><strong>Troubleshooting</strong><span>Symptom, cause, fix — including the apps where insertion is awkward.</span></a></li>
</ul>

:::tip
Every page here is also plain markdown at the same URL with `.md` on the end —
`docs.minne.sh/guides/minne-key.md`. Hand one to an assistant and it can read
these docs without a scraper. [`llms.txt`](https://docs.minne.sh/llms.txt) has
the whole map.
:::
