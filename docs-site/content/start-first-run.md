---
title: First run
description: One permission, one provider, five screens — and what to do when the Accessibility switch is on but the grant is not yours.
---

The first launch opens a window titled **Welcome to Minne**. A rail down the
side marks four steps — Privacy, Accessibility, Provider, Ready — and there
are five screens, because the confirmation after the grant lands is not a
station of its own.

You can leave at any point. Nothing in the flow is mandatory, and the app is
usable without finishing it.

## What the first screen says

**"Minne remembers what you work on."** It reads the text of whatever window
you have in front of you and turns it into a plain-markdown memory that stays
on this Mac.

The screen is a list of promises, in both directions. What it does:

- Reads the visible text of your foreground window through macOS
  Accessibility.
- Stores it as plain markdown in `~/Minne`, yours to edit or delete.
- Talks only to the AI provider you sign in with yourself.

And what it never does:

- Never takes screenshots or records your screen.
- Never uploads or syncs your memory to any cloud service.
- Never captures password fields, and skips apps you blacklist.

**Continue** moves on. If the Accessibility grant is already in place — a
reinstall, or you got there first — the flow skips the request and lands on
the confirmation screen instead.

Every one of those claims is checkable in the source. [What leaves your
Mac](/privacy) does the checking.

## Granting Accessibility

**"Grant Accessibility access."** macOS keeps window text behind this
permission and there is no way around it. Open System Settings, go to
Privacy & Security ▸ Accessibility, and switch Minne on.

The buttons are **Open System Settings** and **Set Up Later**.

Minne watches for the grant rather than asking you to come back: it polls once
a second while the onboarding window is up, and every five seconds afterwards
so the menu-bar hint stays honest if you revoke it later. The moment the grant
lands the screen changes to **"Accessibility granted"**. There is no relaunch
and no quit.

:::note
Apple's own permission dialog does not close by itself. Once the switch is on,
it is safe to close — the screen behind it has already moved on.
:::

## When the switch is on but nothing works

macOS can hold a stale Accessibility entry left by an older copy of Minne, or
by a differently-signed one. The switch in System Settings looks on, and it
is: it just belongs to that other copy. Flipping it makes no difference,
because the entry being flipped is not yours.

Minne notices. If the grant has not arrived fifteen seconds after you clicked
through to System Settings — or the moment you come back from a visit that
lasted at least four seconds and left it missing — the screen grows an
explanation and a **Repair Permission** button.

Repair runs `tccutil reset Accessibility sh.minne.app`. That clears every
entry macOS holds against the bundle identifier, stale ones included, and
Minne then asks for the permission again so a fresh switch can land where the
old one was in the way. The patience clock restarts afterwards, so if it is
still stuck the button comes back.

:::warn
Repair needs a bundle identity, so it is unavailable when you are running the
bare executable `swift build` produces. Install the built `.app` instead — see
[Build from source](/reference/build).
:::

## Choosing an AI

**"Choose your AI provider."** The same cards Settings → Account shows:
a Claude subscription, a ChatGPT subscription, an API key, or a local model.
Sign in to one, or press **Set Up Later**.

[Choose your AI](/start/provider) covers what each card means, what it sends
where, and the caveats — particularly for the local option.

The buttons here are **Done** and **Set Up Later**.

## The last screen

**"You're all set."** Minne lives in the menu bar from here, and starts
remembering as soon as you close the window.

The screen leaves you with one thing worth knowing: **⌥Space asks Minne
anything, from any app.** The other one — a tap of right-Option to wake Minne
at the caret — you will meet the first time you are staring at an empty text
field. See [The Minne key](/guides/minne-key) and [Keys and
shortcuts](/reference/shortcuts).

## Why only Accessibility

It is the only permission Minne asks for. No Screen Recording. No Full Disk
Access. Nothing to approve for the microphone, the camera or your contacts.

That one grant buys three things:

| | |
| --- | --- |
| **Reading** | The text of the foreground window, which is what becomes memory. |
| **Watching** | The right-Option tap, seen through an event tap. |
| **Writing** | Putting a finished draft back into the field you were typing in. |

Everything else works without it. The menu bar, chat, settings and provider
sign-in are all unaffected — chat's ⌥Space is a Carbon hotkey precisely
because Carbon hotkeys need no permission and Minne must be able to open its
window whether or not capture was ever granted.

What you lose without it is capture, and the Minne key, which does not exist
at all.

## Skipping, and coming back

**Set Up Later** is a real answer, not a stalling tactic. The app carries on in
a degraded no-capture mode: everything works except reading and writing other
apps' windows.

The menu bar says so, permanently. A standing row reads **"Capture off — grant
Accessibility access…"** and clicking it reopens the onboarding window at the
step you left. Settings → Privacy has a **Setup Guide…** button that does the
same thing.

Closing the window counts as "later" too. Nothing is lost.

## The first hour

Two clocks run at different speeds, and it is worth knowing which is which.

Captures land in `~/Minne/sources/` **immediately** — one markdown file per
snapshot, organised by day, readable the moment they are written. Open the
folder from the menu bar and you will see them accumulating.

They become wiki pages only when the sync pass runs, and that pass is on a
**thirty-minute timer**. It is also a model job: without a provider signed in
it is skipped entirely, and captures simply pile up in `sources/` until you
sign in. Nothing is lost in the meantime — the pass works through everything
past its watermark when it finally runs.

So the honest expectation for the first hour is a `sources/` directory filling
up and a `wiki/` directory that is still mostly empty. Settings has a **Sync
Now** button if you would rather not wait. [Your memory
folder](/guides/memory) explains what the distillation actually produces.
