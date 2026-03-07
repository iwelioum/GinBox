# SOKOUL — REPOSITORY MAP

Navigation guide for contributors and AI agents.

This document provides a complete map of the repository and helps identify
where code should live before modifying anything.

Before making any change, read in this order:

1. [`AGENTS.md`](./AGENTS.md)         ← rules for AI agents
2. [`ARCHITECTURE.md`](./ARCHITECTURE.md) ← system architecture and boundaries
3. [`CONTRIBUTING.md`](./CONTRIBUTING.md) ← workflow and pull request rules
4. [`REPO_MAP.md`](./REPO_MAP.md)     ← repository navigation (this file)

---

## Repository Overview

```
sokoul/
│
├── AGENTS.md                ← AI agent strict rules
├── ARCHITECTURE.md          ← Architectural decisions and data flows
├── CONTRIBUTING.md          ← Workflow, commits, PR rules
├── REPO_MAP.md              ← This file
│
├── sokoul-desktop/          ← Electron + React desktop client
│   └── src/
│
├── sokoul-backend/          ← Rust + Axum API server
│   └── src/
│
├── e2e/                     ← Playwright end-to-end tests
├── docs/                    ← Extended documentation
└── scripts/                 ← Development and build scripts
```

| Application       | Stack                          | Role                   |
|-------------------|--------------------------------|------------------------|
| `sokoul-desktop`  | Electron + React + TypeScript  | User interface         |
| `sokoul-backend`  | Rust + Axum + SQLite           | API, services, database|

---

## Frontend Architecture

Location: `sokoul-desktop/src/`

The frontend follows **Feature-Sliced Design (FSD)**.

```
app          ← bootstrap only, no business logic
↓
pages        ← route-level compositions, no logic
↓
widgets      ← complex UI blocks (features + entities combined)
↓
features     ← isolated user interactions
↓
entities     ← business objects and their UI
↓
shared       ← generic reusable primitives, no business logic
```

Higher layers may import **only** from layers below them.
**Never sideways. Never upward.**

### Frontend Layer Mapping

| Layer      | Path                    | Responsibility                          | Can import from                     |
|------------|-------------------------|-----------------------------------------|-------------------------------------|
| `app`      | `src/app/`              | Root providers, routing, bootstrap      | pages, widgets, features, shared    |
| `pages`    | `src/pages/`            | Route-level composition only            | widgets, features, entities, shared |
| `widgets`  | `src/widgets/`          | Complex UI blocks (composed sections)   | features, entities, shared          |
| `features` | `src/features/`         | Isolated user interactions              | entities, shared                    |
| `entities` | `src/entities/`         | Business objects + their UI             | shared                              |
| `shared`   | `src/shared/`           | Generic reusable utilities              | nothing internal                    |
| `stores`   | `src/stores/`           | Global Zustand state                    | entities, shared                    |

---

## Frontend Feature Inventory

Location: `src/features/`

| Feature     | Purpose                        | Status |
|-------------|--------------------------------|--------|
| `catalog`   | Browse and discover content    | active |
| `player`    | Video stream playback          | active |
| `search`    | Full-text search of catalog    | active |
| `watchlist` | Save and manage content        | active |

Every feature must follow this internal structure:

```
features/catalog/
├── index.ts          ← public API — export only what external layers need
├── components/       ← UI components specific to this feature
├── hooks/            ← data fetching and local state logic
├── model/            ← local types, constants, zod schemas
└── __tests__/        ← co-located unit tests
```

**Every feature must expose a public API via `index.ts`.**
Never import from an internal path of a feature slice.

---

## Frontend Entities

Location: `src/entities/`

Entities represent **core domain objects** shared across features.

| Entity   | Role                  | UI exports             |
|----------|-----------------------|------------------------|
| `movie`  | Movie metadata        | MovieCard, MovieBadge  |
| `stream` | Stream source info    | StreamInfo             |
| `user`   | User preferences      | UserAvatar             |

Typical entity structure:

```
entities/movie/
├── index.ts          ← public API
├── components/       ← UI representation of this entity
├── model/            ← types, constants, schemas
└── __tests__/
```

---

## Shared Modules

Location: `src/shared/`

Contains **generic code reusable across the entire app**.

| Module    | Path             | Contents                                      |
|-----------|------------------|-----------------------------------------------|
| `ui/`     | `shared/ui/`     | Button, Card, Modal, Skeleton, Input, Badge…  |
| `api/`    | `shared/api/`    | HTTP client + all API type definitions        |
| `lib/`    | `shared/lib/`    | formatDuration, formatDate, truncateText…     |
| `config/` | `shared/config/` | App constants + env variable access           |
| `i18n/`   | `shared/i18n/`   | fr.json, en.json + i18n setup                 |

Rules for `shared/`:
- No business logic
- No feature-specific imports
- Every export must be generic and reusable anywhere

---

## Backend Architecture

Location: `sokoul-backend/src/`

The backend follows a **strict layered service architecture**.

```
routes/          ← Axum route registration only
↓
handlers/        ← request parsing + response shaping  (≤ 80 lines)
↓
services/        ← all business logic and orchestration
↓
repositories/    ← SQL queries only, via sqlx macros
↓
SQLite
```

### Backend Folder Mapping

