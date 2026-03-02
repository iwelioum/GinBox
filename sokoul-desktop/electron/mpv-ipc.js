// ══════════════════════════════════════════════════════════
// mpv-ipc.js — Communication avec MPV via named pipe Windows
// Responsabilité unique : envoyer des commandes JSON à MPV
// Aucune logique spawn/kill ici (réservée à mpv-manager.js)
// ══════════════════════════════════════════════════════════

const net = require('net')

const PIPE_PATH = '\\\\.\\pipe\\mpvsocket'

// ── Connexion ──────────────────────────────────────────────────────────────

/**
 * Tente de se connecter au pipe MPV.
 * Retries silencieux si le socket n'est pas encore prêt (MPV met ~500ms à démarrer).
 *
 * @param {number} retries   — Nombre de tentatives max
 * @param {number} delayMs   — Délai entre chaque tentative (ms)
 * @returns {Promise<void>}
 */
function waitForSocket(retries = 10, delayMs = 200) {
  return new Promise((resolve, reject) => {
    let attempts = 0

    function attempt() {
      const socket = net.createConnection(PIPE_PATH)

      socket.once('connect', () => {
        socket.destroy()
        resolve()
      })

      socket.once('error', () => {
        socket.destroy()
        attempts++
        if (attempts >= retries) {
          reject(new Error('[MPV IPC] Socket non disponible après toutes les tentatives'))
          return
        }
        setTimeout(attempt, delayMs)
      })
    }

    attempt()
  })
}

/**
 * Envoie une commande JSON au pipe MPV et retourne la réponse parsée.
 * Ouvre une connexion, envoie, attend la réponse, ferme.
 *
 * @param {object} cmd — Objet commande (ex: { command: ['set_property', 'pause', false] })
 * @returns {Promise<any>}
 */
async function sendCommand(cmd) {
  await waitForSocket()
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(PIPE_PATH)
    let buffer = ''

    socket.once('connect', () => {
      socket.write(JSON.stringify(cmd) + '\n')
    })

    socket.on('data', (chunk) => {
      buffer += chunk.toString()
      // MPV envoie parfois plusieurs lignes — on prend la première réponse complète
      const lines = buffer.split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          socket.destroy()
          resolve(parsed)
          return
        } catch (_) {
          // Ligne incomplète — continuer à accumuler
        }
      }
    })

    socket.once('error', (err) => {
      socket.destroy()
      reject(err)
    })

    socket.once('close', () => {
      // Si on ferme sans avoir résolu (ex: MPV n'a rien répondu)
      resolve(null)
    })
  })
}

// ── Commandes publiques ────────────────────────────────────────────────────

/** @returns {Promise<any>} */
function play() {
  return sendCommand({ command: ['set_property', 'pause', false] })
}

/** @returns {Promise<any>} */
function pause() {
  return sendCommand({ command: ['set_property', 'pause', true] })
}

/** @returns {Promise<any>} */
function togglePause() {
  return sendCommand({ command: ['cycle', 'pause'] })
}

/**
 * @param {number} seconds
 * @returns {Promise<any>}
 */
function seekTo(seconds) {
  return sendCommand({ command: ['seek', seconds, 'absolute'] })
}

/**
 * @param {number} n — Volume 0-100
 * @returns {Promise<any>}
 */
function setVolume(n) {
  return sendCommand({ command: ['set_property', 'volume', n] })
}

/** @returns {Promise<any>} */
function getPosition() {
  return sendCommand({ command: ['get_property', 'time-pos'] })
}

/** @returns {Promise<any>} */
function getDuration() {
  return sendCommand({ command: ['get_property', 'duration'] })
}

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
function loadFile(url) {
  return sendCommand({ command: ['loadfile', url] })
}

module.exports = {
  waitForSocket,
  sendCommand,
  play,
  pause,
  togglePause,
  seekTo,
  setVolume,
  getPosition,
  getDuration,
  loadFile,
}
