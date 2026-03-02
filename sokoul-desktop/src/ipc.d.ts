/**
 * IPC bridge type declarations for the Electron preload layer.
 *
 * These interfaces describe the APIs exposed via contextBridge:
 *   - window.electronAPI  (window management)
 *   - window.mpv          (MPV player control)
 *   - window.overlay      (overlay mouse capture & navigation)
 *
 * Consumed by both PlayerPage (main window) and OverlayPage (overlay window).
 */

/** Window management bridge exposed by Electron's preload script; consumed by the title bar and fullscreen toggle. */
export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  setFullscreen: (flag: boolean) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  onBackendReady: (cb: () => void) => () => void;
  onBackendError: (cb: (code: number) => void) => () => void;
}

/** Typed MPV IPC command payload */
export type MpvCommand =
  | { command: ['set_property', string, unknown] }
  | { command: ['get_property', string] }
  | { command: ['seek', number, string] }
  | { command: ['loadfile', string, string] }
  | { command: ['cycle', string] }
  | { command: string[] };

/** MPV player control bridge for launching, seeking, and querying playback state via JSON IPC; all calls must be wrapped in try/catch. */
export interface MpvAPI {
  launch: (url: string) => Promise<void>;
  kill: () => Promise<void>;
  waitUntilReady: (retries?: number, delayMs?: number) => Promise<boolean>;
  command: (cmd: MpvCommand | string[]) => Promise<unknown>;
  onActive: (cb: (active: boolean) => void) => () => void;
  onBack: (cb: () => void) => () => void;
}

/** Controls mouse event forwarding between the transparent overlay window and MPV, enabling clickable UI elements over the video surface. */
export interface OverlayAPI {
  /**
   * capture(true)  -> setIgnoreMouseEvents(false) -> clicks hit overlay buttons
   * capture(false) -> setIgnoreMouseEvents(true, forward) -> clicks pass to MPV
   */
  capture: (enable: boolean) => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  isFullscreen: () => Promise<boolean>;
  /** Signals "go back" to PlayerPage which handles navigation */
  back: () => Promise<void>;
}

/** MPV track metadata returned by the 'track-list' property */
export interface MpvTrack {
  id: number;
  type: 'audio' | 'sub' | 'video';
  lang?: string;
  title?: string;
  codec?: string;
  selected: boolean;
  default?: boolean;
  forced?: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    mpv?: MpvAPI;
    overlay?: OverlayAPI;
  }
}
