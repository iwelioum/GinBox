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
