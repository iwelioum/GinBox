# sokoul-backend

Rust REST API server for SOKOUL desktop media player.

## Stack

- **Axum** — HTTP framework
- **SQLx** — Async SQLite with compile-time query verification
- **Reqwest** — HTTP client for external APIs
- **AES-GCM** — Encryption for sensitive stored data

## Endpoints

| Route | Description |
|-------|-------------|
| `GET /catalog/:type/:id` | Browse catalog (popular, top_rated, genre, etc.) |
| `GET /catalog/:type/meta/:id` | Full metadata for a single item |
| `GET /catalog/:type/:id/credits` | Cast and crew |
| `GET /catalog/:type/:id/images` | Gallery images |
| `GET /search?q=&type=` | Search across movies and series |
| `GET /sources/:type/:id` | Torrent sources (Prowlarr + Torrentio) |
| `POST /debrid/unrestrict` | Unrestrict magnet via Real-Debrid |
| `GET /fanart/:type/:id` | HD artwork from Fanart.tv |
| `GET /trakt/:type/:id/reviews` | Ratings and reviews from Trakt |
| `GET /collections/all` | Movie collections/sagas |
| `GET /collections/:id` | Single collection detail |
| `/profiles/*` | User profile CRUD |
| `/lists/*` | Watchlist management |
| `/playback/*` | Playback position save/restore |
| `/user/progress` | Watch status tracking |
| `/preferences` | User UI preferences |

## Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Fill in required API keys:
#    - TMDB_API_KEY (required)
#    - REALDEBRID_API_TOKEN (required for streaming)

# 3. Build and run
cargo run
```

The server starts on `http://127.0.0.1:3000`. SQLite database is created
automatically on first run via migrations.

## Database

SQLite with auto-migrations in `migrations/`. The `.sqlx/` directory contains
compile-time query verification cache (committed to git so CI can build without
a live database).

## Project Structure

```
src/
  main.rs            Entry point, server setup
  models.rs          Database models (SQLx FromRow)
  errors.rs          Error types (thiserror)
  parser.rs          Torrent name parsing
  routes/            HTTP route handlers
  services/          Business logic & external API clients
  middleware/        CORS, rate limiting
migrations/          SQLite migration files
.sqlx/               Compile-time query cache
```
