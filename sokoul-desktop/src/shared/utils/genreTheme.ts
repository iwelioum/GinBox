// genreTheme.ts — Visual themes per TMDB genre.
// Each genre is mapped to a full atmosphere driving gradients,
// vignettes, typography, and particles on the detail page.

/** Full visual theme definition for a genre, driving atmosphere, particles, typography, and gradients. */
export interface GenreTheme {
  atmosphere:     'dark' | 'light' | 'neon' | 'warm' | 'cold';
  overlayEffect:  'torch' | 'scanlines' | 'petals' | 'stars' | 'rain' | 'dust' | 'none';
  glassStyle:     'frosted' | 'neon-edge' | 'warm-glow' | 'clean';
  particleType:   'embers' | 'dust' | 'sparks' | 'petals' | 'snow' | 'none';
  fontMood:       'serif-dramatic' | 'mono-tech' | 'sans-warm' | 'sans-clean';
  noiseIntensity: number;   // 0.0 → 1.0
  vignetteColor:  string;   // hex
  bgGradient:     string;   // full CSS gradient
  accentColor:    string;   // UI accent colour
}

const GENRE_THEMES: Record<string, GenreTheme> = {
  Horror: {
    atmosphere:     'dark',
    overlayEffect:  'torch',
    glassStyle:     'frosted',
    particleType:   'embers',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.06,
    vignetteColor:  '#1a0000',
    bgGradient:     'radial-gradient(ellipse at top, #1a0000 0%, #07080f 60%)',
    accentColor:    '#8b0000',
  },
  Thriller: {
    atmosphere:     'cold',
    overlayEffect:  'torch',
    glassStyle:     'frosted',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.05,
    vignetteColor:  '#00050a',
    bgGradient:     'radial-gradient(ellipse at top, #00050a 0%, #07080f 60%)',
    accentColor:    '#c0392b',
  },
  'Science Fiction': {
    atmosphere:     'neon',
    overlayEffect:  'scanlines',
    glassStyle:     'neon-edge',
    particleType:   'sparks',
    fontMood:       'mono-tech',
    noiseIntensity: 0.03,
    vignetteColor:  '#000a1a',
    bgGradient:     'radial-gradient(ellipse at top, #000a1a 0%, #07080f 60%)',
    accentColor:    '#4361ee',
  },
  Fantasy: {
    atmosphere:     'warm',
    overlayEffect:  'stars',
    glassStyle:     'warm-glow',
    particleType:   'petals',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.02,
    vignetteColor:  '#0a0510',
    bgGradient:     'radial-gradient(ellipse at top, #1a0a2e 0%, #07080f 60%)',
    accentColor:    '#8e44ad',
  },
  Animation: {
    atmosphere:     'warm',
    overlayEffect:  'petals',
    glassStyle:     'clean',
    particleType:   'petals',
    fontMood:       'sans-warm',
    noiseIntensity: 0.01,
    vignetteColor:  '#1a0a00',
    bgGradient:     'radial-gradient(ellipse at top, #1a0a00 0%, #07080f 60%)',
    accentColor:    '#ff9f43',
  },
  Drama: {
    atmosphere:     'cold',
    overlayEffect:  'rain',
    glassStyle:     'frosted',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.04,
    vignetteColor:  '#050505',
    bgGradient:     'radial-gradient(ellipse at top, #050505 0%, #07080f 60%)',
    accentColor:    '#8e44ad',
  },
  Romance: {
    atmosphere:     'warm',
    overlayEffect:  'petals',
    glassStyle:     'warm-glow',
    particleType:   'petals',
    fontMood:       'sans-warm',
    noiseIntensity: 0.01,
    vignetteColor:  '#1a0505',
    bgGradient:     'radial-gradient(ellipse at top, #1a0505 0%, #07080f 60%)',
    accentColor:    '#e91e8c',
  },
  Comedy: {
    atmosphere:     'light',
    overlayEffect:  'none',
    glassStyle:     'warm-glow',
    particleType:   'none',
    fontMood:       'sans-warm',
    noiseIntensity: 0.01,
    vignetteColor:  '#0a0800',
    bgGradient:     'radial-gradient(ellipse at top, #0a0800 0%, #07080f 60%)',
    accentColor:    '#f4d03f',
  },
  Western: {
    atmosphere:     'warm',
    overlayEffect:  'dust',
    glassStyle:     'warm-glow',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.07,
    vignetteColor:  '#1a0800',
    bgGradient:     'radial-gradient(ellipse at top, #1a0800 0%, #07080f 60%)',
    accentColor:    '#a04000',
  },
  Documentary: {
    atmosphere:     'cold',
    overlayEffect:  'none',
    glassStyle:     'clean',
    particleType:   'dust',
    fontMood:       'sans-clean',
    noiseIntensity: 0.02,
    vignetteColor:  '#050505',
    bgGradient:     'radial-gradient(ellipse at top, #050505 0%, #07080f 60%)',
    accentColor:    '#2ecc71',
  },
  War: {
    atmosphere:     'dark',
    overlayEffect:  'dust',
    glassStyle:     'frosted',
    particleType:   'embers',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.08,
    vignetteColor:  '#0a0800',
    bgGradient:     'radial-gradient(ellipse at top, #0a0500 0%, #07080f 60%)',
    accentColor:    '#7f8c8d',
  },
  Action: {
    atmosphere:     'neon',
    overlayEffect:  'none',
    glassStyle:     'neon-edge',
    particleType:   'sparks',
    fontMood:       'mono-tech',
    noiseIntensity: 0.03,
    vignetteColor:  '#0a0000',
    bgGradient:     'radial-gradient(ellipse at top, #1a0500 0%, #07080f 60%)',
    accentColor:    '#e63946',
  },
  Adventure: {
    atmosphere:     'warm',
    overlayEffect:  'dust',
    glassStyle:     'warm-glow',
    particleType:   'sparks',
    fontMood:       'sans-warm',
    noiseIntensity: 0.03,
    vignetteColor:  '#0a0500',
    bgGradient:     'radial-gradient(ellipse at top, #1a0a00 0%, #07080f 60%)',
    accentColor:    '#f39c12',
  },
  Crime: {
    atmosphere:     'dark',
    overlayEffect:  'none',
    glassStyle:     'frosted',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.05,
    vignetteColor:  '#050510',
    bgGradient:     'radial-gradient(ellipse at top, #0a0a15 0%, #07080f 60%)',
    accentColor:    '#2c3e50',
  },
  Mystery: {
    atmosphere:     'dark',
    overlayEffect:  'torch',
    glassStyle:     'frosted',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.04,
    vignetteColor:  '#05000a',
    bgGradient:     'radial-gradient(ellipse at top, #0a0515 0%, #07080f 60%)',
    accentColor:    '#6c3483',
  },
  Music: {
    atmosphere:     'neon',
    overlayEffect:  'none',
    glassStyle:     'neon-edge',
    particleType:   'sparks',
    fontMood:       'sans-warm',
    noiseIntensity: 0.02,
    vignetteColor:  '#000a05',
    bgGradient:     'radial-gradient(ellipse at top, #001a0a 0%, #07080f 60%)',
    accentColor:    '#1db954',
  },
  History: {
    atmosphere:     'warm',
    overlayEffect:  'dust',
    glassStyle:     'frosted',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.06,
    vignetteColor:  '#0a0800',
    bgGradient:     'radial-gradient(ellipse at top, #0a0800 0%, #07080f 60%)',
    accentColor:    '#1a5276',
  },
  Family: {
    atmosphere:     'light',
    overlayEffect:  'petals',
    glassStyle:     'clean',
    particleType:   'petals',
    fontMood:       'sans-warm',
    noiseIntensity: 0.01,
    vignetteColor:  '#0a0505',
    bgGradient:     'radial-gradient(ellipse at top, #0a0505 0%, #07080f 60%)',
    accentColor:    '#e84393',
  },
};

