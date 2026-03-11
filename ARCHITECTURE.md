# SOKOUL — ARCHITECTURE.md

> Living document. Update after every structural change.
> Last updated: 2025-03-11 (Auto-Agent Session 0)

---

## Overview

Sokoul is a desktop streaming application built with **Electron 31 + React 18 + Rust/Axum**.
It uses a **dual-window** architecture: the main window renders MPV video via `--wid`,
and a transparent overlay window displays player controls on top. The two windows sync
state via `BroadcastChannel`.

```
┌──────────────────────────────────────────────────────────┐
│                     Electron Shell                        │
│  ┌─────────────────────┐    ┌──────────────────────┐    │
│  │  Main Window         │    │  Overlay Window       │    │
│  │  (React renderer)    │◄──►│  (player controls)    │    │
│  │  HashRouter + pages  │ BC │  BroadcastChannel     │    │
│  └────────┬─────────────┘    └──────────────────────┘    │
│           │ HTTP (localhost:3000)                          │
│  ┌────────▼─────────────┐    ┌──────────────────────┐    │
│  │  Rust Backend         │    │  MPV Player           │    │
│  │  Axum + SQLite        │    │  Named pipe IPC       │    │
│  │  127.0.0.1:3000       │    │  \\.\pipe\mpv-{ts}    │    │
│  └────────┬──────────────┘    └──────────────────────┘    │
│           │                                                │
│  ┌────────▼────────────────────────────────────────────┐  │
│  │  External APIs                                       │  │
│  │  TMDB · Fanart.tv · Real-Debrid · Torrentio ·       │  │
│  │  Prowlarr · Wastream · FlareSolverr · Trakt         │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Frontend Structure

```
sokoul-desktop/src/
├── app/                       # App shell
│   ├── main.tsx               # Entry point, providers, QueryClient
│   └── App.tsx                # HashRouter + routes (ErrorBoundary-wrapped)
│
├── features/                  # Feature-sliced design (modules CANNOT import each other)
│   ├── catalog/               # Browse, home, settings, profiles
│   │   ├── components/        # HomePage, BrowsePage, SettingsPage, HeroBanner,
│   │   │                      # ContentCard, ContentRail, HoverCard, ProfileForm...
│   │   ├── hooks/             # useCatalogLoader
│   │   ├── store/             # catalog.store.ts (Zustand — sections, favorites)
│   │   └── config/            # categories.config.ts
│   │
│   ├── detail/                # Content detail page
│   │   ├── components/        # DetailPage (lazy sections), HeroSection, InfoSection,
│   │   │                      # DetailEpisodes, SourcesPage, SourceBadges, SourceCard...
│   │   └── hooks/             # useDetailData, useDetailPlayback, useSourceFiltering
│   │
│   ├── player/                # Video playback
│   │   ├── components/        # PlayerPage, OverlayPage, SourcePanel
│   │   └── hooks/             # useMpv, usePlayerLifecycle, useEpisodeNavigation
│   │
│   └── search/                # Search feature
│       └── components/        # SearchPage (300ms debounce, trending suggestions)
│
├── shared/                    # Cross-feature shared code
│   ├── api/                   # Axios client (baseURL: 127.0.0.1:3000), endpoints
│   ├── components/
│   │   ├── ui/                # Skeleton, Spinner, EmptyState, Badge...
│   │   ├── layout/            # Navbar
│   │   └── modals/            # ResumeModal
│   ├── config/                # genreTypography.ts
│   ├── hooks/                 # useLists, useCollectionQuery, useScrollPosition,
│   │                          # useSearchHistory, useDynamicAccentColor, useMouseIdle...
│   ├── i18n/                  # i18next config + locales/ (fr.json, en.json)
│   ├── stores/                # toastStore.ts
│   ├── types/                 # index.ts (all TypeScript types)
│   └── utils/                 # fanart, genreTheme, image, logoUtils, parsing
│
├── stores/                    # App-wide Zustand stores
│   ├── profileStore.ts        # Active profile (persisted in localStorage)
│   ├── preferencesStore.ts    # Stream preferences (language, quality, cached RD)
│   └── logStore.ts            # Debug log ring buffer (200 entries, in-memory)
│
└── styles/
    ├── globals.css            # Reset, base, prefers-reduced-motion
    └── tokens.css             # CSS custom properties (--color-*, --radius-*, --font-*)
```

**Key rules:**
- Feature modules (`catalog`, `detail`, `player`, `search`) **cannot import each other**
- Shared code goes in `shared/`
- HashRouter required — Electron loads via `file://`
- GPU acceleration disabled — required for MPV `--wid` rendering
- Each route wrapped in its own `ErrorBoundary`

---

## Electron Main Process

```
sokoul-desktop/electron/
├── main.js               # App lifecycle, dual-window creation, IPC handlers
├── preload.js            # Context bridge: window.mpv, window.overlay, window.electronAPI
├── mpv-manager.js        # Spawns MPV with --ipc-server, --force-media-title
├── mpv-ipc.js            # JSON IPC over named pipe, polls position every 250ms
└── backend-manager.js    # Spawns Rust backend, waits for SOKOUL_BACKEND_READY stdout
```

---

## Backend Structure

