# SOKOUL — ARCHITECTURE.md

> Living document. Update after every structural change.
> Version: master (735f251) — 2026-03-09

---

## Overview

Sokoul is a desktop streaming application built with **Electron + React + Rust**.

```
┌─────────────────────────────────────────────────────┐
│                  Electron Shell                      │
│  ┌────────────────────┐   ┌────────────────────┐   │
│  │  React Frontend    │   │   MPV Player        │   │
│  │  (renderer proc.)  │◄──│   (via IPC)         │   │
│  └────────┬───────────┘   └────────────────────┘   │
│           │ HTTP / IPC                               │
│  ┌────────▼───────────┐                             │
│  │  Rust Backend      │                             │
│  │  Axum + SQLite     │                             │
│  └────────┬───────────┘                             │
│           │                                          │
│  ┌────────▼───────────────────────────────────┐    │
│  │  External APIs                              │    │
│  │  TMDB · Fanart · OMDB · Torrentio · Prowlarr│    │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Frontend Structure

```
sokoul-desktop/src/
├── app/                    # App shell, router, providers
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── features/               # Domain-driven feature modules
│   ├── catalog/            # Browse, search, content display
│   │   ├── components/     # UI only (ContentCard, ContentRail, HeroBanner...)
│   │   ├── hooks/          # useSearch, useCatalog, useGenres...
│   │   └── api/            # TMDB queries via React Query
│   │
│   ├── player/             # Video playback
│   │   ├── components/     # PlayerPage, PlayerOverlay...
│   │   ├── hooks/          # usePlayerKeyboard, usePlayback...
│   │   └── ipc/            # Electron IPC wrappers
│   │
│   ├── collections/        # User collections & lists
│   │   ├── components/
│   │   └── hooks/
│   │
│   └── profile/            # User profiles & settings
│       ├── components/
│       └── hooks/
│
├── pages/                  # Route-level page components (thin wrappers)
│   ├── HomePage.tsx
│   ├── DetailPage.tsx
│   ├── SearchPage.tsx
│   ├── BrowsePage.tsx
│   ├── CollectionsPage.tsx
│   ├── PlayerPage.tsx
│   ├── ProfilePage.tsx
│   └── SettingsPage.tsx
│
├── components/             # Shared UI primitives
│   ├── ui/                 # Button, Badge, Skeleton, Modal, Toast...
│   ├── layout/             # Navbar, Sidebar, PageWrapper...
│   └── feedback/           # LoadingSpinner, ErrorBoundary, EmptyState...
│
├── hooks/                  # App-wide hooks
│   ├── useScrollPosition.ts
│   ├── useSearchHistory.ts
│   ├── usePlayerKeyboard.ts
│   └── useIntersectionObserver.ts
│
├── styles/
│   ├── globals.css         # Reset, base styles, prefers-reduced-motion
│   └── tokens.css          # All CSS custom properties (--color-*, --radius-*, etc.)
│
├── types/
│   ├── content.ts          # ContentItem, Movie, Series, Episode...
│   ├── player.ts           # PlayerState, SubtitleTrack, AudioTrack...
│   └── api.ts              # TMDB response types
│
└── lib/
    ├── tmdb.ts             # TMDB API client
    ├── fanart.ts           # Fanart API client
    └── utils.ts            # Shared utilities
```

---

## Backend Structure

```
sokoul-backend/src/
├── main.rs                 # Axum server entry point
├── routes/
│   ├── catalog.rs          # GET /movies, /series, /search
│   ├── stream.rs           # POST /stream (Torrentio + Prowlarr)
│   ├── debrid.rs           # Real-Debrid integration
│   └── playback.rs         # POST /playback/position, GET /playback/recent
├── models.rs               # Rust structs (ContentItem, Stream, PlaybackEntry...)
├── parser.rs               # Torrent title parser (quality, codec, language)
└── db/
    └── migrations/         # SQLite migrations
```

---

## Data Flow

### Content browsing
```
HomePage → useGenres() → GET /api/genres → TMDB API → React Query cache
                ↓
         ContentRail × 25 → ContentCard (lazy image load)
```

### Playback
```
ContentCard click → DetailPage → Play button
        ↓
POST /api/stream { imdb_id, quality }
        ↓
Torrentio + Prowlarr (parallel) → parser.rs → sorted results
        ↓
Electron IPC → MPV spawn → PlayerPage
        ↓
POST /api/playback/position (every 30s + on exit)
```

---

## Key Conventions

| Convention | Rule |
|-----------|------|
| Pages | Thin wrappers — no business logic, only layout + feature imports |
| Features | Self-contained — own components, hooks, API calls |
| Shared UI | `src/components/ui/` — no domain knowledge |
| IPC calls | Always wrapped in `src/features/player/ipc/` — never called directly from UI |
| API calls | Always via React Query — no raw `fetch()` in components |
| CSS | TailwindCSS classes + `var(--token)` for dynamic values |
