#!/usr/bin/env bash
# Release pipeline: build the bundle, sign it with the hardened runtime,
# notarize and staple it, and package it as a dmg.
#
#   MINNE_SIGN_IDENTITY   "Developer ID Application: … (TEAMID)" — enables signing
#   MINNE_NOTARY_PROFILE  notarytool keychain profile name     — enables notarization
#                         (store one with: xcrun notarytool store-credentials)
#
# With neither set the script still runs end to end and produces an ad-hoc
# signed, un-notarized dmg — the contributor path. macOS will quarantine such a
# build; see the Release section of README.md.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$ROOT/build"
APP="$BUILD/Minne.app"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"
DMG="$BUILD/Minne-$VERSION.dmg"
STAGING="$BUILD/dmg-staging"
ENTITLEMENTS="$ROOT/scripts/minne-brain.entitlements"

IDENTITY="${MINNE_SIGN_IDENTITY:-}"
PROFILE="${MINNE_NOTARY_PROFILE:-}"
# "did the caller supply a real identity" — IDENTITY itself becomes "-" below.
RELEASE_BUILD=""
if [ -n "$IDENTITY" ]; then RELEASE_BUILD="yes"; fi

"$ROOT/scripts/build.sh"

# --- sign ------------------------------------------------------------------
# The bundle is always signed, with the same runtime flags and entitlements
# either way. Leaving it unsigned is not an option: the linker gives every
# arm64 executable an ad-hoc signature, and that signature alone claims a
# CodeResources seal the bundle does not have, so an "unsigned" .app fails
# `codesign --verify --strict` outright.
if [ -n "$IDENTITY" ]; then
    echo "==> Signing with: $IDENTITY"
    # A secure timestamp is required for notarization, and is only available
    # when signing with a real identity.
    TIMESTAMP=--timestamp
else
    echo "==> Ad-hoc signing: MINNE_SIGN_IDENTITY is not set (not notarized)"
    IDENTITY="-"
    TIMESTAMP=--timestamp=none
fi
# Stale extended attributes (quarantine, Finder metadata) make codesign fail.
xattr -cr "$APP"
# Nested code first, outer bundle last — signing the app seals the brain in.
codesign --force "$TIMESTAMP" --options runtime \
    --entitlements "$ENTITLEMENTS" \
    --sign "$IDENTITY" "$APP/Contents/MacOS/minne-brain"
codesign --force "$TIMESTAMP" --options runtime \
    --sign "$IDENTITY" "$APP"
codesign --verify --strict --deep --verbose=2 "$APP"

# --- notarize the app ------------------------------------------------------
if [ -n "$RELEASE_BUILD" ] && [ -n "$PROFILE" ]; then
    echo "==> Notarizing app (profile: $PROFILE)"
    ZIP="$BUILD/Minne-$VERSION.zip"
    rm -f "$ZIP"
    # ditto, not zip: it preserves the bundle's symlinks and metadata.
    ditto -c -k --keepParent "$APP" "$ZIP"
    xcrun notarytool submit "$ZIP" --keychain-profile "$PROFILE" --wait
    xcrun stapler staple "$APP"
    rm -f "$ZIP"
else
    echo "==> Skipping notarization: needs MINNE_SIGN_IDENTITY and MINNE_NOTARY_PROFILE"
fi

# --- dmg -------------------------------------------------------------------
echo "==> Packaging $DMG"
rm -rf "$STAGING" "$DMG"
mkdir -p "$STAGING"
cp -R "$APP" "$STAGING/Minne.app"
ln -s /Applications "$STAGING/Applications"
hdiutil create -quiet -volname "Minne $VERSION" -srcfolder "$STAGING" \
    -fs HFS+ -format UDZO -ov "$DMG"
rm -rf "$STAGING"

# The dmg is downloaded and Gatekeeper checks it too, so it gets its own
# signature and its own notarization ticket. An ad-hoc signature would say
# nothing about a disk image, so this half is release-only.
if [ -n "$RELEASE_BUILD" ]; then
    codesign --force --timestamp --sign "$IDENTITY" "$DMG"
fi
if [ -n "$RELEASE_BUILD" ] && [ -n "$PROFILE" ]; then
    echo "==> Notarizing dmg"
    xcrun notarytool submit "$DMG" --keychain-profile "$PROFILE" --wait
    xcrun stapler staple "$DMG"
    xcrun stapler validate "$DMG"
    spctl --assess --type open --context context:primary-signature -vv "$DMG"
fi

echo "==> Done: $DMG"
shasum -a 256 "$DMG"
