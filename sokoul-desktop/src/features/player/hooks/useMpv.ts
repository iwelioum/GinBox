// useMpv.ts — React hook to control MPV via window.mpv
// No Electron/Node imports — delegates only to preload

import { useState, useEffect, useRef } from 'react';
import type { MpvTrack } from '@/shared/types/ipc';

/**
 * Wraps the Electron preload IPC bridge to control the native MPV process.
 * All commands go through window.mpv to avoid direct Node/Electron imports in the renderer.
 */
export function useMpv() {
  const [position,    setPosition]    = useState<number>(0);
  const [duration,    setDuration]    = useState<number>(0);
  const [isActive,    setIsActive]    = useState<boolean>(false);
  const [isPlaying,   setIsPlaying]   = useState<boolean>(false);
  const [audioTracks, setAudioTracks] = useState<MpvTrack[]>([]);
  const [subTracks,   setSubTracks]   = useState<MpvTrack[]>([]);

  const tracksLoadedRef = useRef(false);

  // main.js sends this event after mpv:launch and mpv:kill
  // → avoids polling when MPV is not started
  useEffect(() => {
    const unsub = window.mpv?.onActive?.((active: boolean) => {
      if (active) {
        tracksLoadedRef.current = false;
        setIsActive(true);
      } else {
        setIsActive(false);
        setPosition(0);
        setDuration(0);
        setAudioTracks([]);
        setSubTracks([]);
        tracksLoadedRef.current = false;
      }
    });
    return () => unsub?.();
  }, []);

  // ── Polling position / duration / pause state (only when isActive) ──
  // 250ms interval → smooth progress bar (4 updates/s)
  // and isPlaying synced with actual MPV state (prevents desync)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      try {
        const [pos, dur, paused] = await Promise.all([
          window.mpv?.command({ command: ['get_property', 'time-pos'] }) as Promise<{ data?: number } | null>,
          window.mpv?.command({ command: ['get_property', 'duration']  }) as Promise<{ data?: number } | null>,
          window.mpv?.command({ command: ['get_property', 'pause']     }) as Promise<{ data?: boolean } | null>,
        ]);

        if (typeof pos?.data    === 'number')  setPosition(pos.data);
        if (typeof dur?.data    === 'number')  setDuration(dur.data);
        if (typeof paused?.data === 'boolean') setIsPlaying(!paused.data);
      } catch {
        // Silently ignore — main.js returns null if MPV is not ready
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (duration > 0 && !tracksLoadedRef.current) {
      tracksLoadedRef.current = true;
      loadTracks();
    }
  }, [duration]);

  async function launch(url: string): Promise<void> {
    tracksLoadedRef.current = false;
    setAudioTracks([]);
    setSubTracks([]);
    await window.mpv?.launch(url);
    setIsActive(true);  // PlayerPage activates polling directly
  }

  async function waitUntilReady(retries = 20, delayMs = 150): Promise<boolean> {
    return (await window.mpv?.waitUntilReady?.(retries, delayMs)) ?? false;
  }

  async function kill(): Promise<void> {
    await window.mpv?.kill();
    setIsActive(false);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setAudioTracks([]);
    setSubTracks([]);
    tracksLoadedRef.current = false;
  }

  async function play(): Promise<void> {
    await window.mpv?.command({ command: ['set_property', 'pause', false] });
  }

  async function pause(): Promise<void> {
    await window.mpv?.command({ command: ['set_property', 'pause', true] });
  }

  async function seekTo(seconds: number): Promise<void> {
    await window.mpv?.command({ command: ['seek', seconds, 'absolute'] });
  }

  async function setVolume(n: number): Promise<void> {
    await window.mpv?.command({ command: ['set_property', 'volume', n] });
  }

  async function cycleSubtitle(): Promise<void> {
    await window.mpv?.command({ command: ['cycle', 'sub'] });
  }

  async function cycleAudio(): Promise<void> {
    await window.mpv?.command({ command: ['cycle', 'audio'] });
  }

  async function loadTracks(): Promise<void> {
    try {
      const res = await window.mpv?.command({ command: ['get_property', 'track-list'] }) as { data?: MpvTrack[] } | null;
      if (!res?.data) return;
      setAudioTracks(res.data.filter(t => t.type === 'audio'));
      setSubTracks(res.data.filter(t => t.type === 'sub'));
    } catch {
      // Silently ignore
    }
  }

  async function selectAudioTrack(id: number): Promise<void> {
    await window.mpv?.command({ command: ['set_property', 'aid', id] });
    setTimeout(loadTracks, 150);
  }

  async function selectSubTrack(id: number): Promise<void> {
    await window.mpv?.command({ command: ['set_property', 'sid', id] });
    setTimeout(loadTracks, 150);
  }

  async function disableSubs(): Promise<void> {
    await window.mpv?.command({ command: ['set_property', 'sid', 'no'] });
    setTimeout(loadTracks, 150);
  }

  return {
    launch, kill, waitUntilReady,
    play, pause, seekTo, setVolume,
    cycleSubtitle, cycleAudio,
    loadTracks, selectAudioTrack, selectSubTrack, disableSubs,
    audioTracks, subTracks,
    position, duration, isActive, isPlaying,
  };
}
