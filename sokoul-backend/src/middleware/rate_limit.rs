// ══════════════════════════════════════════════════════════
// rate_limit.rs — Local spam protection
// RULES: Simple and effective
// ══════════════════════════════════════════════════════════

use tower_http::trace::TraceLayer;

// For now, using TraceLayer for monitoring.
// Complex rate limiting is not critical on a 100% loopback server,
// but useful to prevent infinite React request loops in dev.

pub fn trace_layer() -> TraceLayer<tower_http::classify::SharedClassifier<tower_http::classify::ServerErrorsAsFailures>> {
    TraceLayer::new_for_http()
}