# SOKOUL — Documentation Index

## Navigation

| Document | Description | Owner |
|----------|-------------|-------|
| `../CLAUDE.md` | Configuration Claude Code, coding standards, guardrails | All agents |
| `../ARCHITECTURE.md` | System architecture, data flow, component diagram | atlas |
| `../KNOWN_PATTERNS.md` | Battle-tested patterns — do not break | All agents |
| `DECISIONS.md` | ADR log — why we made key decisions | atlas / memo |
| `TECH_DEBT.md` | Known debt by severity (P0→P3) | memo |
| `ERROR_CODES.md` | All API error codes and their meaning | vulcan |
| `sessions/` | Per-session audit reports | memo |

## Agents Quick Reference

| Agent | Domain | Model |
|-------|--------|-------|
| atlas | Types, models, migrations | sonnet |
| helios | Streaming, player, MPV | sonnet |
| nova | UI, design system, animations | sonnet |
| vulcan | Rust backend, Axum routes | sonnet |
| sentinel | Security audits | sonnet (read-only) |
| memo | Documentation | haiku (read-only) |
| oracle | Tests, QA, edge cases | sonnet |
| perf | Performance analysis | sonnet |
| hunter | Bug detection | sonnet |
| pipeline | Streaming pipeline tracing | sonnet |

## Commands

| Command | Purpose |
|---------|---------|
| `/session` | Full multi-agent audit + fix + docs |
| `/audit-security` | Deep security scan |
| `/sync-types` | Sync TypeScript ↔ Rust models |

## Session History

Previous sessions are documented in `sessions/` and legacy `AGENT_SESSION_*.md` files.
