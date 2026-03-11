---
description: Redesign the SOKOUL detail page as a cinematic entertainment universe
---

# SOKOUL Detail Page — Cinematic Redesign v3

## Mission

Transform `features/detail/` into an **immersive entertainment universe**.
Not a data page. Not a minimal page. A **cinematic experience** where every viewport
contains something beautiful, interactive, and alive.

North stars: Disney+ richness · Apple TV+ restraint · IMDb depth · Letterboxd culture · Netflix interactions.

Target: a page that makes the user feel they've entered the world of the show.

---

## Pre-flight — Read before touching any file

1. Read `CLAUDE.md` — coding standards, guardrails, session limits
2. Read `KNOWN_PATTERNS.md` — patterns to preserve
3. Read `shared/types/index.ts` — MediaDetail type (source of truth for available data)
4. Read `features/detail/` entirely — understand what exists before adding anything
5. Read `globals.css` and `tailwind.config.*` — available tokens

**Anti-hallucination rule**: never render a field that doesn't exist in the type system.
If a section needs unavailable data → render with `isComingSoon={true}`.
`isComingSoon` sections: visible, `opacity-60`, "Coming soon" badge, non-interactive.
Never hide. Never fake data.

---

## Agents — Parallel execution

| Agent | Responsibility | Priority files |
|---|---|---|
| **nova** | All layout, Tailwind, primitives, sections | `features/detail/**`, `shared/components/ui/**`, `globals.css` |
| **helios** | Trailer, episode play, poster preview video | Playback hooks, MPV IPC |
| **atlas** | Type extensions if new fields needed | `shared/types/index.ts`, `models.rs` |
| **oracle** | Tests for new hooks and state transitions | `tests/**` |

Conflict rule: **nova** has priority on all `.tsx` layout files.
**helios** has priority on anything touching playback, MPV, or video preview.
If both need the same file → helios defers UI styling to nova.

Session guardrail: max 10 files per commit, max 300 lines.
If scope exceeds limit → split: sections 1–9 first, then 10–17.

---

## Color System — Update `globals.css`

```css
:root {
  --color-bg:          #0B1026;
  --color-surface:     #121A35;
  --color-surface-2:   #1A2444;
  --color-border:      rgba(255,255,255,0.08);
  --color-muted:       rgba(255,255,255,0.45);
  --color-text:        rgba(255,255,255,0.92);
  --color-accent:      #2B8CFF;
  --color-accent-2:    #7A5CFF;

  /* Depth system — 3 layers */
  --depth-base:        0 2px 8px rgba(0,0,0,0.2);
  --depth-surface:     0 10px 30px rgba(0,0,0,0.35);
  --depth-elevated:    0 20px 60px rgba(0,0,0,0.55);
  --depth-accent-glow: 0 10px 30px rgba(43,140,255,0.35);
}
```

Gradient signature:
```css
background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
```

**Rule**: zero hex values in components. Always CSS variables.
Depth usage:
- `--depth-base` → page-level elements
- `--depth-surface` → cards, panels at rest
- `--depth-elevated` → hover states, modals, focused cards

---

## Typography System — Mandatory

Every component must use this scale. No improvisation.

```
Display XL  → text-7xl  font-semibold tracking-tight  Clash Display  (hero title)
Display L   → text-6xl  font-semibold tracking-tight  Clash Display  (feature title)
Display M   → text-5xl  font-semibold tracking-tight  Clash Display  (large heading)
Section     → text-3xl  font-semibold tracking-tight  Clash Display  (SectionHeader)
Card Title  → text-lg   font-medium                   Plus Jakarta Sans
Body        → text-sm   font-normal   leading-6       Plus Jakarta Sans
Meta        → text-xs   font-normal                   Plus Jakarta Sans  color: var(--color-muted)
Label       → text-xs   uppercase tracking-widest     Plus Jakarta Sans  color: var(--color-muted)
```

**Rule: max 3 font sizes per section.**
If a section uses more than 3 sizes → simplify hierarchy, don't add more variants.
Minimum size: 14px (text-sm). Never smaller.

---

## Spacing System — Strict Scale

```
Allowed: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96
Tailwind: p-1 p-2 p-3 p-4 p-6 p-8 p-12 p-16 p-24
```

