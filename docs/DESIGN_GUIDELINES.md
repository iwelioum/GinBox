# SOKOUL — DESIGN_GUIDELINES.md

> This file is the single source of truth for all visual decisions in Sokoul.
> Every AI agent and every developer must follow these guidelines.
> Last updated: 2026-03-09

---

## Design Vision

Sokoul must feel like a **premium dark streaming platform**.

Reference: Disney+ (luminous, vibrant) × Apple TV+ (editorial, clean) × Infuse (artwork-first).

The interface exists to **get out of the way of the content**.
Posters and artwork are the heroes. UI is the frame.

---

## Color System

All colors must use CSS tokens. No hardcoded hex values in components.

```css
/* src/styles/tokens.css */
:root {
  /* Backgrounds */
  --color-bg:           #0a0a0f;   /* Page background */
  --color-bg-elevated:  #14141b;   /* Cards, panels */
  --color-bg-card:      #1a1a24;   /* Hover states */
  --color-bg-overlay:   rgba(10, 10, 15, 0.85);

  /* Accent */
  --color-accent:       #6c63ff;   /* Primary CTA, active states */
  --color-accent-hover: #8b85ff;
  --color-accent-muted: rgba(108, 99, 255, 0.15);

  /* Text */
  --color-text:         #ffffff;
  --color-text-muted:   rgba(255, 255, 255, 0.60);
  --color-text-subtle:  rgba(255, 255, 255, 0.35);

  /* Surfaces */
  --color-border:       rgba(255, 255, 255, 0.08);
  --color-glass:        rgba(0, 0, 0, 0.40);
  --color-glass-light:  rgba(255, 255, 255, 0.04);
}
```

### Color usage rules

| Situation | Token |
|-----------|-------|
| Page background | `--color-bg` |
| Card / panel | `--color-bg-elevated` |
| Primary button, active dot, progress | `--color-accent` |
| Body text | `--color-text` |
| Secondary text (metadata, labels) | `--color-text-muted` |
| Placeholder, disabled | `--color-text-subtle` |
| Dividers, card borders | `--color-border` |
| Overlays on images | `--color-glass` |

**Never use:** `#e50914` (Netflix red) anywhere in Sokoul.

---

## Typography

```css
:root {
  --font-display: "Clash Display", sans-serif;   /* Hero titles, section headers */
  --font-ui:      "Plus Jakarta Sans", sans-serif; /* All UI text */
  --font-mono:    "JetBrains Mono", monospace;    /* Technical info (quality badges, timestamps) */

  /* Scale */
  --text-hero:    clamp(2rem, 5vw, 4rem);         /* Hero banner title */
  --text-display: clamp(1.5rem, 3vw, 2.5rem);     /* Page titles */
  --text-title:   clamp(1.125rem, 2vw, 1.5rem);   /* Section headers */
  --text-body:    1rem;                            /* Default text */
  --text-small:   0.875rem;                        /* Metadata, labels */
  --text-xs:      0.75rem;                         /* Badges, timestamps */
}
```

### Typography rules

- **Clash Display** → hero titles, featured section headers only
- **Plus Jakarta Sans** → everything else
- **Line clamping** → always clamp card titles (`line-clamp-2`), synopsis (`line-clamp-3`)
- **Never use system fonts** for content titles

---

## Spacing

All spacing must be multiples of **4px**.

```css
:root {
  --spacing-page:  calc(3.5vw + 24px);  /* Horizontal page padding */
  --spacing-rail:  1.5rem;              /* Gap between rails */
  --spacing-card:  0.75rem;             /* Gap between cards in a rail */
  --spacing-section: 3rem;             /* Gap between major sections */
}
```

### Spacing rules

| Element | Value |
|---------|-------|
| Page horizontal padding | `var(--spacing-page)` |
| Between rails | `24px` minimum |
| Card gap in rail | `12px` |
| Button padding | `12px 20px` |
| Badge padding | `4px 8px` |

---

## Border Radius

```css
:root {
  --radius-sm:   6px;     /* Badges, small chips */
  --radius-md:   10px;    /* Cards, inputs */
  --radius-lg:   16px;    /* Modals, large panels */
  --radius-xl:   24px;    /* Hero sections */
  --radius-pill: 9999px;  /* Pills, dots, avatar */
}
```

