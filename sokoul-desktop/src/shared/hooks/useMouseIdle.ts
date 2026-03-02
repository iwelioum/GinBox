/**
 * Manages auto-hide behavior for overlay controls.
 * Shows controls on mouse movement, hides after a timeout.
 * The overlay uses setIgnoreMouseEvents so mousemove events
 * are forwarded from the Electron main process even when
 * the overlay is transparent to clicks.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const HIDE_DELAY_MS = 3000;

interface UseMouseIdleReturn {
  showControls:    boolean;
  setShowControls: (show: boolean) => void;
  resetTimer:      () => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

/**
 * Tracks mouse inactivity to auto-hide player controls after 3s of idle time.
 * Works with Electron's setIgnoreMouseEvents so the overlay stays click-through when hidden.
 */
export function useMouseIdle(isActive: boolean): UseMouseIdleReturn {
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(isActive);
  activeRef.current = isActive;

  const resetTimer = useCallback(() => {
    if (!activeRef.current) return;
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, HIDE_DELAY_MS);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!activeRef.current) return;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => resetTimer(), [resetTimer]);

  useEffect(() => {
    window.addEventListener('mousemove', resetTimer);
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetTimer]);

  /** Hide everything when MPV becomes inactive */
  useEffect(() => {
    if (!isActive) {
      setShowControls(false);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [isActive]);

  return { showControls, setShowControls, resetTimer, handleMouseEnter, handleMouseLeave };
}
