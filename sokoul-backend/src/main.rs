// ══════════════════════════════════════════════════════════
// main.rs — Serveur + CORS loopback + signal READY
// NOUVEAU : Spécifique Electron/Desktop
// RÈGLES : Loopback (127.0.0.1) obligatoire. Signal stdout.
// ══════════════════════════════════════════════════════════

use axum::{routing::get, Router};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod errors;
mod middleware;
mod models;
mod parser;
mod routes;
mod services;

pub struct AppState {
    pub db: SqlitePool,
    pub http_client: reqwest::Client,
    pub realdebrid_token: String,
    pub prowlarr_url: String,
    pub prowlarr_key: String,
    pub tmdb_key: String,
    pub fanart_key: String,
    pub tvdb_key: String,
    pub simkl_client_id: String,
    pub watchmode_key: String,
    pub omdb_key: String,
    pub trakt_client_id: String,
    pub trakt_client_secret: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialisation de l'environnement (fail-fast)
    dotenvy::dotenv().unwrap_or_else(|_| {
        eprintln!("[FATAL] Le fichier .env est introuvable.");
        std::process::exit(1);
    });

    // 2. Initialisation des logs
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sokoul_backend=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 3. Initialisation Base de données
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    // PRAGMAs SQLite — ordre obligatoire : WAL d'abord
    sqlx::query("PRAGMA journal_mode=WAL").execute(&pool).await?;
    sqlx::query("PRAGMA synchronous=NORMAL").execute(&pool).await?;
    sqlx::query("PRAGMA foreign_keys=ON").execute(&pool).await?;   // active ON DELETE CASCADE
    sqlx::query("PRAGMA busy_timeout=5000").execute(&pool).await?; // 5s avant SQLITE_BUSY
    sqlx::query("PRAGMA temp_store=memory").execute(&pool).await?;
    sqlx::query("PRAGMA mmap_size=268435456").execute(&pool).await?; // 256 MB mmap
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!("Database connected and migrations applied.");

    // 4. Initialisation État Global
    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("Sokoul/1.0.0")
        .build()?;

    let app_state = Arc::new(AppState {
        db: pool,
        http_client,
        realdebrid_token: env::var("REALDEBRID_API_TOKEN").unwrap_or_default(),
        prowlarr_url: env::var("PROWLARR_URL").unwrap_or_default(),
        prowlarr_key: env::var("PROWLARR_API_KEY").unwrap_or_default(),
        tmdb_key: env::var("TMDB_API_KEY").unwrap_or_default(),
        fanart_key: env::var("FANART_API_KEY").unwrap_or_default(),
        tvdb_key: env::var("TVDB_API_KEY").unwrap_or_default(),
        simkl_client_id: env::var("SIMKL_CLIENT_ID").unwrap_or_default(),
        watchmode_key: env::var("WATCHMODE_API_KEY").unwrap_or_default(),
        omdb_key: env::var("OMDB_API_KEY").unwrap_or_default(),
        trakt_client_id: env::var("TRAKT_CLIENT_ID").unwrap_or_default(),
        trakt_client_secret: env::var("TRAKT_CLIENT_SECRET").unwrap_or_default(),
    });

    // 5. Router - Orchestration des Services
    let app = Router::new()
        .route("/health", get(|| async { "Sokoul Desktop Backend OK" }))
        .nest("/catalog", routes::catalog::router())
        .nest("/sources", routes::stream::router())
        .nest("/search", routes::catalog::search_router())
        .nest("/debrid", routes::debrid::router())
        .nest("/fanart", routes::fanart::router())
        .nest("/profiles", routes::profiles::router())
        .nest("/playback", routes::playback::router())
        .nest("/trakt", routes::trakt::router())
        .nest("/lists", routes::lists::router())
        .nest("/preferences", routes::preferences::router())
        .nest("/user/progress", routes::user_progress::router())
        .nest("/collections", routes::collections::router())
        .with_state(app_state)
        .layer(middleware::cors::cors_layer())
        .layer(middleware::rate_limit::trace_layer());

    // 6. Binding TCP
    let host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "3000".to_string());
    let addr: SocketAddr = format!("{}:{}", host, port).parse()?;

    let listener = TcpListener::bind(&addr).await?;
    info!("Serveur Sokoul Desktop démarré sur {}", addr);

    // ⭐ SIGNAL CRITIQUE POUR ELECTRON ⭐
    info!("SOKOUL_BACKEND_READY");

    axum::serve(listener, app).await?;

    Ok(())
}