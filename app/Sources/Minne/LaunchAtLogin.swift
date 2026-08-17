import Foundation
import ServiceManagement

/// Launch-at-login via SMAppService.mainApp. Only functional from a real
/// .app bundle (scripts/build.sh); the bare SwiftPM dev executable has no
/// bundle identity for launchd to register, so the menu shows the toggle
/// disabled there.
@MainActor
enum LaunchAtLogin {
    static var isSupported: Bool {
        Bundle.main.bundleURL.pathExtension == "app"
    }

    static var isEnabled: Bool {
        guard isSupported else { return false }
        return SMAppService.mainApp.status == .enabled
    }

    static func setEnabled(_ enabled: Bool) throws {
        if enabled {
            try SMAppService.mainApp.register()
        } else {
            try SMAppService.mainApp.unregister()
        }
    }
}