Never use arbitrary values (`p-[18px]`, `mb-5`, `gap-7`).
When in doubt: more space, not less.

---

## Micro Interaction Rules — Every interactive element

Every clickable, hoverable, or focusable element must provide feedback:

| Interaction | Effect |
|---|---|
| hover | `scale(1.02–1.05)` depending on element size |
| press | `active:scale-[0.97]` |
| focus | `ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-black` |
| loading | shimmer animation |
| active/selected | accent glow or accent border |

Base class for all interactive elements:
```
transition-all duration-200 active:scale-[0.97]
```

No interactive element is allowed to be visually static.

---

## Section Rhythm Rule

Sections must alternate between **dense** and **visual** types.
Dense sections are information-heavy. Visual sections are media-heavy.

```
1  Hero              → visual
2  Watch Progress    → dense
3  Stats             → dense
4  Trailer           → visual
5  Story World       → dense
6  Episode Explorer  → visual
7  Characters        → visual
8  Universe Map      → visual
9  Soundtrack        → dense
10 Awards            → dense
11 Behind the Scenes → visual
12 Reviews           → dense
13 Gallery           → visual
14 Cultural Impact   → dense
15 Trivia            → visual
16 Production        → dense
17 Recommendations   → visual
```

If two consecutive sections have the same type → change one's layout to rebalance.
This prevents visual fatigue across a long scroll.

---

## Image Strategy

All images must follow this standard:

- Format: **WebP** preferred, JPG fallback (`<source type="image/webp">` + `<img>` fallback)
- `sizes` attribute required on every `<img>` — never omit
- `loading="lazy"` on all images below the fold
- Aspect ratio container required — never raw `<img>` without wrapper (prevents CLS)
- Shimmer plays during load, removed on `onLoad`

```tsx
// Standard image pattern
<picture>
  <source srcSet={`${src}.webp`} type="image/webp" />
  <img
    src={`${src}.jpg`}
    alt={alt}
    loading="lazy"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="w-full h-full object-cover opacity-0 transition-opacity duration-300"
    onLoad={(e) => {
      e.currentTarget.classList.remove("opacity-0")
      e.currentTarget.closest(".shimmer")?.classList.remove("shimmer")
    }}
  />
</picture>
```

---

## Poster Card Standard

Every poster card on the page (rails, cast, gallery, recommendations) must include:

```tsx
// Mandatory fields — never omit any
<PosterCard
  poster={media.posterPath}    // 2:3 WebP
  title={media.title}          // max 2 lines, ellipsis
  year={media.year}            // text-xs meta
  rating={media.rating}        // ⭐ X.X format
  onPlay={() => ...}           // helios domain
  onPreview={() => ...}        // 800ms hover → trailer
/>
```

Hover overlay (slides up from bottom, never fades):
```
bg-gradient-to-t from-black/90 to-transparent
title + year + ⭐ rating
[▶ Play] button
translateY(100%→0) 250ms ease-out
```

Poster glow on hover:
```
hover:shadow-[0_10px_40px_rgba(43,140,255,0.25)]
```

---

## UI Primitives — Create in `shared/components/ui/`

Mandatory. Every section uses these. No custom one-off styles.

### `GlassPanel.tsx`
```tsx
export function GlassPanel({ children, className = "" }: {
  children: React.ReactNode; className?: string
}) {
  return (
    <div className={`
      rounded-2xl bg-[var(--color-surface)]
      border border-[var(--color-border)]
      backdrop-blur-sm shadow-[var(--depth-surface)]
      transition-all duration-300
      hover:shadow-[var(--depth-elevated)]
      hover:border-[rgba(255,255,255,0.12)]
      ${className}
    `}>
      {children}
    </div>
  )
}
```

### `SectionHeader.tsx`
```tsx
export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] font-[Clash_Display]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[var(--color-muted)] mt-2 max-w-2xl leading-6">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
```

