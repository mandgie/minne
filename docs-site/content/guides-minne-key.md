---
title: The Minne key
description: Tap right-Option in any text field and Minne writes there, from what is on screen and what it remembers.
---

Put the caret in a text field anywhere on your Mac and tap the right Option key.
A small panel opens beside the caret, Minne thinks, and a draft appears in it.
Press Return and the draft lands in the field.

That is the whole feature. The rest of this page is what happens in between, and
where it behaves differently than you would guess.

## What counts as a tap

Right-Option down, then up, with **nothing at all in between** — no other key,
no modifier, no click — inside 0.3 seconds.

Anything else is ordinary Option usage and Minne ignores it. That is what keeps
`@`, `€` and `~` working on international AltGr layouts, along with ⌥←, ⌥-click
and every other Option shortcut. The key event itself is never swallowed, so the
app underneath always sees Option go down and come back up.

It is not a double-tap, and there is no hold gesture. A second tap while the
panel is open closes it.

:::note
The key needs Accessibility access, and it respects your capture blacklist: an
app whose contents may not become memory may not become a prompt either.
:::

## Three modes, decided for you

Minne looks at the field at the moment you press, and what it finds decides the
job. There is no syntax to learn and no prefix to type.

| What is in the field | Mode | What Minne does |
| --- | --- | --- |
| Something is **selected** | Rewrite | Rewrites just the selection. The rest of the field is left alone. |
| Text, nothing selected | Instruction | Reads the text as an instruction to carry out, and replaces the whole field with the result. |
| Empty (or only whitespace) | Infer | Writes what should come next, from the window around the field and from memory. Inserted at the caret, so your blank lines survive. |

The middle one is the surprising one the first time: whatever is sitting in the
field is treated as something to act on, not something to keep. That is
deliberate — a user who wanted to keep it would not have pressed the key. See
[Telling it what you want](/guides/instructions).

## What Minne reads

Once, at the moment you press:

- the focused field's text, and your selection if you have one
- the visible text of the window around it, up to 12 KB
- the window title, and the page URL if you are in a browser — stripped to
  scheme, host and path, never the query string
- who you appear to be writing to, when the window title actually says
  (Slack, Discord, Messages and LinkedIn messaging; a Mail window title carries
  the subject, not the recipient, so Minne does not guess)