**Rule:** Never use arbitrary values like `rounded-[9px]`. Always use a token.

---

## Transitions & Animation

```css
:root {
  --transition-fast:  150ms ease;  /* Hover states */
  --transition-base:  200ms ease;  /* Most interactions */
  --transition-slow:  300ms ease;  /* Panel open/close */
  --transition-xslow: 600ms ease;  /* Page transitions */
}
```

### Animation rules

| Interaction | Duration | Easing |
|------------|----------|--------|
| Button hover | 150ms | ease |
| Card hover scale | 200ms | ease-out |
| Panel/modal open | 300ms | ease-out |
| Page transition | 200ms in / 150ms out | ease |
| Hero auto-advance | 25 000ms | linear (progress bar) |
| Skeleton fade | 200ms | ease |

**Framer Motion variants to reuse:**

```typescript
// Card entrance (stagger in ContentRail)
export const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
}

// Page transition
export const pageVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.2 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

// Overlay auto-hide (player)
export const overlayVariants = {
  visible: { opacity: 1 },
  hidden:  { opacity: 0, transition: { duration: 0.2 } },
}
```

**Always add `@media (prefers-reduced-motion: reduce)` in globals.css.**

---

## Component Patterns

### ContentCard

- Aspect ratio: `aspect-[2/3]` (portrait) · `aspect-video` (landscape)
- Image: lazy load + skeleton before load + descriptive `alt`
- Title overlay: always visible gradient bottom, not hover-only
- Hover: `scale(1.04)` + shadow elevation — max 200ms

### ContentRail

- Header: title left + "Voir tout →" right (when `seeMoreHref` provided)
- Scroll arrows: `ChevronLeft` / `ChevronRight` — visible on rail hover only
- Scroll behavior: `scrollBy({ left: ±600, behavior: "smooth" })`
- Stagger entrance: cards animate in with 50ms delay between each

### HeroBanner

- Height: `65vh`, `min-height: 520px`
- Image position: `object-position: center 20%`
- 3 gradient layers: left (content overlay) · bottom (page transition) · top (vignette)
- Dots: active dot expands to `22px` width (pill shape)
- Progress bar: 2px height, `var(--color-accent)` fill, Framer Motion `duration=cycleMs/1000`

### Navbar

- Transparent at top → `backdrop-blur-md bg-black/40` after 50px scroll
- Search shortcut hint: `⌘K` visible on desktop
- Active route: `var(--color-accent)` underline or text color

### Player Overlay

- Auto-hide: 3s after last mouse movement (reset on `mousemove`)
- Always visible when paused
- Top bar: Back · Title + Episode · Quality badge
- Bottom bar: Timeline · Play · ±10s · Volume · Subtitles · Audio · Fullscreen
- Backgrounds: `bg-gradient-to-b from-black/60` (top) · `bg-gradient-to-t from-black/60` (bottom)

---

## Imagery

### TMDB Image sizes by context

| Context | Size param | Example |
|---------|-----------|---------|
| ContentCard poster | `w342` | `/t/p/w342/{path}` |
| ContentRail landscape | `w500` | `/t/p/w500/{path}` |
| HeroBanner backdrop | `original` | `/t/p/original/{path}` |
| DetailPage hero | `original` | `/t/p/original/{path}` |
| Actor thumbnail | `w185` | `/t/p/w185/{path}` |

### Fallback chain

```
1. Fanart.tv (logo, clearart, background)
2. TMDB (poster, backdrop, still)
3. Local placeholder (branded, not broken image icon)
```

### Rules

- Never stretch or distort artwork
- Always preserve aspect ratio with `object-fit: cover`
- Skeleton placeholder must match exact dimensions of the final image

---

## Accessibility Baseline

Every component must meet these minimums:

- `<img>` → always has descriptive `alt`
- `<button>` icon-only → always has `aria-label`
- `role="switch"` → always has `aria-label` + `aria-checked`
- `<input>` → always has `<label>` or `aria-label`
- Focus indicator → `outline: 2px solid var(--color-accent); outline-offset: 2px`
- `prefers-reduced-motion` → respected globally in `globals.css`
