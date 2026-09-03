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
mkdir -p "$STAGING/.background"
cp -R "$APP" "$STAGING/Minne.app"
ln -s /Applications "$STAGING/Applications"
cp "$(dirname "$0")/dmg-background.tiff" "$STAGING/.background/background.tiff"
# Build read-write first: the drag-to-Applications window (background, icon
# positions, view options) is a .DS_Store Finder has to write into the
# mounted volume before it is frozen into the compressed image.
# A volume with this name left mounted (a user install, an earlier verify)
# hijacks the Finder styling below — the AppleScript addresses the disk by
# name and read-only volumes swallow view-option writes silently.
for v in "/Volumes/Minne $VERSION"*; do
    [ -e "$v" ] && hdiutil detach "$v" -force -quiet || true
done
# hdiutil on GitHub's macOS runners fails intermittently with "Resource busy"
# (exit 16) on create, attach and detach — the v0.1.11 release died there after
# a clean notarization. Nothing is wrong with the image; a short wait and a
# second try is the documented workaround.
retry() {
    local attempt=1
    until "$@"; do
        local code=$?
        if [ "$attempt" -ge 5 ]; then
            echo "==> ERROR: '$1' failed $attempt times (last exit $code)" >&2
            return "$code"
        fi
        echo "==> '$1' failed (exit $code), retrying in 3s ($attempt/5)" >&2
        sleep 3
        attempt=$((attempt + 1))
    done
}

RW_DMG="$BUILD/Minne-rw.dmg"
rm -f "$RW_DMG"
retry hdiutil create -volname "Minne $VERSION" -srcfolder "$STAGING" \
    -fs HFS+ -format UDRW -ov "$RW_DMG"
MOUNT=$(retry hdiutil attach -readwrite -noverify -nobrowse "$RW_DMG" | awk -F'\t' 'END {print $NF}')
VOLNAME=$(basename "$MOUNT")
if [ "$VOLNAME" != "Minne $VERSION" ]; then
    echo "==> WARNING: volume mounted as '$VOLNAME' (name collision?)" >&2
fi
osascript <<OSA
tell application "Finder"
    tell disk "$VOLNAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {200, 140, 860, 570}
        set opts to the icon view options of container window
        set arrangement of opts to not arranged
        set icon size of opts to 112
        set background picture of opts to file ".background:background.tiff"
        set position of item "Minne.app" of container window to {165, 190}
        set position of item "Applications" of container window to {495, 190}
        close
    end tell
end tell
OSA
sync
DSSTORE_SIZE=$(stat -f%z "$MOUNT/.DS_Store" 2>/dev/null || echo 0)
if [ "$DSSTORE_SIZE" -lt 4096 ]; then
    echo "==> ERROR: dmg window layout was not written (.DS_Store ${DSSTORE_SIZE}B)" >&2
    hdiutil detach "$MOUNT" -quiet || true
    exit 1
fi
retry hdiutil detach "$MOUNT"
retry hdiutil convert "$RW_DMG" -format UDZO -o "$DMG"
rm -f "$RW_DMG"
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
