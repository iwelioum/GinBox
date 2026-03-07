# Sokoul — Copilot Instructions

## Architecture

Sokoul is a desktop media player with two projects in one monorepo:

- **`sokoul-backend/`** — Rust REST API (Axum + SQLx + SQLite) on `127.0.0.1:3000`. Aggregates metadata from TMDB, torrent sources from Prowlarr/Torrentio, and streaming links via Real-Debrid. All state lives in a local SQLite database.
- **`sokoul-desktop/`** — React 18 / TypeScript / Electron 31 desktop client. Uses a **dual-window** architecture: the main window renders MPV video via `--wid`, and a transparent overlay window displays player controls on top. The two windows sync state via `BroadcastChannel`.

### Backend structure

```
sokoul-backend/src/
├── main.rs          # Axum server, AppState (Arc'd DB pool + API keys + HTTP client)
├── models.rs        # Shared domain types
├── errors.rs        # AppError enum → HTTP status + JSON
├── parser.rs        # Regex torrent title parser (quality, language, codec)
├── routes/          # HTTP handlers — thin layer over services
├── services/        # Business logic + external API clients
└── middleware/      # CORS (loopback + file://), rate limiting
```

Key patterns:
- **AppState** holds `SqlitePool`, `reqwest::Client`, and all API keys as a shared `Arc`.
- Routes extract `State<Arc<AppState>>` and delegate to services.
- All SQL uses `sqlx::query!` macros for **compile-time verification**. The `.sqlx/` directory is committed to allow CI builds without a live database.
- Stream scoring uses a 3-tier system: language (0–600) + resolution (0–400) + source quality (0–300), then sorts by cached > language > resolution > quality > seeders > size.
- Real-Debrid integration uses an adaptive rate limiter (singleton via `OnceLock`+`Mutex`) that adjusts interval on 429 responses.
- Cache TTL varies by content age: current year → 6h, last year → 24h, older → 7 days. Stale-while-revalidate returns old data while refreshing in the background.

### Frontend structure

```
sokoul-desktop/src/
├── app/             # main.tsx (providers, QueryClient), App.tsx (HashRouter + routes)
├── api/             # Axios client (baseURL: 127.0.0.1:3000) with logging interceptors
├── features/        # Feature-sliced modules (player, catalog, detail)
│   ├── player/      # MPV playback, overlay controls, subtitle/audio track switching
│   ├── catalog/     # Homepage rails, browse, hover cards, categories config
│   └── detail/      # Content detail page, trailers, gallery, cast
├── shared/          # Cross-feature code (components, hooks, stores, utils, types)
└── styles/          # Tailwind globals, animations
```

Key patterns:
- **HashRouter** is required — Electron loads via `file://` which doesn't support `pushState`.
- **Zustand** for client state (profiles, preferences, catalog), **React Query** for server state. Stores never make API calls directly; fetching is done in hooks.
- **Feature modules cannot import each other.** Shared code goes in `shared/`.
- GPU acceleration is disabled (`app.disableHardwareAcceleration()`) — required for MPV `--wid` rendering.
- Each route has its own `ErrorBoundary` to prevent cross-feature crashes.

### Electron main process (`electron/`)

- `main.js` — App lifecycle, dual-window creation, IPC handler registration
- `preload.js` — Context bridge exposing `window.mpv`, `window.overlay`, `window.electronAPI`
- `mpv-manager.js` — Spawns MPV with `--ipc-server=\\.\pipe\mpv-{pid}`, lifecycle events
- `mpv-ipc.js` — JSON IPC over named pipe, polls position every 250ms
- `backend-manager.js` — Spawns Rust backend, waits for `SOKOUL_BACKEND_READY` stdout signal

## Build & Run Commands

### Backend (`sokoul-backend/`)

```bash
cargo build              # Debug build
cargo build --release    # Release build
cargo run                # Run dev server on 127.0.0.1:3000
cargo check              # Fast type/borrow checking (no codegen)
cargo clippy             # Lint
cargo fmt --check        # Format check
```

### Frontend (`sokoul-desktop/`)

```bash
npm install                   # Install dependencies
npm run dev                   # Vite dev server on localhost:5173
npm run build                 # tsc + vite build to dist/
npm run check                 # Type-check only (tsc --noEmit)
npm run electron:dev          # Full dev: Vite + Electron with hot-reload
npm run electron:build        # Package Windows NSIS installer
```

### Full stack

```bash
scripts\start-all.bat         # Start backend + desktop together
scripts\start-backend.bat     # Backend only
scripts\start-desktop.bat     # Desktop only
scripts\check-prerequisites.bat  # Verify Node, Rust, MPV, .env
scripts\diagnose.bat          # Full system diagnostic
```

## Conventions

### Naming

- All code identifiers must be **English only** (codebase was translated from French).
- Files: `kebab-case` (e.g., `catalog-page.tsx`, `rail-titles.ts`)
- Components: `PascalCase` (e.g., `MovieCard.tsx`, `PlayerOverlay.tsx`)
- Hooks: `useSomething.ts` (e.g., `useMouseIdle.ts`)
- Backend route handlers: `get_catalog`, `post_unrestrict` (verb_noun)

### TypeScript

- Strict mode is enabled. Do not weaken with `any` or `@ts-ignore`.
- Path alias: `@/*` maps to `src/*`.
- No ESLint — TypeScript strict mode is the sole static analysis tool.

### Rust

- Use `sqlx::query!` macros (never raw `sqlx::query`) — compile-time SQL checking.
- After adding/modifying SQL queries, run `cargo sqlx prepare` to update `.sqlx/` cache.
- Error types use `thiserror` and implement `IntoResponse` for Axum.
- No `println!` in production code — use `tracing::info!` / `tracing::error!`.

### Git commits

Follow conventional commit format:

```
refactor(step-X): description
feat(catalog): add genre filtering
fix(player): handle MPV pipe disconnect
```

### Environment

The backend requires a `.env` file (copy from `.env.example`). Minimum required keys:

- `TMDB_API_KEY`
- `REALDEBRID_API_TOKEN`

## Validation checklist

Before considering work complete, run:

```bash
# Frontend
cd sokoul-desktop && npx tsc --noEmit

# Backend
cd sokoul-backend && cargo check && cargo clippy && cargo fmt --check
```
