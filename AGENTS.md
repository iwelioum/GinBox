# SOKOUL — AI AGENT DEVELOPMENT GUIDE
# Version: 2.1
# Compatible: Claude Code · Cursor · GitHub Copilot · Aider · Windsurf

Architecture integrity always overrides speed of implementation.

---

## Reading Order — Mandatory

Before making any modification, read in this order:

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md) ← system architecture and layer rules
2. [`REPO_MAP.md`](./REPO_MAP.md)         ← where every file belongs
3. [`CONTRIBUTING.md`](./CONTRIBUTING.md) ← workflow and PR rules
4. [`AGENTS.md`](./AGENTS.md)             ← this file

Never start coding without understanding the repository layout.

---

## Technology Stack

| Layer           | Technology                          |
|-----------------|-------------------------------------|
| Desktop client  | Electron + React + TypeScript (FSD) |
| Backend API     | Rust + Axum + sqlx                  |
| Database        | SQLite                              |
| State           | Zustand                             |
| Tests (FE)      | Vitest + Testing Library            |
| Tests (BE)      | Rust built-in unit tests            |
| i18n            | react-i18next                       |

---

## Agent Operating Principles

1. **Never guess** — if the correct architectural decision is unclear, stop and ask
2. **Never violate layer boundaries** — import law is absolute
3. **Never introduce cross-feature coupling** — features are isolated units
4. **Never bypass type safety** — no `any`, no `unwrap()` in production
5. **Never add dependencies without approval** — ask before every install
6. **Always preserve existing tests** — never delete or skip a passing test

If uncertainty exists → **STOP and explain. Do not implement.**

---

## Mandatory Session Initialization

Run this before touching any file:

```bash
# 1. Map the repository
find . -type f | grep -v node_modules | grep -v target | grep -v .git

# 2. Verify frontend health
cd sokoul-desktop
npx tsc --noEmit
npx vitest run

# 3. Verify backend health
cd sokoul-backend
cargo check
cargo test
cargo clippy -- -D warnings
```

If any check fails **before your change** → report it and stop.
Do NOT work on top of a broken codebase.

---

## Tool Permissions (Claude Code)

```yaml
allow:
  - Bash(npx tsc --noEmit)
  - Bash(npx vitest run*)
  - Bash(cargo test*)
  - Bash(cargo clippy*)
  - Bash(cargo fmt --check)
  - Read(*)

deny:
  - Bash(rm -rf *)
  - Bash(git push*)
  - Bash(git reset --hard*)

ask_before:
  - Bash(git commit*)
  - Bash(npm install*)
  - Bash(cargo add*)
  - Edits to: .env* · Cargo.toml · package.json · src/stores/** · **/config/**
```

---

## Frontend Architecture (FSD)

Location: `sokoul-desktop/src/`

```
app       ← bootstrap only, no business logic
↓
pages     ← route-level compositions, no logic
↓
widgets   ← complex UI blocks (features + entities combined)
↓
features  ← single isolated user interaction
↓
entities  ← business objects + their UI
↓
shared    ← generic reusable primitives, no business logic
```

### Import Law — Absolute Rule

Each layer may import **only from layers below it**.

```
app → pages → widgets → features → entities → shared
```

```typescript
// ❌ FORBIDDEN — sideways import
import { usePlayer } from '@/features/player'   // inside catalog feature

// ✅ CORRECT
import { useStreamUrl } from '@/entities/stream'
```

### Public API Rule

Every slice exposes its public API through `index.ts` only.

```typescript
// ❌ FORBIDDEN
import { MovieCard } from '@/entities/movie/components/MovieCard'

// ✅ CORRECT
import { MovieCard } from '@/entities/movie'
```

### Feature Slice Structure

```
features/catalog/
├── index.ts       ← public API only
├── components/    ← UI specific to this feature
├── hooks/         ← state logic + data fetching
├── model/         ← types, constants, zod schemas
└── __tests__/     ← co-located unit tests
```

---

## Electron Process Boundaries

```
Main Process    ← filesystem, IPC, tray, native dialogs
Renderer Process ← React UI only — no Node APIs
```

```typescript
// ❌ FORBIDDEN in renderer
import fs from 'fs'
const { ipcRenderer } = require('electron')

// ✅ CORRECT
const data = await window.electronAPI.readFile(path)
```

All system access must go through the **preload bridge**.

---

## Backend Architecture

Location: `sokoul-backend/src/`

```
routes/       ← HTTP binding only
↓
handlers/     ← parse · validate · shape response  (≤ 80 lines)
↓
services/     ← all business logic
↓
repositories/ ← SQL queries only (sqlx macros)
↓
SQLite
```

| Layer           | Hard rule                                  |
|-----------------|--------------------------------------------|
| `routes/`       | No logic — routing only                    |
| `handlers/`     | No business logic · ≤ 80 lines             |
| `services/`     | No SQL queries                             |
| `repositories/` | SQL only · no logic · no `unwrap()`        |

```rust
// ❌ FORBIDDEN — SQL in handler + unwrap
async fn get_catalog(State(db): State<Pool<Sqlite>>) -> impl IntoResponse {
    let rows = sqlx::query!("SELECT * FROM movies").fetch_all(&db).await.unwrap();
    Json(rows)
}

// ✅ CORRECT
async fn get_catalog(
    State(state): State<AppState>
) -> Result<Json<Vec<MovieResponse>>, AppError> {
    let movies = state.catalog_service.get_all().await?;
    Ok(Json(movies))
}
```

---

## Naming Conventions

All identifiers must be in **English only**. French is forbidden.

