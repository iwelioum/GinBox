import type { CSSProperties } from 'react';

export interface GenreStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing: string;
  color: string;
  textShadow: string;
  textTransform?: CSSProperties['textTransform'];
  fontStyle?: CSSProperties['fontStyle'];
}

export const GENRE_TYPOGRAPHY: Record<string, GenreStyle> = {
  action: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
    fontWeight: '900',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#ffffff',
    textShadow:
      '0 0 40px rgba(255,60,60,0.4), 0 2px 12px rgba(0,0,0,0.9)',
  },
  thriller: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: '700',
    fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
    letterSpacing: '0.02em',
    fontStyle: 'italic',
    color: '#e8e0d0',
    textShadow: '0 2px 20px rgba(0,0,0,0.95)',
  },
  'sci-fi': {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: '600',
    fontSize: 'clamp(1rem, 2vw, 1.75rem)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#7df9ff',
    textShadow:
      '0 0 30px rgba(125,249,255,0.5), 0 2px 8px rgba(0,0,0,0.9)',
  },
  horror: {
    fontFamily: "'Creepster', cursive",
    fontWeight: '400',
    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
    letterSpacing: '0.05em',
    color: '#ff3333',
    textShadow:
      '0 0 20px rgba(255,0,0,0.6), 0 2px 12px rgba(0,0,0,0.95)',
  },
  romance: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: '300',
    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
    letterSpacing: '0.04em',
    fontStyle: 'italic',
    color: '#f9c6c6',
    textShadow: '0 2px 16px rgba(0,0,0,0.85)',
  },
  animation: {
    fontFamily: "'Lilita One', cursive",
    fontWeight: '400',
    fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
    letterSpacing: '0.02em',
    color: '#ffe066',
    textShadow:
      '0 0 24px rgba(255,224,102,0.4), 0 2px 8px rgba(0,0,0,0.85)',
  },
  documentary: {
    fontFamily: "'DM Serif Display', serif",
    fontWeight: '400',
    fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
    letterSpacing: '0.01em',
    color: '#d4c9b0',
    textShadow: '0 2px 12px rgba(0,0,0,0.9)',
  },
  drama: {
    fontFamily: "'Libre Baskerville', serif",
    fontWeight: '700',
    fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
    letterSpacing: '0.03em',
    color: '#e8e8e8',
    textShadow: '0 2px 16px rgba(0,0,0,0.9)',
  },
  western: {
    fontFamily: "'Rye', cursive",
    fontWeight: '400',
    fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#d4a843',
    textShadow: '0 2px 12px rgba(0,0,0,0.9)',
  },
  comedy: {
    fontFamily: "'Pacifico', cursive",
    fontWeight: '400',
    fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
    letterSpacing: '0.01em',
    color: '#ffffff',
    textShadow: '0 2px 12px rgba(0,0,0,0.85)',
  },
  default: {
    fontFamily: "'Clash Display', sans-serif",
    fontWeight: '700',
    fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
    letterSpacing: '0.02em',
    color: '#ffffff',
    textShadow: '0 2px 12px rgba(0,0,0,0.9)',
  },
};

/** TMDB genre ID → typography key mapping */
const GENRE_ID_MAP: Record<number, string> = {
  28: 'action',
  12: 'action',       // Adventure → action style
  53: 'thriller',
  9648: 'thriller',   // Mystery → thriller style
  878: 'sci-fi',
  27: 'horror',
  10749: 'romance',
  16: 'animation',
  99: 'documentary',
  18: 'drama',
  37: 'western',
  35: 'comedy',
  10751: 'comedy',    // Family → comedy style
  10402: 'comedy',    // Music → comedy style
  80: 'thriller',     // Crime → thriller style
  10752: 'action',    // War → action style
  36: 'documentary',  // History → documentary style
  14: 'sci-fi',       // Fantasy → sci-fi style
  10770: 'drama',     // TV Movie → drama style
};

/** Card-specific sizing overrides */
export const CARD_TITLE_STYLE: GenreStyle = {
  ...GENRE_TYPOGRAPHY.default,
  fontSize: 'clamp(0.75rem, 1.5vw, 1rem)',
};

/** Hero-specific sizing overrides */
export const HERO_TITLE_STYLE: GenreStyle = {
  ...GENRE_TYPOGRAPHY.default,
  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
};

/** Resolve genre IDs to the best matching typography style */
export function getGenreStyle(genreIds: number[]): GenreStyle {
  for (const id of genreIds) {
    const key = GENRE_ID_MAP[id];
    if (key && GENRE_TYPOGRAPHY[key]) {
      return GENRE_TYPOGRAPHY[key];
    }
  }
  return GENRE_TYPOGRAPHY.default;
}

/** Resolve a genre key string (e.g. "action", "sci-fi") to its style */
export function getGenreStyleByKey(genreKey: string): GenreStyle {
  return GENRE_TYPOGRAPHY[genreKey] ?? GENRE_TYPOGRAPHY.default;
}
