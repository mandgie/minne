---
slug: what-is-ai-memory
title: What is a personal AI memory? — Minne
h1: What is a personal AI memory?
description: A personal AI memory is an index of what you have worked on — the people, projects and decisions — kept on your own machine in a form you can read, that an AI assistant consults before it writes or answers. Here is how one works, and what it is for.
published: 2026-08-26
byline: true
definedTerm: personal AI memory
---

> A personal AI memory is an index of what you have worked on — the people,
> projects and decisions — kept on your own machine in a form you can read,
> that an AI assistant consults before it writes or answers.

That one sentence carries four claims, and each is a choice: it is an *index*,
not a recording; it covers *your work*, not the internet; it lives *on your
machine*, not in an account; and it exists *to be consulted* — by an assistant
that would otherwise open every conversation knowing nothing about you.

This page is the concept. [Minne](/) is one implementation of it, and is used
below as the worked example.

## How is it different from chat history?

Chat memory — the kind ChatGPT or Claude keeps — remembers what you *told the
assistant*. A personal AI memory remembers what you *did*: the threads you
answered, the decisions that landed, the people who keep appearing. You never
dictated any of it, and that is the point. The context an assistant needs to
write your Monday email is not in your previous chats; it is in last week's
work.

The second difference is custody. Chat history lives in a provider's account,
in a format you cannot open. A memory you own sits on your disk and remains
yours when you switch providers — or leave entirely.

## Does it need to record my screen?

No. The recording approach — capture everything as video, search it later —
was Rewind's, and it bought totality at the price of storing every pixel you
ever saw. The alternative is to read the *text* of the window you are working
in, through the same accessibility interface a screen reader uses, and keep
only what was distilled from it. Text is enough to know what you worked on;
it is also maskable, greppable and small. The trade-offs run both ways —
[they have their own page](/ai-without-screen-recording).

## Where should the memory live?

In files you can open. If an assistant is going to act on a summary of your
working life, you need to be able to read that summary, correct it, and
delete it — which argues for plain markdown over an opaque database. Minne's
version is a wiki in `~/Minne`: one page per person, project and topic, raw
captures kept separately underneath, and a `SCHEMA.md` — owned by you, never
rewritten by the machine — that tells the agent what is worth keeping. It
opens in Obsidian as it stands. The format is documented in
[Your memory folder](https://docs.minne.sh/guides/memory), and the argument for
plain files is made at length in [a second brain you never have to file](/second-brain).

## What can you do with one?

Three things, in increasing order of usefulness:

- **Search your past.** *What did Ingrid and I agree on last week?* is a
  question with a factual answer, and a memory can produce it — with
  citations to where it looked.
- **Ground an assistant.** Any AI can write "a reply". Only one that has read
  the project page can write *your* reply — the one that knows the budget
  goes out before Friday's flight. Minne does this for
  [email](/email-replies) and [status updates](/status-updates) alike.
- **Stop maintaining notes about your own work.** The memory is built from
  what you were doing anyway. Nobody files anything.

## The test to apply

Whatever tool you evaluate — Minne included — the definition above gives you
the checklist: Can I read the memory? Can I edit and delete it? Does it stay
on my machine? What, exactly, does the capture see? Minne's answers are
markdown, yes, yes, and
[text through the Accessibility APIs, masked before disk](https://docs.minne.sh/privacy)
— and because it is [free and open source](https://github.com/mandgie/minne),
you can check the answers against the code rather than take this page's word
for it. For the same checklist applied to named neighbours, see
[Minne and Goldfish](/vs/goldfish), [Minne and Elephas](/vs/elephas) and
[Minne and Raycast AI](/vs/raycast-ai).
