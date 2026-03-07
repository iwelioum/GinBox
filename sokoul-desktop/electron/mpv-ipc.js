// ══════════════════════════════════════════════════════════
// mpv-ipc.js — Communication with MPV via Windows named pipe
// Responsibility: send JSON commands, read properties,
//   position polling, audio/subtitle track management
// No spawn/kill logic here (reserved for mpv-manager.js)
// ══════════════════════════════════════════════════════════

const net = require('net')

/** @type {string | null} */
let pipePath = null
/** @type {NodeJS.Timeout | null} */
let pollingTimeout = null
/** @type {NodeJS.Timeout | null} */
let pollingInterval = null

const IPC_TIMEOUT_MS = 2000
const POLL_INTERVAL_MS = 5000
const POLL_INITIAL_DELAY_MS = 2000

// ── Pipe path (dynamic, set by mpv-manager on spawn) ───────────────────

/** @param {string} path */
function setPipePath(path) { pipePath = path }

/** @returns {string | null} */
function getPipePath() { return pipePath }

// ── Connection ──────────────────────────────────────────────────────────────

/**
 * Waits until the MPV IPC pipe is ready.
 * Used only at launch — not before every command.
 *
 * @param {number} retries   — Maximum number of attempts
 * @param {number} delayMs   — Delay between each attempt (ms)
 * @returns {Promise<void>}
 */
function waitForSocket(retries = 10, delayMs = 200) {
  return new Promise((resolve, reject) => {
    if (!pipePath) {
      reject(new Error('[MPV IPC] Pipe path not set'))
      return
    }

    let attempts = 0

    function attempt() {
      const socket = net.createConnection(pipePath)

      socket.once('connect', () => {
        socket.destroy()
        resolve()
      })

      socket.once('error', () => {
        socket.destroy()
        if (++attempts >= retries) {
          reject(new Error('[MPV IPC] Socket unavailable after all attempts'))
          return
        }
        setTimeout(attempt, delayMs)
      })
    }

    attempt()
  })
}

/**
 * Sends a JSON command to the MPV pipe.
 * 2s timeout — returns null if no response or connection error.
 *
 * @param {object} cmd — Command object (e.g.: { command: ['set_property', 'pause', false] })
 * @returns {Promise<any>}
 */
function sendCommand(cmd) {
  return new Promise((resolve) => {
    if (!pipePath) return resolve(null)

    const socket = net.createConnection(pipePath)
    let buffer = ''
    let settled = false

    const timeout = setTimeout(() => {
      if (!settled) { settled = true; socket.destroy(); resolve(null) }
    }, IPC_TIMEOUT_MS)

    socket.once('connect', () => {
      socket.write(JSON.stringify(cmd) + '\n')
    })

    socket.on('data', (chunk) => {
      if (settled) return
      buffer += chunk.toString()
      // MPV sometimes sends multiple lines — take the first complete JSON response
      const lines = buffer.split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          settled = true
          clearTimeout(timeout)
          socket.destroy()
          resolve(parsed)
          return
        } catch (_) {
          // Incomplete line — continue accumulating
        }
      }
    })

    socket.once('error', () => {
      if (!settled) { settled = true; clearTimeout(timeout); socket.destroy(); resolve(null) }
    })
  })
}

/**
 * Reads an MPV property. Returns the value or null if unavailable.
 *
 * @param {string} name — MPV property name (e.g.: 'time-pos', 'duration')
 * @returns {Promise<any>}
 */
async function getMpvProperty(name) {
  const result = await sendCommand({ command: ['get_property', name] })
  if (result && result.error === 'success') return result.data
  return null
}

// ── Playback controls ─────────────────────────────────────────────────────

/** @returns {Promise<any>} */
function play() { return sendCommand({ command: ['set_property', 'pause', false] }) }

/** @returns {Promise<any>} */
function pause() { return sendCommand({ command: ['set_property', 'pause', true] }) }

/** @returns {Promise<any>} */
function togglePause() { return sendCommand({ command: ['cycle', 'pause'] }) }

/** @returns {Promise<any>} */
function stop() { return sendCommand({ command: ['stop'] }) }

