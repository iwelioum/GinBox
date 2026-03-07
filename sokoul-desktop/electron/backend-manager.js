// ══════════════════════════════════════════════════════════
// BACKEND MANAGER — Local Rust backend launcher
// MIGRATED FROM: GinBox (process logic adapted for Electron)
// RULES:
//   → Runs on 127.0.0.1:3000 only
//   → Checks if backend is running BEFORE spawning (prevents port 10048 error)
//   → Watches for "SOKOUL_BACKEND_READY" signal on stdout
//   → mainWindow set AFTER startBackend() via setMainWindow()
//   → Killed on before-quit (no ghost processes)
// ══════════════════════════════════════════════════════════

const { spawn } = require('child_process')
const { app }   = require('electron')
const http      = require('http')
const path      = require('path')

// Checks if the backend is already responding on :3000 (avoids EADDRINUSE error)
async function isBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3000/health', (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => { resolve(data.includes('Sokoul')) })
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => { req.destroy(); resolve(false) })
  })
}

let backendProcess = null
let mainWindowRef  = null   // Set after createWindow()
let backendReady   = false  // Flag if READY received before window

// Called from main.js once the window is created
function setMainWindow(win) {
  mainWindowRef = win
  // If the backend was already ready before the window was ready,
  // send the signal now.
  if (backendReady) {
    mainWindowRef.webContents.send('backend:ready')
  }
}

// startBackend is async to await isBackendRunning()
async function startBackend() {
  // ⭐ PORT 10048 BUG FIX: do not spawn if already running
  const alreadyRunning = await isBackendRunning()
  if (alreadyRunning) {
    console.log('[Backend] Already running on :3000 — reusing.')
    backendReady = true
    // setMainWindow() will forward the signal once the window is ready
    return
  }

  const isDev = !app.isPackaged
  const backendPath = isDev
    ? path.join(__dirname, '../../sokoul-backend/target/debug/sokoul-backend.exe')
    : path.join(process.resourcesPath, 'sokoul-backend', 'sokoul-backend.exe')
  const backendCwd = isDev
    ? path.join(__dirname, '../../sokoul-backend')
    : path.dirname(backendPath)

  backendProcess = spawn(backendPath, [], {
    cwd:      backendCwd,
    stdio:    ['ignore', 'pipe', 'pipe'],
    detached: false,
  })

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString()
    if (output.includes('SOKOUL_BACKEND_READY')) {
      backendReady = true
      if (mainWindowRef) {
        mainWindowRef.webContents.send('backend:ready')
      }
      // Otherwise setMainWindow() will forward the signal when called
    }
  })

  backendProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim()
    // Filter non-critical tracing messages
    if (msg) console.error('[Backend]', msg)
  })

  backendProcess.on('error', (err) => {
    console.error('[Backend] Unable to launch process:', err.message)
    backendReady = false
    if (mainWindowRef) {
      mainWindowRef.webContents.send('backend:error', -1)
    }
  })

  backendProcess.on('exit', (code) => {
    backendReady = false
    if (code !== 0 && mainWindowRef) {
      mainWindowRef.webContents.send('backend:error', code)
    }
  })
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM')
    backendProcess = null
  }
  backendReady  = false
  mainWindowRef = null
}

module.exports = { startBackend, stopBackend, setMainWindow }
