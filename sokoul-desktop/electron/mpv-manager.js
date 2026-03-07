// ══════════════════════════════════════════════════════════
// mpv-manager.js — MPV process lifecycle
// Responsibility: spawn / kill / reuse instance / error detection
// UI notifications: mpv:active, mpv:error, playback-position-update
// ══════════════════════════════════════════════════════════

const { spawn }   = require('child_process')
const { app }     = require('electron')
const path        = require('path')
const mpvIpc      = require('./mpv-ipc')

/** @type {import('child_process').ChildProcess | null} */
let mpvProcess = null
/** @type {Promise<boolean> | null} */
let killInFlight = null
/** @type {Electron.BrowserWindow | null} */
let mainWindow = null
/** @type {Electron.BrowserWindow | null} */
let overlayWindow = null

// ── MPV error translation table (stderr → UI message) ────────────────

const ERROR_PATTERNS = [
  { pattern: /Failed to open/i,                         message: 'Failed to open stream. Invalid URL or unreachable server.' },
  { pattern: /Protocol not found|Unsupported protocol/i, message: 'Unsupported protocol. Check the stream URL.' },
  { pattern: /Connection refused|Could not connect/i,   message: 'Unable to connect to the streaming server.' },
  { pattern: /403|Forbidden/i,                          message: 'Access denied. The stream requires authentication.' },
  { pattern: /404|Not Found/i,                          message: 'Stream not found. Incorrect or expired URL.' },
  { pattern: /Timed out|timeout/i,                      message: 'Connection timeout. The server is not responding.' },
]

// ── UI notifications ───────────────────────────────────────────────────────

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send(channel, data)
  }
}

function notifyActive(active) { sendToRenderer('mpv:active', active) }

function notifyError(message) {
  console.error(`[MPV] Error: ${message}`)
  sendToRenderer('mpv:error', message)
}

function detectErrorInLine(line) {
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(line)) {
      notifyError(message)
      return
    }
  }
}

// ── Position polling (delegates to mpv-ipc, routes to renderer) ──────────────

function startPolling() {
  mpvIpc.startPositionPolling((position, duration) => {
    sendToRenderer('playback-position-update', {
      positionSeconds: position,
      durationSeconds: duration,
    })
  })
}

// ── Stop helpers ────────────────────────────────────────────────────────

/**
 * Waits for a process to actually exit.
 * @param {import('child_process').ChildProcess} proc
 * @param {number} timeoutMs
 * @returns {Promise<boolean>}
 */
function waitForExit(proc, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false
    /** @type {NodeJS.Timeout | null} */
    let timer = null

    const done = (ok) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      proc.removeListener('exit', onExit)
      proc.removeListener('error', onError)
      resolve(ok)
    }

    const onExit = () => done(true)
    const onError = (err) => {
      console.warn(`[MPV] Exit wait error: ${err.message}`)
      done(true)
    }

    proc.once('exit', onExit)
    proc.once('error', onError)
    timer = setTimeout(() => done(false), timeoutMs)
  })
}

/**
 * Last resort on Windows: kill the process tree.
 * @param {number} pid
 * @returns {Promise<boolean>}
 */
function taskkillTree(pid) {
  return new Promise((resolve) => {
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })

    killer.once('error', (err) => {
      console.error(`[MPV] taskkill error: ${err.message}`)
      resolve(false)
    })
    killer.once('exit', (code) => resolve(code === 0))
  })
}

/**
 * Tries multiple levels of termination until confirmed.
 * @param {import('child_process').ChildProcess} proc
 * @returns {Promise<boolean>}
 */
