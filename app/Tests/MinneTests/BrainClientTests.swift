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

    func testUnimplementedRequestSurfacesTypedError() async throws {
        let client = try makeClient()
        _ = try await client.start()
        do {
            // ingest is still a stub; chat is live as of US-004 and would need auth.
            _ = try await client.request(.ingest(id: UUID().uuidString))
            XCTFail("ingest should not be implemented yet")
        } catch let BrainClientError.brain(code, _) {
            XCTAssertEqual(code, "unimplemented")
        }
        await client.stop()
    }
}
