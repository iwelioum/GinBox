# SOKOUL — ARCHITECTURE

> Architecture integrity is considered critical.
> This document is the single source of truth for all architectural decisions.
> Read it entirely before touching any file in this codebase.

---

## For AI Agents

Before making any modification to this project, you must read in order:

1. [`AGENTS.md`](./AGENTS.md) — strict engineering rules for agents
2. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — this file
3. [`CONTRIBUTING.md`](./CONTRIBUTING.md) — workflow and PR rules

Architecture boundaries defined here are strict and must never be violated.
If you are unsure about a decision → stop and explain rather than guess.

---

## Repository Layout

```
sokoul/
├── sokoul-desktop/     ← Electron + React client (TypeScript + FSD)
│   └── src/
├── sokoul-backend/     ← Rust + Axum API server
│   └── src/
├── docs/               ← Extended documentation and diagrams
├── scripts/            ← Development and build scripts
├── e2e/                ← End-to-end tests (Playwright)
├── .env.example        ← All required environment variables
├── AGENTS.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
└── REPO_MAP.md
```

---

## System Overview

Sokoul is a **desktop streaming platform** built on two independently
deployable systems communicating over a local HTTP API.

```
┌─────────────────────────────────────────────────────────┐
│                    sokoul-desktop                        │
│                                                          │
│   Electron Shell                                         │
│   ┌────────────────────────────────────────────────┐    │
│   │  Renderer Process — React + TypeScript + FSD   │    │
│   │                                                │    │
│   │   app → pages → widgets → features → shared   │    │
│   └────────────────────────────────────────────────┘    │
│   ┌────────────────────────────────────────────────┐    │
│   │  Main Process — Node.js                        │    │
│   │  IPC handlers · Tray · Auto-updater · Deeplink │    │
│   └────────────────────────────────────────────────┘    │
│                         │                               │
│                 HTTP (localhost only)                    │
└─────────────────────────┼───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    sokoul-backend                        │
│                                                          │
│   ┌──────────┐   ┌──────────┐   ┌──────────────────┐   │
│   │ handlers │ → │ services │ → │  repositories    │   │
│   └──────────┘   └──────────┘   └──────────────────┘   │
│                                         │               │
│                                  SQLite via sqlx         │
└─────────────────────────────────────────────────────────┘
```

### Global Data Flow

```
User interaction
  ↓
React UI (component)
  ↓
Custom hook (feature layer)
  ↓
API client (shared/api)
  ↓
Axum handler (parse + validate)
  ↓
Service (business logic)
  ↓
Repository (SQL query)
  ↓
SQLite
```

---

## Tech Stack

| Layer             | Technology              | Role                                |
|-------------------|-------------------------|-------------------------------------|
| Shell             | Electron                | Native desktop wrapper              |
| UI Framework      | React 18+               | Component rendering                 |
| Language (FE)     | TypeScript 5+           | Static typing                       |
| Architecture (FE) | Feature-Sliced Design   | Module organization + boundaries    |
| State management  | Zustand                 | Global state                        |
| Styling           | TailwindCSS             | Utility-first CSS                   |
| i18n              | react-i18next           | Internationalization                |
| Tests (FE)        | Vitest + Testing Library| Unit + component tests              |
| Language (BE)     | Rust stable             | Backend language                    |
| HTTP Framework    | Axum 0.7+               | Async HTTP server                   |
| Database ORM      | sqlx                    | Async SQL with compile-time checks  |
| Database          | SQLite                  | Local embedded database             |
| Tests (BE)        | Rust built-in tests     | Unit + integration tests            |
| E2E               | Playwright              | Full application flow tests         |

---

## Frontend Architecture

### Feature-Sliced Design — Layer Hierarchy

```
src/
├── app/           ← Bootstrap only: providers, router, global styles
│                    NO business logic here
│
├── pages/         ← Route-level compositions
│                    Thin layer — composes widgets, zero logic
│
├── widgets/       ← Complex composed UI blocks
│                    Combines features + entities into full sections
│
├── features/      ← Single isolated user interaction
│   ├── catalog/      browse and display content
│   ├── player/       video stream playback
│   ├── search/       full-text search
│   └── watchlist/    save and manage content
│
├── entities/      ← Business objects + their UI representation
│   ├── movie/
│   ├── stream/
│   └── user/
│
├── shared/        ← Generic reusable primitives — zero business logic
│   ├── ui/           Design system (Button, Card, Modal, Skeleton…)
│   ├── api/          HTTP client + shared API types
│   ├── lib/          Pure utility functions (formatters, parsers…)
│   ├── config/       App constants + env variable access
│   └── i18n/         Translation files (fr.json, en.json) + setup
│
└── stores/        ← Global Zustand stores
```

