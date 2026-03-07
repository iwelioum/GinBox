# Sokoul Scripts

Automation scripts for development, build, and maintenance tasks.

## Directory Structure

```
scripts/
├── dev/            # Development & runtime scripts
├── build/          # Build & release scripts
├── maintenance/    # Diagnostic, cleanup & quality scripts
└── README.md
```

## Dev Scripts (`scripts/dev/`)

| Script | Purpose | When to use |
|--------|---------|-------------|
| `start-all.bat` | Launches backend + desktop in separate windows, waits for backend health check | Daily development — single command to start everything |
| `start-backend.bat` | Starts the Rust/Axum backend on port 3000 | When you only need the backend running |
| `start-desktop.bat` | Starts the Electron desktop app (Vite + Electron) | When you only need the frontend (backend must be running) |
| `live-logs.bat` | Real-time color-coded log monitoring | Debugging — see all logs with syntax highlighting |
| `watch-types.bat` | Runs `tsc --noEmit --watch` for continuous type checking | During development — catch type errors immediately |

## Build Scripts (`scripts/build/`)

| Script | Purpose | When to use |
|--------|---------|-------------|
| `build-desktop.bat` | Type-checks and builds the frontend with Vite | Testing a production frontend build |
| `build-backend.bat` | Builds the Rust backend in release mode | Testing a production backend build |
| `release.bat` | Full release pipeline: tsc → cargo release → Vite build → Electron package | Creating a release build |

## Maintenance Scripts (`scripts/maintenance/`)

| Script | Purpose | When to use |
|--------|---------|-------------|
| `check-prerequisites.bat` | Verifies Node.js, npm, Rust, .env, mpv.exe, and dependencies | First setup or after environment changes |
| `check-env.bat` | Validates all required `.env` keys are present | After modifying `.env` or on first setup |
| `diagnose.bat` | Full 8-section system diagnostic (tools, files, env, DB, API, mpv, TS, summary) | When something isn't working — comprehensive health check |
| `reset-database.bat` | Deletes SQLite database files (preserves .env and source) | When database is corrupted or you need a fresh start |
| `clear-artwork-cache.bat` | Clears the `artwork_cache` table in the database | When artwork images are stale or broken |
| `audit.bat` | Full quality gate: tsc, ts-prune, madge, eslint, cargo check/clippy/fmt | Before every coding session — ensures clean project state |

## Quick Start

```bash
# First time setup
scripts\maintenance\check-prerequisites.bat

# Daily development
scripts\dev\start-all.bat

# Before committing
scripts\maintenance\audit.bat
```
