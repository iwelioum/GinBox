// Extrait la couleur dominante du poster via node-vibrant
// et l'injecte dans les variables CSS globales

import { useEffect } from 'react';
import { Vibrant } from 'node-vibrant/browser';

/** Extracts a palette from the current poster and injects CSS custom properties so the entire page theme adapts to the content being viewed. */
export function useDynamicAccentColor(posterUrl: string | null) {
  useEffect(() => {
    if (!posterUrl) return;

    const fullUrl = posterUrl.startsWith('http')
      ? posterUrl
      : `https://image.tmdb.org/t/p/w185${posterUrl}`;

    let cancelled = false;

    Vibrant.from(fullUrl)
      .getPalette()
      .then(palette => {
        if (cancelled) return;

        const accent      = palette.Vibrant?.hex    ?? '#6366f1';
        const accentMuted = palette.Muted?.hex      ?? '#1e1b4b';
        const accentDark  = palette.DarkMuted?.hex  ?? '#07080f';
        const accentLight = palette.LightVibrant?.hex ?? '#a5b4fc';

        const root = document.documentElement;
        root.style.setProperty('--accent',       accent);
        root.style.setProperty('--accent-muted', accentMuted);
        root.style.setProperty('--accent-dark',  accentDark);
        root.style.setProperty('--accent-light', accentLight);

        const hex = accent.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        root.style.setProperty('--accent-rgb', `${r},${g},${b}`);
      })
      .catch(() => {
        /* Palette extraction can fail for invalid images — no-op fallback */
      });

    return () => {
      cancelled = true;
      document.documentElement.removeAttribute('style');
    };
  }, [posterUrl]);
}
