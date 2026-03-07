# SOKOUL — FILE REFERENCE
# Quick lookup table for all 138 source files
# For architecture and layer rules → see REPO_MAP.md and ARCHITECTURE.md
# SOKOUL MONOREPO - QUICK FILE REFERENCE

## BACKEND (sokoul-backend/src/) - 34 Rust Files

### ROOT LEVEL (4,540 LOC total)
| File | LOC | Type | Purpose |
|------|-----|------|---------|
| main.rs | 120 | Handler | Axum app init, AppState, middleware setup |
| models.rs | 409 | Types | Domain structs (ContentType, Stream, Meta, Video) |
| parser.rs | 380 | Utility | Regex torrent title parser (quality, language, codec) |
| errors.rs | 54 | Types | AppError enum, HTTP error mapping |

### ROUTES/ - HTTP Handlers (1,220 LOC)
| File | LOC | Endpoint | Purpose |
|------|-----|----------|---------|
| stream.rs | 517⚠️ | GET /sources/:type/:id | Multi-source discovery, 3-tier scoring, dedup |
| catalog.rs | 152 | GET /catalog/:contentType | Browse library (movies/series) |
| debrid.rs | 144 | POST /debrid | Real-Debrid integration |
| fanart.rs | 112 | GET /fanart/:id | High-res artwork from FanArt.tv |
| lists.rs | 109 | Trakt lists | User watchlist/collections CRUD |
| playback.rs | 87 | POST/GET /playback | Progress tracking, resume points |
| trakt.rs | 72 | OAuth/sync | Trakt integration, user profile |
| user_progress.rs | 75 | User progress | Watch status, ratings |
| profiles.rs | 61 | Profiles | Multi-user support |
| collections.rs | 63 | GET /collections | Trakt lists |
| preferences.rs | 41 | GET/POST /preferences | User settings |
| artwork.rs | 48 | GET /artwork/:id | Poster/artwork |
| mod.rs | 12 | Aggregator | - |

### SERVICES/ - Business Logic & API Clients (3,045 LOC)
| File | LOC | Type | Purpose |
|------|-----|------|---------|
| tmdb.rs | 906⚠️ | Service | Metadata provider (movies, series, trending, search) |
| realdebrid.rs | 450⚠️ | Service | Debrid client (availability, unrestrict, adaptive rate limit) |
| trakt.rs | 304 | Service | Trakt API (lists, trends, OAuth, user sync) |
| artwork_resolver.rs | 296 | Service | Artwork resolution (priority from TMDB, FanArt, Trakt) |
| artwork_providers.rs | 251 | Service | Artwork abstraction layer |
| cache.rs | 223 | Service | Multi-level caching, dynamic TTL |
| fanart.rs | 208 | Service | FanArt.tv client |
| lists.rs | 264 | Service | User lists CRUD with Trakt sync |
| playback.rs | 129 | Service | Playback progress persistence |
| prowlarr.rs | 83 | Service | Prowlarr torrent indexer client |
| preferences.rs | 75 | Service | User settings management |
| profiles.rs | 70 | Service | Multi-profile support |
| torrentio.rs | 68 | Service | Torrentio API client |
| mod.rs | 13 | Aggregator | - |

### MIDDLEWARE/
| File | LOC | Purpose |
|------|-----|---------|
| cors.rs | 37 | CORS for loopback (127.0.0.1) + file:// only |
| rate_limit.rs | 11 | Placeholder for rate limiting |
| mod.rs | 2 | Aggregator |

---

## FRONTEND (sokoul-desktop/src/) - 96 TypeScript Files

### APP/ - Entry Point (83 LOC)
| File | LOC | Purpose |
|------|-----|---------|
| main.tsx | 29 | React root, QueryClient setup |
| App.tsx | 54 | HashRouter, route definitions, ErrorBoundary per feature |

### FEATURES/ - Feature Modules (10,200+ LOC)

