---
title: Install
description: A disk image, a drag to Applications, and a glyph in the menu bar. macOS 14 or later, no account, no licence key.
---

Minne is one download. There is nothing to sign up for, no licence key and no
trial period — the app is MIT-licensed, and the only account involved is the
one you already hold with an AI provider.

## What you need

- **macOS 14.0 or later.** The bundle declares it as its minimum system
  version and the Swift package is built against it; older releases will not
  launch.
- **An AI provider.** Minne ships no model. A Claude or ChatGPT subscription,
  an Anthropic or OpenAI API key, or a model running on your own machine will
  all do — see [Choose your AI](/start/provider). You can install first and
  decide later.

That is the whole list. No account, no server, no companion app on your phone.

## Download

[Minne.dmg](https://github.com/mandgie/minne/releases/latest/download/Minne.dmg)
always points at the newest release. The current version is 0.1.5.

The link is a redirect to the latest tagged build, so it stays correct after
every release. Every other asset on the
[releases page](https://github.com/mandgie/minne/releases) is a version-stamped
copy of the same thing.

## Install

Open the disk image and drag **Minne** onto the **Applications** shortcut
beside it. Eject the image; you can throw it away afterwards.

Then launch Minne from Applications or Spotlight. Nothing appears in the Dock,
which is the point of the next section.

:::note
Releases published from CI are signed with a Developer ID certificate and
notarized by Apple, so Gatekeeper lets them through without ceremony. If macOS
tells you the app is damaged, you have a build that was not notarized — see
[a build you made yourself](#a-build-you-made-yourself).
:::

## Where the app lives

Minne is a menu-bar app — `LSUIElement` in the bundle, which means macOS gives
it no Dock icon, no application menu and no window on launch. It appears as a
brain glyph in the menu bar, and that glyph is the whole interface: click it
for the menu, or press ⌥Space for chat.

On a MacBook with a notch the first launch nudges the item into the
right-hand cluster, beside Wi-Fi and the clock. macOS quietly declines to draw
status items in the region the notch claims, and the default leftmost slot is
inside it — an app that ran perfectly while looking absent. Once you have
⌘-dragged the item anywhere yourself, macOS remembers your position instead
and Minne never touches it again.

The bundle identifier is `sh.minne.app`. macOS uses it for the Accessibility
grant, which is why it matters later.

## First launch

The onboarding window opens by itself and asks for one permission and one
provider. It is short, and skipping any of it is allowed. [First
run](/start/first-run) walks through it.

## Launching at login

Settings → General has **Launch Minne at login**. It uses the modern
`SMAppService` registration, so there is no login item to hunt for in System
Settings and no helper app.

The checkbox is disabled when Minne is not running from an app bundle — the
bare executable `swift build` produces has no bundle for macOS to register.

## A build you made yourself

A bundle you build locally is **ad-hoc signed**: valid enough to run, not
notarized. macOS quarantines such an app once it has travelled through a
browser, a chat app or AirDrop, and then refuses to open it with a message
about damage.

It is not damaged. Strip the quarantine attribute:

```sh
xattr -dr com.apple.quarantine /Applications/Minne.app
```

Or right-click the app and choose **Open** once; the exception sticks.

[Build from source](/reference/build) covers that path properly.

## Updating

Minne checks GitHub once a day for a newer release — one anonymous request
carrying nothing about you; Settings → General turns it off — and shows
**Update Available** in its menu bar menu when there is one. Nothing downloads
itself: click the row to open the release page, download the new disk image,
quit Minne, and drag the new copy over the old one.

Your memory is untouched by this: it lives in `~/Minne` and
`~/Library/Application Support/Minne`, neither of which is inside the app
bundle. See [Files and paths](/reference/files).

:::tip
If capture stops working after an update — the Accessibility switch still
looks on, but nothing is captured — macOS is holding a permission entry that
belongs to the old copy. Minne can clear it for you: see [when the switch is
on but nothing
works](/start/first-run#when-the-switch-is-on-but-nothing-works).
:::

## Uninstalling

Quit Minne from the menu bar first, so nothing is mid-write.

| Remove | To delete |
| --- | --- |
| `/Applications/Minne.app` | The app. |
| `~/Minne` | Your memory: the raw captures and the wiki. Plain markdown. |
| `~/Library/Application Support/Minne` | Credentials, settings and the search index. |

Deleting the app alone leaves your memory intact, which is usually what you
want if you are reinstalling.

If you would rather do it from inside the app, Settings → Privacy has **Delete
All Memory…**, which empties `~/Minne` for you. It is final — there is no
server-side copy to restore from. [Files and paths](/reference/files) says
exactly what sits where.

macOS keeps the Accessibility grant after the app is gone. Remove the entry in
System Settings → Privacy & Security → Accessibility if you want no trace at
all.