### Import Law — Never Violate This

Each layer may only import from layers **below** it.

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

```typescript
// ❌ FORBIDDEN — sideways import (feature → feature)
import { usePlayer } from '@/features/player'   // inside catalog feature

// ✅ CORRECT — move shared logic down to entities
import { useStreamUrl } from '@/entities/stream'
```

```typescript
// ❌ FORBIDDEN — bypassing a slice's public barrel
import { MovieCard } from '@/entities/movie/components/MovieCard'

// ✅ CORRECT — always import through index.ts
import { MovieCard } from '@/entities/movie'
```

### Feature Slice Internal Structure

```
features/catalog/
├── index.ts          ← Public API: export only what external layers need
├── components/       ← UI components specific to this feature
├── hooks/            ← Data fetching + local state logic
├── model/            ← Local types, constants, zod schemas
└── __tests__/        ← Co-located unit tests
```

### Electron Process Boundary

Sokoul runs across two Electron processes. **Violating this boundary causes crashes.**

```
Main Process (Node.js)
  ├── Owns: filesystem, IPC handlers, tray, auto-updater, native dialogs
  └── Exposes: preload.ts → contextBridge → window.electronAPI

Renderer Process (React)
  ├── NEVER imports: fs · path · electron · child_process
  └── ONLY communicates via: window.electronAPI.method(payload)
```

```typescript
// ❌ FORBIDDEN in renderer
import fs from 'fs'

// ✅ CORRECT
const data = await window.electronAPI.readFile(path)
```

---

## Backend Architecture

### Layer Responsibilities

```
routes/          ← Axum route registration only — zero logic
handlers/        ← Parse request · validate input · shape response  (≤ 80 lines)
services/        ← All business logic and orchestration
repositories/    ← SQL queries only, via sqlx macros
models/          ← Rust domain structs + API types
errors/          ← AppError enum + IntoResponse implementation
config/          ← AppState definition + environment parsing
```

### Request Lifecycle

```
HTTP Request
  → routes/       bind method + path
  → handlers/     parse body, validate input, extract state
  → services/     orchestrate business logic
  → repositories/ execute SQL query
  ← services/     return domain result
  ← handlers/     shape into Json<T>
  ← HTTP Response Result<Json<T>, AppError>
```

### Error Handling Strategy

All errors flow through a central `AppError` enum.
No raw `StatusCode` returns. No `unwrap()` in production paths.

```rust
pub enum AppError {
    NotFound(String),
    DatabaseError(sqlx::Error),
    ValidationError(String),
    ExternalServiceError(String),
    Unauthorized,
}

impl IntoResponse for AppError { ... }

// ❌ FORBIDDEN
let conn = pool.acquire().await.unwrap();

// ✅ CORRECT
let conn = pool.acquire().await.map_err(AppError::DatabaseError)?;
```

---

## API Contract Policy

Frontend and backend must share a single source of truth for API contracts.

Rules:
- Rust structs define the **canonical schema**
- TypeScript types in `shared/api/types/` must exactly match backend responses
- Any breaking API change requires explicit versioning discussion
- Never duplicate type definitions between layers

```typescript
// ❌ FORBIDDEN — type defined independently in frontend
interface Movie { id: number; titre: string }

// ✅ CORRECT — type lives in shared/api/types/, derived from Rust model
import type { Movie } from '@/shared/api/types'
```

**Future plan:** OpenAPI schema generation to automatically produce TypeScript
types from Rust structs — eliminating manual synchronization entirely.

---

## Testing Strategy

Testing occurs at three independent levels:

**Unit tests**
- Frontend: Vitest + Testing Library — co-located in `__tests__/`
- Backend: Rust built-in test modules — inline `#[cfg(test)]` blocks
- Target: pure functions, hooks, service logic

**Integration tests**
- Backend service tests interacting with a real in-memory SQLite instance
- Verify that handler → service → repository chains work end to end

