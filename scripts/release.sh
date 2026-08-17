#!/usr/bin/env bash
# Release pipeline: build the bundle, sign it with the hardened runtime,
# notarize and staple it, and package it as a dmg.
#
#   MINNE_SIGN_IDENTITY   "Developer ID Application: … (TEAMID)" — enables signing
#   MINNE_NOTARY_PROFILE  notarytool keychain profile name     — enables notarization
#                         (store one with: xcrun notarytool store-credentials)
#
# With neither set the script still runs end to end and produces an *unsigned*
# dmg — the contributor path. macOS will quarantine such a build; see the
# Release section of README.md.
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

"$ROOT/scripts/build.sh"

# --- sign ------------------------------------------------------------------
if [ -n "$IDENTITY" ]; then
    echo "==> Signing with: $IDENTITY"
    # Stale extended attributes (quarantine, Finder metadata) make codesign fail.
    xattr -cr "$APP"
    # Nested code first, outer bundle last — signing the app seals the brain in.
    codesign --force --timestamp --options runtime \
        --entitlements "$ENTITLEMENTS" \
        --sign "$IDENTITY" "$APP/Contents/MacOS/minne-brain"
    codesign --force --timestamp --options runtime \
        --sign "$IDENTITY" "$APP"
    codesign --verify --strict --deep --verbose=2 "$APP"
else
    echo "==> Skipping signing: MINNE_SIGN_IDENTITY is not set (unsigned build)"
fi

# --- notarize the app ------------------------------------------------------
if [ -n "$IDENTITY" ] && [ -n "$PROFILE" ]; then
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
# signature and its own notarization ticket.
if [ -n "$IDENTITY" ]; then
    codesign --force --timestamp --sign "$IDENTITY" "$DMG"
fi
if [ -n "$IDENTITY" ] && [ -n "$PROFILE" ]; then
    echo "==> Notarizing dmg"
    xcrun notarytool submit "$DMG" --keychain-profile "$PROFILE" --wait
    xcrun stapler staple "$DMG"
    xcrun stapler validate "$DMG"
    spctl --assess --type open --context context:primary-signature -vv "$DMG"
fi

echo "==> Done: $DMG"
shasum -a 256 "$DMG"
