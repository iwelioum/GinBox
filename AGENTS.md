# SOKOUL — AGENTS.md

This file defines specialized AI agents responsible for improving the Sokoul codebase.

Agents must operate in **analysis-first mode**:
they analyze, critique, and propose improvements before implementing changes.

All agents must follow the global rules defined below.

---

# PRODUCT CONTEXT

Sokoul is a **desktop streaming application** for personal media libraries.

The goal is to provide a **premium streaming experience** comparable to Netflix, Apple TV, and Disney+.

**Target users:** movie enthusiasts, Plex/Jellyfin power users, desktop users (Mac / Windows).

---

# TECH STACK

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 |
| Language | TypeScript (strict) |
| Styling | TailwindCSS |
| Animation | Framer Motion |
| Data fetching | React Query |
| Runtime | Electron |
| Backend | Rust (Axum) + SQLite |
| Media APIs | TMDB, Fanart, OMDB |
| Player | MPV via Electron IPC |

**Principles:** Strong typing · Separation of concerns · Clean architecture · UI component reuse · Performance first

---

# DESIGN PHILOSOPHY

The interface must feel like a **professional streaming platform**.

Priorities (in order):
1. Clear visual hierarchy
2. Strong focus on posters and artwork
3. Smooth, purposeful navigation
4. Clean typography (Plus Jakarta Sans + Clash Display)
5. High readability in dark mode
6. Consistent spacing and layout
7. Fluid, non-intrusive animations

---

# GLOBAL RULES

All agents must respect the following rules without exception.

## 1. ANALYZE BEFORE MODIFYING
Agents must first understand the existing architecture, analyze the component structure, and identify problems. **Do not modify code blindly.**

## 2. SMALL CHANGES FIRST
Prefer targeted improvements over massive rewrites. Only propose large refactors when strictly necessary. One file at a time. Wait for explicit validation before continuing.

## 3. STRICT TYPES
```typescript
// ❌ Forbidden
const data: any = fetch(...)
// ✅ Required
const data: ContentItem[] = fetch(...)
```

## 4. FILE SIZE LIMITS
Components must not exceed **300 lines**. If larger → split into focused sub-components.

## 5. SEPARATION OF CONCERNS
Never mix UI, business logic, and data fetching in the same component.
```
features/catalog/
  components/   ← UI only
  hooks/        ← business logic
  api/          ← data fetching
```

## 6. REUSE BEFORE CREATING
Search for an existing component before creating a new one.

## 7. NO HARD-CODED VALUES
```typescript
// ❌ Forbidden
style={{ color: "#6c63ff", borderRadius: "12px" }}
// ✅ Required
className="text-accent rounded-md"  // or var(--color-accent)
```

## 8. CONSISTENT NAMING
| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ContentCard` |
| Hooks | useCamelCase | `useSearchHistory` |
| Functions | camelCase | `handlePlayPause` |
| Constants | UPPER_CASE | `DEFAULT_VOLUME` |
| CSS tokens | kebab-case | `--color-accent` |

## 9. PERFORMANCE FIRST
Watch for: unnecessary re-renders · heavy unoptimized components · missing lazy loading · unkeyed lists.

## 10. RESPONSE FORMAT
Every agent response must follow this structure:

```
### Analysis
What exists and how it works.

### Issues
- Issue 1 (severity: 🔴/🟠/🟡)
- Issue 2

### Solution
What will be changed and why.

### Code Diff
\`\`\`diff
- old code
+ new code
\`\`\`
```

---

# SPRINT 1 — ARCHITECTURE REVIEW

**Agent: Architecture Auditor**

Review the entire project structure. Do not modify code. Produce a report only.

Evaluate:
- Folder organization and separation of concerns
- Dependency structure and module boundaries
- Oversized components (>300 lines)
- Circular dependencies
- Misplaced files (UI logic in pages, fetching in components, etc.)

Output format:
```
## Architecture Report

### Structure Grade: X/10

### Issues Found
| File | Problem | Severity |
|------|---------|----------|

### Recommendations
1. ...
```

---

# SPRINT 2 — CODE QUALITY

**Agent: Code Quality Reviewer**

Audit the codebase without modifying it. Produce a full report.

Look for:
- Dead code and unused imports
- Duplicated logic across components
- TODO / FIXME / console.log remaining
- Inconsistent naming (violating conventions above)
- Missing or incorrect TypeScript types
- Components exceeding 300 lines

Output: table per file with issue, line number, severity, and fix suggestion.

---

# SPRINT 3 — UX / DESIGN REVIEW

**Agent: UX Critic**

Analyze the interface as a senior product designer at Netflix. **Do NOT implement changes yet.**

For every page, evaluate:
- Layout clarity and visual hierarchy
- Typography usage and readability
- Spacing consistency
- Usability and discoverability
- Comparison with Netflix / Apple TV+ / Disney+

Output per page:
```
## [PageName]
**Score:** X/10
**Benchmark:** [closest reference and gap]

### What works
### What doesn't
### Recommendation
```

---

# SPRINT 4 — UI CONSISTENCY

**Agent: UI Consistency Checker**

Ensure the UI is visually consistent across the entire application.

Check across all components:
- Spacing scale (only multiples of 4px)
- Typography scale (matches `--text-*` tokens)
- Border radius (only `--radius-sm/md/lg/xl/pill`)
- Color usage (only `var(--color-*)`, no hardcoded hex)
- Hover states (every interactive element has one)
- Focus states (`:focus-visible` visible on all focusable elements)
- Icon sizes (consistent 16/20/24px grid)

Output: inconsistency table + tokens.css patch if needed.

