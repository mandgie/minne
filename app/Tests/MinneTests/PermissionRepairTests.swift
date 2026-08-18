import XCTest

@testable import Minne

/// Records what it was asked to run and answers with a scripted exit code —
/// the tccutil plumbing is proven without ever resetting a real TCC entry.
private final class FakeRunner: ProcessRunning, @unchecked Sendable {
    var calls: [(executable: URL, arguments: [String])] = []
    var exitCode: Int32?

    init(exitCode: Int32?) {
        self.exitCode = exitCode
    }

    func run(executableURL: URL, arguments: [String]) async -> Int32? {
        calls.append((executableURL, arguments))
        return exitCode
    }
}

final class PermissionRepairTests: XCTestCase {
    func testResetInvokesTccutilWithTheBundleIdentifier() async {
        let runner = FakeRunner(exitCode: 0)
        let repair = AccessibilityRepair(runner: runner, bundleIdentifier: "sh.minne.test")
        let ok = await repair.reset()
        XCTAssertTrue(ok)
        XCTAssertEqual(runner.calls.count, 1)
        XCTAssertEqual(runner.calls[0].executable.path, "/usr/bin/tccutil")
        XCTAssertEqual(runner.calls[0].arguments, ["reset", "Accessibility", "sh.minne.test"])
    }

    func testANonZeroExitIsAFailure() async {
        let runner = FakeRunner(exitCode: 70)
        let repair = AccessibilityRepair(runner: runner, bundleIdentifier: "sh.minne.test")
        let ok = await repair.reset()
        XCTAssertFalse(ok)
    }

    func testALaunchFailureIsAFailure() async {
        let runner = FakeRunner(exitCode: nil)
        let repair = AccessibilityRepair(runner: runner, bundleIdentifier: "sh.minne.test")
        let ok = await repair.reset()
        XCTAssertFalse(ok)
    }

    func testNoBundleIdentifierNeverRunsAnything() async {
        // The bare dev executable has no bundle identity; TCC holds nothing
        // against it, so there is nothing to reset — and nothing must run.
        let runner = FakeRunner(exitCode: 0)
        let repair = AccessibilityRepair(runner: runner, bundleIdentifier: nil)
        let ok = await repair.reset()
        XCTAssertFalse(ok)
        XCTAssertTrue(runner.calls.isEmpty)
    }

    /// The real runner, against a real process — /usr/bin/true and false, not
    /// tccutil, so the suite never touches TCC state.
    func testSystemRunnerReportsRealExitCodes() async {
        let runner = SystemProcessRunner()
        let zero = await runner.run(
            executableURL: URL(fileURLWithPath: "/usr/bin/true"), arguments: [])
        XCTAssertEqual(zero, 0)
        let one = await runner.run(
            executableURL: URL(fileURLWithPath: "/usr/bin/false"), arguments: [])
        XCTAssertEqual(one, 1)
        let missing = await runner.run(
            executableURL: URL(fileURLWithPath: "/nonexistent-executable"), arguments: [])
        XCTAssertNil(missing)
    }
}
