import Foundation

enum BrainClientError: Error, CustomStringConvertible {
    case notRunning
    case brainExited(Int32)
    case brain(code: String, message: String)
    case handshakeFailed(String)

    var description: String {
        switch self {
        case .notRunning: return "brain is not running"
        case .brainExited(let status): return "brain exited with status \(status)"
        case .brain(let code, let message): return "brain error [\(code)]: \(message)"
        case .handshakeFailed(let reason): return "handshake failed: \(reason)"
        }
    }
}

/// How to launch the brain process.
enum BrainLaunch: Sendable {
    /// Compiled minne-brain binary (bundled in Resources or standalone).
    case executable(URL)
    /// Dev fallback: `bun run <main.ts>` on the uncompiled sources.
    case bunScript(URL)

    /// Resolution order: `MINNE_BRAIN_PATH` env override (a binary, or a .ts
    /// entrypoint run via bun), the bundled Resources binary, then walking up
    /// from the executable's directory to find `brain/src/main.ts` (dev runs).
    static func locate() -> BrainLaunch? {
        if let override = ProcessInfo.processInfo.environment["MINNE_BRAIN_PATH"],
            !override.isEmpty
        {
            let url = URL(fileURLWithPath: override)
            return override.hasSuffix(".ts") ? .bunScript(url) : .executable(url)
        }
        if let bundled = Bundle.main.resourceURL?.appendingPathComponent("minne-brain"),
            FileManager.default.isExecutableFile(atPath: bundled.path)
        {
            return .executable(bundled)
        }
        var dir = Bundle.main.bundleURL.deletingLastPathComponent()
        for _ in 0..<8 {
            let candidate = dir.appendingPathComponent("brain/src/main.ts")
            if FileManager.default.fileExists(atPath: candidate.path) {
                return .bunScript(candidate)
            }
            let parent = dir.deletingLastPathComponent()
            if parent == dir { break }
            dir = parent
        }
        return nil
    }
}

struct BrainHello: Sendable {
    let protocolVersion: Int
    let brainVersion: String
}

