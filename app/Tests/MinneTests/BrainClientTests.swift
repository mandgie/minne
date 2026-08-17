import XCTest

@testable import Minne

/// Round-trip tests against the real brain (`bun run src/main.ts`).
/// Requires bun on PATH and the repo checkout layout; skipped otherwise.
final class BrainClientTests: XCTestCase {
    private static var brainMain: URL {
        // <root>/app/Tests/MinneTests/BrainClientTests.swift -> <root>/brain/src/main.ts
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()  // MinneTests/
            .deletingLastPathComponent()  // Tests/
            .deletingLastPathComponent()  // app/
            .deletingLastPathComponent()  // <root>/
            .appendingPathComponent("brain/src/main.ts")
    }

    /// Every test here spawns a real brain, and the brain resolves its data dir
    /// and memory root from the environment it inherits. Without an override
    /// those are the user's own — and `ingest` would digest their captures with
    /// their own credentials into their own `~/Minne`. Set once for the class,
    /// because the child inherits this process's environment at spawn time.
    override class func setUp() {
        super.setUp()
        let scratch = FileManager.default.temporaryDirectory
            .appendingPathComponent("minne-brain-tests-\(UUID().uuidString)")
        try? FileManager.default.createDirectory(
            at: scratch, withIntermediateDirectories: true)
        setenv("MINNE_APP_SUPPORT_DIR", scratch.appendingPathComponent("support").path, 1)
        setenv("MINNE_MEMORY_ROOT", scratch.appendingPathComponent("memory").path, 1)
        // No scheduled sync or lint pass while a test is driving the brain.
        setenv("MINNE_SYNC_INTERVAL_MS", "0", 1)
        setenv("MINNE_LINT_INTERVAL_MS", "0", 1)
        unsetenv("ANTHROPIC_API_KEY")
        unsetenv("OPENAI_API_KEY")
    }

    private func makeClient() throws -> BrainClient {
        try XCTSkipUnless(
            FileManager.default.fileExists(atPath: Self.brainMain.path),
            "brain sources not found at \(Self.brainMain.path)")
        return BrainClient(launch: .bunScript(Self.brainMain), clientName: "MinneTests")
    }

    func testHandshakeAndStatusRoundTrip() async throws {
        let client = try makeClient()
        let hello = try await client.start()
        XCTAssertEqual(hello.protocolVersion, BrainProtocol.version)
        XCTAssertFalse(hello.brainVersion.isEmpty)

        let status = try await client.status()
        guard let object = status?.objectValue else {
            return XCTFail("status result is not an object: \(String(describing: status))")
        }
        XCTAssertEqual(object["state"]?.stringValue, "idle")

        await client.stop()
    }

    /// Collects connection states so assertions can poll with a deadline.
    private actor StateCollector {
        private(set) var states: [BrainConnectionState] = []
        func append(_ state: BrainConnectionState) { states.append(state) }
    }

    /// Polls until `predicate` matches the collected states or the deadline passes.
    private func waitFor(
        _ collector: StateCollector, timeout: TimeInterval = 20,
        _ description: String,
        _ predicate: ([BrainConnectionState]) -> Bool
    ) async throws {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if predicate(await collector.states) { return }
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        XCTFail("timed out waiting for: \(description) — got \(await collector.states)")
    }

    func testConnectionStatesAcrossCrashRestartAndStop() async throws {
        let client = try makeClient()
        let collector = StateCollector()
        let consumer = Task {
            for await state in client.connectionStates {
                await collector.append(state)
            }
        }
        defer { consumer.cancel() }

        _ = try await client.start()
        try await waitFor(collector, "initial connect") { states in
            guard case .connecting = states.first else { return false }
            return states.contains { if case .connected = $0 { return true } else { return false } }
        }

        // Crash the brain; the client must report restarting, then reconnect.
        let pid = await client.brainProcessIdentifier
        let unwrappedPid = try XCTUnwrap(pid)
        kill(unwrappedPid, SIGKILL)

        try await waitFor(collector, "restarting then reconnected") { states in
            guard
                let restartIndex = states.firstIndex(where: {
                    if case .restarting(let attempt, _) = $0 { return attempt == 1 }
                    return false
                })
            else { return false }
            return states[restartIndex...].contains {
                if case .connected = $0 { return true } else { return false }
            }
        }

        await client.stop()
        try await waitFor(collector, "stopped") { states in
            if case .stopped = states.last { return true }
            return false
        }
    }

    /// The scratch app-support dir has no capture index, so the pass has
    /// nothing to digest: it reports `idle` without reaching a model, which is
    /// also what the "sync now" button gets on a quiet machine.
    func testIngestReportsAnIdlePass() async throws {
        let client = try makeClient()
        _ = try await client.start()
        let result = try await client.request(.ingest(id: UUID().uuidString, mode: nil))
        guard let object = result?.objectValue else {
            return XCTFail("ingest result is not an object: \(String(describing: result))")
        }
        XCTAssertEqual(object["pass"]?.stringValue, "sync")
        XCTAssertEqual(object["status"]?.stringValue, "idle")
        await client.stop()
    }

    func testRejectedRequestSurfacesTypedError() async throws {
        let client = try makeClient()
        _ = try await client.start()
        do {
            _ = try await client.request(
                .login(id: UUID().uuidString, provider: "frobnicator", method: nil))
            XCTFail("an unknown provider should not be accepted")
        } catch let BrainClientError.brain(code, _) {
            XCTAssertEqual(code, "invalid_request")
        }
        await client.stop()
    }
}
