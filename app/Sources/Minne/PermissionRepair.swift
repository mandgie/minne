import Foundation

/// Runs one subprocess to completion. A protocol so the tccutil plumbing is
/// unit-testable without ever resetting a real TCC entry.
protocol ProcessRunning: Sendable {
    /// The process's exit code, or nil when it could not be launched.
    func run(executableURL: URL, arguments: [String]) async -> Int32?
}

struct SystemProcessRunner: ProcessRunning {
    func run(executableURL: URL, arguments: [String]) async -> Int32? {
        await withCheckedContinuation { continuation in
            let process = Process()
            process.executableURL = executableURL
            process.arguments = arguments
            process.standardOutput = FileHandle.nullDevice
            process.standardError = FileHandle.nullDevice
            process.terminationHandler = { continuation.resume(returning: $0.terminationStatus) }
            do {
                try process.run()
            } catch {
                // The handler cannot fire for a process that never launched,
                // so this is the continuation's only resume.
                process.terminationHandler = nil
                BrainClient.log(
                    "permission repair: \(executableURL.path) failed to launch: \(error)")
                continuation.resume(returning: nil)
            }
        }
    }
}

/// `tccutil reset Accessibility <bundle id>` — the one way out of the stale
/// deadlock: System Settings shows Minne's switch as on (an entry left behind
/// by an older copy — ad-hoc dev builds and signed builds accumulate separate
/// entries) while `AXIsProcessTrusted()` stays false, and no amount of
/// flipping the switch escapes it. Resetting clears every stale entry so the
/// next prompt registers a fresh one.
struct AccessibilityRepair: Sendable {
    static let tccutilURL = URL(fileURLWithPath: "/usr/bin/tccutil")

    let runner: any ProcessRunning
    /// Nil when running the bare dev executable, which has no bundle identity
    /// for TCC to hold an entry against — the repair is meaningless there.
    let bundleIdentifier: String?

    /// True when the reset ran and exited 0.
    func reset() async -> Bool {
        guard let bundleIdentifier else {
            BrainClient.log("permission repair unavailable: not running from an app bundle")
            return false
        }
        let status = await runner.run(
            executableURL: Self.tccutilURL,
            arguments: ["reset", "Accessibility", bundleIdentifier])
        switch status {
        case 0:
            BrainClient.log(
                "permission repair: reset the Accessibility entry for \(bundleIdentifier)")
            return true
        case .some(let code):
            BrainClient.log("permission repair: tccutil exited \(code)")
            return false
        case nil:
            return false
        }
    }
}
