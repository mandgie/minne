import Foundation

/// What of a page's address one press may send to the model.
///
/// The path is context — it says "this is a tweet reply" or "this is a pull
/// request" — but the query string and fragment are liability: they carry
/// session tokens, search terms and tracking ids, none of which a draft
/// needs. Non-web schemes (chrome://, file://, about:) say nothing about
/// register and are dropped entirely.
enum PageURL {
    static func sanitize(_ raw: String) -> String? {
        guard let components = URLComponents(string: raw),
            let scheme = components.scheme?.lowercased(),
            scheme == "http" || scheme == "https",
            let host = components.host, !host.isEmpty
        else { return nil }
        var kept = URLComponents()
        kept.scheme = scheme
        kept.host = host
        kept.port = components.port
        kept.path = components.path
        return kept.string
    }
}