| Folder           | Responsibility                         | Hard rules                          |
|------------------|----------------------------------------|-------------------------------------|
| `routes/`        | Axum router configuration only        | No logic                            |
| `handlers/`      | Request parsing + response shaping    | No business logic · ≤ 80 lines      |
| `services/`      | Business logic + orchestration        | No SQL queries                      |
| `repositories/`  | Database access via sqlx macros       | SQL only · no logic                 |
| `models/`        | Domain structs + API types            | Pure data structures                |
| `errors/`        | AppError enum + IntoResponse impl     | All errors centralized here         |
| `config/`        | AppState + environment parsing        | Injected via Axum State             |

---

## Backend Route Map

| Route                 | Handler file              | Service file                |
|-----------------------|---------------------------|-----------------------------|
| GET /api/catalog      | `handlers/catalog.rs`     | `services/catalog.rs`       |
| GET /api/detail/:id   | `handlers/catalog.rs`     | `services/catalog.rs`       |
| GET /api/artwork/:id  | `handlers/artwork.rs`     | `services/artwork.rs`       |
| POST /api/unrestrict  | `handlers/unrestrict.rs`  | `services/unrestrict.rs`    |

Full request/response contracts → `sokoul-backend/src/routes/README.md`

---

## Critical Files

| File                                           | Purpose                                    |
|------------------------------------------------|--------------------------------------------|
| `sokoul-desktop/src/app/router.tsx`            | All frontend routes defined here           |
| `sokoul-desktop/src/shared/api/client.ts`      | Global HTTP client used by all features    |
| `sokoul-desktop/src/shared/api/types/index.ts` | Shared TypeScript types (API contracts)    |
| `sokoul-desktop/src/stores/playerStore.ts`     | Global player state (stream URL, playback) |
| `sokoul-backend/src/main.rs`                   | Server bootstrap + route mounting          |
| `sokoul-backend/src/config/mod.rs`             | AppState definition + env parsing          |
| `sokoul-backend/src/errors/mod.rs`             | AppError enum — all error types live here  |
| `sokoul-backend/migrations/`                   | SQLite migrations — never edit manually    |
| `.env.example`                                 | All required env variables documented here |

---

## Task Routing Guide

| Task                              | Location                                    |
|-----------------------------------|---------------------------------------------|
| Add UI component to a feature     | `features/<name>/components/`               |
| Add data fetching logic           | `features/<name>/hooks/`                    |
| Add a reusable UI primitive       | `shared/ui/`                                |
| Add a shared utility function     | `shared/lib/`                               |
| Add or modify an API call         | `shared/api/` + update types                |
| Add a translation string          | `shared/i18n/locales/fr.json` + `en.json`   |
| Add global state                  | `stores/`                                   |
| Add a new business entity         | `entities/<name>/`                          |
| Add a new backend route           | `routes/` → `handlers/` → `services/`      |
| Fix type mismatch (FE ↔ BE)       | `shared/api/types/` + Rust `models/`        |
| Add a database migration          | `sokoul-backend/migrations/` (new file)     |

---

## Forbidden Patterns

If you see any of these in the codebase, they are **bugs to fix**.

### Frontend

```typescript
// ❌ Cross-feature import
import { usePlayer } from '@/features/player'     // inside catalog feature

// ❌ Internal path import past barrel
import { MovieCard } from '@/entities/movie/components/MovieCard'

// ❌ Hardcoded user-visible string
<p>Chargement en cours...</p>

// ❌ any type
function parse(data: any) { ... }

// ❌ Business logic inside a page
function CatalogPage() {
    const filtered = movies.filter(m => m.year > 2010) // belongs in feature
}

// ❌ French identifier
const comedie = movies.filter(m => m.genre === 'comedy')
```

### Backend

```rust
// ❌ unwrap() in production
let conn = pool.acquire().await.unwrap();

// ❌ println! in production
println!("response: {:?}", response);

// ❌ SQL query outside repository
// services/catalog.rs
let rows = sqlx::query!("SELECT * FROM movies").fetch_all(&db).await?;

// ❌ Business logic inside handler
async fn get_catalog(...) {
    let filtered = movies.into_iter().filter(|m| m.rating > 7.0).collect();
    // ↑ belongs in service layer
}
```

---

## Diagnostic Commands

```bash
# Frontend type check
cd sokoul-desktop && npx tsc --noEmit

# Frontend lint
cd sokoul-desktop && pnpm lint

# Frontend tests
cd sokoul-desktop && pnpm test

# Backend compile check
cd sokoul-backend && cargo check

# Backend strict lint
cd sokoul-backend && cargo clippy -- -D warnings

# Backend tests
cd sokoul-backend && cargo test

# Scan for debug artifacts
grep -rn "console\.log\|console\.debug\|println!\|dbg!" \
  --include="*.ts" --include="*.tsx" --include="*.rs" \
  --exclude-dir=node_modules --exclude-dir=target .

# Scan for French identifiers
grep -rn "tendance\|comedie\|films\|chargement\|recherche" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules .
```

---

## Simplified Dependency Graph

```
CatalogPage (pages)
  └── CatalogFeed (widgets)
        ├── useCatalog (features/catalog)
        │     └── shared/api + shared/lib
        └── MovieCard (entities/movie)
              └── shared/ui + shared/lib

PlayerPage (pages)
  └── PlayerView (widgets)
        ├── usePlayer (features/player)
        │     └── shared/api + stores/playerStore
        └── StreamInfo (entities/stream)
              └── shared/ui
```

---

## Final Notes

Before modifying anything:

1. Identify the correct layer using the Task Routing Guide above
2. Verify no existing implementation covers your need
3. Respect import boundaries — no exceptions
4. Expose public APIs via `index.ts` in every slice
5. If unsure → consult `ARCHITECTURE.md` or ask before implementing

```