#### CATALOG/ (1,600+ LOC) - Homepage & Browse
| File | LOC | Type | Purpose |
|------|-----|------|---------|
| components/BrowsePage.tsx | 1283⚠️ | Component | Browse with filters, sections, hover cards |
| components/CatalogFilters.tsx | 1079⚠️ | Component | Mega-filter (Type, Genres, Period, Rating, Duration, Language) |
| config/categories.config.ts | 726⚠️ | Config | Homepage section definitions |
| components/HeroBanner.tsx | 592 | Component | Cinematic hero with auto-slide (8s), backdrop, title |
| components/ProfileSelectPage.tsx | 314 | Component | Multi-user profile selection |
| components/HomePage.tsx | 278 | Component | Hero + trending/popular rails |
| components/CollectionsPage.tsx | 268 | Component | Trakt collections grid |
| hooks/useCatalogLoader.ts | 97 | Hook | Fetch catalog items with batch queries |
| components/HoverCard.tsx | 138 | Component | Floating preview card on hover |
| components/ContentCard.tsx | 161 | Component | Individual content tile (poster, rating) |
| components/MyListsPage.tsx | 115 | Component | User lists/watchlist |
| components/ActorPage.tsx | 154 | Component | Actor filmography |
| components/CollectionDetailPage.tsx | 152 | Component | Collection detail |
| components/BrandRow.tsx | 90 | Component | Logo/brand carousel |
| components/ContentRail.tsx | 74 | Component | Horizontal scrolling section |
| components/DebugPage.tsx | 61 | Component | Developer debug interface |
| store/catalog.store.ts | 55 | Store | Catalog UI state |
| hooks/useCollectionQuery.ts | 15 | Hook | Fetch single collection |
| components/SettingsPage.tsx | 12 | Component | Settings (stub) |
| components/ProfilePage.tsx | 10 | Component | Profile mgmt (stub) |
| index.ts | 18 | Aggregator | - |

#### DETAIL/ (2,600+ LOC) - Content Detail Page
| File | LOC | Type | Purpose |
|------|-----|------|---------|
| components/SourcesPage.tsx | 764 | Component | Stream sources table, quality, language, seeders |
| components/DetailPage.tsx | 559 | Component | Main detail container |
| components/HeroSection.tsx | 206 | Component | Backdrop, title, rating, play button |
| components/StatsSection.tsx | 203 | Component | Rating, popularity, providers, certification |
| components/InfoSection.tsx | 166 | Component | Runtime, year, genres, network |
| components/GallerySection.tsx | 114 | Component | Photo gallery with lightbox |
| components/CastSection.tsx | 95 | Component | Cast carousel |
| components/SourceRow.tsx | 95 | Component | Single source entry |
| components/TrailerSection.tsx | 87 | Component | Video trailers/clips |
| components/SagaSection.tsx | 91 | Component | Franchise/collection grouping |
| components/SimilarSection.tsx | 65 | Component | Recommendations carousel |
| hooks/useDetailQuery.ts | 16 | Hook | Fetch content metadata |
| hooks/useCreditsQuery.ts | 16 | Hook | Fetch cast/crew |
| hooks/useImagesQuery.ts | 17 | Hook | Fetch images |
| hooks/useSimilarQuery.ts | 17 | Hook | Fetch recommendations |
| hooks/useVideosQuery.ts | 17 | Hook | Fetch trailers |
| components/DetailSkeleton.tsx | 16 | Component | Loading skeleton |
| index.ts | 17 | Aggregator | - |