### `CinematicButton.tsx`
```tsx
type Variant = "primary" | "secondary" | "ghost"
export function CinematicButton({ children, variant = "primary", onClick }: {
  children: React.ReactNode; variant?: Variant; onClick?: () => void
}) {
  const styles: Record<Variant, string> = {
    primary: `
      bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]
      text-white shadow-lg
      hover:shadow-[var(--depth-accent-glow)] hover:scale-[1.04]
    `,
    secondary: `
      bg-[var(--color-surface-2)] border border-[var(--color-border)]
      text-[var(--color-text)]
      hover:border-[rgba(255,255,255,0.2)] hover:scale-[1.02]
    `,
    ghost: `
      bg-transparent text-[var(--color-muted)]
      hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]
    `
  }
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-xl font-medium
        transition-all duration-200 active:scale-[0.97]
        ${styles[variant]}
      `}
    >
      {children}
    </button>
  )
}
```

### `ScrollReveal.tsx`
```tsx
export function ScrollReveal({ children, delay = 0 }: {
  children: React.ReactNode; delay?: number
}) {
  const prefersReducedMotion = useReducedMotion()
  if (prefersReducedMotion) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}
```

### `SkeletonShimmer.tsx`
```tsx
export function SkeletonShimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />
}
```

---

## Cinematic Effects — Add to `globals.css`

```css
/* Hero atmospheric glow */
.hero-glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(43,140,255,0.35), transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(122,92,255,0.25), transparent 40%);
  filter: blur(120px);
  pointer-events: none;
  z-index: 1;
}

/* Section ambient atmosphere — add to every section */
.section-atmosphere {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 10% 20%, rgba(43,140,255,0.15), transparent 40%),
    radial-gradient(circle at 90% 10%, rgba(122,92,255,0.12), transparent 40%);
  filter: blur(120px);
  opacity: 0.6;
  pointer-events: none;
}

/* Hero cinematic vignette */
.hero-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.75));
  pointer-events: none;
  z-index: 2;
}

/* Hero gradient — bottom fade */
.hero-gradient {
  position: absolute; bottom: 0; left: 0; right: 0; height: 60%;
  background: linear-gradient(to top, var(--color-bg) 0%, rgba(11,16,38,0.8) 50%, transparent 100%);
  pointer-events: none;
  z-index: 3;
}

