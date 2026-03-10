# Sokoul — Visual Identity & Rail System Prompt

## Context

Sokoul is NOT a Netflix clone.
It is a premium cinema platform with a complete, curated catalog.
The unique strength: original categories + cinematic identity per genre.

Reference: Letterboxd × Criterion Channel × Disney+ × MUBI.

---

## 1. RAIL TITLE SYSTEM — Strict Rule

Each ContentRail displays either:
- A **genre name** (short, clean): "Action", "Thriller", "Sci-Fi"
- OR a **tagline** (editorial, evocative): "No brakes. No mercy."

**Never both on the same rail. Never alternating on the same render.**

The rule: rails alternate in a fixed pattern across the page:
```
Rail 1 → genre name     ("Action")
Rail 2 → tagline        ("No brakes. No mercy.")
Rail 3 → genre name     ("Science Fiction")
Rail 4 → tagline        ("One episode in. You watch ten.")
Rail 5 → genre name     ("Horror")
...and so on
```

This pattern must be deterministic — always the same order on reload.
No random switching. No animation between the two.

Implementation:
```typescript
// In rail config or HomePage
const displayTitle = index % 2 === 0 ? rail.genreName : rail.tagline
```

Remove the existing title-cycling animation (15s/10s timer).
Titles must be **stable**. Never animated. Never changing after mount.

---

## 2. LOGO SYSTEM — Every Content Has an Identity

### Priority chain for every ContentCard and DetailPage hero:

```
1. Fanart.tv clearlogo (preferred — transparent PNG, high quality)
2. TMDB logo_path (fallback)
3. Styled text title (last resort — but must look intentional)
```

### When logo exists (Fanart clearlogo):
- Display as `<img>` with `max-h-[48px]` on cards, `max-h-[120px]` on hero
- `object-fit: contain`, `object-position: left center`
- Drop shadow: `filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8))`
- Never stretch, never crop

### When NO logo exists — Styled Text Title:
This is the creative challenge. The title becomes a designed object.

Each genre has a **typography identity**:

```typescript
// src/shared/config/genreTypography.ts

export const GENRE_TYPOGRAPHY: Record<string, GenreStyle> = {
  action: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize:   "clamp(1.5rem, 3vw, 2.5rem)",
    fontWeight: "900",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#ffffff",
    textShadow: "0 0 40px rgba(255,60,60,0.4), 0 2px 12px rgba(0,0,0,0.9)",
  },
  thriller: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: "700",
    fontSize:   "clamp(1.25rem, 2.5vw, 2rem)",
    letterSpacing: "0.02em",
    fontStyle: "italic",
    color: "#e8e0d0",
    textShadow: "0 2px 20px rgba(0,0,0,0.95)",
  },
  "sci-fi": {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: "600",
    fontSize:   "clamp(1rem, 2vw, 1.75rem)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#7df9ff",
    textShadow: "0 0 30px rgba(125,249,255,0.5), 0 2px 8px rgba(0,0,0,0.9)",
  },
  horror: {
    fontFamily: "'Creepster', cursive",
    fontWeight: "400",
    fontSize:   "clamp(1.5rem, 3vw, 2.25rem)",
    letterSpacing: "0.05em",
    color: "#ff3333",
    textShadow: "0 0 20px rgba(255,0,0,0.6), 0 2px 12px rgba(0,0,0,0.95)",
  },
  romance: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: "300",
    fontSize:   "clamp(1.5rem, 3vw, 2.5rem)",
    letterSpacing: "0.04em",
    fontStyle: "italic",
    color: "#f9c6c6",
    textShadow: "0 2px 16px rgba(0,0,0,0.85)",
  },
  animation: {
    fontFamily: "'Lilita One', cursive",
    fontWeight: "400",
    fontSize:   "clamp(1.25rem, 2.5vw, 2rem)",
    letterSpacing: "0.02em",
    color: "#ffe066",
    textShadow: "0 0 24px rgba(255,224,102,0.4), 0 2px 8px rgba(0,0,0,0.85)",
  },
  documentary: {
    fontFamily: "'DM Serif Display', serif",
    fontWeight: "400",
    fontSize:   "clamp(1.25rem, 2.5vw, 2rem)",
    letterSpacing: "0.01em",
    color: "#d4c9b0",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
  },
  drama: {
    fontFamily: "'Libre Baskerville', serif",
    fontWeight: "700",
    fontSize:   "clamp(1.25rem, 2.5vw, 2rem)",
    letterSpacing: "0.03em",
    color: "#e8e8e8",
    textShadow: "0 2px 16px rgba(0,0,0,0.9)",
  },
  western: {
    fontFamily: "'Rye', cursive",
    fontWeight: "400",
    fontSize:   "clamp(1.25rem, 2vw, 1.75rem)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#d4a843",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
  },
  comedy: {
    fontFamily: "'Pacifico', cursive",
    fontWeight: "400",
    fontSize:   "clamp(1.25rem, 2.5vw, 2rem)",
    letterSpacing: "0.01em",
    color: "#ffffff",
    textShadow: "0 2px 12px rgba(0,0,0,0.85)",
  },
  default: {
    fontFamily: "'Clash Display', sans-serif",
    fontWeight: "700",
    fontSize:   "clamp(1.25rem, 2.5vw, 2rem)",
    letterSpacing: "0.02em",
    color: "#ffffff",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
  },
}
```

