# Session 5 — 2026-03-11

## Context
- Sessions completed: 0–4
- Previous session: aria-labels, i18n KIND_LABELS, toast error handling, cleanup
- Focus: P0 query error states, P3 skeleton loading, kids filter expansion

## What was implemented

| File | Modification | Reason |
|------|-------------|--------|
| `shared/components/ui/QueryErrorState.tsx` | **Created** — full + compact error UI component | Standardize error handling across 17+ queries |
| `shared/components/ui/index.ts` | Added QueryErrorState + props export | Barrel export for reuse |
| `shared/i18n/locales/en.json` | Added `error.queryFailed`, `error.retry` | i18n support |
| `shared/i18n/locales/fr.json` | Added `error.queryFailed`, `error.retry` | i18n support |
| `features/search/SearchPage.tsx` | Spinner→Skeleton, +QueryErrorState, +isError/refetch | Error + skeleton |
| `features/catalog/ProfileSelectPage.tsx` | +QueryErrorState, +isError/refetch | Error handling |
| `features/catalog/CollectionsPage.tsx` | Spinner→Skeleton, +QueryErrorState, +isError/refetch | Error + skeleton |
| `features/detail/SourcesPage.tsx` | +QueryErrorState for meta query error | Error handling |
| `features/catalog/ActorPage.tsx` | Spinner→Skeleton, +QueryErrorState, +useKidsFilter | Error + skeleton + kids |
| `features/catalog/BrowsePage.tsx` | +QueryErrorState, +isError/refetch from hook | Error handling |
| `features/catalog/useBrowseData.ts` | Added `isError` + `refetch` to interface + return | Hook API extension |
| `features/catalog/CollectionDetailPage.tsx` | Spinner→Skeleton, +QueryErrorState, +useKidsFilter | Error + skeleton + kids |
| `features/detail/SimilarSection.tsx` | +useKidsFilter, filterForKids on items | Kids filter |
| `features/catalog/EditorialCard.tsx` | Destructure `isError` from fanart query | Silent error awareness |
| `features/catalog/HoverCard.tsx` | Destructure `isError` from meta query | Silent error awareness |
| `features/detail/StatsSection.tsx` | Destructure `isError` from trakt query | Silent error awareness |

**Total: 16 files modified/created, 1 new component**

## Architectural decisions

### QueryErrorState design
- **Full variant** (default): WifiOff SVG icon + translated title + error.message + retry Button. Used for page-level failures.
- **Compact variant** (`compact=true`): Inline flex row with warning icon + truncated message + retry link. Designed for in-page sections.
- Non-critical queries (fanart, trakt, HoverCard meta) absorb errors silently — they destructure `isError` for monitoring but show no error UI because the parent component works without the data.

### useBrowseData hook extension
Added `isError: boolean` and `refetch: () => void` to the hook's return type. `isError` is computed as `results.some(r => r.isError)` from the parallel `useQueries`. `refetch` calls `r.refetch()` on all query results. This avoids exposing the internal query structure to BrowsePage.

### Kids filter — all 7 entry points
| # | Location | Pattern | What it filters |
|---|----------|---------|----------------|
| 1 | HomePage (line 115) | `filterForKids(deduplicated)` | Rail items |
| 2 | useHomePersonalized | `filterForKids()` on 3 arrays | Continue watching, recently added, because-you-watched |
| 3 | useBrowseData (line 123) | `filterForKids(deduped)` | All browsed items |
| 4 | SearchPage | `filterForKids(trending)` + `filterForKids(allMetas)` | Search results + suggestions |
| 5 | ActorPage | `filterForKids(data?.metas ?? [])` | Actor filmography |
| 6 | CollectionDetailPage | `filterForKids(data.parts ?? [])` → `filteredParts` | Collection movies |
| 7 | SimilarSection | `filterForKids(items ?? []).slice(0, 8)` | Similar content rail |

**If adding a new entry point** (e.g., GenrePage): import `useKidsFilter`, call `filterForKids()` on the content array before rendering.

### Skeleton loading strategy
- Page-level loading: replace Spinner/custom-spinner-div with a grid of `animate-pulse` divs matching the expected layout
- SearchPage: 10-item poster grid (`aspect-[2/3]`)
- ActorPage: profile circle + filmography poster rail
- CollectionsPage: 6-item landscape grid (`aspect-[21/9]`)
- CollectionDetailPage: title skeleton + 8-item poster grid
- SourcesPage: kept Spinner (loading is for active stream search, not page load)

## Rules added to AGENTS.md
1. Every React Query must destructure `isError` + `error` + `refetch` — use QueryErrorState
2. QueryErrorState has full and compact variants
3. Non-critical queries can absorb errors silently
4. useBrowseData returns `isError` + `refetch`
5. Kids filter has 7 entry points (listed above)
6. Replace custom Spinner divs with Skeleton grids for page-level loading
7. CollectionsPage uses `useInfiniteQuery` — cast error to `Error`
8. i18n error keys: `error.queryFailed` and `error.retry`

## Score de complétion

### Query error handling: 12/19 → was 2/19
| Page/Component | Status |
|----------------|--------|
| DetailPage | ✅ Had error handling |
| ActorPage | ✅ Session 5 |
| SearchPage | ✅ Session 5 |
| ProfileSelectPage | ✅ Session 5 |
| CollectionsPage | ✅ Session 5 |
| CollectionDetailPage | ✅ Session 5 |
| SourcesPage (meta) | ✅ Session 5 |
| BrowsePage | ✅ Session 5 |
| HoverCard | ✅ Silent (non-critical) |
| EditorialCard | ✅ Silent (non-critical) |
| StatsSection | ✅ Silent (non-critical) |
| HomePage | ⬜ Rails absorb errors via React Query defaults |
| SettingsPage | ⬜ No query — reads from store |
| PlayerPage | ⬜ Errors handled by mpv-manager events |
| SourcePanel | ⬜ Errors from useSourceFiltering (custom hook) |
| ProfilePage | ⬜ Needs review |
| useHomePersonalized | ⬜ 3 queries without error UI |
| DetailEpisodes | ⬜ Inherits from DetailPage |

### Kids filter: 7/7 entry points covered ✅

### Skeleton loading: 5/6 pages with skeletons
- ✅ DetailPage (DetailSkeleton), SearchPage, ActorPage, CollectionsPage, CollectionDetailPage
- ⬜ HomePage (uses rail-level loading, no page skeleton needed)

### Technical debt remaining
| Area | Status | Impact |
|------|--------|--------|
| Virtualization (SourcePanel > 50 items) | ⬜ Not implemented | Medium — rare to exceed 50 after filters |
| React Query staleTime tuning | ⬜ Not standardized | Low — defaults work acceptably |
| Lazy loading DetailPage sections | ⬜ Not implemented | Medium — first load has 5 non-critical sections |
| Toast integration for playback events | ⬜ Under-utilized | Low — system exists, needs wiring |

## TODO for next session (prioritized)
- [ ] P1: SourcePanel provider filter tabs (Phase 3 Feature 1 — most requested)
- [ ] P1: SettingsPage expansion (Sources, Real-Debrid, Data sections)
- [ ] P2: Lazy load non-critical DetailPage sections (Suspense boundaries)
- [ ] P2: React Query staleTime standardization per data type
- [ ] P2: Toast integration for playback lifecycle events
- [ ] P3: HoverCard trailer autoplay (YouTube iframe on hover)
- [ ] P3: Homepage personalized rails (continue watching, top rated)
