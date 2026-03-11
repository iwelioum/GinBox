---
description: Run a full SOKOUL audit session with all specialized agents working in parallel
---

Run a complete SOKOUL audit session. Follow this exact workflow:

## Phase 0 — Context Scan (do this FIRST)

Before any audit, read and summarize:
- `CLAUDE.md` — project rules and constraints
- `ARCHITECTURE.md` — system design
- `KNOWN_PATTERNS.md` — established patterns to preserve
- `docs/TECH_DEBT.md` — existing debt (don't re-report already known issues)
- `docs/DECISIONS.md` — past architectural decisions

Output a one-paragraph system understanding summary before proceeding.
This step **reduces hallucinations** and prevents re-proposing already-rejected solutions.

## Phase 1 — Parallel Audit (spawn simultaneously)

- **atlas**: Audit type coherence between `shared/types/` and `sokoul-backend/src/models.rs`. Check duplicates, missing fields, migration needs. Verify no existing migration is broken.
- **helios**: Audit player pipeline. Check error handling in SourcePanel, PlayerPage. Verify `goToNextEpisode` doesn't use navigate() state. Check timeouts on streaming services.
- **nova**: Audit UI consistency. Check card ratios, spacing violations, hardcoded colors, missing empty states, animation compliance.
- **vulcan**: Audit backend security. Find unwrap/expect/panic. Check CORS, rate limiting, input validation, timeouts. Verify all errors return standard format.
- **sentinel**: Full security scan. Electron config, dependency audit, secret leaks, prompt injection vectors.
- **hunter**: Cross-domain bug hunt. Race conditions, async errors, memory leaks, unreachable code.
- **perf**: Performance audit. React re-renders, TanStack Query config, Rust blocking calls, streaming latency.

## Phase 2 — Triage

Collect all findings. Sort by severity:
- **P0** (security/crash) → fix immediately, this session
- **P1** (data loss/corruption) → fix this session
- **P2** (performance/UX degradation) → plan fix, add to TECH_DEBT.md
- **P3** (cleanup/refactor) → document only

Check for **domain conflicts**: if two agents want to modify the same file, the one whose primary domain it is has priority. Defer the other's request.

Check **session guardrails**: if P0+P1 fixes exceed 10 files or 300 lines, split into two sessions.

## Phase 3 — Implementation

Fix P0 and P1 issues only. For each fix:
1. State the evidence (file, line, problem)
2. Show the minimal diff
3. Confirm no interdomain conflict
4. Verify the fix doesn't break the session guardrail limits

## Phase 4 — Documentation

Use **memo** to:
- Generate session report in `docs/sessions/SESSION_YYYY-MM-DD.md`
- Update `KNOWN_PATTERNS.md` with any new patterns
- Update `TECH_DEBT.md` with P2/P3 items
- Record any architectural decisions as ADRs in `docs/DECISIONS.md`

Use **oracle** to:
- Generate tests for any new logic introduced during Phase 3

## Phase 5 — Agent Scoring

Rate each agent 0–10 on precision, security coverage, and impact. Log in session report.
- Score < 6 → note restriction for next session
- Score > 8 → note expanded scope for next session
