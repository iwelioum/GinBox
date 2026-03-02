// ══════════════════════════════════════════════════════════
// PRELOAD.JS — Bridge IPC contextBridge sécurisé
// Lecteur MPV : à implémenter (phase 1+)
// ══════════════════════════════════════════════════════════

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Contrôles fenêtre (TitleBar custom)
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
  launch:  (url) => ipcRenderer.invoke('mpv:launch',  { url }),
  kill:    ()    => ipcRenderer.invoke('mpv:kill'),
  waitUntilReady: (retries, delayMs) => ipcRenderer.invoke('mpv:waitUntilReady', retries, delayMs),
  command: (cmd) => ipcRenderer.invoke('mpv:command', cmd),

  // Écouter l'événement mpv:active envoyé par main.js
  onActive: (cb) => {
    const handler = (_, active) => cb(active)
    ipcRenderer.on('mpv:active', handler)
    return () => ipcRenderer.removeListener('mpv:active', handler)
  },

  // Écouter le signal retour envoyé par l'overlay (sans données)
  onBack: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('player:back', handler)
    return () => ipcRenderer.removeListener('player:back', handler)
  },
})

// ── Overlay controls ──────────────────────────────────────
// capture(true)  → setIgnoreMouseEvents(false) → clics sur les boutons actifs
// capture(false) → setIgnoreMouseEvents(true, forward) → clics passent à MPV
contextBridge.exposeInMainWorld('overlay', {
  capture:          (enable)               => ipcRenderer.invoke('overlay:capture', enable),
  toggleFullscreen: ()                     => ipcRenderer.invoke('window:toggleFullscreen'),
  isFullscreen:     ()                     => ipcRenderer.invoke('window:isFullscreen'),
  // Signal retour → PlayerPage se charge de la navigation
  back: () => ipcRenderer.invoke('overlay:back'),
})