async function forceStop(proc) {
  if (proc.exitCode !== null) return true

  try {
    proc.kill('SIGTERM')
  } catch (err) {
    console.warn(`[MPV] SIGTERM failed: ${err.message}`)
  }
  if (await waitForExit(proc, 1200)) {
    console.log('[MPV] Process killed (SIGTERM)')
    return true
  }

  try {
    proc.kill('SIGKILL')
  } catch (err) {
    console.warn(`[MPV] SIGKILL failed: ${err.message}`)
  }
  if (await waitForExit(proc, 1200)) {
    console.log('[MPV] Process killed (SIGKILL)')
    return true
  }

  if (typeof proc.pid === 'number' && proc.pid > 0) {
    const killedByTaskkill = await taskkillTree(proc.pid)
    if (!killedByTaskkill) {
      console.warn(`[MPV] taskkill returned non-zero for PID ${proc.pid}`)
    }
    if (await waitForExit(proc, 1200)) {
      console.log('[MPV] Process killed (taskkill)')
      return true
    }
  }

  console.error('[MPV] Unable to confirm process termination')
  return false
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Registers Electron window references for notifications.
 * @param {Electron.BrowserWindow} main
 * @param {Electron.BrowserWindow | null} overlay
 */
function setWindows(main, overlay) {
  mainWindow = main
  overlayWindow = overlay
}

/** @returns {boolean} */
function isAlive() {
  return mpvProcess !== null && mpvProcess.exitCode === null
}

/**
 * Launches MPV with a URL and an Electron window handle.
 * If MPV is already alive → reuses instance (loadfile IPC).
 * Otherwise → kills the old one + spawns a new process.
 *
 * @param {string} url         — URL or path to the media to play
 * @param {string | number} wid — Electron BrowserWindow HWND
 */
async function launch(url, wid) {
  // ── Reuse: if MPV alive → loadfile instead of respawn ───────────────
  if (mpvProcess && mpvProcess.exitCode === null) {
    const result = await mpvIpc.loadFile(url)
    if (result && result.error === 'success') {
      startPolling()
      notifyActive(true)
      console.log(`[MPV] Reuse instance: loaded ${url}`)
      return
    }
    // IPC failed → kill and respawn
    console.warn('[MPV] Reuse failed, respawning')
    await kill()
  }

  // ── Spawn new process ────────────────────────────────────────────
  await kill()

  const mpvBin = path.join(app.getAppPath(), 'mpv', 'mpv.exe')
  const widInt = parseInt(wid.toString(), 10)
  const pipeName = `\\\\.\\pipe\\mpv-${Date.now()}`

  mpvIpc.setPipePath(pipeName)

  const args = [
    url,
    `--wid=${widInt}`,
    '--no-border',
    '--no-osc',
    '--no-input-default-bindings',
    `--input-ipc-server=${pipeName}`,
    '--idle=yes',
    '--pause',
    '--hwdec=no',
    '--vo=direct3d',
    '--keep-open=yes',
    '--volume=100',
  ]

  console.log(`[MPV] Launching: ${url} (wid: ${widInt})`)

  const proc = spawn(mpvBin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })
  mpvProcess = proc

  // Drain stdout (prevent buffer blocking)
  proc.stdout.on('data', () => {})

  // Parse stderr to detect stream errors
  let stderrBuffer = ''
  proc.stderr.on('data', (chunk) => {
    stderrBuffer += chunk.toString()
    const lines = stderrBuffer.split('\n')
    stderrBuffer = lines.pop()
    for (const line of lines) {
      if (line.trim()) detectErrorInLine(line)
    }
  })

  proc.on('exit', (code) => {
    // Flush remaining stderr
    if (stderrBuffer.trim()) detectErrorInLine(stderrBuffer)
    stderrBuffer = ''

    console.log(`[MPV] Process exited (code: ${code})`)
    if (mpvProcess === proc) {
      mpvProcess = null
      mpvIpc.stopPositionPolling()
      notifyActive(false)
      if (code !== 0 && code !== null) {
        notifyError(`MPV stopped unexpectedly (code: ${code})`)
      }
    }
  })

  proc.on('error', (err) => {
    console.error(`[MPV] Spawn error: ${err.message}`)
    if (mpvProcess === proc) {
      mpvProcess = null
      mpvIpc.stopPositionPolling()
      notifyActive(false)
      notifyError(`Unable to launch MPV: ${err.message}`)
    }
  })

  // Wait for the IPC pipe to be ready then start polling
  try {
    await mpvIpc.waitForSocket(20, 150)
    startPolling()
    notifyActive(true)
  } catch (err) {
    console.warn(`[MPV] IPC not ready: ${err.message}`)
  }
}

/**
 * Kills the current MPV process if it exists.
 */
async function kill() {
  if (killInFlight) return killInFlight

  killInFlight = (async () => {
    mpvIpc.stopPositionPolling()

    if (mpvProcess === null) return true
    const proc = mpvProcess
    const stopped = await forceStop(proc)

    if (stopped || proc.exitCode !== null) {
      if (mpvProcess === proc) {
        mpvProcess = null
        notifyActive(false)
      }
      return true
    }

    console.warn('[MPV] kill() failed — process handle kept for retry')
    return false
  })()

  try {
    return await killInFlight
  } finally {
    killInFlight = null
  }
}

module.exports = { launch, kill, setWindows, isAlive }