/** Neutral fallback for genres with no explicit mapping. */
export const DEFAULT_THEME: GenreTheme = {
  atmosphere:     'dark',
  overlayEffect:  'none',
  glassStyle:     'clean',
  particleType:   'none',
  fontMood:       'sans-clean',
  noiseIntensity: 0.02,
  vignetteColor:  '#050505',
  bgGradient:     'radial-gradient(ellipse at top, #090b13 0%, #07080f 60%)',
  accentColor:    '#0063e5',
};

/**
 * Maps TMDB genre IDs (numeric) to GENRE_THEMES keys.
 * Use resolveThemeByIds() to look up a theme by ID rather than by name.
 */
export const TMDB_ID_TO_THEME_KEY: Record<number, string> = {
  28:    'Action',
  12:    'Adventure',
  878:   'Science Fiction',
  27:    'Horror',
  53:    'Thriller',
  14:    'Fantasy',
  80:    'Crime',
  18:    'Drama',
  35:    'Comedy',
  10749: 'Romance',
  16:    'Animation',
  10751: 'Family',
  99:    'Documentary',
  36:    'History',
  9648:  'Mystery',
  10402: 'Music',
  10752: 'War',
  37:    'Western',
  // Series-specific genre IDs
  10759: 'Action',           // Action & Adventure
  10765: 'Science Fiction',  // Sci-Fi & Fantasy
  10768: 'War',              // War & Politics
  10764: 'Comedy',           // Reality (neutral fallback)
  10767: 'Documentary',      // Talk
};

// Visual priority: visually strong genres dominate neutral ones in multi-genre content.
const PRIORITY = [
  'Horror', 'War', 'Thriller', 'Science Fiction',
  'Fantasy', 'Animation', 'Western', 'Crime',
  'Mystery', 'Drama', 'Romance', 'Action',
  'Adventure', 'Music', 'History', 'Family',
  'Comedy', 'Documentary',
];

/** Picks the highest-priority genre theme for content with multiple genres (by English TMDB name). */
export function resolveTheme(genreNames: string[]): GenreTheme {
  if (!genreNames || genreNames.length === 0) return DEFAULT_THEME;
  const match = PRIORITY.find(g => genreNames.includes(g));
  return GENRE_THEMES[match ?? ''] ?? DEFAULT_THEME;
}

/**
 * Picks the highest-priority genre theme by TMDB numeric IDs.
 * Supports both number arrays and comma-separated string params (e.g. '28,878').
 */
export function resolveThemeByIds(genreIds: (number | string)[]): GenreTheme {
  const ids = genreIds
    .flatMap(id => String(id).split(',').map(s => parseInt(s.trim(), 10)))
    .filter(n => !isNaN(n));
  const names = ids
    .map(id => TMDB_ID_TO_THEME_KEY[id])
    .filter((name): name is string => Boolean(name));
  return resolveTheme(names);
}

/** Returns the CSS font-family string for a given fontMood. */
export function fontFamilyFromMood(mood: string): string {
  switch (mood) {
    case 'serif-dramatic': return "'Georgia', 'Playfair Display', serif";
    case 'mono-tech':      return "'SF Mono', 'Fira Code', 'Consolas', monospace";
    case 'sans-warm':      return "'Nunito', 'Segoe UI', sans-serif";
    case 'sans-clean':     return "'Inter', 'Helvetica Neue', sans-serif";
    default:               return 'inherit';
  }
}

export default GENRE_THEMES;