#### PLAYER/ (2,000+ LOC) - MPV Playback & Controls
| File | LOC | Type | Purpose |
|------|-----|------|---------|
| components/PlayerPage.tsx | 248 | Component | Main video container, overlay coordination |
| hooks/useEpisodeNavigation.ts | 199 | Hook | Series next/prev episode navigation |
| hooks/useMpv.ts | 130 | Hook | MPV lifecycle, IPC, event listeners |
| components/OverlayPage.tsx | 182 | Component | Transparent overlay window contents |
| components/ControlsBar.tsx | 147 | Component | Play/pause, progress, volume controls |
| components/SourcePanel.tsx | 150 | Component | Source/stream selection during playback |
| components/SubtitlesPanel.tsx | 141 | Component | Subtitle track selection, offset |
| components/HeaderOverlay.tsx | 139 | Component | Top overlay (title, back button) |
| components/LoadingScreen.tsx | 125 | Component | Loading indicator |
| hooks/useSwitchSource.ts | 141 | Hook | Change playback source |
| components/ProgressBar.tsx | 90 | Component | Scrubber bar with timeline |
| components/AudioPanel.tsx | 97 | Component | Audio track selection |
| components/EpisodeOverlay.tsx | 111 | Component | Episode selection panel |
| hooks/usePlayerInfo.ts | 58 | Hook | Player metadata (title, position, duration) |
| hooks/useProgressSave.ts | 63 | Hook | Auto-save progress to backend |
| hooks/usePlayerBroadcast.ts | 47 | Hook | Sync main ↔ overlay windows |
| types/player.types.ts | 16 | Types | Player state definitions |
| utils/formatTime.ts | 10 | Utility | Format seconds to HH:MM:SS |
| components/VideoContainer.tsx | 30 | Component | MPV canvas/wid container |
| index.ts | 18 | Aggregator | - |

#### SEARCH/ (83 LOC)
| File | LOC | Purpose |
|------|-----|---------|
| components/SearchPage.tsx | 82 | Content search interface |
| index.ts | 1 | Placeholder |

### SHARED/ - Cross-Feature Code (1,629 LOC)

#### API/
| File | LOC | Purpose |
|------|-----|---------|
| api/client.ts | 135 | Axios client (baseURL: 127.0.0.1:3000) |

#### COMPONENTS/
| File | LOC | Purpose |
|------|-----|---------|
| layout/Navbar.tsx | 151 | Top nav (search, profile, settings) |
| layout/TitleBar.tsx | 55 | Electron frameless window controls |
| ui/ErrorBoundary.tsx | 54 | Feature-level crash isolation |
| modals/ResumeModal.tsx | 71 | Resume from timestamp dialog |
| ui/Button.tsx | 35 | Reusable button component |
| ui/Spinner.tsx | 31 | Loading spinner |
| layout/Layout.tsx | 18 | Main layout wrapper |

#### HOOKS/
| File | LOC | Purpose |
|------|-----|---------|
| useMouseIdle.ts | 58 | Detect idle time for overlay fade |
| useAmbientColor.ts | 49 | Backdrop blur + color tint |
| useDynamicAccentColor.ts | 40 | Extract dominant color from image |
| useLists.ts | 48 | Fetch user lists |
| useHoverCard.ts | 29 | Hover card positioning |
| useScrollPosition.ts | 15 | Scroll to top/bottom detection |

#### UTILS/
| File | LOC | Purpose |
|------|-----|---------|
| genreTheme.ts | 295 | Genre-to-visual-theme mapping |
| contentKind.ts | 184 | Content classification (movie/series/status) |
| fanart.ts | 156 | FanArt.tv image resolution |
| parsing.ts | 124 | Stream title parsing, quality extraction |
| extractColor.ts | 73 | Dominant color extraction |
| topPosters.ts | 43 | Select top quality poster |
| time.ts | 11 | Time formatting |
| tmdb.ts | 11 | TMDB logo extraction |
| error.ts | 22 | Error message formatting |
| glassStyles.ts | 29 | Frosted glass effect CSS |
| hoverCardPosition.ts | 28 | Hover card position calculation |

#### STORES/ (Zustand Client State)
| File | LOC | Purpose |
|------|-----|---------|
| preferencesStore.ts | 44 | User preferences (theme, language, quality) |
| logStore.ts | 54 | Debug logs for DevTools |
| profileStore.ts | 21 | Current active profile |
| index.ts | 5 | Aggregator |

