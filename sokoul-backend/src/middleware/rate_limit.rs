// ══════════════════════════════════════════════════════════
// rate_limit.rs — Protection contre le spam local
// NOUVEAU
// RÈGLES : Simple et efficace
// ══════════════════════════════════════════════════════════

use tower_http::trace::TraceLayer;

// Pour l'instant, on utilise TraceLayer pour le monitoring.
// Le rate limiting complexe n'est pas critique sur un serveur 100% loopback,
// mais utile pour éviter les boucles infinies de requêtes React en dev.

pub fn trace_layer() -> TraceLayer<tower_http::classify::SharedClassifier<tower_http::classify::ServerErrorsAsFailures>> {
    TraceLayer::new_for_http()
}