/* Shimmer loading */
@keyframes shimmer {
  0%   { background-position: -200% 0 }
  100% { background-position:  200% 0 }
}
.shimmer {
  background: linear-gradient(
    90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Cinematic breathing backdrop */
@keyframes cinematic-breathe {
  from { transform: scale(1.08) }
  to   { transform: scale(1.0)  }
}
.backdrop-breathe {
  animation: cinematic-breathe 8s linear forwards;
}

/* Waveform — soundtrack section */
@keyframes wave {
  0%, 100% { height: 4px }
  50%       { height: 20px }
}

/* Trophy shimmer */
@keyframes trophy-shimmer {
  0%   { filter: brightness(1) }
  50%  { filter: brightness(1.6) drop-shadow(0 0 8px rgba(255,215,0,0.6)) }
  100% { filter: brightness(1) }
}
```

Section wrapper pattern (use in every section except Hero):
```tsx
<section className="relative px-16 py-16">
  <div className="section-atmosphere" />
  <div className="relative z-10">
    {/* section content */}
  </div>
</section>
```

---

## File Structure

```
features/detail/
├── components/
│   ├── DetailHeader.tsx              ← Navigation context
│   ├── sections/
│   │   ├── HeroExperience.tsx        ← 1  visual
│   │   ├── WatchProgress.tsx         ← 2  dense  (conditional)
│   │   ├── UniverseStats.tsx         ← 3  dense
│   │   ├── TrailerExperience.tsx     ← 4  visual
│   │   ├── StoryWorld.tsx            ← 5  dense
│   │   ├── EpisodeExplorer.tsx       ← 6  visual  (series only)
│   │   ├── CharacterUniverse.tsx     ← 7  visual
│   │   ├── UniverseMap.tsx           ← 8  visual  (series, isComingSoon)
│   │   ├── SoundtrackExperience.tsx  ← 9  dense   (isComingSoon if no data)
│   │   ├── AwardsLegacy.tsx          ← 10 dense   (isComingSoon if no data)
│   │   ├── BehindTheScenes.tsx       ← 11 visual  (isComingSoon if no data)
│   │   ├── Reviews.tsx               ← 12 dense
│   │   ├── GalleryExperience.tsx     ← 13 visual
│   │   ├── CulturalImpact.tsx        ← 14 dense   (isComingSoon if no data)
│   │   ├── TriviaFacts.tsx           ← 15 visual  (isComingSoon if no data)
│   │   ├── ProductionDetails.tsx     ← 16 dense
│   │   └── RecommendationEngine.tsx  ← 17 visual
│   └── DetailPage.tsx               ← Orchestrator, lazy-loads all
├── hooks/
│   └── useDetailPlayback.ts         ← helios domain, do not touch
└── index.ts
```

All sections lazy-loaded: `React.lazy` + `Suspense` + matching skeleton.
All sections (except Hero) wrapped in `<ScrollReveal>`.

---

## Section 0 — DetailHeader

Fixed or sticky at top of page. Appears above the Hero.

```
[ CONTAINER — position:absolute top-0 left-0 right-0 px-16 py-6 z-20 ]
  flex row items-center justify-between

  LEFT:
    ← Back button (ghost, text-sm)
    breadcrumb: Home / Series / Grey's Anatomy
    separator: / text-[var(--color-border)]
    each crumb: text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]

  RIGHT:
    + Watchlist button (ghost)
    Share button (ghost, icon only, aria-label="Share")
    Rate button (ghost, icon only, aria-label="Rate this title")

Background: transparent → bg-[var(--color-bg)/80] backdrop-blur-md
on scroll > 100px (smooth transition, 300ms)
```

This gives the page spatial context — the user knows where they are.

---

## Section 1 — HeroExperience (visual)

```
[ BACKDROP — full viewport height, object-cover, relative overflow-hidden ]
  .backdrop-breathe
  .hero-glow
  .hero-vignette
  .hero-gradient

[ CONTENT — absolute bottom-0 px-16 pb-16 z-10 ]
  tagline — Label style, var(--color-accent), mb-3
  title   — Display L (text-6xl) Clash Display, mb-4
  chips   — flex row gap-3 mb-6:
    [ ⭐ 8.7 ] [ 🎬 2005 ] [ 📺 19 seasons ] [ Medical Drama ] [ ABC ]
    chip: px-3 py-1 rounded-full bg-[var(--color-surface)]/80
          border border-[var(--color-border)] text-xs backdrop-blur-sm
  buttons — flex row gap-3:
    <CinematicButton variant="primary">▶ Play</CinematicButton>
    <CinematicButton variant="secondary">◉ Trailer</CinematicButton>
    <CinematicButton variant="ghost">+ Watchlist</CinematicButton>
    <CinematicButton variant="ghost">☆ Rate</CinematicButton>
```

Parallax scroll:
```tsx
const { scrollY } = useScroll()
const y = useTransform(scrollY, , [0, -240])
// Apply to backdrop wrapper div only
```

Hover on ▶ Play → helios triggers silent muted trailer (800ms delay).

---

## Section 2 — WatchProgress (dense, conditional)

Render only if `watchHistory` contains this media.

```
[ FULL-WIDTH GlassPanel px-8 py-6 ]
  flex row items-center gap-6

  thumbnail: aspect-video w-24 rounded-lg overflow-hidden (poster)
  info:
    Label: "Continue watching"
    title — Card Title style
    "S3 E7 · 23 min remaining" — Meta style
  progress:
    w-full h-1 rounded-full bg-[var(--color-border)]
    inner: w-[42%] bg-[var(--color-accent)] h-full rounded-full
           transition-all duration-500 (animate width on mount)
  button: <CinematicButton variant="primary">▶ Resume</CinematicButton>
```

---

## Section 3 — UniverseStats (dense)

```
[ HORIZONTAL STRIP — flex row gap-4 overflow-x-auto scrollbar-none ]
  Stat cards (GlassPanel px-6 py-5 min-w-[140px] flex-shrink-0):
    icon — text-2xl mb-2
    value — Display M (text-5xl) Clash Display (count-up animation)
    label — Label style

Count-up animation:
  0 → value, 1.2s easeOut, on viewport enter, once
  Skip if prefersReducedMotion

Stagger: 0.06s between cards
```

Stats: ⭐ rating · 📺 seasons · 🎬 episodes · 🏆 awards · 📅 run years.
Skip any stat not available in type.

---

## Section 4 — TrailerExperience (visual)

```
[ VIDEO CONTAINER — aspect-video rounded-2xl overflow-hidden GlassPanel ]
  helios handles player internals
  nova styles wrapper only

[ BELOW — flex row gap-8 mt-6 ]
  LEFT (60%): synopsis excerpt, 4 lines, "Read more ↓" expands (AnimatePresence)
  RIGHT (40%): duration · release · views (Meta style, space-y-2)
```

Autoplay muted when 50% of section enters viewport. Never autoplay with sound.

---

## Section 5 — StoryWorld (dense)

```
[ TWO COLUMNS gap-12 ]
  LEFT (60%):
    SectionHeader title="Story"
    Synopsis (expandable after 4 lines)
    Tone tags: [ Dark ] [ Medical ] [ Romance ]
      tag: px-3 py-1 rounded-full border border-[var(--color-border)]
           text-xs bg-[var(--color-surface-2)]

  RIGHT (40%):
    SectionHeader title="Themes"
    Theme list space-y-3:
      each: flex items-center gap-2
        dot: w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]
        text: Body style