/// Supervises the brain process: spawns it, performs the `hello` handshake,
/// correlates requests with terminal events, streams intermediate events, and
/// auto-restarts on crash with capped exponential backoff.
actor BrainClient {
    enum State: Sendable, Equatable {
        case idle, running, restarting, stopped
    }

    private let launch: BrainLaunch
    private let clientName: String

    private var process: Process?
    private var stdinHandle: FileHandle?
    private var readTask: Task<Void, Never>?
    private var pending: [String: CheckedContinuation<BrainEvent, any Error>] = [:]
    private var restartAttempt = 0
    /// Bumped whenever the current process is replaced or abandoned, so stale
    /// termination handlers from a previous incarnation are ignored.
    private var generation = 0
    private(set) var state: State = .idle

    /// Intermediate events (text_delta, progress, …) and terminal events that
    /// settle no pending request.
    nonisolated let events: AsyncStream<BrainEvent>
    private let eventSink: AsyncStream<BrainEvent>.Continuation

    /// User-facing connection state transitions, for the menu-bar UI.
    /// Single-consumer, like `events`.
    nonisolated let connectionStates: AsyncStream<BrainConnectionState>
    private let connectionSink: AsyncStream<BrainConnectionState>.Continuation
    private(set) var connection: BrainConnectionState = .stopped

    init(launch: BrainLaunch, clientName: String = "Minne.app") {
        self.launch = launch
        self.clientName = clientName
        (self.events, self.eventSink) = AsyncStream.makeStream(
            bufferingPolicy: .bufferingNewest(256))
        (self.connectionStates, self.connectionSink) = AsyncStream.makeStream(
            bufferingPolicy: .bufferingNewest(64))
    }

    private func setConnection(_ new: BrainConnectionState) {
        connection = new
        connectionSink.yield(new)
    }

    /// Test hook: pid of the currently running brain process, if any.
    var brainProcessIdentifier: Int32? { process?.processIdentifier }

    // MARK: - Lifecycle

    /// Spawns the brain and performs the version handshake.
    @discardableResult
    func start() async throws -> BrainHello {
        setConnection(.connecting)
        do {
            try spawn()
            return try await handshake()
        } catch {
            abandonProcess()
            state = .idle
            setConnection(.failed(reason: String(describing: error)))
            throw error
        }
    }

    /// Closes stdin so the brain exits cleanly; force-terminates if it lingers.
    func stop() async {
        state = .stopped
        setConnection(.stopped)
        defer { connectionSink.finish() }
        guard let proc = process else { return }
        generation += 1
        failAllPending(with: .notRunning)
        try? stdinHandle?.close()
        stdinHandle = nil
        var waited = 0
        while proc.isRunning && waited < 20 {
            try? await Task.sleep(nanoseconds: 100_000_000)
            waited += 1
        }
        if proc.isRunning { proc.terminate() }
        readTask?.cancel()
        readTask = nil
        process = nil
        eventSink.finish()
    }

    // MARK: - Requests

    /// Sends a request and awaits its terminal event; throws on `error`.
    @discardableResult
    func request(_ request: BrainRequest) async throws -> JSONValue? {
        let event = try await sendAwaitingTerminal(request)
        switch event {
        case .done(_, let result):
            return result
        case .error(_, let code, let message):
            throw BrainClientError.brain(code: code, message: message)
        default:
            preconditionFailure("non-terminal event settled a request")
        }
    }

    func status() async throws -> JSONValue? {
        try await request(.status(id: UUID().uuidString))
    }

    private func sendAwaitingTerminal(_ request: BrainRequest) async throws -> BrainEvent {
        guard state == .running, let stdinHandle else { throw BrainClientError.notRunning }
        var data = try JSONEncoder().encode(request)
        data.append(0x0A)
        return try await withCheckedThrowingContinuation { continuation in
            pending[request.id] = continuation
            do {
                try stdinHandle.write(contentsOf: data)
            } catch {
                pending.removeValue(forKey: request.id)
                continuation.resume(throwing: error)
            }
        }
    }

    private func handshake() async throws -> BrainHello {
        let result = try await request(
            .hello(id: UUID().uuidString, protocolVersion: BrainProtocol.version, client: clientName))
        guard let object = result?.objectValue,
            let version = object["protocolVersion"]?.intValue
        else {
            throw BrainClientError.handshakeFailed("malformed hello response")
        }
        guard version == BrainProtocol.version else {
            throw BrainClientError.handshakeFailed(
                "brain speaks protocol \(version), app speaks \(BrainProtocol.version)")
        }
        restartAttempt = 0
        let hello = BrainHello(
            protocolVersion: version,
            brainVersion: object["brainVersion"]?.stringValue ?? "unknown")
        setConnection(.connected(brainVersion: hello.brainVersion))
        return hello
    }

    // MARK: - Process management

    private func spawn() throws {
        let proc = Process()
        switch launch {
        case .executable(let url):
            proc.executableURL = url
        case .bunScript(let url):
            proc.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            proc.arguments = ["bun", "run", url.path]
            // brain/src/main.ts -> run from brain/ so bun resolves the workspace.
            proc.currentDirectoryURL = url.deletingLastPathComponent().deletingLastPathComponent()
        }

        let stdinPipe = Pipe()
        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        proc.standardInput = stdinPipe
        proc.standardOutput = stdoutPipe
        proc.standardError = stderrPipe

        generation += 1
        let gen = generation
        proc.terminationHandler = { [weak self] process in
            let status = process.terminationStatus
            Task { await self?.processDidExit(generation: gen, status: status) }
        }

        try proc.run()
        process = proc
        stdinHandle = stdinPipe.fileHandleForWriting
        state = .running

        // Do NOT use FileHandle.bytes.lines here: it performs its blocking
        // read(2) inline on the iterating task's executor, and this Task
        // inherits the actor's isolation — the blocked read would park the
        // whole actor and deadlock request/response. readabilityHandler
        // delivers on a dispatch source instead.
        let stdoutLines = Self.lineStream(for: stdoutPipe.fileHandleForReading)
        let stderrLines = Self.lineStream(for: stderrPipe.fileHandleForReading)
        readTask = Task { [weak self] in
            for await line in stdoutLines {
                await self?.handleLine(line)
            }
        }
        Task.detached {
            for await line in stderrLines {
                Self.log("brain: \(line)")
            }
        }
        Self.log("spawned brain (pid \(proc.processIdentifier))")
    }

    /// Splits a pipe's output into lines off-actor via readabilityHandler;
    /// finishes at EOF or when the consuming task is cancelled.
    private static func lineStream(for handle: FileHandle) -> AsyncStream<String> {
        AsyncStream { continuation in
            // Only touched inside readabilityHandler, which the file handle
            // invokes serially on its own dispatch source.
            nonisolated(unsafe) var buffer = Data()
            handle.readabilityHandler = { handle in
                let data = handle.availableData
                if data.isEmpty {
                    if let line = String(data: buffer, encoding: .utf8), !line.isEmpty {
                        continuation.yield(line)
                    }
                    handle.readabilityHandler = nil
                    continuation.finish()
                    return
                }
                buffer.append(data)
                while let newline = buffer.firstIndex(of: 0x0A) {
                    let lineData = buffer.subdata(in: buffer.startIndex..<newline)
                    buffer.removeSubrange(buffer.startIndex...newline)
                    if let line = String(data: lineData, encoding: .utf8), !line.isEmpty {
                        continuation.yield(line)
                    }
                }
            }
            continuation.onTermination = { _ in
                handle.readabilityHandler = nil
            }
        }
    }

    private func handleLine(_ line: String) {
        guard !line.isEmpty else { return }
        let event: BrainEvent
        do {
            event = try JSONDecoder().decode(BrainEvent.self, from: Data(line.utf8))
        } catch {
            Self.log("undecodable event dropped: \(line)")
            return
        }
        if event.isTerminal, let continuation = pending.removeValue(forKey: event.id) {
            continuation.resume(returning: event)
        } else {
            eventSink.yield(event)
        }
    }

    private func processDidExit(generation gen: Int, status: Int32) {
        guard gen == generation else { return }
        readTask?.cancel()
        readTask = nil
        process = nil
        stdinHandle = nil
        failAllPending(with: .brainExited(status))
        guard state != .stopped else { return }
        Self.log("brain exited with status \(status)")
        scheduleRestart()
    }

    private func scheduleRestart() {
        restartAttempt += 1
        let delay = min(0.5 * pow(2.0, Double(restartAttempt - 1)), 30.0)
        state = .restarting
        setConnection(
            .restarting(attempt: restartAttempt, retryAt: Date().addingTimeInterval(delay)))
        Self.log(String(format: "restart #%d in %.1fs", restartAttempt, delay))
        Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            await self?.restartIfNeeded()
        }
    }

    private func restartIfNeeded() async {
        guard state == .restarting else { return }
        do {
            try spawn()
            let hello = try await handshake()
            Self.log(
                "reconnected: brain v\(hello.brainVersion), protocol \(hello.protocolVersion)")
        } catch let error as BrainClientError {
            abandonProcess()
            if case .handshakeFailed = error {
                // A version mismatch never resolves by retrying.
                Self.log("giving up after failed handshake: \(error)")
                state = .stopped
                setConnection(.failed(reason: error.description))
            } else {
                Self.log("restart failed: \(error)")
                scheduleRestart()
            }
        } catch {
            abandonProcess()
            Self.log("restart failed: \(error)")
            scheduleRestart()
        }
    }

    /// Detaches from the current process (ignoring its termination handler)
    /// and terminates it if still running.
    private func abandonProcess() {
        generation += 1
        readTask?.cancel()
        readTask = nil
        stdinHandle = nil
        if let proc = process, proc.isRunning { proc.terminate() }
        process = nil
    }

    private func failAllPending(with error: BrainClientError) {
        let waiters = pending
        pending = [:]
        for continuation in waiters.values {
            continuation.resume(throwing: error)
        }
    }

    // MARK: - Logging (stderr only; stdout stays clean by convention)

    static func log(_ message: String) {
        FileHandle.standardError.write(Data("[BrainClient] \(message)\n".utf8))
    }
}
