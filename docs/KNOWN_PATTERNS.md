# SOKOUL — KNOWN_PATTERNS.md

> Recurring patterns and anti-patterns discovered through development.
> Add new entries after each session.

---

## Validated Patterns

### Accordéon CSS (grid-rows animation)
```tsx
<div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
  <div className="overflow-hidden">
    {/* content */}
  </div>
</div>
```
**Used in:** SourcePanel.tsx, SourcesSidebar.tsx

### Provider badge styling
```tsx
// Torrentio
<span className="bg-[#1a1a2e] text-[#7c6aff] text-[10px] uppercase px-1.5 py-0.5 rounded">Torrentio</span>
// Prowlarr
<span className="bg-[#1a2a1a] text-[#4ade80] text-[10px] uppercase px-1.5 py-0.5 rounded">Prowlarr</span>
// Wastream
<span className="bg-[#2a1a10] text-[#fb923c] text-[10px] uppercase px-1.5 py-0.5 rounded">Wastream</span>
```
**Used in:** SourceBadges.tsx, sourcePanelHelpers.tsx

### Pre-parsing torrent titles (performance)
```tsx
const parsedSources = useMemo(() =>
  sources.map(s => ({ source: s, meta: parseTorrentName(s.title) })),
[sources]);
```
**Why:** `parseTorrentName()` is regex-heavy. Call once per source list change,
not per-render in filtering/sorting/display.
**Used in:** useSourceFiltering.ts

### Single unified useEffect for dependent state
```tsx
useEffect(() => {
  if (!isSeries) return;
  // 1. Check history first
  if (historyFetched && lastProgressEpisode) { ... return; }
  // 2. Then validate season
  if (seasons.length && !seasons.includes(selectedSeason)) { ... return; }
  // 3. Then validate episode
  if (episodesOfSeason.length && !episodesOfSeason.find(...)) { ... }
}, [isSeries, historyFetched, lastProgressEpisode, seasons, episodesOfSeason]);
```
**Why:** Multiple separate useEffects for related state cause race conditions.
**Used in:** useDetailData.ts

### Lazy loading non-critical sections
```tsx
const GallerySection = React.lazy(() => import('./GallerySection'));
// ...
<Suspense fallback={<div className="animate-pulse h-40 bg-white/5 rounded-xl" />}>
  <GallerySection />
</Suspense>
```
**Used in:** DetailPage.tsx (6 sections lazy-loaded)

### Component file splitting (300-line rule)
When a component exceeds 300 lines, extract into sibling files:
- `homeRailsConfig.ts` — config data extracted from HomePage.tsx
- `settingsWidgets.tsx` — sub-components extracted from SettingsPage.tsx
- `sourcePanelHelpers.tsx` — helpers + SourceCard extracted from SourcePanel.tsx

---

## Anti-Patterns (DO NOT use)

### ❌ Functions in navigate() state
```tsx
// WRONG — structuredClone will crash
navigate('/player', { state: { goToNext: () => {...} } });

// CORRECT — pass plain data, reconstruct functions on arrival
navigate('/player', { state: { episodes: [...] } });
// In PlayerPage: rebuild goToNext from episodes array
```

### ❌ parseTorrentName() called per render
```tsx
// WRONG — called inside JSX map, runs on every render
{sources.map(s => {
  const meta = parseTorrentName(s.title); // ← expensive, repeated
  return <SourceCard meta={meta} />;
})}

// CORRECT — memoize the parsed list
const parsed = useMemo(() => sources.map(...), [sources]);
```

### ❌ Multiple useEffects for related state
```tsx
// WRONG — race condition between effects
useEffect(() => { if (!selectedSeason) setSeason(seasons[0]); }, [seasons]);
useEffect(() => { if (!selectedEpisode) setEpisode(episodes[0]); }, [episodes]);

// CORRECT — single unified effect with priorities (see Validated Patterns)
```

### ❌ typeof with optional chaining
```tsx
// WRONG — TypeScript syntax error
item?.videos as unknown as typeof item?.episodes

// CORRECT — use the explicit type name
item?.videos as unknown as EpisodeVideo[] | undefined
```

### ❌ Hardcoded hex colors in component styles
```tsx
// WRONG
style={{ color: "#6c63ff" }}

// CORRECT — use CSS variables or Tailwind classes
className="text-[var(--color-accent)]"
// Exception: genre theming in genreTheme.ts (intentional per-genre colors)
```