[ BOTTOM full-width — series only ]
  SectionHeader title="Story Arc"
  Interactive timeline:
    horizontal line + dots at key seasons
    active dot: scale(1.4) accent color glow
    click → AnimatePresence card (y:-10→0, opacity:0→1, 300ms)
```

---

## Section 6 — EpisodeExplorer (visual, series only)

```
[ SPOTLIGHT — GlassPanel flex row ]
  left 40%: backdrop 16:9 rounded-xl — hover:scale(1.02)
  right 60% px-8:
    Label: "Now Spotlighting"
    episode title — Section style (text-3xl)
    S·E metadata — Meta style
    synopsis — 3 lines expandable
    progress bar if partially watched
    <CinematicButton>▶ Play Episode</CinematicButton>

[ SEASON SELECTOR — mt-8 flex row gap-2 ]
  active pill: bg-[var(--color-accent)] text-white
  inactive: GlassPanel text-[var(--color-muted)]
  transition-all 200ms

[ EPISODE GRID — mt-6 ]
  Cards: aspect-video rounded-xl overflow-hidden group
  hover overlay slides up:
    translateY(100%→0) 250ms ease-out
    title + duration + [▶ Play]
  poster glow: hover:shadow-[0_10px_40px_rgba(43,140,255,0.25)]
```

Virtualize if > 24 episodes: `@tanstack/react-virtual`.

---

## Section 7 — CharacterUniverse (visual)

```
[ PORTRAIT GRID — grid cols-2 sm:cols-3 lg:cols-5 gap-4 ]
  Card group:
    aspect-[2/3] rounded-xl overflow-hidden .shimmer
      image: w-full h-full object-cover (WebP + onLoad pattern)
      hover: scale(1.04) 200ms
      hover:shadow-[var(--depth-elevated)]

    hover overlay slides up:
      translateY(100%→0) 250ms
      bg-gradient-to-t from-black/90
      bio 2 lines — text-xs
      "143 episodes" — text-xs var(--color-accent)
      "View filmography →" — text-xs underline

    below portrait:
      actor name — Card Title style mt-2
      character name — Meta style
```

Virtualize if > 20 cast members.

---

## Section 8 — UniverseMap (visual, series only, isComingSoon)

```
[ GlassPanel p-8 ]
  SectionHeader title="Character Universe"

  SVG relationship graph:
    central node: show title (large)
    branch nodes: main characters (medium)
    leaf nodes: relationships (small)

    node: rounded-full bg-[var(--color-surface-2)]
          border border-[var(--color-accent)/30] px-3 py-2 text-xs text-center
    hover node: border-[var(--color-accent)] shadow-[var(--depth-accent-glow)]
    connection lines: SVG stroke var(--color-border) strokeWidth 1

    click node → AnimatePresence panel with key episodes
```

---

## Section 9 — SoundtrackExperience (dense)

```
[ TRACK LIST space-y-2 ]
  Track row (GlassPanel px-4 py-3 group):
    flex row items-center gap-4
    number — text-sm var(--color-muted) w-6
    info:
      title — Body style font-medium
      artist · episode — Meta style mt-0.5
    waveform (opacity-0 → opacity-100 on hover/active):
      5 bars, each: w-1 rounded-full bg-[var(--color-accent)]
      animation: wave, stagger 0.1s per bar
    streaming icons — opacity-60 hover:opacity-100 transition 200ms
    [ ▶ ] preview — hover:scale(1.1) 200ms