```
sokoul-backend/src/
├── main.rs                 # Axum server, AppState (Arc'd DB pool + API keys + HTTP client)
├── models.rs               # All domain structs (Source, CatalogItem, Profile, PlaybackEntry...)
├── errors.rs               # AppError enum → HTTP status + JSON
├── parser.rs               # Regex torrent title parser (quality, language, codec)
├── routes/
│   ├── catalog.rs          # GET /catalog/:type/:id, /catalog/:type/meta/:id, /search
│   ├── stream.rs           # GET /sources/:type/:id — parallel fetch (tokio::join!)
│   ├── debrid.rs           # POST /debrid/:info_hash, /debrid/unrestrict
│   ├── fanart.rs           # GET /fanart/:type/:id, /fanart/:type/:id/logo
│   ├── artwork.rs          # GET /artwork/:media_type/:tmdb_id (cached bundles)
│   ├── playback.rs         # POST /playback/position, GET /playback/history
│   ├── profiles.rs         # CRUD /profiles/
│   ├── lists.rs            # CRUD /lists/, /lists/:id/items
│   ├── preferences.rs      # GET/POST /preferences/
│   ├── trakt.rs            # /trakt/auth/*, /trakt/scrobble/*
│   ├── user_progress.rs    # /user/progress/
│   └── collections.rs      # /collections/all, /collections/:id
├── services/
│   ├── realdebrid.rs       # RD API client, adaptive rate limiter, unrestrict_with_repair
│   ├── torrentio.rs        # Torrentio source fetcher
│   ├── prowlarr.rs         # Prowlarr indexer client
│   ├── wastream.rs         # Wastream DDL source fetcher
│   ├── flaresolverr.rs     # FlareSolverr proxy setup (called at startup)
│   └── trakt.rs            # Trakt API client (device auth, scrobble)
├── middleware/
│   └── cors.rs             # CORS for loopback + file://
└── .sqlx/                  # Committed — enables CI builds without live DB
```

**Key patterns:**
- **AppState** holds `SqlitePool`, `reqwest::Client`, and API keys as `Arc`
- Routes extract `State<Arc<AppState>>` and delegate to services
- SQL uses `sqlx::query!` macros for **compile-time verification**
- Stream scoring: language(0–600) + resolution(0–400) + quality(0–300) + RD cached bonus(+2000)
- Cache TTL: current year → 6h, last year → 24h, older → 7 days
- Real-Debrid: adaptive rate limiter (`OnceLock`+`Mutex`), adjusts on 429 responses
- 14 migrations total (latest: artwork_cache with 7-day TTL)

---

## Data Flow

### Content browsing
```
HomePage → useCatalogLoader → GET /catalog/{type}/{id} → TMDB API → React Query cache
                ↓
         ContentRail × 25 → ContentCard (lazy image load)
         + "Continue Watching" rail (from playback history)
         + "Top Rated" rail (vote_average ≥ 7.5)
```

### Playback
```
DetailPage → Play button → useDetailPlayback.handlePlay()
        ↓
GET /sources/{type}/{id}
        ↓
tokio::join! → Torrentio + Prowlarr + Wastream (parallel, 15-20s timeouts)
        ↓
parser.rs → 3-tier scoring → post_process_sources (dedup, filter, sort)
        ↓
POST /debrid/{info_hash} → RD cache probe → unrestrict
        ↓
Electron IPC → mpv-manager.js → MPV spawn with --force-media-title
        ↓
OverlayPage renders controls → BroadcastChannel syncs with main window
        ↓
POST /playback/position (periodically + on exit)
```

### Source scoring pipeline
```
Raw sources → parseTorrentName() → metadata extraction
        ↓
Language score (0-600): VFF > TRUEFRENCH > FRENCH > MULTI > VOSTFR > VO
Resolution score (0-400): 2160p > 1080p > 720p > 480p
Quality score (0-300): REMUX > BLURAY > WEB-DL > WEBRIP > HDTV
        ↓
Multi-level sort: cached > language > resolution > quality > seeders > size
```

---

## Zustand Stores

| Store | Persistence | Purpose |
|-------|-------------|---------|
| `useProfileStore` | localStorage | Active user profile |
| `usePreferencesStore` | localStorage | Language, quality, UI preferences |
| `useCatalogStore` | in-memory | Homepage rail data, favorites |
| `useLogStore` | in-memory | Debug log ring buffer (200 entries) |
| `useToastStore` | in-memory | UI toast notifications |

---

## Key Conventions

| Convention | Rule |
|-----------|------|
| Feature isolation | Features cannot import each other; shared code in `shared/` |
| State management | Zustand for client state, React Query for server state |
| API calls | Always via React Query hooks — stores never call APIs directly |
| Routing | HashRouter only (`file://` protocol) |
| Styling | Tailwind + CSS variables (`var(--color-*)`) — no inline CSS values |
| Types | TypeScript strict mode, no `any` or `@ts-ignore` |
| File size | Components must not exceed 300 lines |
| Naming | Files: kebab-case, Components: PascalCase, Hooks: useSomething |
| i18n | All user-facing strings via `useTranslation()` (fr.json + en.json) |
| a11y | `prefers-reduced-motion: reduce` in globals.css, aria-labels on icon buttons |
