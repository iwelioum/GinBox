// ══════════════════════════════════════════════════════════
// MAIN.JS — Sokoul main window
// MPV player: to implement (phase 1+)
// ══════════════════════════════════════════════════════════

const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { startBackend, stopBackend, setMainWindow } = require('./backend-manager')
const mpvManager = require('./mpv-manager')
const mpvIpc     = require('./mpv-ipc')

// Disable Chromium GPU acceleration — required for MPV to render
// into the window via --wid (otherwise: audio OK, black screen)
app.disableHardwareAcceleration()

let mainWindow      = null
let mainWindowHwnd  = null   // Native HWND — retrieved after window loads
let overlayWindow   = null   // Transparent overlay window — MPV controls

// ── IPC ───────────────────────────────────────────────────────────────────────
function registerIpcHandlers() {
  // Main window controls
  ipcMain.handle('window:minimize',      () => mainWindow?.minimize())
  ipcMain.handle('window:maximize',      () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize())
  ipcMain.handle('window:close',         () => mainWindow?.close())
  ipcMain.handle('window:isMaximized',   () => mainWindow?.isMaximized() ?? false)
  ipcMain.handle('window:setFullscreen', (_, flag) => mainWindow?.setFullScreen(flag))
  ipcMain.handle('shell:openExternal',   (_, url)  => shell.openExternal(url))

  // ── MPV (notifications handled by mpv-manager via setWindows) ──────────
  ipcMain.handle('mpv:launch', (_, { url }) => mpvManager.launch(url, mainWindowHwnd))
  ipcMain.handle('mpv:kill', () => mpvManager.kill())

  ipcMain.handle('mpv:waitUntilReady', async (_, retries = 20, delayMs = 150) => {
    const retryCount = typeof retries === 'number' && retries > 0 ? Math.floor(retries) : 20
    const retryDelay = typeof delayMs === 'number' && delayMs > 0 ? Math.floor(delayMs) : 150
    try {
      await mpvIpc.waitForSocket(retryCount, retryDelay)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[MPV IPC] waitUntilReady failed: ${message}`)
      return false
    }
  })

  // mpv:command — silent catch: MPV may not be running (overlay polling)
  ipcMain.handle('mpv:command', async (_, cmd) => {
    try {
      return await mpvIpc.sendCommand(cmd)
    } catch {
      return null  // MPV unavailable — caller receives null
    }
  })

  // Audio & subtitle tracks (filtering in main to lighten renderer)
  ipcMain.handle('mpv:getAudioTracks', async () => {
    try { return await mpvIpc.getAudioTracks() }
    catch { return [] }
  })
  ipcMain.handle('mpv:getSubtitleTracks', async () => {
    try { return await mpvIpc.getSubtitleTracks() }
    catch { return [] }
  })

  // ── Overlay — mouse capture ──────────────────────────────────────────
  // enable=true  : overlay captures clicks (clickable buttons)
  // enable=false : clicks pass through to MPV (setIgnoreMouseEvents forward)
  ipcMain.handle('overlay:capture', (_, enable) => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return
    if (enable) {
      overlayWindow.setIgnoreMouseEvents(false)
    } else {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    }
  })

  // ── Back from overlay → PlayerPage navigates to detail page ──
  ipcMain.handle('overlay:back', (_, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('player:back', data)
    }
  })

  // ── Fullscreen toggle ─────────────────────────────────────────────────
  ipcMain.handle('window:toggleFullscreen', () => {
    const isFs = mainWindow.isFullScreen()
    mainWindow.setFullScreen(!isFs)
  })
  ipcMain.handle('window:isFullscreen', () => {
    return mainWindow.isFullScreen()
  })
}

// ── Transparent overlay window (MPV controls) ─────────────────────────────
function createOverlay() {
  if (!mainWindow || mainWindow.isDestroyed()) return

  const b = mainWindow.getBounds()

  overlayWindow = new BrowserWindow({
    x:           b.x,
    y:           b.y,
    width:       b.width,
    height:      b.height,
    show:            false,  // hidden until ready-to-show — avoids startup flash
    frame:           false,
    transparent:     true,
    backgroundColor: '#00000000',  // Chromium starts transparent before any CSS
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable:   false,
    focusable:   false,  // WS_EX_NOACTIVATE — clicks captured without stealing focus from mainWindow
    parent:      mainWindow,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  // Show without stealing focus once React is ready
  overlayWindow.once('ready-to-show', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.showInactive()
    }
  })

  // Start in passthrough mode — clicks go to MPV
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })

  app.isPackaged
    ? overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/overlay' })
    : overlayWindow.loadURL('http://localhost:5173/#/overlay')

  // Helper: resync overlay bounds to mainWindow bounds
  function syncOverlayBounds() {
    if (!overlayWindow || overlayWindow.isDestroyed()) return
    const nb = mainWindow.getBounds()
    overlayWindow.setBounds({ x: nb.x, y: nb.y, width: nb.width, height: nb.height })
  }

  // Follow resize / move / fullscreen changes
  mainWindow.on('resize',            syncOverlayBounds)
  mainWindow.on('move',              syncOverlayBounds)
  mainWindow.on('enter-full-screen', syncOverlayBounds)
  mainWindow.on('leave-full-screen', syncOverlayBounds)

  overlayWindow.on('closed', () => { overlayWindow = null })
}

// ── Main window ────────────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          720,
    minWidth:        1024,
    minHeight:       600,
    frame:           false,
    backgroundColor: '#000000',
    webPreferences: {
      contextIsolation:            true,
      nodeIntegration:             false,
      sandbox:                     true,
      preload:                     path.join(__dirname, 'preload.js'),
      allowRunningInsecureContent: false,
      webSecurity:                 true,
    },
  })

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, cb) => {
    const csp = app.isPackaged
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://image.tmdb.org https://assets.fanart.tv data: blob:",
          "connect-src 'self' http://127.0.0.1:3000 https://api.themoviedb.org https://api.trakt.tv",
          "font-src 'self' data:",
        ].join('; ')
      : [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "img-src 'self' https://image.tmdb.org https://assets.fanart.tv data: blob:",
          "connect-src 'self' http://127.0.0.1:3000 https://api.themoviedb.org https://api.trakt.tv https://*.tmdb.org ws://localhost:5173",
          "font-src 'self' data:",
        ].join('; ')

    cb({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [csp] } })
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  app.isPackaged
    ? await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    : await mainWindow.loadURL('http://localhost:5173')

  // Retrieve HWND after loading — passed to MPV via --wid
  const hwndBuf   = mainWindow.getNativeWindowHandle()
  mainWindowHwnd  = hwndBuf.readBigInt64LE(0).toString()
  console.log(`[MAIN] HWND : ${mainWindowHwnd}`)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  await startBackend()
  registerIpcHandlers()
  await createWindow()
  setMainWindow(mainWindow)
  createOverlay()
  mpvManager.setWindows(mainWindow, overlayWindow)
})

app.on('before-quit', () => {
  stopBackend()
  mpvManager.kill()
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.close()
})
app.on('window-all-closed', () => app.quit())