```

---

## Section 10 — AwardsLegacy (dense)

```
[ AWARD GROUPS space-y-8 ]
  Group:
    flex row items-center gap-3 mb-4:
      trophy icon — text-2xl, .trophy-shimmer on viewport enter
      award name — Section style Clash Display
    Award rows space-y-2:
      flex row: year w-16 Meta · category Body · winner badge
```

Trophy shimmer: `animation: trophy-shimmer 2s ease-in-out 1` on viewport enter.

---

## Section 11 — BehindTheScenes (visual)

```
[ CARD GRID grid cols-2 lg:cols-3 gap-4 ]
  Flip card (perspective-1000):
    FRONT:
      image aspect-video (WebP)
      category badge: [ Interview ] [ Set Photo ] [ Story ]
      title — Card Title style

    BACK (rotateY 180deg on hover, 400ms):
      GlassPanel h-full p-6
      title — Card Title style
      description — Body style line-clamp-4
      date — Meta style mt-auto

    .flip-card { transform-style: preserve-3d }
    .flip-card:hover .flip-inner { transform: rotateY(180deg) }
```

---

## Section 12 — Reviews (dense)

```
[ CRITIC REVIEWS — horizontal scroll scrollbar-none ]
  Editorial cards (GlassPanel min-w-[280px] p-6):
    stars ★★★★★ text-[var(--color-accent)] mb-3
    quote — text-sm italic leading-6 line-clamp-3 mb-4
    divider border-t border-[var(--color-border)] pt-3
    critic — Body style font-medium
    publication + date — Meta style

[ DIVIDER my-8 border-t border-[var(--color-border)] ]

[ AUDIENCE REVIEWS — horizontal scroll scrollbar-none ]
  Compact cards (GlassPanel min-w-[240px] p-4):
    flex row: avatar w-8 h-8 rounded-full + username + score
    comment — text-xs var(--color-muted) line-clamp-2 mt-2
```

Empty state: always `<EmptyState>`. Never hide section.

---

## Section 13 — GalleryExperience (visual)

```
[ TABS mb-6 — [ All ] [ Scenes ] [ Posters ] [ Behind the scenes ] ]
  active: bg-[var(--color-accent)] text-white
  inactive: GlassPanel

[ CSS MASONRY GRID ]
  columns: 3; column-gap: 12px;
  each item: break-inside-avoid mb-3

  Image card rounded-xl overflow-hidden:
    WebP + onLoad pattern
    hover: scale(1.03) shadow-[var(--depth-elevated)] 200ms
    click → lightbox

[ LIGHTBOX — AnimatePresence fixed inset-0 ]
  backdrop: bg-black/90 backdrop-blur-sm
  image: centered max-w-5xl rounded-2xl
  opacity:0→1 scale:0.95→1 300ms
  navigation: ← → keyboard + buttons
  close: Escape + × button
```

---

## Section 14 — CulturalImpact (dense, isComingSoon if no data)

Editorial section giving cultural depth to the work.

```
[ TWO COLUMNS gap-8 ]
  LEFT — Score cards (GlassPanel p-6):
    IMDb — rating + rank
    Rotten Tomatoes — tomatometer + audience score
    Each: icon + large score (Display M) + label (Meta)

  RIGHT — Memorable quotes:
    Quote card (GlassPanel p-6 italic):
      opening quote mark — text-6xl var(--color-accent)/20 leading-none
      quote — Body style italic leading-6
      — character, episode (Meta style mt-3)

[ BOTTOM — Memorable moments rail ]
  horizontal scroll of scene cards (16:9, GlassPanel)
  caption below each card — Body style
```

---

## Section 15 — TriviaFacts (visual)

```
[ FLIP CARD GRID grid cols-2 lg:cols-3 gap-4 ]
  Card:
    FRONT (GlassPanel p-6 text-center):
      icon text-3xl mb-3
      Label: "Did you know?"

    BACK (rotateY 180deg on hover, 400ms):
      GlassPanel p-6
      trivia — Body style line-clamp-4
      source — Meta style mt-auto
