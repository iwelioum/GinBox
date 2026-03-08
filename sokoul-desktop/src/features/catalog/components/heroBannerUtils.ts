// heroBannerUtils.ts -- Shared constants, helpers, and Framer Motion variants
// used across HeroBanner sub-components.

import * as React            from 'react';
import type { CatalogMeta } from '@/shared/types';
import { TMDB_IMAGE_BASE }  from '@/shared/constants/tmdb';

// -- Constants ----------------------------------------------------------------

export const AUTOPLAY_MS  = 7_000;
export const MAX_SLIDES   = 8;
export const DEFAULT_TINT = 'rgba(4,7,20,0.97)';

// -- Image helper -------------------------------------------------------------

export function imgUrl(
  path: string | undefined | null,
  size = 'original',
): string | null {
  if (!path) return null;
  if (path.startsWith('http')) {
    return path.replace('/w500/', '/original/').replace('/w1280/', '/original/');
  }
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

// -- Metadata helpers ---------------------------------------------------------

export function getYear(item: CatalogMeta): string {
  const raw = item.release_date ?? item.first_air_date ?? String(item.year ?? '');
  return raw.substring(0, 4);
}

export function getGenres(item: CatalogMeta): string[] {
  if (item.genre_names && item.genre_names.length > 0) return item.genre_names;
  if (Array.isArray(item.genres)) {
    return item.genres.map(g => (typeof g === 'string' ? g : g.name));
  }
  return [];
}

export function formatDuration(item: CatalogMeta): string | null {
  const mins = item.runtime ?? item.episode_run_time?.[0];
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function computeBadge(item: CatalogMeta): 'new' | 'trending' | null {
  const dateStr = item.release_date ?? item.first_air_date;
  if (dateStr) {
    const days = (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
    if (days >= 0 && days <= 60) return 'new';
  }
  if ((item.popularity ?? 0) > 150) return 'trending';
  return null;
}

// -- Framer Motion variants ---------------------------------------------------

// Background: direction-aware on the x-axis
export const bgVariants = {
  enter: (dir: number): { opacity: number; x: number; scale: number } => ({
    opacity: 0,
    x:       dir > 0 ? 80 : -80,
    scale:   1.0,
  }),
  center: { opacity: 1, x: 0, scale: 1.0 },
  exit:   { opacity: 0, x: 0, scale: 1.05 },
};

// Content: simple fadeUp independent of navigation direction
export const contentVariants = {
  enter:  { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0  },
  exit:   { opacity: 0, y: -5 },
};

// -- Ripple hook (Watch button effect) ---------------------------------------

export interface RippleItem { id: number; x: number; y: number }

export function useRipple(): {
  ripples:   RippleItem[];
  addRipple: (e: React.MouseEvent<HTMLButtonElement>) => void;
} {
  const [ripples, setRipples] = React.useState<RippleItem[]>([]);
  const addRipple = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id   = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  }, []);
  return { ripples, addRipple };
}
