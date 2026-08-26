---
slug: second-brain
title: A second brain that maintains itself — plain markdown on your Mac — Minne
h1: A second brain you never have to file
description: Every second brain dies of upkeep. Minne's wiki writes itself from the work you were already doing — one markdown page per person, project and topic, in a folder you can open in Obsidian, grep, and take with you.
published: 2026-08-26
---

Every second brain dies the same death. The system is sound, the first week
is glorious, and then a busy Tuesday happens and nothing gets filed — and a
second brain you have stopped feeding is just a folder of last month. The
problem was never the method. It is that capture is a chore, and chores lose.

Minne removes the chore. It watches the work you were doing anyway — the
text of the windows you work in, never a picture of your screen — and an AI
agent distils it into a wiki of plain markdown in `~/Minne`: one page per
person, project and topic, updated every half hour, each page citing the raw
captures it came from. You write nothing down. It is already written down.

> A second brain only works if it is maintained, and it is only trustworthy
> if you can read it. A self-maintaining wiki in plain markdown is the version
> that survives contact with a busy week.

## The folder

```
~/Minne/
  SCHEMA.md          the rules of the wiki — yours, never rewritten
  index.md           the map: every page, one line each
  sources/           raw captures, append-only, masked before disk
  wiki/
    ingrid-berg.md   a person
    oslo-move.md     a project
    daily/           one page per day
    style/           how you write, per context
```

Wiki pages link with `[[wikilinks]]`, carry flat frontmatter, and cite their
sources down to the snapshot. Raw captures expire after 90 days by default;
the distilled wiki never does. Every file and field is documented in
[Your memory folder](https://docs.minne.sh/guides/memory).

## You own the schema

The agent maintains the wiki, but the contract it works to — `SCHEMA.md` —
is yours, written once by Minne and never touched again. Tell it what is
never worth a page (recruiter mail, newsletters), how projects should be
named, which sections a page must carry, which folders are hands-off. The
PARA-or-Zettelkasten argument dissolves rather pleasingly: whatever your
method, write it in the schema and the librarian follows it.
[Steering with SCHEMA.md](https://docs.minne.sh/guides/schema) shows the edits
worth making.

## Grep it, git it, leave anytime

`~/Minne` is an Obsidian vault as it stands — the wikilinks, daily notes and
frontmatter were designed to resolve the way Obsidian resolves them. It is
plain enough to grep, and putting it under git gives you a diffable history
of what the agent changed. Other AI tools can read it too:
[Minne serves the memory read-only over MCP](https://docs.minne.sh/guides/mcp)
to Claude Desktop or any MCP client.

And because the memory is files, leaving is copying a folder. No export
button, no lock-in — the wiki outlives the app, which is exactly the right
order of priority. If that idea is new,
[what is a personal AI memory?](/what-is-ai-memory) makes the longer
argument.

## What it costs

Minne is free and MIT-licensed. The intelligence is a model you bring: an
API key from Anthropic or OpenAI, [Ollama on your own machine](/local-ai-writing)
— in which case nothing leaves it — or a Claude/ChatGPT subscription sign-in.
There is no Minne account, no Minne server, and no Minne subscription;
[the provider guide](https://docs.minne.sh/start/provider) lays out the
trade-offs. macOS 14 and later.
[Download it](https://github.com/mandgie/minne/releases/latest/download/Minne.dmg)
and let the filing do itself.
