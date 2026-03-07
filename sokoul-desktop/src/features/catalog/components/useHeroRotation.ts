// useHeroRotation.ts — Auto-rotation timer for the hero banner carousel.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AUTOPLAY_MS } from './heroBannerUtils';

export interface UseHeroRotationReturn {
  current:      number;
  direction:    number;
  paused:       boolean;
  setCurrent:   Dispatch<SetStateAction<number>>;
  setDirection: Dispatch<SetStateAction<number>>;
  setPaused:    Dispatch<SetStateAction<boolean>>;
}

export function useHeroRotation(slideCount: number): UseHeroRotationReturn {
  const [current,   setCurrent]   = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused,    setPaused]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setDirection(1);
    setCurrent(i => (i + 1) % slideCount);
  }, [slideCount]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slideCount <= 1 || paused) return;
    timerRef.current = setInterval(advance, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slideCount, paused, advance, current]);

  return { current, direction, paused, setCurrent, setDirection, setPaused };
}
