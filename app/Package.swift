// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Minne",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(name: "Minne")
    ]
)
