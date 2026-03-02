// ══════════════════════════════════════════════════════════
// cors.rs — Configuration CORS loopback exclusif
// NOUVEAU
// RÈGLES : Autorise uniquement localhost et 127.0.0.1
// SÉCURITÉ : Zéro "Any" — headers explicites uniquement
//            Predicate pour gérer l'origin "null" d'Electron
//            production (chargement via file://)
// ══════════════════════════════════════════════════════════

use tower_http::cors::{AllowOrigin, CorsLayer};
use axum::http::{header, Method, request::Parts};

pub fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(
            |origin: &axum::http::HeaderValue, _parts: &Parts| {
                let s = origin.to_str().unwrap_or("");
                // Développement Vite (localhost / 127.0.0.1)
                s.starts_with("http://localhost")
                    || s.starts_with("http://127.0.0.1")
                    // Production Electron file:// → origine "null"
                    || s == "null"
            },
        ))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        // Headers explicites — Any est interdit
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::ACCEPT,
            header::ORIGIN,
        ])
        .allow_credentials(false)
}
