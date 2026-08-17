import AppKit
import ApplicationServices

/// Real `FocusedWindowSource`: `NSWorkspace` for the frontmost app, an
/// `AXObserver` for focused-window and title changes, and a depth-first walk
/// of the focused window's `AXUIElement` tree for the text itself.
///
/// All of the policy lives in `CaptureScheduler`; this file is glue and is
/// not exercised by `swift test` — it needs a real, trusted process and a
/// live window server.
@MainActor
final class AccessibilityWindowSource: FocusedWindowSource {
    var onFocusChange: (@MainActor () -> Void)?

    /// AX calls are synchronous IPC into the target app: without a timeout an
    /// unresponsive app would hang the main thread. 2 s is long enough for a
    /// busy browser and short enough not to be felt.
    private static let messagingTimeout: Float = 2
    /// Ceilings for one walk. Deep or enormous trees (a long chat log, a big
    /// spreadsheet) get cut rather than burning CPU; `truncatedByWalk` records
    /// that it happened.
    private static let maxDepth = 48
    private static let maxElements = 8000
    /// Roles for which `AXSelectedText` means anything; asking anything else
    /// only costs a round trip.
    private static let textRoles: Set<String> = [
        kAXTextFieldRole, kAXTextAreaRole, kAXStaticTextRole, kAXComboBoxRole, "AXWebArea",
    ]

    private struct FrontApp {
        let pid: pid_t
        let bundleIdentifier: String
        let name: String
        let element: AXUIElement
    }

    private var observing = false
    private var workspaceObserver: (any NSObjectProtocol)?
    private var observer: AXObserver?
    private var observedPID: pid_t?
    /// Title changes are posted on the window element, so the observer has to
    /// follow the focused window as it changes.
    private var observedWindow: AXUIElement?
    private var cachedApp: (pid: pid_t, element: AXUIElement)?

    // MARK: - FocusedWindowSource

