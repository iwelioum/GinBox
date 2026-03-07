# Contributing to Sokoul

Thank you for contributing.
This repository follows strict engineering standards to maintain long-term stability.

> Read [AGENTS.md](./AGENTS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)
> before starting. These documents define the rules that apply to every contribution.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Local Setup](#local-setup)
4. [Git Hooks](#git-hooks)
5. [Development Workflow](#development-workflow)
6. [Branching Strategy](#branching-strategy)
7. [Commit Convention](#commit-convention)
8. [Pull Request Rules](#pull-request-rules)
9. [Code Standards](#code-standards)
10. [Architecture Rules](#architecture-rules)
11. [Testing Requirements](#testing-requirements)
12. [What NOT to Do](#what-not-to-do)

---

## Prerequisites

| Tool    | Minimum version | Check command     |
|---------|-----------------|-------------------|
| Node.js | 20+             | `node --version`  |
| pnpm    | 9+              | `pnpm --version`  |
| Rust    | stable (1.78+)  | `rustc --version` |
| Git     | 2.40+           | `git --version`   |

---

## Project Structure

```
sokoul/
├── sokoul-desktop/          ← Electron + React client
│   └── src/
│       ├── app/             ← Bootstrap: providers, router, global styles
│       ├── pages/           ← Route-level compositions (no logic)
│       ├── widgets/         ← Complex composed UI blocks
│       ├── features/        ← Isolated user interactions
│       │   ├── catalog/
│       │   ├── player/
│       │   ├── search/
│       │   └── watchlist/
│       ├── entities/        ← Business objects + their UI
│       │   ├── movie/
│       │   ├── stream/
│       │   └── user/
│       ├── shared/          ← Generic reusable primitives (no business logic)
│       │   ├── ui/
│       │   ├── api/
│       │   ├── lib/
│       │   ├── config/
│       │   └── i18n/
│       └── stores/          ← Global Zustand stores
│
├── sokoul-backend/          ← Rust + Axum API server
│   └── src/
│       ├── routes/          ← Route registration only
│       ├── handlers/        ← Request parsing + response shaping
│       ├── services/        ← Business logic
│       ├── repositories/    ← SQL queries only
│       ├── models/          ← Domain structs + API types
│       ├── errors/          ← AppError enum
│       └── config/          ← AppState + env parsing
│
├── e2e/                     ← Playwright end-to-end tests
├── docs/                    ← Extended documentation
├── scripts/                 ← Development and build scripts
├── .env.example             ← All required env variables
├── AGENTS.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
└── REPO_MAP.md
```

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/your-org/sokoul.git
cd sokoul

# 2. Frontend dependencies
cd sokoul-desktop
pnpm install

# 3. Environment variables
cp .env.example .env
# Fill in required values — see ARCHITECTURE.md for variable reference

# 4. Start backend
cd ../sokoul-backend
cargo run

# 5. Start desktop app (new terminal)
cd ../sokoul-desktop
pnpm dev
```

Verify your setup before writing any code:

```bash
# Frontend — all must pass
cd sokoul-desktop && pnpm typecheck && pnpm test && pnpm lint

# Backend — all must pass
cd sokoul-backend && cargo check && cargo clippy -- -D warnings && cargo test
```

**All commands must be green before you start.**
If any fails before your change → report it. Do not work on top of a broken state.

---

## Git Hooks

The repository uses pre-commit hooks to automatically enforce quality checks.
This blocks bad commits before they reach CI — catching ~80% of broken PRs locally.

Install them once after cloning:

```bash
# From the repo root
pnpm dlx husky install
```

### What runs automatically

**On every `git commit` (pre-commit hook):**

```bash
# Frontend — staged files only (fast)
pnpm typecheck
pnpm lint-staged   # ESLint + Prettier on staged *.ts *.tsx files

# Backend — on every commit touching .rs files
cargo fmt --check
cargo clippy -- -D warnings
```

**On every `git commit` (commit-msg hook):**

```bash
# Validates your commit message follows Conventional Commits
npx commitlint --edit
```

If a hook fails → fix the reported issue, `git add` the fix, then commit again.
Never use `git commit --no-verify` to bypass hooks unless explicitly approved.

### lint-staged configuration

```json
// sokoul-desktop/package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## Development Workflow

```
1. Pull latest main
2. Create a branch          → see Branching Strategy
3. Make your change
4. Hooks run automatically  → fix any reported issues
5. Write or update tests
6. Commit                   → see Commit Convention
7. Open a Pull Request      → see PR Rules
```

---

## Branching Strategy

| Type     | Pattern                       | Example                        |
|----------|-------------------------------|--------------------------------|
| Feature  | `feat/<scope>-<description>`  | `feat/catalog-trending-rail`   |
| Bug fix  | `fix/<scope>-<description>`   | `fix/player-stream-timeout`    |
| Refactor | `refactor/<description>`      | `refactor/shared-utils-split`  |
| Chore    | `chore/<description>`         | `chore/update-axum-0.7.5`      |
| Docs     | `docs/<description>`          | `docs/adr-004-offline-mode`    |

Rules:
- Always branch from `main`
- One feature per branch — never bundle unrelated changes
- Delete the branch after merge

---

## Commit Convention

Sokoul uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short imperative description>

[optional body — explain WHY, not WHAT]
```

### Valid types

| Type       | When to use                                |
|------------|--------------------------------------------|
| `feat`     | New user-facing feature                    |
| `fix`      | Bug fix                                    |
| `refactor` | Code change with no behavior change        |
| `test`     | Adding or updating tests only              |
| `docs`     | Documentation only                         |
| `chore`    | Tooling, deps, config — no production code |
| `perf`     | Performance improvement                    |
| `style`    | Formatting only — zero logic change        |

### Valid scopes

`catalog` · `player` · `search` · `watchlist` · `shared` ·
`entities` · `backend` · `config` · `deps` · `ci`

### Examples

```bash
feat(catalog): add trending rail with auto-scroll
fix(player): handle stream timeout with exponential retry
refactor(shared): extract duration formatter to shared/lib
test(catalog): add useCatalog empty state coverage
chore(deps): update axum to 0.7.5
perf(backend): batch artwork queries to eliminate N+1
```

---

## Pull Request Rules

### Checklist before opening a PR

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test` passes with zero failures
- [ ] `cargo clippy -- -D warnings` passes
- [ ] `cargo test` passes
- [ ] No `console.log` or `println!` in production paths
- [ ] No hardcoded UI strings — all text uses `t('key')`
- [ ] New feature includes tests (coverage ≥ 80% on new code)
- [ ] No cross-feature imports introduced
- [ ] `.env.example` updated if new env variables were added

### PR description template

```markdown
## Summary
<!-- What does this PR do? 1–3 sentences -->

## Motivation
<!-- Why is this needed? Link issue if applicable -->

## Changes
<!-- Bullet list of significant changes -->

## Testing
<!-- How was this tested? -->

## Architecture impact
<!-- Does this touch layer boundaries or API contracts? -->
```

### Review criteria

Every PR is reviewed against:

1. **FSD compliance** — no cross-feature imports, correct layer placement
2. **Type safety** — no `any`, explicit return types on exports
3. **Error handling** — loading + error + empty states on async operations
4. **Test coverage** — critical paths covered, no empty test bodies
5. **i18n compliance** — zero hardcoded user-visible strings
6. **No debug artifacts** — no `console.log`, no commented-out blocks
7. **API contract** — TypeScript types match backend response shapes

---

## Code Standards

Full rule set with examples → [`AGENTS.md`](./AGENTS.md)

### Language

All code, comments, and identifiers must be in **English only**.

```typescript
// ❌ FORBIDDEN
const comedie = movies.filter(m => m.genre === 'comedy')
function getTendances() { ... }

// ✅ CORRECT
const comedies = movies.filter(m => m.genre === 'comedy')
function getTrending() { ... }
```

### Naming conventions

| Context             | Convention       | Example               |
|---------------------|------------------|-----------------------|
| TS variables        | camelCase        | `streamingUrl`        |
| TS functions        | camelCase        | `getMovieDetails`     |
| React components    | PascalCase       | `MovieCard`           |
| TS types/interfaces | PascalCase       | `StreamConfig`        |
| TS constants        | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`     |
| File names          | kebab-case       | `movie-card.tsx`      |
| Rust functions      | snake_case       | `get_catalog_items`   |
| Rust types/structs  | PascalCase       | `MovieResponse`       |
| Env variables       | UPPER_SNAKE_CASE | `SOKOUL_API_BASE_URL` |

### File size limits

| File type       | Limit     | Action if exceeded      |
|-----------------|-----------|-------------------------|
| React component | 200 lines | Extract sub-components  |
| Custom hook     | 150 lines | Split by responsibility |
| Rust handler    | 80 lines  | Delegate to service     |
| Rust service    | 300 lines | Split by domain         |
| Rust repository | 400 lines | Split by entity         |

---

## Architecture Rules

The frontend follows **Feature-Sliced Design (FSD)**.
Features must remain strictly isolated.

### Import Law

```
app → pages → widgets → features → entities → shared
```

Each layer may only import from layers **below** it. Never sideways, never upward.

```typescript
// ❌ FORBIDDEN — feature importing from another feature
import { usePlayer } from '@/features/player'   // inside catalog feature

// ✅ CORRECT — move shared logic to entities
import { useStreamUrl } from '@/entities/stream'
```

```typescript
// ❌ FORBIDDEN — bypassing barrel file
import { MovieCard } from '@/entities/movie/components/MovieCard'

// ✅ CORRECT — always use index.ts
import { MovieCard } from '@/entities/movie'
```

```rust
// ❌ FORBIDDEN — business logic inside handler
async fn get_catalog(State(db): State<Pool<Sqlite>>) -> impl IntoResponse {
    let movies = sqlx::query!("SELECT * FROM movies")
        .fetch_all(&db).await.unwrap();
    Json(movies)
}

// ✅ CORRECT — delegate to service
async fn get_catalog(
    State(state): State<AppState>
) -> Result<Json<Vec<MovieResponse>>, AppError> {
    let movies = state.catalog_service.get_all().await?;
    Ok(Json(movies))
}
```

---

## Testing Requirements

| Scenario              | Requirement                            |
|-----------------------|----------------------------------------|
| New feature hook      | Unit test required                     |
| New service function  | Unit test required                     |
| New UI component      | Render test required (Testing Library) |
| New API route         | Handler + service test required        |
| Bug fix               | Regression test required               |

### Coverage targets

| Layer            | Target |
|------------------|--------|
| Frontend logic   | ≥ 70%  |
| Backend services | ≥ 80%  |
| Critical paths   | ≥ 90%  |

```bash
# Frontend coverage
pnpm test --coverage

# Backend coverage
cargo tarpaulin --out Html
```

---

## What NOT to Do

These will cause your PR to be rejected immediately:

```
❌ Cross-feature import       features/catalog → features/player
❌ Business logic in page     filtering/sorting inside CatalogPage
❌ Hardcoded UI string        <p>Loading...</p> instead of t('common.loading')
❌ console.log in production  even a single one
❌ println! in production     even a single one
❌ any type                   without explicit justification comment
❌ unwrap() in Rust           without a // SAFETY: comment
❌ Committing .env secrets    real API keys in source
❌ Adding dep without asking  surprise npm install or cargo add
❌ File over size limit       without splitting first
❌ PR with failing checks     typecheck or tests red
❌ Empty test body            it('should work', () => {})
❌ git commit --no-verify     bypassing hooks without approval
```

---

## Getting Help

If unsure about an architectural decision:

1. Check [`ARCHITECTURE.md`](./ARCHITECTURE.md) — flows and layer rules
2. Check [`AGENTS.md`](./AGENTS.md) — decision tree and forbidden patterns
3. Open a GitHub Discussion with the `architecture` label

**Never guess and implement the wrong pattern — ask first.**
