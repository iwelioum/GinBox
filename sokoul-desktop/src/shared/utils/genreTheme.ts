/** Full visual theme definition for a genre, driving atmosphere, particles, typography, and gradients to create an immersive genre-specific detail page. */
export interface GenreTheme {
  atmosphere:     'dark' | 'light' | 'neon' | 'warm' | 'cold';
  overlayEffect:  'torch' | 'scanlines' | 'petals' | 'stars' |
                  'rain' | 'dust' | 'none';
  glassStyle:     'frosted' | 'neon-edge' | 'warm-glow' | 'clean';
  particleType:   'embers' | 'dust' | 'sparks' | 'petals' |
                  'snow' | 'none';
  fontMood:       'serif-dramatic' | 'mono-tech' |
                  'sans-warm' | 'sans-clean';
  noiseIntensity: number;   // 0.0 → 1.0
  vignetteColor:  string;   // hex
  bgGradient:     string;   // CSS gradient complet
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
    bgGradient:     `radial-gradient(ellipse at top, #1a0000 0%, #07080f 60%)`,
  },
  Thriller: {
    atmosphere:     'cold',
    overlayEffect:  'torch',
    glassStyle:     'frosted',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.05,
    vignetteColor:  '#00050a',
    bgGradient:     `radial-gradient(ellipse at top, #00050a 0%, #07080f 60%)`,
  },
  'Science Fiction': {
    atmosphere:     'neon',
    overlayEffect:  'scanlines',
    glassStyle:     'neon-edge',
    particleType:   'sparks',
    fontMood:       'mono-tech',
    noiseIntensity: 0.03,
    vignetteColor:  '#000a1a',
    bgGradient:     `radial-gradient(ellipse at top, #000a1a 0%, #07080f 60%)`,
  },
  Fantasy: {
    atmosphere:     'warm',
    overlayEffect:  'stars',
    glassStyle:     'warm-glow',
    particleType:   'petals',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.02,
    vignetteColor:  '#0a0510',
    bgGradient:     `radial-gradient(ellipse at top, #1a0a2e 0%, #07080f 60%)`,
  },
  Animation: {
    atmosphere:     'warm',
    overlayEffect:  'petals',
    glassStyle:     'clean',
    particleType:   'petals',
    fontMood:       'sans-warm',
    noiseIntensity: 0.01,
    vignetteColor:  '#1a0a00',
    bgGradient:     `radial-gradient(ellipse at top, #1a0a00 0%, #07080f 60%)`,
  },
  Drama: {
    atmosphere:     'cold',
    overlayEffect:  'rain',
    glassStyle:     'frosted',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.04,
    vignetteColor:  '#050505',
    bgGradient:     `radial-gradient(ellipse at top, #050505 0%, #07080f 60%)`,
  },
  Romance: {
    atmosphere:     'warm',
    overlayEffect:  'petals',
    glassStyle:     'warm-glow',
    particleType:   'petals',
    fontMood:       'sans-warm',
    noiseIntensity: 0.01,
    vignetteColor:  '#1a0505',
    bgGradient:     `radial-gradient(ellipse at top, #1a0505 0%, #07080f 60%)`,
  },
  Comedy: {
    atmosphere:     'light',
    overlayEffect:  'none',
    glassStyle:     'warm-glow',
    particleType:   'none',
    fontMood:       'sans-warm',
    noiseIntensity: 0.01,
    vignetteColor:  '#0a0800',
    bgGradient:     `radial-gradient(ellipse at top, #0a0800 0%, #07080f 60%)`,
  },
  Western: {
    atmosphere:     'warm',
    overlayEffect:  'dust',
    glassStyle:     'warm-glow',
    particleType:   'dust',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.07,
    vignetteColor:  '#1a0800',
    bgGradient:     `radial-gradient(ellipse at top, #1a0800 0%, #07080f 60%)`,
  },
  Documentary: {
    atmosphere:     'cold',
    overlayEffect:  'none',
    glassStyle:     'clean',
    particleType:   'dust',
    fontMood:       'sans-clean',
    noiseIntensity: 0.02,
    vignetteColor:  '#050505',
    bgGradient:     `radial-gradient(ellipse at top, #050505 0%, #07080f 60%)`,
  },
  War: {
    atmosphere:     'dark',
    overlayEffect:  'dust',
    glassStyle:     'frosted',
    particleType:   'embers',
    fontMood:       'serif-dramatic',
    noiseIntensity: 0.08,
    vignetteColor:  '#0a0800',
    bgGradient:     `radial-gradient(ellipse at top, #0a0500 0%, #07080f 60%)`,
  },
  Action: {
    atmosphere:     'neon',
    overlayEffect:  'none',
    glassStyle:     'neon-edge',
    particleType:   'sparks',
    fontMood:       'mono-tech',
    noiseIntensity: 0.03,
    vignetteColor:  '#000a00',
    bgGradient:     `radial-gradient(ellipse at top, #000a00 0%, #07080f 60%)`,
  },
};

// Ordre de priorité si multi-genres
const PRIORITY = [
  'Horror', 'War', 'Thriller', 'Science Fiction',
  'Fantasy', 'Animation', 'Western', 'Drama',
  'Romance', 'Action', 'Comedy', 'Documentary',
];

/** Picks the highest-priority genre theme when content has multiple genres, ensuring visually dominant genres (Horror, War) win over neutral ones (Comedy). */
export function resolveTheme(genres: string[]): GenreTheme {
  const match = PRIORITY.find(g => genres.includes(g));
  return GENRE_THEMES[match ?? 'Documentary'];
}
