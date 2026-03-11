# SOKOUL — Technical Debt Tracker

## TD-001: SourcePanel virtualization
- **Severity**: P2
- **Location**: `features/detail/components/SourcePanel.tsx`
- **Impact**: Performance degrades if > 50 sources rendered without virtualization
- **Proposed fix**: Use `@tanstack/react-virtual` for windowed rendering

## TD-002: React Query staleTime standardization
- **Severity**: P2
- **Location**: Various components with `useQuery`
- **Impact**: Inconsistent caching behavior, unnecessary refetches
- **Proposed fix**: Centralize staleTime config: metadata 5min, sources 1min, playback 30s, fanart Infinity

## TD-003: Lazy loading DetailPage sections
- **Severity**: P2
- **Location**: `features/detail/components/DetailPage.tsx`
- **Impact**: 5 non-critical sections loaded eagerly on first render
- **Proposed fix**: `React.lazy()` + `Suspense` for GallerySection, TrailerSection, SagaSection, StatsSection, SimilarSection

## TD-004: Toast integration for playback events
- **Severity**: P3
- **Location**: `features/player/`, `features/detail/hooks/useDetailPlayback.ts`
- **Impact**: User gets no feedback on playback lifecycle (source selected, cached, error)
- **Proposed fix**: Wire `useToast()` into playback hooks for success/warning/error events

## TD-005: Remaining query error states
- **Severity**: P2
- **Location**: `useHomePersonalized`, `ProfilePage`, `DetailEpisodes`
- **Impact**: 7/19 queries still have no error UI
- **Proposed fix**: Apply `QueryErrorState` component to remaining pages

## TD-006: HoverCard trailer autoplay
- **Severity**: P3
- **Location**: `features/catalog/components/HoverCard.tsx`
- **Impact**: Trailers exist in data but not displayed on hover
- **Proposed fix**: YouTube iframe with muted autoplay on 600ms hover delay

## TD-007: Homepage personalized rails
- **Severity**: P2
- **Location**: `features/catalog/components/HomePage.tsx`
- **Impact**: "Continue watching" and "Top rated" rails exist in hooks but need polish
- **Proposed fix**: Wire `useHomePersonalized` rails with progress bars and resume functionality

## TD-008: Hardcoded hex colors across 19 files
- **Severity**: P2
- **Location**: Multiple: `ActorPage`, `CollectionDetailPage`, `HoverCard`, `HeroSlide`, `SourcesPage`, `StatsSection`, `LoadingFallback`, etc.
- **Impact**: 35+ instances of non-token colors violating the design system
- **Proposed fix**: Replace with `var(--color-*)` tokens; add missing tokens for rating colors (IMDB, Trakt)

## TD-009: Sub-14px font sizes across 25+ files
- **Severity**: P2
- **Location**: `CastSection`, `EpisodeCard`, `HeroSection`, `HoverCard`, `SagaSection`, `SourceCard`, `SourcesSidebar`, etc.
- **Impact**: 60+ instances of text-[10px], text-[11px], text-xs violating 14px minimum
- **Proposed fix**: Bump to minimum text-[13px] or text-sm per context

## TD-010: transition-all overuse (50+ instances)
- **Severity**: P2
- **Location**: `heroSectionParts`, `BrowseHero`, `CastSection`, `FilterDrawer`, `CollectionsPage`, etc.
- **Impact**: Animates all CSS properties, causing unnecessary repaints and violating max-3 rule
- **Proposed fix**: Replace with scoped transitions (transition-colors, transition-[transform,opacity])

## TD-011: Zustand stores subscribed without selectors (13 instances)
- **Severity**: P2
- **Location**: `useDetailData`, `useDetailPlayback`, `useSourceFiltering`, `PlayerPage`, `SourcesPage`, `SettingsPage`, `DebugPage`
- **Impact**: Full-store re-renders on any mutation; PlayerPage re-renders every 250ms during playback
- **Proposed fix**: Use selector pattern: `useProfileStore(s => s.activeProfile)` instead of full destructure

## TD-012: Sequential API calls in play flow
- **Severity**: P2
- **Location**: `SourcesPage.tsx:84-93`, `stream.rs:157-160`
- **Impact**: +1-3s per play action from sequential unrestrict+position fetch (frontend) and TMDB calls (backend)
- **Proposed fix**: `Promise.all` on frontend; `tokio::join!` for TMDB calls on backend

## TD-013: Error response format non-compliant
- **Severity**: P2
- **Location**: `sokoul-backend/src/errors.rs:67-70`
- **Impact**: Flat `{ "error": "CODE", "message": "..." }` vs documented nested format
- **Proposed fix**: Nest error format; coordinate with frontend error parsing

## TD-014: Missing React.memo on list-rendered components
- **Severity**: P2
- **Location**: `EditorialCard`, `EpisodeCard`, `HoverCard`, `HeroSlide`, `CastSection`, `SimilarSection`
- **Impact**: O(n) child re-renders in lists; only ContentCard is memoized
- **Proposed fix**: Add React.memo() with appropriate comparison functions

## TD-015: Debrid route 5-min unbounded timeout
- **Severity**: P1
- **Location**: `sokoul-backend/src/services/realdebrid.rs:476-508`
- **Impact**: Single request holds HTTP connection for up to 300s; can exhaust connection pool
- **Proposed fix**: Add Axum timeout middleware (120s) or convert to polling API

## TD-016: shell:openExternal no URL validation (Electron)
- **Severity**: P0
- **Location**: `sokoul-desktop/electron/main.js:28`
- **Impact**: Any renderer code can open arbitrary URLs (file://, smb://)
- **Proposed fix**: Add URL scheme whitelist (https, http, magnet) in IPC handler

## TD-017: unsafe-eval in production CSP (Electron)
- **Severity**: P0
- **Location**: `sokoul-desktop/electron/main.js:176`
- **Impact**: Allows eval()/new Function() in production, weakens CSP
- **Proposed fix**: Remove 'unsafe-eval' from production CSP; verify React 18 doesn't need it

## TD-018: Overlay window missing sandbox:true (Electron)
- **Severity**: P1
- **Location**: `sokoul-desktop/electron/main.js:115-119`
- **Impact**: Overlay renderer has more capabilities than necessary
- **Proposed fix**: Add `sandbox: true` to overlay webPreferences
