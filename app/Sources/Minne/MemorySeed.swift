import Foundation

/// Creates `~/Minne` on first run and seeds the files that give the memory its
/// shape.
///
/// Seeding is additive and idempotent: a file that already exists is never
/// touched, because from the moment the user (or the agent) has edited
/// `SCHEMA.md` it is theirs. A missing file is re-seeded on the next launch, so
/// deleting `index.md` gets you a fresh one rather than a broken wiki.
///
/// The templates here cover the sources layer, which is what US-009 builds.
/// US-010 owns the wiki half of `SCHEMA.md` and the per-page-type templates in
/// `brain/templates/`; it will extend these seeds rather than replace them.
enum MemorySeed {
    /// Directories and files created on first run.
    static func seed(_ paths: MemoryPaths, fileManager: FileManager = .default) throws
        -> [String]
    {
        var created: [String] = []
        for directory in [paths.memoryRoot, paths.sources, paths.wiki] {
            if !fileManager.fileExists(atPath: directory.path) {
                try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
                created.append(paths.relativePath(of: directory))
            }
        }
        // The index and credentials live outside the memory root and are
        // nobody's business but Minne's — hence 0700.
        if !fileManager.fileExists(atPath: paths.appSupport.path) {
            try fileManager.createDirectory(
                at: paths.appSupport, withIntermediateDirectories: true,
                attributes: [.posixPermissions: 0o700])
        }
        for (url, contents) in [
            (paths.schema, schemaTemplate), (paths.index, indexTemplate), (paths.log, logTemplate),
        ] where !fileManager.fileExists(atPath: url.path) {
            try contents.write(to: url, atomically: true, encoding: .utf8)
            created.append(paths.relativePath(of: url))
        }
        return created
    }

    // MARK: - Templates

    /// The contract. Human-owned: Minne seeds it once and never rewrites it.
    static let schemaTemplate = """
        # SCHEMA.md — how Minne's memory is organised

        This file is the contract between you and the agent that maintains this
        wiki. It is **human-owned**: Minne writes it once, when the memory is
        created, and never edits it again. Change anything here and the agent
        follows the new rules.

        ## Three layers

        | Layer | Path | Owner | Rule |
        | --- | --- | --- | --- |
        | Sources | `sources/` | the app | Immutable. Append-only, never edited or rewritten. |
        | Wiki | `wiki/`, `index.md`, `log.md` | the agent | Distilled, interlinked pages that cite sources. |
        | Schema | `SCHEMA.md` | you | The rules the agent works to. |

        Everything is plain markdown: open this folder in Obsidian, grep it,
        edit it, or delete it. Nothing here is a Minne-private format.

        ## Sources — raw capture

        Minne captures the text of your foreground window (never screenshots)
        and writes it to one file per app per hour:

        ```
        sources/YYYY-MM-DD/HHmm-<app-slug>.md
        ```

        `HHmm` is the *start of the hour bucket* in local time — every capture
        from Safari between 14:00 and 14:59 lands in `1400-safari.md`.

        Each file opens with YAML frontmatter describing the bucket, written
        when the file is created:

        ```yaml
        ---
        type: source
        app: "Safari"
        bundle_id: "com.apple.Safari"
        date: 2026-08-17
        hour: "1400"
        started: 2026-08-17T14:03:12+02:00
        ---
        ```

        Every capture then **appends** one section — existing sections are never
        touched, so a source file only ever grows:

        ````markdown
        ## Snapshot 3 — 14:31:07

        ```yaml
        time: 2026-08-17T14:31:07+02:00
        window: "Minne — a local memory"
        url: "https://example.com/minne"
        ```

        ```text
        …the captured text…
        ```
        ````

        The window title and URL live in the section rather than the
        frontmatter because they change from capture to capture while the file
        header, written once, cannot.

        `truncated: true` marks a capture cut off at the size cap;
        `redactions: N` counts sensitive spans replaced with `▮▮▮` before
        anything was written. Masking happens before persistence — the
        unredacted text never reaches this folder.

        ### Citing a source

        A snapshot is cited by its file path and its snapshot number:

        ```
        sources/2026-08-17/1400-safari.md#3
        ```

        Wiki pages cite sources this way in their `sources:` frontmatter and
        inline where a claim comes from a specific capture.

        ## Wiki — distilled memory

        `index.md` is the entry point: every page must be reachable from it.
        `log.md` records what the agent did and when. Pages live in `wiki/`,
        link to each other with `[[wikilinks]]`, and cite the sources they were
        derived from.

        The page types, their required frontmatter, and the linting rules are
        defined when the wiki layer is built. Until then the agent only reads
        this folder.

        ## Retention

        Raw sources older than the retention window (90 days by default) are
        deleted automatically, together with their entries in the search index.
        **The wiki is never pruned** — that is the point of distilling: the
        pages outlive the captures they came from.

        """

    static let indexTemplate = """
        ---
        title: Index
        type: index
        summary: Entry point to this memory. Every wiki page is reachable from here.
        last_updated: null
        ---

        # Index

        This is the front page of your memory. Minne's agent keeps it up to
        date; you can edit it freely.

        Nothing has been distilled yet. Raw captures are accumulating in
        `sources/` — see [[SCHEMA]] for how this memory is organised.

        ## Pages

        _(none yet)_

        """

    static let logTemplate = """
        ---
        title: Log
        type: log
        summary: What the agent did to this memory, newest last.
        ---

        # Log

        """
}
