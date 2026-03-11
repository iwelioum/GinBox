// ══════════════════════════════════════════════════════════
// PRELOAD.JS — Secure IPC contextBridge
// MPV Player: to implement (phase 1+)
// ══════════════════════════════════════════════════════════

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls (custom TitleBar)
  minimizeWindow:  () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow:  () => ipcRenderer.invoke('window:maximize'),
  closeWindow:     () => ipcRenderer.invoke('window:close'),
  isMaximized:     () => ipcRenderer.invoke('window:isMaximized'),
  setFullscreen:   (flag) => ipcRenderer.invoke('window:setFullscreen', flag),
  openExternal:    (url)  => ipcRenderer.invoke('shell:openExternal', url),

  // Backend Rust
  onBackendReady: (cb) => {
    ipcRenderer.on('backend:ready', cb)
    return () => ipcRenderer.removeListener('backend:ready', cb)
  },
  onBackendError: (cb) => {
    const handler = (_, code) => cb(code)
    ipcRenderer.on('backend:error', handler)
    return () => ipcRenderer.removeListener('backend:error', handler)
  },
})

// ── MPV ──────────────────────────────────────────────────
contextBridge.exposeInMainWorld('mpv', {
  launch:  (url, mediaTitle) => ipcRenderer.invoke('mpv:launch',  { url, mediaTitle }),
  kill:    ()    => ipcRenderer.invoke('mpv:kill'),
  waitUntilReady: (retries, delayMs) => ipcRenderer.invoke('mpv:waitUntilReady', retries, delayMs),
  command: (cmd) => ipcRenderer.invoke('mpv:command', cmd),

  // ── Playback controls ──────────────────────────────────────────────
  play:        ()                       => ipcRenderer.invoke('mpv:command', { command: ['set_property', 'pause', false] }),
  pause:       ()                       => ipcRenderer.invoke('mpv:command', { command: ['set_property', 'pause', true] }),
  togglePause: ()                       => ipcRenderer.invoke('mpv:command', { command: ['cycle', 'pause'] }),
  stop:        ()                       => ipcRenderer.invoke('mpv:command', { command: ['stop'] }),
  seek:        (seconds, mode = 'absolute') => ipcRenderer.invoke('mpv:command', { command: ['seek', seconds, mode] }),
  setVolume:   (level)                  => ipcRenderer.invoke('mpv:command', { command: ['set_property', 'volume', level] }),
  setSpeed:    (rate)                   => ipcRenderer.invoke('mpv:command', { command: ['set_property', 'speed', rate] }),

  // ── Audio & subtitle tracks ──────────────────────────────────────
  getAudioTracks:    ()   => ipcRenderer.invoke('mpv:getAudioTracks'),
  getSubtitleTracks: ()   => ipcRenderer.invoke('mpv:getSubtitleTracks'),
  setAudioTrack:     (id) => ipcRenderer.invoke('mpv:command', { command: ['set_property', 'aid', id] }),
  setSubtitleTrack:  (id) => ipcRenderer.invoke('mpv:command', { command: ['set_property', 'sid', id] }),

  // ── Events ──────────────────────────────────────────────────────
  onActive: (cb) => {
    const handler = (_, active) => cb(active)
    ipcRenderer.on('mpv:active', handler)
    return () => ipcRenderer.removeListener('mpv:active', handler)
  },
  onError: (cb) => {
    const handler = (_, message) => cb(message)
    ipcRenderer.on('mpv:error', handler)
    return () => ipcRenderer.removeListener('mpv:error', handler)
  },
  onPositionUpdate: (cb) => {
    const handler = (_, data) => cb(data)
    ipcRenderer.on('playback-position-update', handler)
    return () => ipcRenderer.removeListener('playback-position-update', handler)
  },
  onBack: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('player:back', handler)
    return () => ipcRenderer.removeListener('player:back', handler)
  },
})

// ── Overlay controls ──────────────────────────────────────
// capture(true)  → setIgnoreMouseEvents(false) → clicks on active buttons
// capture(false) → setIgnoreMouseEvents(true, forward) → clicks pass through to MPV
contextBridge.exposeInMainWorld('overlay', {
  capture:          (enable)               => ipcRenderer.invoke('overlay:capture', enable),
  toggleFullscreen: ()                     => ipcRenderer.invoke('window:toggleFullscreen'),
  isFullscreen:     ()                     => ipcRenderer.invoke('window:isFullscreen'),
  // Back signal → PlayerPage handles the navigation
  back: () => ipcRenderer.invoke('overlay:back'),
})
