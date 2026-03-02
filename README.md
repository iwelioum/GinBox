# SOKOUL

Desktop media player with integrated catalog, streaming via Real-Debrid, and
MPV-based playback.

## Architecture

```
sokoul-backend/    Rust API server (Axum + SQLite)
sokoul-desktop/    React 18 / Electron desktop client
scripts/           Automation scripts (Windows .bat)
docs/              External API documentation
```

### Backend (Rust / Axum)

REST API on `http://127.0.0.1:3000`. Aggregates content metadata from TMDB,
artwork from Fanart.tv, torrent sources from Prowlarr/Torrentio, and streaming
links via Real-Debrid. Stores user profiles, watchlists, playback history and
preferences in a local SQLite database.

### Desktop (React / Electron)

Single-window Electron app with a transparent overlay for player controls.
Uses Vite for development, TailwindCSS for styling, Zustand for client state,
and TanStack Query for server state. MPV renders video directly into the main
window via `--wid`; a second transparent window displays controls on top.

## Quick Start

```bash
# 1. Prerequisites
scripts/check-prerequisites.bat

# 2. Configure backend
cp sokoul-backend/.env.example sokoul-backend/.env
# Fill in API keys (TMDB, Real-Debrid, etc.)

# 3. Install frontend dependencies
cd sokoul-desktop && npm install && cd ..

# 4. Launch everything
scripts/start-all.bat
```

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/start-all.bat` | Start backend + desktop together |
| `scripts/start-backend.bat` | Start Rust backend only |
| `scripts/start-desktop.bat` | Start Electron desktop only |
| `scripts/check-prerequisites.bat` | Verify Node, Rust, MPV, .env |
| `scripts/diagnose.bat` | Full system diagnostic |
| `scripts/live-logs.bat` | Real-time log monitoring |
| `scripts/reset-database.bat` | Delete SQLite DB (fresh start) |

## Development

See [`sokoul-desktop/README-DEV.md`](sokoul-desktop/README-DEV.md) for
frontend-specific documentation (IPC architecture, npm scripts, caveats).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rust, Axum, SQLx, SQLite |
| Frontend | React 18, TypeScript (strict), Vite |
| Desktop | Electron 31, MPV (native video) |
| Styling | TailwindCSS, Framer Motion |
| State | Zustand (client), TanStack Query (server) |
| APIs | TMDB, Fanart.tv, Real-Debrid, Prowlarr, Trakt |
