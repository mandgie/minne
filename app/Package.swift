// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Minne",
    platforms: [.macOS(.v14)],
    targets: [
        // libsqlite3 ships with macOS (FTS5 included) — SnapshotIndex talks to
        // it directly through the SQLite3 module in the SDK.
        .executableTarget(
            name: "Minne",
            // Familjen Grotesk and IBM Plex Mono (both OFL, licences alongside)
            // are the faces the product site is set in. `.copy` keeps the
            // Fonts/ directory verbatim so MinneTheme can look them up by
            // subdirectory; `.process` would flatten it.
            resources: [.copy("Resources/Fonts")],
            linkerSettings: [.linkedLibrary("sqlite3")]),
        .testTarget(name: "MinneTests", dependencies: ["Minne"])
    ]
)
