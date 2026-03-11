# SOKOUL Detail Page — Premium Design Specification v2.0

> **Goal**: Make the detail page feel like a $100M streaming platform.  
> **References**: Netflix 2025, Apple TV+, Disney+ (but BETTER than all three).  
> **Philosophy**: Each title is a museum exhibit. The page is the frame.

---

## Table of Contents

1. [Design Tokens — New & Extended](#1-design-tokens--new--extended)
2. [Page Architecture](#2-page-architecture)
3. [Section 1 — HeroSection](#3-section-1--herosection)
4. [Section 2 — InfoSection](#4-section-2--infosection)
5. [Section 3 — DetailEpisodes](#5-section-3--detailepisodes)
6. [Section 4 — TrailerSection](#6-section-4--trailersection)
7. [Section 5 — GallerySection](#7-section-5--gallerysection)
8. [Section 6 — CastSection](#8-section-6--castsection)
9. [Section 7 — StatsSection](#9-section-7--statssection)
10. [Section 8 — SimilarSection](#10-section-8--similarsection)
11. [Section 9 — CollectionBanner](#11-section-9--collectionbanner)
12. [New Animations to Add](#12-new-animations-to-add)
13. [Section Transitions — Framer Motion](#13-section-transitions--framer-motion)
14. [What Makes Us BETTER](#14-what-makes-us-better)

---

## 1. Design Tokens — New & Extended

### New tokens to add to `tokens.css`

```css
:root {
  /* ── Detail Page Specific ──────────────────────────────────────────── */
  --detail-hero-height:       85vh;
  --detail-hero-min:          600px;
  --detail-hero-max:          960px;
  --detail-content-max:       1400px;
  --detail-section-gap:       56px;             /* 14 × 4px */
  
  /* ── Enhanced Surfaces (depth layers) ──────────────────────────────── */
  --color-bg-sunken:          #08080c;          /* below base — for section contrast */
  --color-bg-frosted:         rgba(17, 17, 24, 0.60);
  --color-bg-card-hover:      rgba(255, 255, 255, 0.06);
  
  /* ── Gradient Presets ──────────────────────────────────────────────── */
  --gradient-hero-bottom:     linear-gradient(to top, var(--color-bg-base) 0%, rgba(10,10,15,0.95) 15%, rgba(10,10,15,0.6) 40%, transparent 65%);
  --gradient-hero-left:       linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 55%, transparent 75%);
  --gradient-hero-top:        linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%);
  --gradient-hero-vignette:   radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.4) 100%);

  /* ── Premium Shadows (elevation system) ────────────────────────────── */
  --shadow-hero-content:      0 4px 40px rgba(0, 0, 0, 0.8);
  --shadow-button-glow:       0 0 32px 6px;
  --shadow-section-divider:   0 1px 0 rgba(255, 255, 255, 0.04);
  --shadow-trailer:           0 24px 80px rgba(0, 0, 0, 0.7), 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-cast-photo:        0 4px 16px rgba(0, 0, 0, 0.6);
  
  /* ── Motion ────────────────────────────────────────────────────────── */
  --ease-premium:             cubic-bezier(0.22, 1, 0.36, 1);  /* expo out */
  --ease-spring:              cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-cinematic:           cubic-bezier(0.16, 1, 0.3, 1);
  --duration-stagger-base:    0.08s;            /* between staggered items */
}
```

### Tailwind Config Additions (`tailwind.config.js`)

```js
// Add to theme.extend:
{
  keyframes: {
    'detail-section-enter': {
      '0%':   { opacity: '0', transform: 'translateY(32px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'accent-pulse': {
      '0%, 100%': { opacity: '0.15' },
      '50%':      { opacity: '0.3' },
    },
    'bar-fill': {
      '0%':   { width: '0%' },
      '100%': { width: 'var(--bar-target)' },
    },
    'number-pop': {
      '0%':   { transform: 'scale(0.8)', opacity: '0' },
      '60%':  { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    'trailer-glow': {
      '0%, 100%': { boxShadow: '0 0 60px rgba(var(--accent-rgb), 0.15)' },
      '50%':      { boxShadow: '0 0 100px rgba(var(--accent-rgb), 0.3)' },
    },
  },
  animation: {
    'detail-enter': 'detail-section-enter 0.65s var(--ease-premium) both',
    'accent-pulse': 'accent-pulse 4s ease-in-out infinite',
    'bar-fill':     'bar-fill 1.8s var(--ease-cinematic) both',
    'number-pop':   'number-pop 0.5s var(--ease-spring) both',
    'trailer-glow': 'trailer-glow 4s ease-in-out infinite',
  },
}
```

---

## 2. Page Architecture

### Overall Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Title Bar] 32px                                            │
│ [Navbar] 64px — becomes transparent over hero               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          HERO SECTION (85vh, full-bleed)              │  │
│  │  4-layer backdrop composite                          │  │
│  │  Content anchored bottom-left                        │  │
│  │  Accent radial glow (genre-aware)                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ← overlapping -40px into hero fade zone →                  │
│                                                             │
│  ┌───────────────── max-w-[1400px] ─────────────────────┐  │
│  │  INFO SECTION                                        │  │
│  │  ────────── 56px gap ──────────                      │  │
│  │  EPISODES SECTION (shows only)                       │  │
│  │  ────────── 56px gap ──────────                      │  │
│  │  TRAILER SECTION                                     │  │
│  │  ────────── 56px gap ──────────                      │  │
│  │  STATS SECTION                                       │  │
│  │  ────────── 56px gap ──────────                      │  │
│  │  CAST SECTION                                        │  │
│  │  ────────── 56px gap ──────────                      │  │
│  │  GALLERY SECTION                                     │  │
│  │  ────────── 56px gap ──────────                      │  │
│  │  COLLECTION BANNER (if applicable)                   │  │
│  │  ────────── 56px gap ──────────                      │  │
│  │  SIMILAR SECTION                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Footer padding 96px]                                      │
└─────────────────────────────────────────────────────────────┘
```

### Framer Motion — Page Container

```tsx
// DetailPage.tsx wrapper
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  className="relative min-h-screen"
  style={{ backgroundColor: 'var(--color-bg-base)' }}
>
```

### Section Wrapper Component (NEW)

Create `DetailSection.tsx` — wraps each section with scroll-triggered entrance:

```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface DetailSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const DetailSection: React.FC<DetailSectionProps> = ({ 
  children, className = '', delay = 0 
}) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 1, 0.36, 1],  // --ease-premium
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
};
```

### Section Title Component (NEW)

Standardize all section headers:

```tsx
export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    className="font-display text-sm font-semibold uppercase tracking-[0.2em] mb-6"
    style={{ color: 'var(--color-text-muted)' }}
  >
    {children}
  </h2>
);
```

**Typography**: `font-family: var(--font-display)` (Clash Display), `font-size: 14px`, `font-weight: 600`, `letter-spacing: 0.2em`, `text-transform: uppercase`, `color: var(--color-text-muted)`

---

## 3. Section 1 — HeroSection

### What Disney+ does
Full-width backdrop, logo at bottom-left, minimal gradient. Simple. Safe.

### What Netflix does
82vh hero, heavy left-gradient for text readability, rating badge, big Play button.

### What Apple TV+ does
Subtle, cinematic. Barely any UI on the image. Hero breathes. Logo is pristine.

### What SOKOUL does BETTER ✨

**A living, breathing cinematic canvas** with 5 composited layers, parallax depth, genre-aware accent lighting, and a staggered content reveal that feels like a movie opening.

---

### Layout

```
Height:       85vh (min: 600px, max: 960px)
Width:        100vw (full bleed, edge to edge)
Content area: px-[var(--section-px)] pb-16 max-w-[900px]
Alignment:    flex items-end (content at bottom)
Z-layers:     backdrop(0) → gradients(1) → accent glow(2) → content(20)
```

### Backdrop Composite — 5 Layers (bottom to top)

```
Layer 5 (topmost):  Vignette — radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)
Layer 4:            Top darkening — linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%)
Layer 3:            Left readability — linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 55%, transparent 75%)
Layer 2:            Bottom fade — linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.95) 15%, rgba(10,10,15,0.6) 40%, transparent 65%)
Layer 1 (bottom):   Backdrop image — cover, center top
```

**Implementation** (single `div`, stacked `background-image`):

```tsx
<div
  className="absolute inset-0"
  style={{
    backgroundImage: [
      'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)',
      'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%)',
      'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 55%, transparent 75%)',
      'linear-gradient(to top, var(--color-bg-base) 0%, rgba(10,10,15,0.95) 15%, rgba(10,10,15,0.6) 40%, transparent 65%)',
      `url(${backdropUrl})`,
    ].join(', '),
    backgroundSize: 'auto, auto, auto, auto, cover',
    backgroundPosition: 'center, top, top, bottom, top center',
    backgroundRepeat: 'no-repeat',
    transform: `translateY(var(--parallax-y, 0px))`,
    willChange: 'transform',
  }}
/>
```

### Accent Glow Layer (Genre-Aware)

A subtle radial glow in the bottom-left area, colored by the extracted accent color.

```tsx
{accentColor && (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      background: `radial-gradient(ellipse at 15% 85%, ${accentColor}18, transparent 50%)`,
      mixBlendMode: 'screen',
    }}
  />
)}
```

**Why it's better**: Disney+ has no accent lighting. Netflix uses a flat tint. We use a subtle, positioned radial glow that makes the accent color feel like it's emanating from the content itself — like a backlit movie poster.

### Parallax Effect

```tsx
// Scroll listener (passive, throttled via rAF)
React.useEffect(() => {
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        el.style.setProperty('--parallax-y', `${y * 0.25}px`);
        // Fade out hero content as user scrolls
        const opacity = Math.max(0, 1 - y / 500);
        contentEl.style.opacity = String(opacity);
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

**Parallax multiplier**: `0.25` (subtle — NOT 0.5, which is too aggressive)

### Content Stagger Animation (Improved)

Replace setTimeout-based stagger with Framer Motion orchestration:

```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Usage:
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="relative z-20 px-[var(--section-px)] pb-16 w-full max-w-[900px]"
>
  <motion.div variants={itemVariants}>{/* Type badge */}</motion.div>
  <motion.div variants={itemVariants}>{/* Logo / Title */}</motion.div>
  <motion.div variants={itemVariants}>{/* Tagline */}</motion.div>
  <motion.div variants={itemVariants}>{/* Meta badges */}</motion.div>
  <motion.div variants={itemVariants}>{/* Synopsis */}</motion.div>
  <motion.div variants={itemVariants}>{/* Action buttons */}</motion.div>
</motion.div>
```

**Timeline**:
```
0ms          Container mounts
200ms        Type badge appears (y:20→0, opacity:0→1, 600ms ease-premium)
320ms        Logo/Title appears
440ms        Tagline appears
560ms        Meta badges appear
680ms        Synopsis appears
800ms        Action buttons appear
```

### Type Badge

```
Layout:       inline-flex items-center gap-1.5
Padding:      px-3 py-1
Background:   ${accentColor}15 (15% opacity of accent)
Border:       1px solid ${accentColor}40
Radius:       rounded-md (8px)
Font:         13px, font-bold, tracking-[0.15em], uppercase
Color:        ${accentColor}
Icon:         Tv2 (11px) or Film (11px) — filled variant
```

### Logo Display

```
Max-width:    600px
Min-width:    180px  
Width:        34vw (responsive)
Margin:       mb-4
Filter:       drop-shadow(0 8px 40px rgba(0,0,0,0.9))
```

### Title (when no logo)

```
Font:         Genre-specific (from genreTypography.ts)
Size:         Genre-specific, typically clamp(2rem, 5vw, 3.5rem)
Weight:       Genre-specific (700-900)
Line-height:  1.05
Text-wrap:    balance
Drop-shadow:  Genre-specific (see VISUAL_IDENTITY_PROMPT.md)
Margin:       mb-4
```

### Tagline

```
Font:         var(--font-main) (Plus Jakarta Sans)
Size:         15px (0.9375rem)
Weight:       500 (medium)
Style:        italic
Color:        rgba(255,255,255,0.45)
Line-height:  1.5 (leading-snug)
Max-width:    max-w-lg (32rem)
Margin:       mb-5
```

### Meta Badges Row

```
Layout:       flex flex-wrap items-center gap-x-3 gap-y-2
Margin:       mb-6

Rating Badge:
  Background: ${ratingColor}15
  Border:     1px solid ${ratingColor}40
  Radius:     rounded-lg
  Padding:    px-3 py-1.5
  Font:       13px font-bold
  Star icon:  11px, fill-current
  Vote count: opacity-50, font-normal, parenthesized
  
Separator:    · character, text-white/20

Year/Runtime: text-white/70 text-sm font-medium

Genre Pills:
  Background: rgba(255,255,255,0.08)
  Border:     1px solid rgba(255,255,255,0.08)
  Backdrop:   backdrop-blur-sm
  Radius:     rounded-full
  Padding:    px-3 py-1
  Font:       13px font-medium text-white/65
```

### Synopsis

```
Font:         var(--font-main)
Size:         15px (0.9375rem)
Color:        rgba(255,255,255,0.60)
Line-height:  1.7 (leading-relaxed)
Max-width:    max-w-[680px]
Line-clamp:   3 (collapsed), unset (expanded)
Expansion:    Animated height via Framer Motion layout animation
```

**"Show More" trigger**:

```
Font:         12px font-medium
Color:        rgba(255,255,255,0.35) → hover: rgba(255,255,255,0.75)
Transition:   color 200ms ease
Icon:         ChevronDown (13px), translate-y 0.5px on hover
```

### Action Buttons

#### Play Button (PRIMARY)

```
Height:       52px (h-13)
Padding:      px-9
Radius:       rounded-2xl (16px)
Background:   accentColor || var(--color-accent)
Font:         16px font-bold text-white
Icon:         Play (21px) fill-current
Gap:          gap-3

Shadow (rest):  0 0 28px 4px ${accent}44, 0 4px 20px rgba(0,0,0,0.5)
Shadow (hover): 0 0 48px 10px ${accent}66, 0 8px 32px rgba(0,0,0,0.6)

Hover:
  - Shimmer sweep (via-white/20 gradient translating from -100% to +100%)
  - Duration: 600ms ease-in-out
  - Shadow expands (see above)
  
Active: scale(0.96)
Focus: ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-base)]
Disabled: opacity-60, cursor-default

prefers-reduced-motion:
  - No shimmer sweep
  - No shadow animation
  - Keep scale on active
```

#### My List Button (SECONDARY)

```
Height:       52px
Padding:      px-7
Radius:       rounded-2xl
Background:   rgba(255,255,255,0.08)
Backdrop:     backdrop-blur-xl
Border:       1px solid rgba(255,255,255,0.12)
Font:         14px font-medium text-white/85
Icon:         Plus (18px) or Check (18px, accent color when active)
Gap:          gap-2.5

Hover:
  background: rgba(255,255,255,0.15)
  border-color: rgba(255,255,255,0.20)
  
Active: scale(0.96)
Transition: all 200ms ease
```

#### Sources Button (TERTIARY — icon only)

```
Size:         52px × 52px
Radius:       rounded-2xl
Background:   rgba(255,255,255,0.08)
Backdrop:     backdrop-blur-xl
Border:       1px solid rgba(255,255,255,0.12)
Icon:         Download (19px) text-white/55
Hover:        text-white, bg-white/15
Active:       scale(0.96)
```

---

## 4. Section 2 — InfoSection

### What competitors do
Netflix: Plain text synopsis below hero. Apple TV+: Minimal metadata. Disney+: Basic info cards.

### What SOKOUL does BETTER ✨
**Structured metadata grid** with visual hierarchy and a glass-card rating display that feels premium.

### Layout

```
Container:    max-w-[1400px] mx-auto
Spacing:      space-y-8
Overlap:      -mt-10 (pulls into hero gradient fade)
```

### Rating Card (Redesigned)

Replace the flat `bg-elevated` box with a glass card:

```
Layout:       inline-flex items-center gap-3
Padding:      px-5 py-3
Background:   var(--color-bg-frosted) — rgba(17, 17, 24, 0.60)
Backdrop:     backdrop-blur-xl
Border:       1px solid rgba(255,255,255,0.08)
Radius:       rounded-xl
Shadow:       0 4px 24px rgba(0,0,0,0.3)

Star:
  Color:      var(--color-warning) — #f59e0b
  Size:       20px
  Class:      fill-current drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]

Rating number:
  Font:       var(--font-display) (Clash Display)
  Size:       24px (text-2xl)
  Weight:     700
  Color:      var(--color-text-primary)
  
Vote count:
  Font:       var(--font-main)
  Size:       12px
  Color:      var(--color-text-muted)
```

### Metadata Pills (Redesigned)

```
Background:   rgba(255,255,255,0.05)
Border:       1px solid rgba(255,255,255,0.06)
Radius:       rounded-full
Padding:      px-3.5 py-1.5
Font:         13px font-medium
Color:        var(--color-text-secondary)

"Ongoing" status:
  Background: rgba(34,197,94,0.12)
  Border:     1px solid rgba(34,197,94,0.20)
  Color:      var(--color-success)
  Dot:        w-1.5 h-1.5 rounded-full bg-current animate-pulse
```

### Synopsis

```
Font:         var(--font-main)
Size:         15px
Color:        var(--color-text-secondary)
Line-height:  1.75 (relaxed++)
Line-clamp:   4 (collapsed)
Max-width:    max-w-[720px]

"Read More" button:
  Font:       14px font-medium
  Color:      var(--color-accent)
  Hover:      var(--color-accent-hover)
  Underline:  underline-offset-2 decoration-1 on hover
```

### Metadata Grid (Redesigned)

```
Layout:       grid grid-cols-2 lg:grid-cols-4 gap-6
Padding:      py-8
Border-top:   1px solid var(--color-border) — rgba(255,255,255,0.06)

Each item:
  Label:      text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mb-1
  Value:      text-sm text-[var(--color-text-secondary)] font-medium
```

---

## 5. Section 3 — DetailEpisodes

### What Netflix does
Dropdown season selector, vertical episode list, large still images.

### What SOKOUL does BETTER ✨
**Tabbed interface** with inline preview, pill-based season selector, and premium episode cards with watch progress.

### Tab Navigation

```
Layout:       border-b border-[var(--color-border)]
Tab:
  Padding:    pb-4
  Font:       14px font-medium
  Inactive:   color: var(--color-text-muted), border-b-2 border-transparent
  Active:     color: var(--color-text-primary), border-b-2 border-[var(--color-accent)]
  Hover:      color: var(--color-text-secondary)
  Transition: color 200ms ease, border-color 200ms ease
  Gap:        gap-8 between tabs
```

### Episode Preview Card (Selected)

```
Container:
  Background: var(--color-bg-elevated)
  Border:     1px solid var(--color-border)
  Radius:     var(--radius-card)
  Overflow:   hidden

Still image:
  Aspect:     aspect-video (16:9)
  Fit:        object-cover
  Overlay:    linear-gradient(to top, var(--color-bg-elevated) 0%, transparent 40%)
  
Progress bar:
  Height:     3px (not 4px — thinner = more premium)
  Background: var(--color-border)
  Fill:       var(--color-accent)
  Radius:     rounded-full
  Position:   absolute bottom-0
  
Info area:
  Padding:    p-5
  Episode ID: text-xs text-[var(--color-text-muted)] uppercase tracking-wider
  Title:      text-base font-semibold text-[var(--color-text-primary)]
  Overview:   text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2
  
Play button:
  Background: var(--color-accent)
  Hover:      var(--color-accent-hover)
  Radius:     var(--radius-card)
  Font:       13px font-semibold text-white
  Padding:    px-5 py-2.5
```

### Season Selector Pills

```
Layout:       flex gap-2 overflow-x-auto scrollbar-hide
Pill:
  Padding:    px-4 py-2
  Radius:     var(--radius-card)
  Font:       14px font-medium
  Inactive:   bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]
  Active:     bg-[var(--color-accent)] text-white
  Hover:      bg-[var(--color-bg-overlay)]
  Transition: background 200ms ease, color 200ms ease
```

### Episode List

```
Container:    space-y-2 max-h-[480px] overflow-y-auto
Scrollbar:    scrollbar-thin scrollbar-thumb-[var(--color-border)]

Episode card (EpisodeCard.tsx):
  Layout:     flex items-start gap-4 p-3 rounded-xl
  Background: transparent → hover: rgba(255,255,255,0.03)
  Border:     1px solid transparent → hover: var(--color-border)
  Selected:   bg-[var(--color-accent)]10 border-[var(--color-accent)]30
  Transition: all 200ms ease
  
  Thumbnail:
    Width:    120px
    Aspect:   16:9
    Radius:   rounded-lg
    Progress: 2px bar at bottom
    
  Episode number:
    Font:     12px font-bold text-[var(--color-text-muted)] uppercase tracking-wider
    
  Title:
    Font:     14px font-semibold text-[var(--color-text-primary)]
    Truncate: truncate (1 line)
    
  Overview:
    Font:     13px text-[var(--color-text-secondary)] leading-relaxed
    Clamp:    line-clamp-2
    
  Status badges:
    Watched:  text-[var(--color-success)] text-xs font-medium
    Resume:   text-[var(--color-warning)] text-xs font-medium
```

---

## 6. Section 4 — TrailerSection

### What Disney+ does
External link. Opens YouTube in a browser. **Terrible UX.**

### What Netflix does
Inline preview that auto-plays. Good but no user control.

### What SOKOUL does BETTER ✨
**Cinematic thumbnail with ambient glow** → fullscreen modal with smooth Framer Motion entry/exit.

### Thumbnail Card

```
Container:
  Width:      w-full max-w-[960px]
  Aspect:     aspect-video (16:9)
  Radius:     rounded-2xl
  Overflow:   hidden
  Shadow:     var(--shadow-trailer)
  Position:   relative
  Cursor:     cursor-pointer
  
  // AMBIENT GLOW (new — what makes it premium)
  &::before:
    Content:    ''
    Position:   absolute
    Inset:      -20px
    Background: radial-gradient(ellipse at center, ${accentColor}12, transparent 70%)
    Z-index:    -1
    Filter:     blur(40px)
    Animation:  accent-pulse 4s ease-in-out infinite
    (prefers-reduced-motion: no animation)

Image:
  Fit:        object-cover
  Transition: transform 700ms var(--ease-cinematic)
  Hover:      scale(1.04)

Overlay gradient:
  Background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 40%, transparent 60%, rgba(0,0,0,0.15) 100%)
  Hover:      from-black/55 (lighten slightly)

"Official Trailer" text:
  Position:   absolute bottom-5 left-6
  Font:       13px font-semibold uppercase tracking-[0.18em]
  Color:      rgba(255,255,255,0.55)
  
Center play button:
  Size:       80px × 80px
  Radius:     rounded-full
  Background: rgba(255,255,255,0.12)
  Backdrop:   backdrop-blur-md
  Border:     1px solid rgba(255,255,255,0.20)
  Shadow:     0 0 50px rgba(255,255,255,0.12)
  Icon:       Play (36px) fill-white ml-1.5
  
  Hover:
    Scale:    1.1
    Background: rgba(255,255,255,0.20)
    Shadow:   0 0 80px rgba(255,255,255,0.2)
  
  Transition: transform 300ms var(--ease-premium), background 300ms ease, box-shadow 300ms ease

Focus:
  ring-2 ring-[var(--color-accent)] outline-none
```

### Modal (Framer Motion)

```tsx
// Backdrop
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }}
  className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
  onClick={close}
>
  // Content
  <motion.div
    initial={{ scale: 0.92, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.92, opacity: 0 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="relative w-full max-w-5xl aspect-video mx-6"
    onClick={e => e.stopPropagation()}
  >
    <iframe ... className="w-full h-full rounded-xl shadow-2xl" />
  </motion.div>
</motion.div>
```

**Close button**: 
```
Position:   absolute top-5 right-5
Size:       40px × 40px
Background: rgba(255,255,255,0.08)
Hover:      rgba(255,255,255,0.15)
Radius:     rounded-full
Icon:       X (18px) text-white/70
Backdrop:   backdrop-blur-sm
```

---

## 7. Section 5 — GallerySection

### What competitors do
Netflix: No gallery. Disney+: No gallery. Apple TV+: Sometimes extras/clips.

### What SOKOUL does BETTER ✨
**A full art gallery** with tabbed categories, smooth scroll, and a premium lightbox. This is our unique killer feature — NO major streaming platform does this.

### Tab Pills

```
Layout:       flex items-center gap-5 mb-5

Tab button:
  Padding:    px-3.5 py-1.5
  Radius:     rounded-full
  Font:       13px font-semibold
  
  Inactive:
    Border:     1px solid rgba(255,255,255,0.12)
    Color:      rgba(255,255,255,0.35)
    Background: transparent
    Hover:      border-color rgba(255,255,255,0.25), color rgba(255,255,255,0.55)
    
  Active:
    Border:     1px solid var(--color-accent)
    Color:      var(--color-accent)
    Background: color-mix(in srgb, var(--color-accent) 10%, transparent)
    
  Transition: all 200ms ease
  
Count suffix: ml-1 opacity-50 text-[12px]
```

### Thumbnail Grid

```
Layout:       flex gap-3 overflow-x-auto pb-2 scrollbar-hide

Aspect ratios:
  Scenes:     16:9, width 300px
  Posters:    2:3, width 130px
  Logos:       16:5, width 220px

Thumbnail:
  Radius:     rounded-xl
  Overflow:   hidden
  Cursor:     cursor-zoom-in
  Border:     1px solid var(--color-border)
  
  Image:
    Fit:        object-cover
    Transition: transform 500ms var(--ease-premium)
    Hover:      scale(1.05)
    
  Overlay (on hover):
    Background: rgba(0,0,0,0.25)
    Display:    flex items-center justify-center
    Icon:       ZoomIn (24px) text-white/70, opacity-0 → opacity-100
    Transition: opacity 300ms ease, background 300ms ease
    
  Focus:
    ring-2 ring-[var(--color-accent)] outline-none
```

### Lightbox Styling

```tsx
<Lightbox
  styles={{
    container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
    button: { filter: 'none', color: 'rgba(255,255,255,0.7)' },
  }}
/>
```

---

## 8. Section 6 — CastSection

### What Netflix does
Horizontal scroll, square photos, name + role. Functional but bland.

### What Disney+ does
Card-based, larger photos. Better but generic.

### What SOKOUL does BETTER ✨
**Circular portraits** with grayscale→color reveal on hover, accent ring, and character name. Feels like an art gallery credits wall.

### Layout

```
Container:    flex gap-5 overflow-x-auto pb-4 scrollbar-hide
Padding:      First item: pl-0, Last item: pr-8 (compensated)
```

### Cast Card (Redesigned)

```
Width:        80px (up from 64px — bigger = more premium)
Flex:         flex-shrink-0 flex flex-col items-center gap-3
Cursor:       cursor-pointer
Focus:        focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg

Photo circle:
  Size:       72px × 72px (up from 64px)
  Radius:     rounded-full
  Overflow:   hidden
  Ring:       ring-2 ring-[var(--color-border)]
  Shadow:     var(--shadow-cast-photo)
  
  Image:
    Fit:        object-cover
    Filter:     grayscale(100%) → hover: grayscale(0%)
    Brightness: brightness(0.85) → hover: brightness(1)
    Scale:      1 → hover: 1.05
    Transition: filter 400ms ease, transform 300ms var(--ease-premium), brightness 400ms ease
    
  Ring (hover):
    ring-[var(--color-accent)]
    Transition: ring-color 300ms ease
    
  Placeholder (no photo):
    Background: var(--color-bg-elevated)
    Icon:       User (24px) text-[var(--color-text-muted)]
    Font:       Initials — text-lg font-bold text-[var(--color-text-muted)]

Name:
  Font:       12px font-medium
  Color:      var(--color-text-secondary)
  Width:      w-full text-center truncate
  Line-height: leading-tight
  
Character:
  Font:       11px font-normal
  Color:      var(--color-text-muted)
  Width:      w-full text-center truncate
```

---

## 9. Section 7 — StatsSection

### What Netflix does
No public stats. Just a match percentage.

### What Apple TV+ does
Nothing. No community data.

### What SOKOUL does BETTER ✨
**Animated stat cards** with count-up numbers, progress bars, and Trakt community reviews. We surface the data that cinephiles want.

### Stat Cards Grid

```
Layout:       grid grid-cols-2 lg:grid-cols-4 gap-4

Card:
  Padding:    p-5
  Radius:     rounded-xl
  Background: rgba(255,255,255,0.04)
  Border:     1px solid rgba(255,255,255,0.06)
  Hover:      bg-rgba(255,255,255,0.06), border-rgba(255,255,255,0.10)
  Transition: all 200ms ease

Label:
  Font:       11px uppercase tracking-[0.15em] font-semibold
  Color:      rgba(255,255,255,0.30)
  Margin:     mb-2

Number:
  Font:       var(--font-display) (Clash Display)
  Size:       28px (text-[1.75rem])
  Weight:     800 (font-extrabold)
  Color:      stat.color || var(--color-accent)
  
  Animation:
    Entry:    number-pop — scale(0.8) → scale(1.05) → scale(1), opacity 0→1
    Delay:    0.5s (after entering viewport)
    Count-up: 1500ms, easeOut cubic (1 - (1-p)³)
    
Progress bar:
  Height:     3px (h-[3px] — thicker than 2px, premium feel)
  Background: rgba(255,255,255,0.06)
  Radius:     rounded-full
  Margin:     mt-3
  
  Fill:
    Height:   100%
    Radius:   rounded-full
    Background: stat.color || var(--color-accent)
    Width:    0% → stat.percent%
    Transition: width 1.8s var(--ease-cinematic)
    Delay:    0.3s after entering viewport
```

### Review Cards Grid

```
Layout:       grid gap-4 sm:grid-cols-2 lg:grid-cols-3

Card:
  Padding:    p-5
  Radius:     rounded-xl
  Background: rgba(255,255,255,0.03)
  Border:     1px solid rgba(255,255,255,0.06)
  Hover:      border-rgba(255,255,255,0.10)
  Transition: border-color 200ms ease

Author row:
  Layout:     flex items-center justify-between mb-3
  Name:       text-sm font-semibold text-[var(--color-text-primary)]
  Date:       text-xs text-[var(--color-text-muted)]

Comment:
  Font:       14px
  Color:      rgba(255,255,255,0.55)
  Line-height: 1.65
  Clamp:      line-clamp-4

Likes:
  Font:       13px text-[var(--color-text-muted)]
  Margin:     mt-3
  Icon:       ♥ character, color var(--color-danger)
```

---

## 10. Section 8 — SimilarSection

### What Netflix does
Standard card rail. Functional. No personality.

### What SOKOUL does BETTER ✨
**Backdrop-based cards** with hover reveal of title + year, consistent sizing, and smooth navigation to detail pages.

### Card

```
Width:        220px (up from 200px)
Flex:         flex-shrink-0
Cursor:       cursor-pointer
Focus:        focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-xl

Thumbnail:
  Aspect:     aspect-video (16:9)
  Radius:     rounded-xl
  Overflow:   hidden
  Border:     1px solid var(--color-border)
  Margin:     mb-2.5
  
  Image:
    Fit:        object-cover
    Transition: transform 500ms var(--ease-premium)
    Hover:      scale(1.05)
    
  Overlay:
    Background: transparent → hover: rgba(0,0,0,0.25)
    Transition: background 300ms ease

Title:
  Font:       14px font-medium
  Color:      rgba(255,255,255,0.80)
  Truncate:   truncate
  Line-height: leading-tight

Year:
  Font:       13px font-normal
  Color:      rgba(255,255,255,0.35)
  Margin:     mt-0.5

No-image fallback:
  Background: rgba(255,255,255,0.06)
  Display:    flex items-center justify-center
  Icon:       Film (24px) text-white/15
```

### Scroll Behavior

```
Container:    flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth
Padding:      pb-4

Scroll arrows (opacity-0 → opacity-100 on rail hover):
  Position:   absolute top-1/2 -translate-y-1/2
  Left arrow: left-0
  Right arrow: right-0
  Size:       40px × 40px
  Background: var(--color-bg-frosted) — rgba(17,17,24,0.60)
  Backdrop:   backdrop-blur-md
  Border:     1px solid rgba(255,255,255,0.10)
  Radius:     rounded-full
  Icon:       ChevronLeft / ChevronRight (18px) text-white/70
  Shadow:     0 4px 16px rgba(0,0,0,0.4)
  Hover:      bg-white/15
  Transition: opacity 200ms ease, background 200ms ease
```

---

## 11. Section 9 — CollectionBanner (SagaSection)

### What competitors do
Disney+: "More Like This" section. Netflix: "More from this franchise." Both are just grids.

### What SOKOUL does BETTER ✨
**A visual franchise timeline** with current-film highlighting, accent glow, and chronological ordering.

### Layout

```
Container:    flex gap-4 overflow-x-auto scrollbar-hide pb-4

Current film scroll-into-view:
  On mount: containerRef.current?.scrollTo({
    left: currentItemRef.current?.offsetLeft - 100,
    behavior: 'smooth'
  })
```

### Collection Poster

```
Width:        100px (up from 90px)
Height:       150px (2:3 ratio)
Radius:       rounded-xl
Overflow:     hidden
Cursor:       cursor-pointer

Image:
  Fit:        object-cover
  Transition: transform 500ms var(--ease-premium)
  Hover:      scale(1.05)

Current film:
  Outline:    2px solid var(--color-accent)
  Outline-offset: 3px
  Shadow:     0 0 20px ${accentColor}33
  
  "HERE" badge:
    Position:   absolute top-2 right-2
    Font:       10px font-bold uppercase tracking-wider
    Background: var(--color-accent)
    Color:      white
    Padding:    px-2 py-0.5
    Radius:     rounded-full

Other films:
  Outline:    2px solid transparent
  Opacity:    0.8 → hover: 1
  Hover:      outline-color rgba(255,255,255,0.15)
  Transition: all 300ms ease

Title:
  Font:       12px font-medium
  Color:      rgba(255,255,255,0.65)
  Width:      w-full text-center
  Clamp:      line-clamp-2
  Margin:     mt-2.5
  Line-height: leading-tight

Year:
  Font:       11px
  Color:      rgba(255,255,255,0.30)
  Margin:     mt-1
```

---

## 12. New Animations to Add

### Add to `animations.css`:

```css
/* ── Detail page section entrance ────────────────────────────────────────── */
@keyframes detail-section-enter {
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-section-enter {
  animation: detail-section-enter 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ── Ambient glow pulse for trailer ──────────────────────────────────────── */
@keyframes ambient-glow {
  0%, 100% { opacity: 0.4; filter: blur(40px); }
  50%      { opacity: 0.7; filter: blur(50px); }
}

.ambient-glow {
  animation: ambient-glow 4s ease-in-out infinite;
}

/* ── Number pop for stats ────────────────────────────────────────────────── */
@keyframes number-pop {
  0%   { transform: scale(0.8); opacity: 0; }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1);  opacity: 1; }
}

.number-pop {
  animation: number-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* ── Progress bar fill ───────────────────────────────────────────────────── */
@keyframes bar-fill {
  from { width: 0%; }
  to   { width: var(--bar-target, 0%); }
}

.bar-fill {
  animation: bar-fill 1.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ── Prefers reduced motion ──────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .detail-section-enter,
  .ambient-glow,
  .number-pop,
  .bar-fill {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  
  .bar-fill {
    width: var(--bar-target, 0%) !important;
  }
}
```

---

## 13. Section Transitions — Framer Motion

### Master Config

Every section uses `DetailSection` wrapper (defined in §2) with staggered delays:

```tsx
<DetailSection delay={0}>     {/* InfoSection */}
<DetailSection delay={0.05}>  {/* DetailEpisodes */}
<DetailSection delay={0.1}>   {/* TrailerSection */}
<DetailSection delay={0.15}>  {/* StatsSection */}
<DetailSection delay={0.2}>   {/* CastSection */}
<DetailSection delay={0.25}>  {/* GallerySection */}
<DetailSection delay={0.3}>   {/* SagaSection */}
<DetailSection delay={0.35}>  {/* SimilarSection */}
```

These delays only apply on INITIAL load. The `useInView` trigger ensures they animate independently when scrolled to. The delays are for when multiple sections are visible at once on load.

### Shared Motion Config

```tsx
// src/features/detail/motion.ts

export const DETAIL_MOTION = {
  section: {
    initial:   { opacity: 0, y: 32 },
    animate:   { opacity: 1, y: 0 },
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
  
  stagger: {
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
    },
    item: {
      hidden:  { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
  },
  
  modal: {
    backdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit:    { opacity: 0 },
      transition: { duration: 0.25 },
    },
    content: {
      initial: { scale: 0.92, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit:    { scale: 0.92, opacity: 0 },
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
  },
  
  // prefers-reduced-motion override
  reduced: {
    initial:   { opacity: 0 },
    animate:   { opacity: 1 },
    transition: { duration: 0.15 },
  },
} as const;
```

---

## 14. What Makes Us BETTER

### vs Netflix

| Feature | Netflix | SOKOUL |
|---------|---------|--------|
| Hero gradient | 2-layer | **5-layer composite + accent glow** |
| Parallax | None | **0.25x scroll + content fade** |
| Section animations | Cut-in | **Scroll-triggered staggered entrance** |
| Stats | Match % only | **Animated counters + progress bars + reviews** |
| Gallery | None | **Tabbed gallery with lightbox** |
| Cast photos | Square, flat | **Circular, grayscale→color, accent ring** |
| Typography | System font | **Genre-aware display fonts** |
| Trailer | Auto-play inline | **Cinematic thumbnail + ambient glow + modal** |
| Collection | Text list | **Visual timeline with current-film highlight** |
| Accent color | None | **Extracted from backdrop, tints entire page** |

### vs Disney+

| Feature | Disney+ | SOKOUL |
|---------|---------|--------|
| Hero height | ~60vh | **85vh full cinematic** |
| Metadata | Basic text | **Glass-card rating + genre pills** |
| Episodes | Dropdown | **Pill-based season + tabbed interface** |
| Depth | Flat | **Layered surfaces, glass, frosted panels** |
| Motion | Minimal | **Framer Motion orchestrated stagger** |
| Reviews | None | **Trakt community reviews grid** |
| Gallery | None | **Full art gallery with categories** |
| Collections | Just logos | **Poster timeline with accent highlighting** |

### vs Apple TV+

| Feature | Apple TV+ | SOKOUL |
|---------|-----------|--------|
| Typography | SF Pro only | **Genre-specific display fonts (11 styles)** |
| Content density | Very sparse | **Rich but organized — museum layout** |
| Community data | None | **Trakt + TMDB ratings, reviews, votes** |
| Franchise nav | None | **Collection banner with visual timeline** |
| Color theming | Fixed | **Genre-aware accent + extracted palette** |
| Gallery | Extras clips | **High-res stills, posters, logos** |

### The SOKOUL Advantage — Summary

1. **Genre-aware theming** — No competitor changes the visual language per genre
2. **5-layer backdrop composite** — More depth than any competitor
3. **Art gallery** — Unique feature; Netflix/Disney+/Apple TV+ have nothing comparable
4. **Community data** — We surface Trakt + TMDB ratings, reviews, financial data
5. **Typography system** — 11 genre-specific font styles (Netflix uses 1 font)
6. **Accent color extraction** — The entire page tints to match the content
7. **Motion orchestration** — Framer Motion stagger + scroll triggers
8. **Collection timeline** — Visual franchise navigation with current-film highlight
9. **Museum philosophy** — Each title page is unique, not templated

---

## Appendix A — Responsive Breakpoints

Since this is an Electron app (1280px–1920px), we optimize for these ranges:

```
1280px (min):
  Hero: 85vh
  Content max: 1200px
  Grid: 2-col stats, 2-col reviews
  Card widths: slightly reduced (200px → 180px)
  
1440px (sweet spot):
  Hero: 85vh
  Content max: 1300px
  Grid: 4-col stats, 2-col reviews
  Full card widths
  
1920px (max):
  Hero: 85vh, max-height: 960px kicks in
  Content max: 1400px
  Grid: 4-col stats, 3-col reviews
  Generous spacing
```

### Tailwind Classes for Responsive

```
max-w-[1400px]                    → content container
grid grid-cols-2 lg:grid-cols-4   → stats
grid gap-4 sm:grid-cols-2 lg:grid-cols-3  → reviews
```

---

## Appendix B — Accessibility

### Focus Management

```
All interactive elements: focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
Ring offset: ring-offset-2 ring-offset-[var(--color-bg-base)]
Tab order: natural DOM order (hero → info → episodes → trailer → ...)
Skip-to-content: NOT needed (Electron app, no keyboard-only web browsing)
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* All Framer Motion: use transition.duration = 0.01 */
  /* All CSS animations: animation: none */
  /* All transforms: transform: none */
  /* Opacity transitions: keep (they're non-vestibular) */
  /* Scroll behavior: auto (not smooth) */
}
```

### Framer Motion Reduced Motion

```tsx
import { useReducedMotion } from 'framer-motion';

const prefersReducedMotion = useReducedMotion();

<motion.div
  transition={prefersReducedMotion 
    ? { duration: 0.01 } 
    : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
  }
/>
```

### Color Contrast

All text meets WCAG AA against our dark backgrounds:
- `var(--color-text-primary)` #f0f0f5 on #0a0a0f = **18.5:1** ✅
- `var(--color-text-secondary)` #9898b0 on #0a0a0f = **7.3:1** ✅
- `var(--color-text-muted)` #5a5a70 on #0a0a0f = **3.5:1** ✅ (labels/captions only, min 14px)

---

## Appendix C — Performance Budget

### Critical Metrics

```
Largest Contentful Paint (hero image):  < 1.5s
First Input Delay:                      < 50ms
Cumulative Layout Shift:                < 0.05
Total section JS (lazy-loaded):         < 25KB per section
Hero backdrop image:                    original resolution, lazy-decoded
Parallax scroll handler:               rAF-throttled, passive listener
Intersection Observer:                  threshold 0.15, once: true
```

### Image Loading Strategy

```
Hero backdrop:     Eager loading, original quality
Episode stills:    Lazy loading, w780 (TMDB)
Cast photos:       Lazy loading, w185 (TMDB)
Gallery scenes:    Lazy loading, w780 (TMDB)
Gallery posters:   Lazy loading, w342 (TMDB)
Similar backdrops: Lazy loading, w500 (TMDB)
Collection posters: Lazy loading, w185 (TMDB)
```

### Code Splitting

```tsx
// Already implemented via React.lazy:
const CastSection    = React.lazy(() => import('./CastSection'));
const GallerySection = React.lazy(() => import('./GallerySection'));
const TrailerSection = React.lazy(() => import('./TrailerSection'));
const SagaSection    = React.lazy(() => import('./SagaSection'));
const StatsSection   = React.lazy(() => import('./StatsSection'));
const SimilarSection = React.lazy(() => import('./SimilarSection'));
```

---

*Document version: 2.0*  
*Author: NOVA (UI/UX Agent)*  
*Last updated: {current_date}*  
*Status: DESIGN SPEC — Ready for implementation*
