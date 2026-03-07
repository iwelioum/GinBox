import { useState, useEffect } from 'react';

/**
 * Returns window.scrollY updated on each scroll event.
 * Passive listener — no impact on scroll performance.
 */
export function useScrollPosition(): number {
  const [scrollY, setScrollY] = useState(window.scrollY);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial read
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrollY;
}