#### TYPES/
| File | LOC | Purpose |
|------|-----|---------|
| index.ts | 226 | Central TypeScript types (CatalogMeta, ContentType, etc.) |
| ipc.d.ts | 68 | Electron IPC channel types |

#### i18n/
| File | LOC | Purpose |
|------|-----|---------|
| index.ts | 14 | i18next configuration |

### STYLES/
| File | LOC | Purpose |
|------|-----|---------|
| globals.css | 73 | Tailwind directives, custom properties |
| animations.css | 51 | Custom animations (fade, slide, pulse) |
| player.tokens.css | 32 | Player UI CSS custom properties |

### CONFIG FILES
| File | Purpose |
|------|---------|
| vite-env.d.ts | 1 LOC | Vite client types |

---

## ELECTRON MAIN PROCESS (sokoul-desktop/electron/) - 5 JavaScript Files

| File | LOC | Purpose |
|------|-----|---------|
| main.js | 196 | App lifecycle, dual-window creation, IPC setup |
| mpv-ipc.js | 250 | JSON-RPC over named pipe to MPV (250ms polling) |
| mpv-manager.js | 276 | MPV spawning, lifecycle, event handling |
| backend-manager.js | 98 | Rust backend spawning, readiness detection |
| preload.js | 75 | Context bridge: window.mpv, window.electronAPI, window.overlay |

---

## ROOT CONFIG FILES

| File | Purpose |
|------|---------|
| sokoul-backend/Cargo.toml | Rust manifest + dependencies |
| sokoul-desktop/package.json | NPM manifest + build scripts |
| sokoul-desktop/tsconfig.json | TypeScript strict mode + path alias @/* |
| sokoul-desktop/tsconfig.node.json | TS config for build tools |
| sokoul-desktop/vite.config.ts | Bundler config |
| sokoul-desktop/tailwind.config.js | Tailwind theme |
| sokoul-desktop/postcss.config.mjs | PostCSS pipeline |
| sokoul-desktop/eslint.config.js | Linting rules |
| sokoul-desktop/electron-builder.config.js | Windows NSIS installer |
| .github/copilot-instructions.md | Architecture documentation (145 LOC) ✓ |

---

## SCRIPTS (sokoul-desktop/scripts/) - Development Automation

### dev/
- start-all.bat - Start backend + frontend together
- start-backend.bat - Backend only
- start-desktop.bat - Frontend only
- watch-types.bat - TypeScript watcher
- live-logs.bat / live-logs.ps1 - Aggregate logs

### maintenance/
- reset-database.bat - Wipe SQLite DB
- clear-artwork-cache.bat - Clear cached images
- check-prerequisites.bat - Verify Node, Rust, MPV, .env
- check-env.bat - Validate environment variables
- diagnose.bat / diagnose.ps1 - Full system diagnostic
- audit.bat - Code quality checks

---

## SPECIAL NOTES

### Architecture
- Loopback-only API: 127.0.0.1:3000 (CORS restricted to Electron)
- Dual-window player: Main (video) + Overlay (controls) synced via BroadcastChannel
- Named pipe IPC with MPV: \\.\pipe\mpv-{pid}
- HashRouter required for file:// support in Electron

### Stream Discovery Pipeline
1. Fetch from Prowlarr/Torrentio (torrents)
2. Instant availability check via Real-Debrid
3. Score: language(0-600) + resolution(0-400) + quality(0-300)
4. Dedup by info_hash + normalized filename
5. Sort: cached > language > resolution > quality > seeders > size
6. Cap at 20 results

### Caching Strategy
- Database-backed with dynamic TTL
- Current year: 6 hours
- Last year: 24 hours
- Older: 7 days
- Stale-while-revalidate pattern

### Real-Debrid Integration
- Adaptive rate limiting via OnceLock + Mutex singleton
- Adjusts interval based on 429 responses
- Converts magnet/file ID to HTTPS direct links

---

Generated: 2026-03-07 02:35:37
