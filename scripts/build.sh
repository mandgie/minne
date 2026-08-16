#!/usr/bin/env bash
# Builds the release bundle: build/Minne.app with the compiled brain inside.
# SwiftPM produces a bare executable, so the .app structure is assembled here.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$ROOT/build"
APP="$BUILD/Minne.app"

mkdir -p "$BUILD"

echo "==> Compiling brain (bun build --compile)"
(cd "$ROOT/brain" && bun install --frozen-lockfile && bun build --compile src/main.ts --outfile "$BUILD/minne-brain")

echo "==> Building app (swift build -c release)"
(cd "$ROOT/app" && swift build -c release)
APP_BIN="$(cd "$ROOT/app" && swift build -c release --show-bin-path)/Minne"

echo "==> Assembling $APP"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$APP_BIN" "$APP/Contents/MacOS/Minne"
cp "$BUILD/minne-brain" "$APP/Contents/Resources/minne-brain"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleExecutable</key>
	<string>Minne</string>
	<key>CFBundleIdentifier</key>
	<string>sh.minne.app</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>Minne</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>0.1.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>LSMinimumSystemVersion</key>
	<string>14.0</string>
	<key>LSUIElement</key>
	<true/>
	<key>NSPrincipalClass</key>
	<string>NSApplication</string>
</dict>
</plist>
PLIST

echo "==> Done: $APP"
