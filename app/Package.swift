// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Minne",
    platforms: [.macOS(.v14)],
    targets: [
        // libsqlite3 ships with macOS (FTS5 included) — SnapshotIndex talks to
        // it directly through the SQLite3 module in the SDK.
        .executableTarget(name: "Minne", linkerSettings: [.linkedLibrary("sqlite3")]),
        .testTarget(name: "MinneTests", dependencies: ["Minne"])
    ]
)
