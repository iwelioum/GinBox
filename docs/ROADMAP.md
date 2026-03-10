# SOKOUL — ROADMAP.md

> Sprint roadmap for reaching 9/10 UX/UI score.
> Current score: 7.5/10 (audit 2026-03-09, commit 735f251)

---

## Sprint 1 — Design Foundations _(1–2 days)_

**Goal:** Stabilize the design system and core components.

| Task | File | Impact | Status |
|------|------|--------|--------|
| ContentCard — aspect ratio responsive | `ContentCard.tsx` | 🔴 High | ⬜ |
| ContentCard — skeleton loading | `ContentCard.tsx` | 🔴 High | ⬜ |
| ContentCard — title overlay always visible | `ContentCard.tsx` | 🟠 Medium | ⬜ |
| ContentCard — alt text on all images | `ContentCard.tsx` | 🔴 High | ⬜ |
| Create tokens.css | `styles/tokens.css` | 🔴 High | ⬜ |
| Replace all hardcoded colors | 6 files | 🔴 High | ⬜ |
| Add prefers-reduced-motion | `globals.css` | 🔴 High | ⬜ |

**Expected score after Sprint 1:** 8.2/10

---

## Sprint 2 — Streaming UX _(2 days)_

**Goal:** Make the interface intuitive and premium.

| Task | File | Impact | Status |
|------|------|--------|--------|
| ContentRail — scroll arrows | `ContentRail.tsx` | 🟠 Medium | ⬜ |
| ContentRail — "Voir tout" link | `ContentRail.tsx` | 🟠 Medium | ⬜ |
| HeroBanner — progress bar | `HeroBanner.tsx` | 🟠 Medium | ⬜ |
| Navbar — Cmd+K shortcut | `Navbar.tsx` | 🟠 Medium | ⬜ |
| SearchPage — history + trending | `SearchPage.tsx` | 🟠 Medium | ⬜ |
| SearchPage — URL param sync | `SearchPage.tsx` | 🟡 Low | ⬜ |
| DetailPage — age rating badge | `DetailPage.tsx` | 🟠 Medium | ⬜ |
| SettingsPage — save toast | `SettingsPage.tsx` | 🟠 Medium | ⬜ |

**Expected score after Sprint 2:** 8.7/10

---

## Sprint 3 — Premium Player _(2–3 days)_

**Goal:** Transform the player into a real streaming player.

| Task | File | Impact | Status |
|------|------|--------|--------|
| Create PlayerOverlay component | `PlayerOverlay.tsx` | 🔴 High | ⬜ |
| Player — subtitle / audio / quality panel | `PlayerOverlay.tsx` | 🔴 High | ⬜ |
| Player — keyboard shortcuts hook | `usePlayerKeyboard.ts` | 🔴 High | ⬜ |
| Player — quality badge | `PlayerOverlay.tsx` | 🟠 Medium | ⬜ |
| Player — auto-hide overlay 3s | `PlayerOverlay.tsx` | 🟠 Medium | ⬜ |

**Expected score after Sprint 3:** 9.2/10

---

## Backlog — Polish & Extras

| Task | Effort | Impact |
|------|--------|--------|
| Hover preview card (500ms delay) | High | High |
| Continue Watching rail | Medium | High |
| Page route transitions (AnimatePresence) | Low | Medium |
| Navbar glassmorphism on scroll | Low | Medium |
| Card stagger entrance animations | Low | Medium |
| ProfilePage — inline edit | Medium | Medium |
| Avatar SVG local (no DiceBear) | Low | Medium |
| CollectionsPage — responsive grid | Low | Low |
| MyListsPage — undo delete toast | Low | Medium |
| Scroll restoration on back navigation | Low | Low |

---

## Score Tracker

| Sprint | Expected Score | Actual Score | Date |
|--------|---------------|--------------|------|
| Baseline | — | 7.5/10 | 2026-03-09 |
| After Sprint 1 | 8.2/10 | — | — |
| After Sprint 2 | 8.7/10 | — | — |
| After Sprint 3 | 9.2/10 | — | — |
