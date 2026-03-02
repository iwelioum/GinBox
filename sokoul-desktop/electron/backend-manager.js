// ══════════════════════════════════════════════════════════
// BACKEND MANAGER — Lancement backend Rust local
// MIGRÉ DE : GinBox (logique process adaptée pour Electron)
// RÈGLES :
//   → Tourne sur 127.0.0.1:3000 uniquement
//   → Vérifie si le backend tourne AVANT de spawner (anti port 10048)
//   → Signal "SOKOUL_BACKEND_READY" surveillé sur stdout
//   → mainWindow défini APRÈS startBackend() via setMainWindow()
//   → Tué sur before-quit (jamais de processus fantôme)
// ══════════════════════════════════════════════════════════

const { spawn } = require('child_process')
const { app }   = require('electron')
const http      = require('http')
const path      = require('path')

// Vérifie si le backend répond déjà sur :3000 (évite l'erreur EADDRINUSE)
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
let mainWindowRef  = null   // Défini après createWindow()
let backendReady   = false  // Flag si READY reçu avant la fenêtre

// Appelé depuis main.js une fois la fenêtre créée
function setMainWindow(win) {
  mainWindowRef = win
  // Si le backend était déjà prêt avant que la fenêtre soit prête,
  // on envoie le signal maintenant.
  if (backendReady) {
    mainWindowRef.webContents.send('backend:ready')
  }
}

// startBackend est async pour pouvoir await isBackendRunning()
async function startBackend() {
  // ⭐ CORRECTION BUG PORT 10048 : ne pas spawner si déjà en cours
  const alreadyRunning = await isBackendRunning()
  if (alreadyRunning) {
    console.log('[Backend] Déjà démarré sur :3000 — réutilisation.')
    backendReady = true
    // setMainWindow() transmettra le signal dès que la fenêtre est prête
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
      // Sinon setMainWindow() transmettra le signal dès qu'il est appelé
    }
  })

  backendProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim()
    // Filtrer les messages non-critiques de tracing
    if (msg) console.error('[Backend]', msg)
  })

  backendProcess.on('error', (err) => {
    console.error('[Backend] Impossible de lancer le processus :', err.message)
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