    func startObserving() {
        guard !observing else { return }
        observing = true
        workspaceObserver = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.frontmostAppChanged() }
        }
        bindObserver()
    }

    func stopObserving() {
        guard observing else { return }
        observing = false
        if let workspaceObserver {
            NSWorkspace.shared.notificationCenter.removeObserver(workspaceObserver)
        }
        workspaceObserver = nil
        unbindObserver()
        cachedApp = nil
    }

    func currentWindow() -> WindowIdentity? {
        guard let app = frontmostApp() else { return nil }
        // Self-healing: an app that launched while we had no Accessibility
        // grant, or that we simply missed, gets its observer here.
        if observing && observedPID != app.pid { bindObserver() }
        guard let window = focusedWindow(of: app.element) else { return nil }
        return WindowIdentity(
            bundleIdentifier: app.bundleIdentifier,
            appName: app.name,
            windowTitle: string(window, kAXTitleAttribute) ?? "")
    }

    func readFocusedWindow(byteBudget: Int) -> CaptureCandidate? {
        guard let app = frontmostApp(), let window = focusedWindow(of: app.element) else {
            return nil
        }
        let identity = WindowIdentity(
            bundleIdentifier: app.bundleIdentifier,
            appName: app.name,
            windowTitle: string(window, kAXTitleAttribute) ?? "")

        var walk = Walk(budget: byteBudget)
        visit(window, depth: 0, walk: &walk)
        return CaptureCandidate(
            window: identity,
            url: walk.url,
            text: walk.pieces.joined(separator: "\n"),
            truncatedByWalk: walk.truncated)
    }

    // MARK: - Tree walk

    private struct Walk {
        var budget: Int
        var elements = 0
        var truncated = false
        var url: String?
        /// Text already collected in this snapshot. AX trees repeat
        /// relentlessly — a container's title is usually its child's value —
        /// so identical strings are emitted once.
        var seen = Set<String>()
        var pieces: [String] = []
    }

    private func visit(_ element: AXUIElement, depth: Int, walk: inout Walk) {
        guard walk.budget > 0, walk.elements < Self.maxElements, depth <= Self.maxDepth else {
            walk.truncated = true
            return
        }
        walk.elements += 1

        // US-008 owns masking, but a secure field's contents must never be
        // read in the first place, so the whole subtree is skipped here. The
        // subrole is only fetched for text fields — every attribute read is a
        // round trip to the other process, and this walk makes thousands.
        let role = string(element, kAXRoleAttribute)
        if role == "AXSecureTextField" { return }
        if role == kAXTextFieldRole, string(element, kAXSubroleAttribute) == "AXSecureTextField" {
            return
        }

        if walk.url == nil, let url = url(of: element) { walk.url = url }

        // Exactly the attributes the story names: what an element shows, what
        // it is called, and — only where the concept exists — what the user
        // has selected in it.
        var attributes = [kAXTitleAttribute, kAXValueAttribute]
        if let role, Self.textRoles.contains(role) { attributes.append(kAXSelectedTextAttribute) }
        for attribute in attributes {
            guard let text = string(element, attribute) else { continue }
            collect(text, into: &walk)
        }

        for child in children(of: element) {
            visit(child, depth: depth + 1, walk: &walk)
        }
    }

    private func collect(_ raw: String, into walk: inout Walk) {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, walk.seen.insert(text).inserted else { return }
        let cost = text.utf8.count + 1  // + the separating newline
        if cost > walk.budget {
            let (prefix, _) = CaptureScheduler.cap(text, toBytes: walk.budget)
            if !prefix.isEmpty { walk.pieces.append(prefix) }
            walk.budget = 0
            walk.truncated = true
            return
        }
        walk.budget -= cost
        walk.pieces.append(text)
    }

    // MARK: - AX accessors

    private func frontmostApp() -> FrontApp? {
        guard let running = NSWorkspace.shared.frontmostApplication else { return nil }
        let pid = running.processIdentifier
        // Never capture Minne's own windows: our chat would echo itself back
        // into memory.
        guard pid != ProcessInfo.processInfo.processIdentifier else { return nil }
        let element: AXUIElement
        if let cachedApp, cachedApp.pid == pid {
            element = cachedApp.element
        } else {
            element = AXUIElementCreateApplication(pid)
            AXUIElementSetMessagingTimeout(element, Self.messagingTimeout)
            cachedApp = (pid, element)
        }
        return FrontApp(
            pid: pid,
            bundleIdentifier: running.bundleIdentifier ?? "unknown",
            name: running.localizedName ?? "Unknown",
            element: element)
    }

    /// Some apps (and some states, like a sheet being dismissed) expose only
    /// a main window, so that is the fallback.
    private func focusedWindow(of app: AXUIElement) -> AXUIElement? {
        element(app, kAXFocusedWindowAttribute) ?? element(app, kAXMainWindowAttribute)
    }

    private func copyValue(_ element: AXUIElement, _ attribute: String) -> CFTypeRef? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success
        else { return nil }
        return value
    }

    private func string(_ element: AXUIElement, _ attribute: String) -> String? {
        copyValue(element, attribute) as? String
    }

    private func element(_ element: AXUIElement, _ attribute: String) -> AXUIElement? {
        guard let value = copyValue(element, attribute),
            CFGetTypeID(value) == AXUIElementGetTypeID()
        else { return nil }
        return (value as! AXUIElement)
    }

    private func children(of element: AXUIElement) -> [AXUIElement] {
        copyValue(element, kAXChildrenAttribute) as? [AXUIElement] ?? []
    }

    /// `AXURL` is how browsers (and a few document apps) expose the address of
    /// what is on screen; it arrives as a CFURL.
    private func url(of element: AXUIElement) -> String? {
        guard let value = copyValue(element, kAXURLAttribute) else { return nil }
        if let url = value as? URL { return url.absoluteString }
        return value as? String
    }

    // MARK: - Observers

    private func frontmostAppChanged() {
        guard observing else { return }
        bindObserver()
        onFocusChange?()
    }

    /// Called from the AX callback: the focused window or its title changed.
    fileprivate func focusChanged() {
        guard observing else { return }
        bindWindowObserver()
        onFocusChange?()
    }

    private func bindObserver() {
        unbindObserver()
        guard let app = frontmostApp() else { return }
        var created: AXObserver?
        // Fails with .apiDisabled when Accessibility is not granted; the
        // engine gates on that anyway and `currentWindow()` retries later.
        guard AXObserverCreate(app.pid, axObserverCallback, &created) == .success,
            let created
        else { return }
        observer = created
        observedPID = app.pid
        let refcon = Unmanaged.passUnretained(self).toOpaque()
        for notification in [
            kAXFocusedWindowChangedNotification,
            kAXMainWindowChangedNotification,
            kAXFocusedUIElementChangedNotification,
        ] {
            AXObserverAddNotification(created, app.element, notification as CFString, refcon)
        }
        // .commonModes so focus changes still arrive while a menu is tracking.
        CFRunLoopAddSource(
            CFRunLoopGetMain(), AXObserverGetRunLoopSource(created), .commonModes)
        bindWindowObserver()
    }

    private func bindWindowObserver() {
        guard let observer, let app = frontmostApp() else { return }
        let refcon = Unmanaged.passUnretained(self).toOpaque()
        if let observedWindow {
            AXObserverRemoveNotification(
                observer, observedWindow, kAXTitleChangedNotification as CFString)
        }
        observedWindow = focusedWindow(of: app.element)
        guard let observedWindow else { return }
        AXObserverAddNotification(
            observer, observedWindow, kAXTitleChangedNotification as CFString, refcon)
    }

    private func unbindObserver() {
        if let observer {
            CFRunLoopRemoveSource(
                CFRunLoopGetMain(), AXObserverGetRunLoopSource(observer), .commonModes)
        }
        observer = nil
        observedPID = nil
        observedWindow = nil
    }
}

/// AX callbacks are C function pointers, so the instance travels as a refcon.
/// The observer's run-loop source is on the main run loop, hence the
/// `assumeIsolated`.
private func axObserverCallback(
    _ observer: AXObserver, _ element: AXUIElement, _ notification: CFString,
    _ refcon: UnsafeMutableRawPointer?
) {
    guard let refcon else { return }
    let source = Unmanaged<AccessibilityWindowSource>.fromOpaque(refcon).takeUnretainedValue()
    MainActor.assumeIsolated { source.focusChanged() }
}