```

---

## Section 16 — ProductionDetails (dense)

```
[ TWO-COLUMN DEFINITION LIST gap-x-16 gap-y-4 ]
  label: Label style
  value: Body style font-medium

  Fields:
    Creator · Studio · Network · Original Run
    Production Companies · Budget · Filming Locations

  Location tags: px-2 py-1 rounded-md bg-[var(--color-surface-2)]
                 text-xs border border-[var(--color-border)]
```

Clean editorial type hierarchy. No cards, no GlassPanel. Restraint is the design.

---

## Section 17 — RecommendationEngine (visual)

```
Rail 1: "More like this"           ← same genre + tone
Rail 2: "From the same creator"    ← by creator
Rail 3: "Trending now"             ← platform trending

Standard horizontal scroll, px-8, gap-3, scrollbar-none
Poster cards using PosterCard standard (title + year + rating mandatory)
helios handles trailer preview on 800ms hover
```

---

## Poster Preview — Universal Feature

On every poster card throughout the page:

```tsx
const [showPreview, setShowPreview] = useState(false)
const hoverTimer = useRef<NodeJS.Timeout>()

const handleMouseEnter = () => {
  hoverTimer.current = setTimeout(() => setShowPreview(true), 800)
}
const handleMouseLeave = () => {
  clearTimeout(hoverTimer.current)
  setShowPreview(false)
}
```

When `showPreview`: poster opacity 0, video fades in (muted autoplay, loop).
helios implements video logic. nova styles wrapper and transition.

---

## Stagger Grid Animation

Apply to every grid (stats, cast, episodes, trivia, gallery):

```tsx
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}
const item = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
}
// viewport: { once: true }
// Skip if prefersReducedMotion
```

---

## Performance Constraints

- Every section lazy-loaded: `React.lazy` + `Suspense` + skeleton
- Episode grid > 24 → `@tanstack/react-virtual`
- Cast grid > 20 → `@tanstack/react-virtual`
- Gallery: CSS masonry only — no JS layout
- `backdrop-filter: blur` — max 2 elements simultaneously
- `will-change: transform` — only on per-hover animated elements
- Never nested `backdrop-filter`
- All `whileInView` → `viewport: { once: true }`
- WebP + `sizes` required on every image

---

## Self-Improvement Protocol

After each section, nova checks:

1. **Visual Density** — focal + interactive + animated element present?
2. **Rhythm Rule** — dense/visual alternation respected?
3. **Typography** — max 3 font sizes used?
4. **Spacing** — only strict scale values?
5. **Primitives** — GlassPanel / SectionHeader / CinematicButton used?
6. **Colors** — zero hex values?
7. **Micro interactions** — every interactive element has feedback?
8. **Image pattern** — WebP + aspect container + shimmer?

If any check fails → fix before moving to next section.

After all sections, nova produces:

```
[NOVA] Visual Quality Score

Section              | H  | Sp | Ty | Mo | Co | /50
HeroExperience       | /10|/10 |/10 |/10 |/10 | /50
WatchProgress        | /10|/10 |/10 |/10 |/10 | /50
...
Page Total                                     /850

Minimum passing: 745/850 (87.5%)
Below 745 → identify lowest sections, fix before reporting done.
```

Dimensions: H=Hierarchy · Sp=Spacing · Ty=Typography · Mo=Motion · Co=Consistency

---

## Forbidden

- `features/player/**` — helios domain
- Backend code — vulcan domain
- Hex colors in components — CSS variables only
- Arbitrary spacing — strict scale only
- Multiple spinners simultaneously on screen
- Stack trace or error code visible to user
- `navigate()` state — use `playbackStore` (Zustand)
- `parseTorrentName()` — never touch
- Raw `<img>` without aspect ratio container
- Images without `sizes` attribute
- Animating `width`, `height`, `top`, `left`

---

## References

- [Framer Motion scroll animations](https://motion.dev/docs/react-scroll-animations)
- [Framer Motion useInView](https://motion.dev/docs/react-animation)
- [TanStack Virtual](https://tanstack.com/virtual/latest/docs/framework/react/examples)
- [CSS masonry MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Masonry_layout)
- [WebP browser support](https://caniuse.com/webp)
- [WCAG 2.2 contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [Apple TV+ HIG](https://developer.apple.com/design/human-interface-guidelines/tvos)
- [Motion design principles](https://m3.material.io/styles/motion/overview)
- [Netflix Tech Blog — Design](https://netflixtechblog.com/tagged/design)