/**
 * @param {number} seconds
 * @param {'absolute' | 'relative'} [mode='absolute']
 * @returns {Promise<any>}
 */
function seek(seconds, mode = 'absolute') {
  return sendCommand({ command: ['seek', seconds, mode] })
}

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
function loadFile(url) {
  return sendCommand({ command: ['loadfile', url, 'replace'] })
}

// ── Volume & speed ───────────────────────────────────────────────────────

/**
 * @param {number} level — Volume 0-100
 * @returns {Promise<any>}
 */
function setVolume(level) {
  return sendCommand({ command: ['set_property', 'volume', level] })
}

/**
 * @param {number} rate — Playback speed (e.g.: 0.5, 1.0, 2.0)
 * @returns {Promise<any>}
 */
function setSpeed(rate) {
  return sendCommand({ command: ['set_property', 'speed', rate] })
}

// ── Position ───────────────────────────────────────────────────────────────

/** @returns {Promise<number | null>} Position in seconds */
function getPosition() { return getMpvProperty('time-pos') }

/** @returns {Promise<number | null>} Duration in seconds */
function getDuration() { return getMpvProperty('duration') }

// ── Audio & subtitle tracks ─────────────────────────────────────────────

/**
 * Returns the list of embedded audio tracks.
 * @returns {Promise<Array<{id: number, lang: string|null, title: string|null, codec: string|null, selected: boolean}>>}
 */
async function getAudioTracks() {
  const tracks = await getMpvProperty('track-list')
  if (!Array.isArray(tracks)) return []
  return tracks
    .filter(t => t.type === 'audio')
    .map(t => ({
      id:       t.id,
      lang:     t.lang || null,
      title:    t.title || null,
      codec:    t.codec || null,
      selected: t.selected || false,
    }))
}

/**
 * Returns the list of subtitle tracks (embedded + external).
 * @returns {Promise<Array<{id: number, lang: string|null, title: string|null, codec: string|null, selected: boolean, external: boolean}>>}
 */
async function getSubtitleTracks() {
  const tracks = await getMpvProperty('track-list')
  if (!Array.isArray(tracks)) return []
  return tracks
    .filter(t => t.type === 'sub')
    .map(t => ({
      id:       t.id,
      lang:     t.lang || null,
      title:    t.title || null,
      codec:    t.codec || null,
      selected: t.selected || false,
      external: t.external || false,
    }))
}

/**
 * @param {number | string} id — Audio track ID (or 'no' to disable)
 * @returns {Promise<any>}
 */
function setAudioTrack(id) { return sendCommand({ command: ['set_property', 'aid', id] }) }

/**
 * @param {number | string} id — Subtitle track ID (or 'no' to disable)
 * @returns {Promise<any>}
 */
function setSubtitleTrack(id) { return sendCommand({ command: ['set_property', 'sid', id] }) }

// ── Polling position ───────────────────────────────────────────────────────

/**
 * Starts position polling every 5s (after 2s initial delay).
 * The callback receives (positionSeconds, durationSeconds) — integers or null.
 *
 * @param {(position: number|null, duration: number|null) => void} callback
 */
function startPositionPolling(callback) {
  stopPositionPolling()

  pollingTimeout = setTimeout(() => {
    pollingTimeout = null
    pollingInterval = setInterval(async () => {
      const position = await getPosition()
      const duration = await getDuration()
      if (callback) {
        callback(
          position != null ? Math.floor(position) : null,
          duration != null ? Math.floor(duration) : null,
        )
      }
    }, POLL_INTERVAL_MS)
  }, POLL_INITIAL_DELAY_MS)
}

/** Stops position polling. */
function stopPositionPolling() {
  if (pollingTimeout)  { clearTimeout(pollingTimeout);   pollingTimeout  = null }
  if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null }
}

// ── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  setPipePath,
  getPipePath,
  waitForSocket,
  sendCommand,
  getMpvProperty,
  play,
  pause,
  togglePause,
  stop,
  seek,
  loadFile,
  setVolume,
  setSpeed,
  getPosition,
  getDuration,
  getAudioTracks,
  getSubtitleTracks,
  setAudioTrack,
  setSubtitleTrack,
  startPositionPolling,
  stopPositionPolling,
}
