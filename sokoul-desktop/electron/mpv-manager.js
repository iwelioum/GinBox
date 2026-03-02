// ══════════════════════════════════════════════════════════
// mpv-manager.js — Cycle de vie du process MPV
// Responsabilité unique : spawn / kill
// Aucune logique IPC ici (réservée à mpv-ipc.js — Phase 2)
// ══════════════════════════════════════════════════════════

const { spawn }   = require('child_process')
const { app }     = require('electron')
const path        = require('path')

/** @type {import('child_process').ChildProcess | null} */
let mpvProcess = null
/** @type {Promise<boolean> | null} */
let killInFlight = null

/**
 * Attend la fin effective d'un process.
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
 * Dernier recours Windows: tuer l'arbre du process.
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
 * Tente plusieurs niveaux d'arrêt jusqu'à confirmation.
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

/**
 * Lance MPV avec une URL et un handle de fenêtre Electron.
 * Tue automatiquement tout process précédent.
 *
 * @param {string} url         — URL ou chemin du média à lire
 * @param {string | number} wid — HWND de la BrowserWindow Electron
 */
async function launch(url, wid) {
  // Tuer le process existant avant de relancer
  await kill()

  const mpvBin = path.join(app.getAppPath(), 'mpv', 'mpv.exe')

  // MPV attend un entier pur — parseInt évite les guillemets résiduels de BigInt.toString()
  const widInt = parseInt(wid.toString(), 10)

  const args = [
    url,
    `--wid=${widInt}`,
    '--no-border',
    '--no-osc',
    '--no-input-default-bindings',
    '--input-ipc-server=\\\\.\\pipe\\mpvsocket',
    '--pause',
    '--hwdec=no',
    '--vo=direct3d',
    '--keep-open=yes',
    '--volume=100',
  ]

  console.log(`[MPV] Launching: ${url} (wid: ${widInt})`)

  const proc = spawn(mpvBin, args, {
    stdio: 'ignore',
    detached: false,
  })
  mpvProcess = proc

  proc.on('error', (err) => {
    console.error(`[MPV] Error: ${err.message}`)
    if (mpvProcess === proc) mpvProcess = null
  })

  proc.on('exit', (code) => {
    console.log(`[MPV] Process exited (code: ${code})`)
    if (mpvProcess === proc) mpvProcess = null
  })
}

/**
 * Tue le process MPV en cours s'il existe.
 */
async function kill() {
  if (killInFlight) return killInFlight

  killInFlight = (async () => {
    if (mpvProcess === null) return true
    const proc = mpvProcess
    const stopped = await forceStop(proc)

    if (stopped || proc.exitCode !== null) {
      if (mpvProcess === proc) mpvProcess = null
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

module.exports = { launch, kill }