Then, before it asks the model anything, it reads two or three things from your
memory: the style page for this context, up to two pages about the person you
are writing to, and a one-line map of everything else in the wiki. Those are
local file reads, which is why the panel starts thinking immediately.
[Recall, in detail](#how-it-picks-what-to-remember).

Nothing is captured, stored, or written anywhere as a result of a press.

## While it works

The panel reads *Drafting a reply…*, *Rewriting the selection…* or *Following
your instruction…*, and switches to *Searching your memory…* when the model
reaches for a memory tool.

There is no token-by-token streaming, on purpose: the draft has nowhere to go
until it is whole, because **your field is not touched until you accept it**.
That is not a stylistic claim. The only code in the app that writes into your
field runs from Insert and from Undo, and it carries nothing but the finished
draft or its exact inverse.

Escape dismisses. So does a second tap, a click outside the panel, or switching
apps. Dismissing mid-flight also cancels the request rather than letting the
model finish on your quota.

## When the draft is ready

The panel says **Draft ready** and offers:

| Control | Key | What it does |
| --- | --- | --- |
| **Insert** | `↩` | Puts the draft in the field. |
| **Copy** | — | Copies it instead, and leaves the field alone. |
| Another take | `⌘R` | Writes a meaningfully different draft — a different angle, a different opening — rather than paraphrasing this one. |
| Steer it | `⇥` | Opens a field where you say what to change, in words. |
| Edit it | `⌘E` | Edits the draft in place, in the panel. Clicking the draft text does the same. |
| **Dismiss** | `esc` | Nothing happens to your field. |

Those keys are claimed only while the panel is on screen and only while that
state offers them. Outside that moment `⌘R` reloads your browser as it always
did.

Under the draft, when there was anything to ground it in, a muted line says what
Minne actually read:

```
from memory: ingrid-berg, oslo-trip · style: slack
```

A draft grounded in nothing gets no line at all rather than an empty one.

Steering and editing are their own page:
[Telling it what you want](/guides/instructions).

## How the draft gets into your field

Minne has three ways of writing text into another app, and which it uses is
decided by the target rather than by preference.

**Web content always goes through the clipboard.** Browsers, Electron apps,
anything inside a web view. This is not caution: an accessibility write into a
React or contenteditable editor succeeds, verifies, and is then repainted away
by the framework on the next click or keystroke. The text really was there and
really is gone. So Minne does not do it.

**Everywhere else it tries three paths in order and verifies each:** replace the
selected range, set the field's value, and finally paste. Two of the three will
report success for a write they quietly ignored, so the verification is the
point — and it is a poll rather than a single read, because Chromium applies
accessibility writes a moment *after* answering.

On the clipboard path, Minne saves every item and every type on your pasteboard
— not just the string, so a copied image comes back as an image — pastes the
draft, and restores the lot six-tenths of a second later. The delay is
deliberate: the target app reads the pasteboard when it gets round to the
synthetic ⌘V, and restoring sooner would paste your old clipboard instead.

A paste is checked afterwards, leniently, and **never retried** — a second ⌘V on
top of one that landed inserts twice.

If every path refuses, the panel says so and offers **Copy**.

## Undo

Which undo works depends on how the text actually got in, and the panel's
**Undo** button always does the right one:

- **Written through accessibility** — Minne owns the undo. It restores the exact
  previous text and the selection you had. `⌘Z` is claimed while the *Inserted*
  state is on screen.
- **Pasted** — the app owns the undo, because the paste went through its own
  event pipeline. `⌘Z` is not intercepted; the Undo button posts one for you.

Either way the field goes back to exactly what it was.

## How it picks what to remember

Three things are read before the model is asked anything, all from local files:

**The style page**, by rule rather than by search — the page's name follows from
the context, so there is nothing to search for. Minne looks for
`style/<domain> — <recipient>`, then `style/<domain>`, then `style/<app> —
<recipient>`, then `style/<app>`. The domain outranks the app for web content,
because how you write on x.com and on github.com differ the way Slack and Mail
do, while "Google Chrome" lumps them together. This page always goes last in the
prompt, introduced as *follow it*.

**Pages about the person you are writing to** — the one prefetch that does
search, because "the page about Ingrid" has no path rule. At most two pages,
style pages excluded.

**A map of the wiki** — one line per page, so the model can see what a lookup
could find without spending a round trip discovering it.

If it still needs more, the drafting agent can search and read your memory
itself, up to ten tool round trips. It cannot write: a draft may consult memory,
never rewrite it. The instruction it works under is explicit — look a fact up
rather than guess it, read the page rather than trust a search snippet, and
never invent a commitment on your behalf.

## Where it is awkward

- **The first press in Slack, VS Code or another Electron app can be a dud.**
  Chromium keeps its accessibility tree switched off until an assistive client
  asks for it. Minne asks, and retries once half a second later, but the tree
  builds asynchronously. Press again. For VS Code you can turn it on for good
  with `editor.accessibilitySupport: "on"`.
- **Password fields are refused outright**, before any text is read. Anything
  macOS marks as a secure field qualifies. There is no override.
- **The panel sometimes sits at the top-left of the field** rather than at the
  caret. Some apps — Slack and VS Code among them — do not report where the
  caret is, so Minne falls back to the field's leading edge.
- **A busy machine can swallow a press.** macOS switches off an event tap whose
  callback blocks for too long; Minne re-enables it immediately, but the press
  in flight is gone. Tap again.

More symptoms, with fixes: [Troubleshooting](/troubleshooting).
