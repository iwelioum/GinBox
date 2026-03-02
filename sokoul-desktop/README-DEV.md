# SOKOUL Desktop — Developer Guide

## Prerequisites

| Tool           | Version  | Notes                                              |
|----------------|----------|----------------------------------------------------|
| Node.js        | >= 18    | Required for Vite dev server and Electron           |
| npm             | >= 9     | Comes with Node.js                                 |
| Rust toolchain | >= 1.70  | Required for the backend API server (`sokoul-backend`) |
| MPV player     | Latest   | Must be installed and accessible in `PATH`          |
| Electron       | 31.x     | Installed via npm                                  |

## Environment Variables

The **Rust backend** (not the frontend) requires these variables in its `.env`:

| Variable         | Required | Description                              |
|------------------|----------|------------------------------------------|
| `TMDB_API_KEY`   | Yes      | TMDB v3 API key for catalog metadata     |
| `RD_API_KEY`     | Yes      | Real-Debrid API token for link unrestriction |
| `FANART_API_KEY` | No       | Fanart.tv key for HD logos and artwork   |

The Vite frontend has no environment variables — all API calls go through the
Rust backend at `http://127.0.0.1:3000`.

## npm Scripts

| Script              | Command                        | Description                                      |
|---------------------|--------------------------------|--------------------------------------------------|
| `npm run dev`       | `vite`                         | Start Vite dev server (frontend only, port 5173) |
| `npm run build`     | `tsc && vite build`            | Type-check then production build to `dist/`      |
| `npm run check`     | `tsc --noEmit`                 | Type-check without emitting (CI / pre-commit)    |
| `npm run electron:dev`   | `concurrently vite + electron` | Full desktop dev: Vite + Electron in parallel   |
| `npm run electron:build` | `build + electron-builder`     | Package as Windows `.exe`                       |

**Typical development workflow:**

1. Start the Rust backend (`sokoul-backend`) on port 3000
2. Run `npm run electron:dev` — opens the Electron window with hot-reload
3. The overlay window opens automatically when MPV playback starts

## Project Structure

```
src/
  app/             App.tsx (router root), main.tsx (entry point)
  api/             Axios client, endpoint definitions
  features/
    player/        MPV playback: OverlayPage, PlayerPage, hooks, controls
    catalog/       Home browsing: HomePage, rails, catalog store, filters
    detail/        Content detail: DetailPage, sources, trailers, gallery
  shared/
    components/    Reusable UI (ErrorBoundary, etc.)
    hooks/         Cross-feature hooks (useSearch, useLists, useMouseIdle)
    stores/        Zustand stores (profile, preferences, debug log)
    utils/         Pure functions (TMDB helpers, parsing, formatting)
    types/         Central domain types (CatalogMeta, Source, etc.)
  styles/          Global CSS, player token variables
  ipc.d.ts         TypeScript declarations for Electron IPC bridge

electron/
  main.js          Electron main process, window management
  preload.js       contextBridge exposing mpv/overlay/electronAPI
  mpv-manager.js   MPV process lifecycle (launch, kill)
  mpv-ipc.js       Named pipe IPC to MPV's JSON protocol
  backend-manager.js  Rust backend process lifecycle
```

## IPC Architecture

SOKOUL uses a dual-window architecture with three IPC channels:

```
+------------------+    BroadcastChannel    +------------------+
|   Main Window    | ---------------------> |  Overlay Window  |
|   (PlayerPage)   |    'player_info'       |  (OverlayPage)   |
+--------+---------+                        +--------+---------+
         |                                           |
         | Electron IPC                              | Electron IPC
         | (ipcRenderer.invoke)                      | (ipcRenderer.on)
         v                                           v
+--------+---------+                        +--------+---------+
|   Main Process   |                        |  window.overlay   |
|   (main.js)      |                        |  capture / back   |
+--------+---------+                        +-------------------+
         |
         | Named Pipe (JSON IPC)
         v
+--------+---------+
|   MPV Process    |
|   (mpv.exe)      |
+------------------+
```

### Channel Details

| Channel              | Transport         | Direction        | Purpose                                |
|----------------------|-------------------|------------------|----------------------------------------|
| `window.mpv`         | Electron IPC      | Renderer -> Main | Control MPV: play, pause, seek, tracks |
| `window.overlay`     | Electron IPC      | Renderer -> Main | Toggle overlay capture, navigate back  |
| `window.electronAPI` | Electron IPC      | Renderer -> Main | Window controls (min/max/close/fullscreen) |
| `player_info`        | BroadcastChannel  | Main -> Overlay  | Real-time player state sync            |
| `mpv:active`         | Electron IPC      | Main -> Renderer | MPV process lifecycle notifications    |

### Why Two Windows?

MPV renders directly into the main window's HWND via `--wid`. This means the
main window's DOM is hidden behind the MPV video surface. The overlay window is
a transparent, always-on-top, click-through window that renders player controls
on top of MPV. The main window broadcasts its player state via
`BroadcastChannel` so the overlay can display it without direct MPV access.

## Known Caveats

1. **MPV path**: MPV must be in the system `PATH` or its location must be
   configured in `electron/mpv-manager.js`. On Windows, the typical path is
   `C:\mpv\mpv.exe`.

2. **GPU acceleration disabled**: `app.disableHardwareAcceleration()` is called
   in `main.js` because Chromium's GPU compositor conflicts with MPV's
   `--wid` rendering (audio plays but video is black without this).

3. **Real-Debrid token**: The RD API key must be valid and have premium status
   for torrent unrestriction to work. Expired tokens cause silent playback
   failures.

4. **TMDB rate limits**: The catalog loader fires 23 parallel requests on
   startup. TMDB's free tier allows 40 requests per 10 seconds — usually fine,
   but may cause 429 errors on slow connections.

5. **BroadcastChannel**: Only works between same-origin windows. Both the main
   and overlay windows must be loaded from the same Vite dev server or the same
   `file://` path in production.

6. **HashRouter**: The app uses `HashRouter` (not `BrowserRouter`) because
   Electron loads pages via `file://` protocol, which doesn't support
   client-side routing with `pushState`.

## Architecture Decisions

- **Feature-Sliced Design**: Code is organized by feature (player, catalog,
  detail) rather than by type (components, hooks) to keep related code together.

- **Zustand stores are pure state**: No API calls in stores. All side effects
  live in hooks that read/write to stores. This makes stores predictable and
  testable.

- **TanStack Query for server state**: API data is managed by React Query, not
  Zustand. Zustand only holds client-side state (catalog rail data, UI prefs).

- **Error Boundaries per feature**: Each route is wrapped in its own
  `ErrorBoundary` so a crash in the player doesn't unmount the catalog.

- **No ESLint**: The project currently has no ESLint configuration. TypeScript
  strict mode (`tsc --noEmit`) is the sole static analysis tool.
