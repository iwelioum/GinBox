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