**End-to-end tests**
- Playwright runs full application flows against a running Electron instance
- Located in `e2e/` at the repo root
- Run in CI on every PR targeting `main`

Coverage targets:

| Layer            | Target |
|------------------|--------|
| Frontend logic   | ≥ 70%  |
| Backend services | ≥ 80%  |
| Critical paths   | 100%   |

---

## Security Rules

The following rules must never be violated:

- **No API keys or secrets in source code** — use environment variables only
- **Environment variables validated at startup** — missing required vars crash fast
- **All external input validated** before entering the service layer
- **All external API calls must have timeouts** configured explicitly
- **No secrets in frontend code** — the renderer process is fully inspectable
- **SQLite file must not be world-readable** — enforce OS-level permissions
- **AllDebrid API key must never be logged** even in debug mode

```rust
// ❌ FORBIDDEN
println!("API key: {}", config.alldebrid_key);

// ✅ CORRECT — never log secrets
tracing::debug!("External API call initiated");
```

---

## Performance Philosophy

**Frontend:**
- Lazy loading for all heavy pages and widgets (`React.lazy` + `Suspense`)
- Minimal global state — prefer local slice state over Zustand when possible
- Memoized components and callbacks where re-render cost is measurable
- No blocking operations on the main thread

**Backend:**
- Concurrent external API requests where independent (use `tokio::join!`)
- Cache metadata responses that are expensive and rarely change
- Minimize database round-trips — batch queries over N+1 patterns
- All database access is strictly async — no blocking I/O in Axum handlers

---

## API Routes

| Method | Path             | Handler           | Service            | Auth |
|--------|------------------|-------------------|--------------------|------|
| GET    | /api/catalog     | get_catalog       | catalog_service    | No   |
| GET    | /api/detail/:id  | get_detail        | catalog_service    | No   |
| GET    | /api/artwork/:id | get_artwork       | artwork_service    | No   |
| POST   | /api/unrestrict  | post_unrestrict   | unrestrict_service | Yes  |

Full request/response contracts → `sokoul-backend/src/routes/README.md`

---

## Database Schema

```sql
CREATE TABLE movies (
    id          INTEGER PRIMARY KEY,
    title       TEXT NOT NULL,
    year        INTEGER,
    genre       TEXT,
    rating      REAL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watchlist (
    id          INTEGER PRIMARY KEY,
    movie_id    INTEGER REFERENCES movies(id),
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Migrations live in `sokoul-backend/migrations/`.
**Never edit an existing migration file. Always create a new one.**

---

## Environment Variables

| Variable               | System   | Required | Description                   |
|------------------------|----------|----------|-------------------------------|
| `SOKOUL_API_BASE_URL`  | Frontend | Yes      | Backend base URL              |
| `SOKOUL_API_PORT`      | Backend  | Yes      | Axum server listening port    |
| `SOKOUL_DB_PATH`       | Backend  | Yes      | Path to the SQLite file       |
| `SOKOUL_ALLDEBRID_KEY` | Backend  | Yes      | AllDebrid API key             |
| `SOKOUL_ENV`           | Both     | Yes      | `development` or `production` |

All variables must be declared in `.env.example`.
Missing required variables crash the server at startup — this is intentional.

---

## Architectural Decision Records (ADR)

### ADR-001 — SQLite over PostgreSQL
**Decision:** Use SQLite as the local database.
**Rationale:** Sokoul is a single-user desktop app. SQLite ships with the
binary, requires zero infrastructure, and is entirely sufficient for local data.

### ADR-002 — Feature-Sliced Design over ad-hoc structure
**Decision:** Adopt FSD as the frontend architecture.
**Rationale:** FSD enforces strict module boundaries that prevent cross-feature
dependency rot as the codebase scales. Predictable, auditable, and scalable.

### ADR-003 — Local Axum API over IPC-only backend
**Decision:** Backend runs as a separate Rust process over localhost HTTP.
**Rationale:** Fully decouples frontend and backend. Enables independent
testing of each system. Prepares a clean extraction path to a remote service.

---

## Technical Roadmap

- [ ] OpenAPI schema generation — auto-sync Rust structs → TypeScript types
- [ ] End-to-end tests with Playwright
- [ ] Auto-updater via Electron's native mechanism
- [ ] Offline mode with local cache fallback
- [ ] Multi-profile support
```