---

# SPRINT 5 — ARTWORK & POSTERS

**Agent: Artwork Specialist**

Optimize display of all media artwork throughout the app.

Check every image usage:
- Poster aspect ratio → must be `aspect-[2/3]`
- Landscape/backdrop → must be `aspect-video`
- Logo → max-height constrained, no distortion
- Resolution → prefer TMDB `w500` for cards, `original` for hero
- Fallback chain → Fanart → TMDB → local placeholder (no broken images)
- Loading → skeleton `animate-pulse` before image loads
- Alt text → every `<img>` has descriptive alt

Output: per-component audit table + diff for each issue found.

---

# SPRINT 6 — PERFORMANCE

**Agent: Performance Engineer**

Analyze and optimize application performance.

Analyze:
- React re-renders (missing `memo`, `useCallback`, `useMemo`)
- Heavy components loading synchronously (should be `lazy()`)
- Large image payloads (wrong TMDB size param)
- Inefficient hooks (missing dependency arrays, recreated objects)
- React Query config (staleTime, cacheTime per data type)

Propose improvements with measured or estimated impact.

Output:
```
## Performance Report

### Critical (fix immediately)
### Medium (next sprint)
### Low (backlog)
```

---

# SPRINT 7 — POLISH

**Agent: UI Polish Specialist**

Make the interface feel premium and alive.

Focus on:
- Micro-animations on cards (scale, shadow on hover)
- Loading transitions (skeleton → content with fade)
- Empty states (meaningful, branded, not generic)
- Smooth page navigation (AnimatePresence route transitions)
- HeroBanner auto-advance progress bar
- ContentRail scroll arrows (opacity 0→1 on hover)
- Player overlay auto-hide (3s timeout)

For each item: current state → target state → Framer Motion implementation.

---

# SPRINT 8 — ACCESSIBILITY

**Agent: Accessibility Reviewer**

Ensure the application is usable by everyone.

Check WCAG 2.1 AA compliance:
- Keyboard navigation (Tab order, no traps)
- Focus indicators visible (`:focus-visible` with `--color-accent` outline)
- ARIA attributes (`aria-label`, `aria-checked`, `role="switch"`, `alt` on images)
- Color contrast (minimum 4.5:1 for body text, 3:1 for large text)
- `@media (prefers-reduced-motion: reduce)` in globals.css
- Screen reader compatibility (semantic HTML, landmarks)

Output: WCAG audit table per file + mandatory fixes sorted by severity.

---

# MANDATORY CHECKLIST

Before marking any task complete, agents must verify:

- [ ] No `console.log` remains
- [ ] All types are explicit (no `any`)
- [ ] Components are under 300 lines
- [ ] All hard-coded values replaced with tokens
- [ ] Naming conventions respected
- [ ] UI visually consistent with existing pages
- [ ] No regressions introduced

---

# LEARNED RULES (from agent sessions)

## Session 0-1 — Foundation
- "Never pass Function/Map/Set in `navigate()` state — structuredClone crashes"
- "`parseTorrentName()` returns quality values: '2160p','1080p','720p','480p','4K','4k','UHD' — do not invent others"
- "All backend providers already run in parallel via `tokio::join!` in stream.rs"
- "PreferencesStore uses localStorage (`sokoul_stream_preferences`), NOT backend preferences.rs"
- "Profile.id is `number`, not string"

## Session 2 — Component Splits
- "Components > 300 lines must be split into sub-components with focused responsibilities"
- "MPV speed control: `window.mpv.command({ command: ['set_property', 'speed', rate] })`"
- "All icon-only buttons in ControlsBar require `aria-label` — always add when creating new ones"

## Session 3 — Performance & Consistency
- "`parseTorrentName()` must ALWAYS be wrapped in `useMemo([source.title])` — it's an expensive regex parser"
- "EmptyState from `shared/components/ui` is the standard — never use inline div empty states"
- "Spinner from `shared/components/ui` is the standard — never create custom CSS spinners"
- "Kids filter uses genre_ids (fail-open: no genres = include). Applied in: HomePage, BrowsePage, SearchPage, useHomePersonalized"
- "`useKidsFilter<T>()` hook wraps profileStore.isKids for reusability"

## Session 4 — i18n & Cleanup
- "All UI text must use `t()` from react-i18next — no hardcoded English/French strings"
- "Error handling must use toast() from useToast — never console.error for user-facing errors"
- "Fanart queries have `staleTime: Infinity` — this is correct, fanart data never changes"
- "Type-only re-exports (e.g. `BadgeProps`) should not be in barrel index.ts unless consumed externally"

## Session 5 — Error Handling & Kids Filter
- "Every React Query must destructure `isError` + `error` + `refetch` — use `QueryErrorState` component for error UI"
- "QueryErrorState has two variants: full (page-level) and compact (inline/card-level). Use `compact={true}` for sections inside pages"
- "Non-critical queries (fanart, trakt stats, HoverCard meta) can absorb errors silently — just destructure `isError` for future use"
- "useBrowseData returns `isError` + `refetch` — aggregates error state from multiple `useQueries` results"
- "Kids filter entry points (7 total): HomePage, useHomePersonalized, useBrowseData, SearchPage, ActorPage, CollectionDetailPage, SimilarSection"
- "Replace custom Spinner divs with Skeleton variant grids for page-level loading — use `animate-pulse` pattern from DetailSkeleton"
- "CollectionsPage uses `useInfiniteQuery` — error is typed `unknown`, must cast to `Error`"
- "i18n error keys live in `error.queryFailed` and `error.retry` — reuse them, don't create new ones"