| Context            | Convention       | Example               |
|--------------------|------------------|-----------------------|
| TS variables       | camelCase        | `streamingUrl`        |
| TS functions       | camelCase        | `getMovieDetails`     |
| React components   | PascalCase       | `MovieCard`           |
| TS types           | PascalCase       | `StreamConfig`        |
| TS constants       | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`     |
| File names         | kebab-case       | `movie-card.tsx`      |
| Rust functions     | snake_case       | `get_catalog_items`   |
| Rust structs       | PascalCase       | `MovieResponse`       |
| Env variables      | UPPER_SNAKE_CASE | `SOKOUL_API_BASE_URL` |

```typescript
// ❌ FORBIDDEN
const comedie = movies.filter(m => m.genre === 'comedy')

// ✅ CORRECT
const comedies = movies.filter(m => m.genre === 'comedy')
```

---

## Type Safety

```typescript
// ❌ FORBIDDEN
function parse(data: any) { ... }
const movie = response as Movie

// ✅ CORRECT
function parse(data: unknown): Movie { return MovieSchema.parse(data) }
```

All exported functions must declare return types explicitly.

```rust
// ❌ FORBIDDEN
let conn = pool.acquire().await.unwrap();

// ✅ CORRECT
let conn = pool.acquire().await.map_err(AppError::DatabaseError)?;
```

---

## UI State Handling

Every async operation must handle all four states:

```typescript
// ❌ FORBIDDEN — missing states
const movies = await catalogService.getAll()
return <MovieList movies={movies} />

// ✅ CORRECT
if (isLoading)      return <MovieListSkeleton />
if (error)          return <ErrorState message={error.message} onRetry={refetch} />
if (!movies.length) return <EmptyState label={t('catalog.empty')} />
return <MovieList movies={movies} />
```

---

## i18n Rules

No hardcoded user-visible strings anywhere in components.

```typescript
// ❌ FORBIDDEN
<p>Aucun contenu trouvé</p>
<button>Voir plus</button>

// ✅ CORRECT
<p>{t('catalog.empty')}</p>
<button>{t('common.showMore')}</button>
```

Key format: `<slice>.<key>` — e.g. `catalog.trending` · `player.error.stream`

---

## Logging Rules

```typescript
// ❌ FORBIDDEN in production
console.log('data:', movies)

// ✅ ALLOWED — dev only
if (import.meta.env.DEV) console.debug('[catalog]', movies.length)
```

```rust
// ❌ FORBIDDEN
println!("response: {:?}", response);

// ✅ CORRECT — structured logging
tracing::debug!(count = movies.len(), "catalog loaded");
```

---

## Performance Rules

```typescript
// ❌ FORBIDDEN — recomputed every render
const sorted = movies.sort(...)
const handleClick = () => onSelect(...)

// ✅ CORRECT
const sorted      = useMemo(() => [...movies].sort(...), [movies])
const handleClick = useCallback(() => onSelect(...), [onSelect])
```

```rust
// ❌ FORBIDDEN — N+1 pattern
for movie in &movies {
    let artwork = db.get_artwork(movie.id).await?;
}

// ✅ CORRECT — batch fetch
let artworks = repository.get_artworks_by_ids(&ids).await?;
```

---

## Testing Rules

```typescript
// ❌ FORBIDDEN — testing implementation details
expect(component.state.isLoading).toBe(true)

// ✅ CORRECT — testing observable behavior
expect(screen.getByTestId('catalog-skeleton')).toBeInTheDocument()
```

File placement:
- Frontend → `features/catalog/__tests__/useCatalog.test.ts`
- Backend → inline `#[cfg(test)]` block in service file
- E2E → `e2e/` at repo root

---

## File Size Limits

| File type         | Limit     | Action                  |
|-------------------|-----------|-------------------------|
| React component   | 200 lines | Extract sub-components  |
| Custom hook       | 150 lines | Split by responsibility |
| Rust handler      | 80 lines  | Delegate to service     |
| Rust service      | 300 lines | Split by domain         |
| Rust repository   | 400 lines | Split by entity         |

---

## Dependency Policy

Before any `npm install` or `cargo add`, verify:

1. Not already available in the project
2. Actively maintained (last commit < 6 months)
3. No known CVEs (`npm audit` / `cargo audit`)
4. Bundle size acceptable (check bundlephobia.com)

**All dependency additions require explicit user approval.**

---

## Git Commit Rules

One commit = one logical change.

```bash
feat(catalog):    add trending rail
fix(player):      handle stream timeout
refactor(shared): extract duration formatter
test(catalog):    add loading state coverage
chore(deps):      update axum to 0.7.5
```

Never commit: real `.env` values · `console.log` · failing builds.

---

## Decision Tree

```
UI rendering logic?
  └─ YES → features/<name>/components/

Reusable stateless function?
  └─ YES → shared/lib/

Single user interaction?
  └─ YES → features/<name>/

Business entity (Movie, Stream, User)?
  └─ YES → entities/<name>/

Global app state?
  └─ YES → stores/

Page-level composition?
  └─ YES → pages/

Still unsure?
  └─ STOP. Explain. Do not guess.
```

---

## Recovery Procedure

If your change breaks the build:

```bash
# Frontend
cd sokoul-desktop && npx tsc --noEmit 2>&1 | head -50

# Backend
cd sokoul-backend && cargo check 2>&1 | head -50
```

If not resolved in **2 targeted attempts** → `git diff`, report the error, ask the user.
Never attempt random fixes.

---

## Final Rule

> If the correct architectural decision is unclear — **STOP**.
> Explain the problem and ask for guidance.
>
> Architecture mistakes are harder to fix than missing features.
> **Integrity first. Speed second.**
