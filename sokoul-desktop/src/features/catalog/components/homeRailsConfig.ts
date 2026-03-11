// homeRailsConfig.ts — Rail definitions for the HomePage
// Extracted to keep HomePage.tsx under 300 lines (AGENTS.md Rule 4).

export interface RailConfig {
  key:         string;
  titleKey:    string;
  taglineKey?: string;
  accentColor?: string;
  genreIds?:   number[] | null;
}

export const RAILS: RailConfig[] = [
  {
    key: 'trending',      accentColor: '#0063e5', genreIds: null,
    titleKey:   'home.recommendedForYou',
    taglineKey: 'home.recommendedTagline',
  },
  {
    key: 'top10',         accentColor: '#0063e5', genreIds: null,
    titleKey:   'home.newOnSokoul',
    taglineKey: 'home.newOnSokoulTagline',
  },
  {
    key: 'action',        accentColor: '#e63946', genreIds: [28],
    titleKey:   'home.action',
    taglineKey: 'home.actionTagline',
  },
  {
    key: 'scifi',         accentColor: '#4361ee', genreIds: [878],
    titleKey:   'home.scienceFiction',
    taglineKey: 'home.scienceFictionTagline',
  },
  {
    key: 'thriller',      accentColor: '#c0392b', genreIds: [53],
    titleKey:   'home.thriller',
    taglineKey: 'home.thrillerTagline',
  },
  {
    key: 'horror',        accentColor: '#8b0000', genreIds: [27],
    titleKey:   'home.horror',
    taglineKey: 'home.horrorTagline',
  },
  {
    key: 'series',        accentColor: '#0063e5', genreIds: null,
    titleKey:   'home.tvShows',
    taglineKey: 'home.tvShowsTagline',
  },
  {
    key: 'adventure',     accentColor: '#f39c12', genreIds: [12],
    titleKey:   'home.adventure',
    taglineKey: 'home.adventureTagline',
  },
  {
    key: 'comedy',        accentColor: '#f4d03f', genreIds: [35],
    titleKey:   'home.comedy',
    taglineKey: 'home.comedyTagline',
  },
  {
    key: 'drama',         accentColor: '#8e44ad', genreIds: [18],
    titleKey:   'home.drama',
    taglineKey: 'home.dramaTagline',
  },
  {
    key: 'kdrama',        accentColor: '#c0392b', genreIds: null,
    titleKey:   'home.kDrama',
    taglineKey: 'home.kDramaTagline',
  },
  {
    key: 'fantasy',       accentColor: '#8e44ad', genreIds: [14],
    titleKey:   'home.fantasy',
    taglineKey: 'home.fantasyTagline',
  },
  {
    key: 'crime',         accentColor: '#2c3e50', genreIds: [80],
    titleKey:   'home.crime',
    taglineKey: 'home.crimeTagline',
  },
  {
    key: 'anime',         accentColor: '#e74c3c', genreIds: [16],
    titleKey:   'home.anime',
    taglineKey: 'home.animeTagline',
  },
  {
    key: 'series-action', accentColor: '#e63946', genreIds: [10759],
    titleKey:   'home.actionAdventureSeries',
    taglineKey: 'home.actionAdventureSeriesTagline',
  },
  {
    key: 'documentary',   accentColor: '#2ecc71', genreIds: [99],
    titleKey:   'home.documentary',
    taglineKey: 'home.documentaryTagline',
  },
  {
    key: 'romance',       accentColor: '#e91e8c', genreIds: [10749],
    titleKey:   'home.romance',
    taglineKey: 'home.romanceTagline',
  },
  {
    key: 'animation',     accentColor: '#ff9f43', genreIds: [16],
    titleKey:   'home.animation',
    taglineKey: 'home.animationTagline',
  },
  {
    key: 'mystery',       accentColor: '#6c3483', genreIds: [9648],
    titleKey:   'home.mystery',
    taglineKey: 'home.mysteryTagline',
  },
  {
    key: 'war',           accentColor: '#7f8c8d', genreIds: [10752],
    titleKey:   'home.war',
    taglineKey: 'home.warTagline',
  },
  {
    key: 'history',       accentColor: '#1a5276', genreIds: [36],
    titleKey:   'home.history',
    taglineKey: 'home.historyTagline',
  },
  {
    key: 'international', accentColor: '#27ae60', genreIds: null,
    titleKey:   'home.fromAroundTheWorld',
    taglineKey: 'home.fromAroundTheWorldTagline',
  },
  {
    key: 'western',       accentColor: '#a04000', genreIds: [37],
    titleKey:   'home.western',
    taglineKey: 'home.westernTagline',
  },
  {
    key: 'family',        accentColor: '#e84393', genreIds: [10751],
    titleKey:   'home.family',
    taglineKey: 'home.familyTagline',
  },
  {
    key: 'music',         accentColor: '#1db954', genreIds: [10402],
    titleKey:   'home.music',
    taglineKey: 'home.musicTagline',
  },
];

export const SERIES_ONLY_RAIL_KEYS = new Set(['series', 'series-action', 'anime', 'kdrama']);

export const MIN_RAIL_ITEMS = 2;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getPositionVariant(position: number): 'landscape' | 'poster' {
  if (position < 3) return 'landscape';
  return (position - 3) % 4 === 0 ? 'poster' : 'landscape';
}
