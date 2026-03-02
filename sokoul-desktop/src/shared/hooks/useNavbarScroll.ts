import { useState, useEffect } from 'react';

/** Drives the navbar's glass-blur opacity so it stays transparent at the top and becomes opaque on scroll for readability. */
export function useNavbarScroll() {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Transition lisse entre 0 et 100px de scroll
      const y = window.scrollY;
      const newOpacity = Math.min(y / 100, 1);
      setOpacity(newOpacity);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // appel initial
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { opacity };
}
