# SOKOUL — Architectural Decision Records

## ADR-001: HashRouter over BrowserRouter
- **Date**: 2025-03-01
- **Context**: Electron loads the app via `file://` protocol which doesn't support HTML5 `pushState`
- **Decision**: Use `react-router-dom` `HashRouter` for all routing
- **Consequences**: URLs have `#` prefix, but routing works reliably in Electron

## ADR-002: Zustand for client state, React Query for server state
- **Date**: 2025-03-01
- **Context**: Need clear separation between local UI state and remote data
- **Decision**: Zustand stores for profiles, preferences, UI state. React Query for API data.
- **Consequences**: Stores never make API calls directly; fetching is done in hooks with React Query

## ADR-003: Dual-window architecture for MPV
- **Date**: 2025-03-01
- **Context**: MPV renders via `--wid` into the main window, but UI controls need to overlay
- **Decision**: Two Electron windows — main (MPV render target) + transparent overlay (controls)
- **Consequences**: State sync via `BroadcastChannel`, GPU acceleration disabled for `--wid` compatibility

## ADR-004: Kids filter via genre exclusion (fail-open)
- **Date**: 2026-03-11
- **Context**: Kids profile needs to filter inappropriate content without a content rating API
- **Decision**: Exclude TMDB genre IDs: Horror(27), Crime(80), War(10752), Thriller(53), Romance(10749). Fail-open: if no genre data, include the content.
- **Consequences**: False negatives possible for content without genre tags. 7 entry points filter content.

## ADR-005: QueryErrorState component for all query errors
- **Date**: 2026-03-11
- **Context**: 17/19 React Query calls had no error UI — silent failures everywhere
- **Decision**: Centralized `QueryErrorState` component with full and compact variants
- **Consequences**: Full variant for page-level errors, compact for inline sections. Non-critical queries (fanart, trakt) absorb errors silently.

## ADR-006: parseTorrentName is immutable
- **Date**: 2025-03-01
- **Context**: Torrent title parser is battle-tested with known quality values
- **Decision**: Never modify `parseTorrentName()`. Adapt around it with pre-parsing via `useMemo`.
- **Consequences**: Any new quality/codec support must be added downstream, not in the parser itself.

## ADR-008: Migration reset — consolidate 13 files into one
- **Date**: 2026-03-11
- **Context**: Over 13 incremental migrations accumulated during development, including table renames (`playback_history` → `playback_entries`), column additions via `ALTER TABLE`, and a full table rebuild for the `UNIQUE` constraint change on `playback_entries`. No production users exist — all data is dev/test.
- **Decision**: Delete all 13 migration files and replace with a single `20260311000000_initial_schema.sql` that creates the final schema from scratch. 11 tables: `metas`, `episodes`, `streams`, `settings`, `fanart_logos`, `profiles`, `playback_entries`, `user_lists`, `list_items`, `profile_preferences`, `user_progress`, `artwork_cache`. All foreign keys and indexes are explicitly named.
- **Consequences**: 
  - Any existing dev databases must be deleted and recreated
  - `.sqlx/` cache must be regenerated via `cargo sqlx prepare`
  - Future migrations follow immutable append-only rule (ADR in atlas.md)
  - Migration Reset Policy added to `.claude/agents/atlas.md`
