/**
 * Manages the MPV player lifecycle: launch on mount, kill on unmount,
 * IPC "back" listener, and Escape-key navigation. Extracted from
 * PlayerPage to keep the component under the 200-LOC limit.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UsePlayerLifecycleOptions {
  url:            string;
  startAt:        number;
  returnTo:       string;
  launch:         (url: string) => Promise<void>;
  kill:           () => Promise<void>;
  waitUntilReady: (retries?: number, delayMs?: number) => Promise<boolean>;
  seekTo:         (seconds: number) => Promise<void>;
  play:           () => Promise<void>;
  saveProgress:   () => Promise<void>;
}

export function usePlayerLifecycle(opts: UsePlayerLifecycleOptions) {
  const { url, startAt, returnTo, launch, kill, waitUntilReady, seekTo, play, saveProgress } = opts;

  const navigate   = useNavigate();
  const [isLoaded,    setIsLoaded]    = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Guards against double-launch (StrictMode) and double-kill on unmount.
  const killedRef   = useRef(false);
  const launchedRef = useRef(false);

  /** Navigate back: save progress, kill MPV, return to origin. */
  const goBack = useCallback(async () => {
    if (killedRef.current) return;
    killedRef.current = true;
    try {
      await saveProgress();
      await kill();
    } finally {
      if (returnTo) navigate(returnTo, { replace: true });
      else          navigate(-1);
    }
  }, [saveProgress, kill, navigate, returnTo]);

  // ── Launch MPV on mount, kill on unmount ──
  useEffect(() => {
    if (!url) {
      if (returnTo) navigate(returnTo, { replace: true });
      else          navigate(-1);
      return;
    }
    if (launchedRef.current) return;
    launchedRef.current = true;

    const start = async () => {
      setLaunchError(null);
      try {
        await launch(url);
        const ready = await waitUntilReady(24, 150);
        if (!ready) throw new Error('MPV pipe unavailable');
        if (startAt > 0) await seekTo(startAt);
        await play();
        setIsLoaded(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setLaunchError(`Unable to start playback (${message}).`);
        setIsLoaded(false);
        await kill();
      }
    };

    void start();

    return () => {
      launchedRef.current = false;
      if (!killedRef.current) {
        void saveProgress();
        void kill();
      }
    };
    // Must run once at mount. saveProgress uses internal refs for latest
    // values; useMpv functions only reference stable setters / window.mpv.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Overlay "back" signal via IPC ──
  useEffect(() => {
    const unsub = window.mpv?.onBack?.(() => { void goBack(); });
    return () => { unsub?.(); };
  }, [goBack]);

  // ── Escape key triggers back navigation ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void goBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goBack]);

  return { isLoaded, launchError, goBack } as const;
}
