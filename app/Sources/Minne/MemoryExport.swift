import Foundation

/// "Export memory…": one zip of the whole `~/Minne` folder.
///
/// The archive is the memory a user could restore by unzipping it back into
/// place: `sources/`, `wiki/`, `SCHEMA.md`, `index.md`, `log.md`. The search
/// index is deliberately not in it — it lives outside the memory root, is
/// derived from these files, and "Rebuild search index" recreates it from an
/// unzipped backup. Capture writes are held while the copy runs (the caller's
/// job), because copying a live memory drifts silently.
enum MemoryExport {
    enum ExportError: Error, CustomStringConvertible {
        case nothingToExport(path: String)
        case failed(String)

        var description: String {
            switch self {
            case .nothingToExport(let path): return "nothing to export at \(path)"
            case .failed(let reason): return reason
            }
        }
    }

    struct Report: Equatable, Sendable {
        let destination: URL
        let bytes: Int64

        /// One line for the settings section.
        var summary: String {
            "Backed up to \(destination.lastPathComponent) (\(Self.format(bytes: bytes))). "
                + "The search index is not included — it is rebuilt from these files."
        }

        static func format(bytes: Int64) -> String {
            let formatter = ByteCountFormatter()
            formatter.countStyle = .file
            return formatter.string(fromByteCount: bytes)
        }
    }

    /// `Minne-backup-2026-08-27.zip`, matching the by-hand convention the
    /// backups before this feature used.
    static func defaultFilename(now: Date = Date(), timeZone: TimeZone = .current) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = timeZone
        formatter.dateFormat = "yyyy-MM-dd"
        return "Minne-backup-\(formatter.string(from: now)).zip"
    }

    /// Zips `memoryRoot` to `destination` with `ditto -c -k --keepParent` —
    /// the macOS-native archiver, so what it writes is what Archive Utility
    /// unpacks. Blocking; run it off the main actor.
    static func export(memoryRoot: URL, to destination: URL) throws -> Report {
        guard FileManager.default.fileExists(atPath: memoryRoot.path) else {
            throw ExportError.nothingToExport(path: memoryRoot.path)
        }
        try? FileManager.default.removeItem(at: destination)
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/ditto")
        process.arguments = ["-c", "-k", "--keepParent", memoryRoot.path, destination.path]
        let stderrPipe = Pipe()
        process.standardError = stderrPipe
        process.standardOutput = FileHandle.nullDevice
        try process.run()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else {
            let data = stderrPipe.fileHandleForReading.readDataToEndOfFile()
            let reason = String(data: data, encoding: .utf8)?
                .trimmingCharacters(in: .whitespacesAndNewlines)
            throw ExportError.failed(
                reason?.isEmpty == false ? reason! : "ditto exited \(process.terminationStatus)")
        }
        let attributes = try FileManager.default.attributesOfItem(atPath: destination.path)
        let bytes = (attributes[.size] as? Int64) ?? Int64((attributes[.size] as? Int) ?? 0)
        return Report(destination: destination, bytes: bytes)
    }
}