These fonts must be loaded from Google Fonts in `index.html`.

### ContentCard — Logo overlay on backdrop:

```
Position: absolute, bottom-left of card
Padding: 12px
Max-height on card: 40px (logo) or styled text
Fallback text: positioned same as logo would be
Background: none — the backdrop image is the background
```

The logo/text must feel **part of the scene**, not pasted on top.

---

## 3. DETAIL PAGE — Museum of Art

Each film's detail page is a unique visual experience.

### Hero section (130vh):
```
Backdrop: full-bleed, original resolution, object-position: center 20%
Gradient layers:
  1. Left:   linear-gradient(to right, rgba(0,0,0,0.85), transparent 60%)
  2. Bottom: linear-gradient(to top, #0a0a0f 0%, transparent 40%)
  3. Top:    linear-gradient(to bottom, rgba(0,0,0,0.3), transparent 30%)

Content block (bottom-left, max-width: 50%):
  1. Fanart logo OR styled genre text (as designed object)
  2. Metadata row: Year · Runtime · ★ Rating · Classification badge · Language
  3. Genre pills (glass, small)
  4. Synopsis (3 lines collapsed, expandable with animation)
  5. CTA row: [▶ Watch] [+ My List] [⬇ Download] [⋯ More]
```

### Information architecture below hero:

```
Section 1 — Numbers & Reception
  Trakt rating (star display, not just percentage)
  Letterboxd-style rating bar
  Number of Trakt reviews
  Number of likes

Section 2 — Trailer
  Embedded in page — not external link
  Poster thumbnail with play overlay
  Click → lightbox player

Section 3 — Cast & Crew
  Horizontal scroll
  Circular photo (w185 TMDB)
  Name below
  Role in muted text
  Click → ActorPage

Section 4 — Scenes & Gallery
  Horizontal masonry scroll
  TMDB stills (w780 quality minimum)
  Click → lightbox fullscreen

Section 5 — Trakt Reviews
  Top 3 reviews: avatar + username + star rating + text excerpt
  "Show more" to expand all

Section 6 — Similar Content
  Standard ContentRail
  landscape variant
  Title: "You might also like"
```

---

## 4. COLLECTIONS — Genre Identity

Each collection page has a **visual identity**:

```
- Custom hero image (Fanart background or curated backdrop)
- Genre color accent (subtle, not rainbow chaos)
- Editorial description (2 sentences max)
- Sub-collections (e.g., "Action > Military · Superhero · Martial Arts")
```

Collection cards on CollectionsPage:
```
Aspect: 21:9 (cinematic)
Image: best available backdrop from top 3 films in collection
Overlay: collection name in genre typography (from GENRE_TYPOGRAPHY config)
Hover: scale(1.02) + reveal film count + "Explore" button
```

---

## 5. RAIL RHYTHM — HomePage pattern

Fixed repeating pattern (deterministic, not random):

```
Position  Type        Card variant   Min-width
────────  ──────────  ─────────────  ─────────
1         Landscape   16:9           280px     ← "Recommended for You"
2         Landscape   16:9           280px     ← Genre or tagline
3         POSTER      2:3            160px     ← Genre name only
4         Landscape   16:9           280px     ← Tagline
5         FEATURED    1 large card   full      ← Editorial spotlight
6         Landscape   16:9           280px     ← Genre or tagline
7         POSTER      2:3            160px     ← Genre name only
8+        repeat pattern from row 2
```

The FEATURED row (position 5) shows 1 film in a large cinematic card:
```
Width: 100% of container
Height: 280px
Backdrop: original quality
Content: logo + synopsis excerpt + Watch button
```

---

## Implementation Order

When implementing, follow this exact order:

1. `src/shared/config/genreTypography.ts` — Create genre typography config
2. `src/shared/utils/logoUtils.ts` — Logo resolution logic (Fanart → TMDB → styled text)
3. `ContentCard.tsx` — Integrate logo system + styled text fallback
4. `HomePage.tsx` — Fix title system (remove cycling, implement alternating pattern)
5. `DetailPage.tsx` — Museum of art layout
6. `CollectionsPage.tsx` — Genre identity cards

One file at a time. Diff before each change. Wait for validation.
