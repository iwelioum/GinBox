// CatalogFilters.tsx — Panneau mega-filtre combinable
// BLOCS : Type · Genres · Période · Note & Popularité · Langue & Pays · Durée & Structure
// RÈGLES : ET entre blocs, OU entre valeurs d'un même bloc.
//          Genres/Lang/Pays : compteurs depuis items filtrés sans ce bloc.
//          Note/Popularité : 3 sous-blocs indépendants.
//          Durée : adaptatif films/séries selon Bloc 1 actif.

import * as React from 'react';
import { ContentKind, CONTENT_KINDS, SeriesStatus } from '@/shared/utils/contentKind';
import type { CatalogMeta, StreamingProvider, UserWatchStatus } from '@/shared/types';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Clapperboard,
  Clock3,
  CreditCard,
  Eye,
  Film,
  Flame,
  HardDrive,
  Info,
  LoaderCircle,
  PauseCircle,
  Play,
  PlayCircle,
  Radio,
  RotateCcw,
  Scissors,
  Sparkles,
  Square,
  Star,
  Trash2,
  Tv,
  UserRound,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type AvailabilitySource = 'local' | 'debrid' | 'streaming';

const PROVIDER_DISPLAY: Record<string, { name: string; flag: string; color: string }> = {
  netflix:     { name: 'Netflix',     flag: 'INTL', color: '#E50914' },
  disney_plus: { name: 'Disney+',     flag: 'INTL', color: '#113CCF' },
  prime_video: { name: 'Prime Video', flag: 'INTL', color: '#00A8E1' },
  apple_tv:    { name: 'Apple TV+',   flag: 'INTL', color: '#555555' },
  hbo_max:     { name: 'Max (HBO)',   flag: 'INTL', color: '#002BE7' },
  hulu:        { name: 'Hulu',        flag: 'US',   color: '#1CE783' },
  canal_plus:  { name: 'Canal+',      flag: 'FR',   color: '#000000' },
  ocs:         { name: 'OCS',         flag: 'FR',   color: '#FF6900' },
  arte:        { name: 'Arte',        flag: 'FR',   color: '#C8161D' },
  france_tv:   { name: 'France TV',   flag: 'FR',   color: '#005FA9' },
  paramount:   { name: 'Paramount+',  flag: 'INTL', color: '#0064FF' },
  crunchyroll: { name: 'Crunchyroll', flag: 'INTL', color: '#F47521' },
  mubi:        { name: 'MUBI',        flag: 'INTL', color: '#7B2D8B' },
  youtube:     { name: 'YouTube',     flag: 'INTL', color: '#FF0000' },
};

export const YEAR_MIN = 1920;
export const YEAR_MAX = new Date().getFullYear();

const DECADE_PRESETS: { label: string; range: [number, number] }[] = [
  { label: 'Classiques', range: [YEAR_MIN, 1979] },
  { label: '80s',        range: [1980, 1989] },
  { label: '90s',        range: [1990, 1999] },
  { label: '2000s',      range: [2000, 2009] },
  { label: '2010s',      range: [2010, 2019] },
  { label: '2020+',      range: [2020, YEAR_MAX] },
];

const SERIES_STATUS_UI: { value: SeriesStatus; label: string; sublabel: string }[] = [
  { value: 'returning', label: 'En cours',  sublabel: 'Diffusion active'      },
  { value: 'ended',     label: 'Terminée',  sublabel: 'Série complète'         },
  { value: 'canceled',  label: 'Annulée',   sublabel: 'Arrêtée définitivement' },
  { value: 'planned',   label: 'À venir',   sublabel: 'Pas encore diffusée'    },
  { value: 'inprod',    label: 'En prod.',  sublabel: 'En production'          },
];

const USER_STATUS_UI: { value: UserWatchStatus; label: string; sublabel: string }[] = [
  { value: 'plan_to_watch', label: 'Prévu',         sublabel: 'Dans ma liste'           },
  { value: 'in_progress',   label: 'En cours',      sublabel: 'Commencé, pas terminé'    },
  { value: 'to_resume',     label: 'À reprendre',   sublabel: 'Nouveaux épisodes dispo'  },
  { value: 'completed',     label: 'Terminé',       sublabel: 'Vu en entier'             },
  { value: 'on_hold',       label: 'En pause',      sublabel: 'Mis en attente'           },
  { value: 'dropped',       label: 'Abandonné',     sublabel: 'Arrêté en cours'          },
  { value: 'unwatched',     label: 'Non commencé',  sublabel: 'Jamais visionné'          },
];

const LANGUAGE_MAP: Record<string, { label: string }> = {
  fr: { label: 'Français' },
  en: { label: 'Anglais' },
  ja: { label: 'Japonais' },
  ko: { label: 'Coréen' },
  es: { label: 'Espagnol' },
  de: { label: 'Allemand' },
  it: { label: 'Italien' },
  pt: { label: 'Portugais' },
  zh: { label: 'Chinois' },
  ar: { label: 'Arabe' },
  ru: { label: 'Russe' },
  hi: { label: 'Hindi' },
  tr: { label: 'Turc' },
  nl: { label: 'Néerlandais' },
  sv: { label: 'Suédois' },
  da: { label: 'Danois' },
  no: { label: 'Norvégien' },
  fi: { label: 'Finnois' },
  pl: { label: 'Polonais' },
  th: { label: 'Thaï' },
  id: { label: 'Indonésien' },
  he: { label: 'Hébreu' },
  cs: { label: 'Tchèque' },
  hu: { label: 'Hongrois' },
};

const COUNTRY_MAP: Record<string, { label: string }> = {
  US: { label: 'États-Unis' },
  GB: { label: 'Royaume-Uni' },
  FR: { label: 'France' },
  JP: { label: 'Japon' },
  KR: { label: 'Corée du Sud' },
  DE: { label: 'Allemagne' },
  IT: { label: 'Italie' },
  ES: { label: 'Espagne' },
  CN: { label: 'Chine' },
  IN: { label: 'Inde' },
  CA: { label: 'Canada' },
  AU: { label: 'Australie' },
  MX: { label: 'Mexique' },
  BR: { label: 'Brésil' },
  RU: { label: 'Russie' },
  SE: { label: 'Suède' },
  DK: { label: 'Danemark' },
  NO: { label: 'Norvège' },
  BE: { label: 'Belgique' },
  NL: { label: 'Pays-Bas' },
  PL: { label: 'Pologne' },
  IL: { label: 'Israël' },
  TR: { label: 'Turquie' },
  TH: { label: 'Thaïlande' },
};

function getLangMeta(code: string) {
  return LANGUAGE_MAP[code] ?? { label: code.toUpperCase() };
}

function getCountryMeta(code: string) {
  return COUNTRY_MAP[code] ?? { label: code.toUpperCase() };
}

const COUNTRY_VISIBLE_LIMIT = 8;

const RATING_PRESETS: { label: string; min: number; color: string }[] = [
  { label: 'Excellent ≥ 8', min: 8, color: 'text-emerald-400' },
  { label: 'Très bien ≥ 7', min: 7, color: 'text-green-400'   },
  { label: 'Bien ≥ 6',      min: 6, color: 'text-yellow-400'  },
  { label: 'Passable ≥ 5',  min: 5, color: 'text-orange-400'  },
  { label: 'Tous',           min: 0, color: 'text-white/30'    },
];

const VOTE_PRESETS: { label: string; min: number; tooltip: string }[] = [
  { label: '> 10 000', min: 10000, tooltip: 'Très populaire, note très fiable'   },
  { label: '> 1 000',  min: 1000,  tooltip: 'Populaire, note fiable'             },
  { label: '> 500',    min: 500,   tooltip: 'Note assez fiable'                  },
  { label: '> 100',    min: 100,   tooltip: 'Note peu fiable'                    },
  { label: 'Tous',     min: 0,     tooltip: 'Inclut les titres très peu notés'   },
];

const POPULARITY_PRESETS: { label: string; topN: number | null }[] = [
  { label: 'Top 50',  topN: 50   },
  { label: 'Top 100', topN: 100  },
  { label: 'Top 250', topN: 250  },
  { label: 'Top 500', topN: 500  },
  { label: 'Tous',    topN: null },
];

const MOVIE_RUNTIME_PRESETS: { label: string; sublabel: string; range: [number, number] }[] = [
  { label: 'Court',     sublabel: '< 90 min',   range: [0, 89] },
  { label: 'Standard',  sublabel: '90–120 min', range: [90, 120] },
  { label: 'Long',      sublabel: '2h–2h30',    range: [121, 150] },
  { label: 'Très long', sublabel: '> 2h30',     range: [151, 999] },
];

const SEASONS_PRESETS: { label: string; sublabel: string; range: [number, number] }[] = [
  { label: 'Mini-série', sublabel: '1 saison',     range: [1, 1] },
  { label: 'Courte',     sublabel: '2–3 saisons',  range: [2, 3] },
  { label: 'Moyenne',    sublabel: '4–6 saisons',  range: [4, 6] },
  { label: 'Longue',     sublabel: '7–12 saisons', range: [7, 12] },
  { label: 'Saga',       sublabel: '> 12 saisons', range: [13, 999] },
];

const EPISODE_RUNTIME_PRESETS: { label: string; sublabel: string; range: [number, number] }[] = [
  { label: 'Sitcom', sublabel: '~20–30 min', range: [0, 35] },
  { label: 'Drama',  sublabel: '40–60 min',  range: [36, 65] },
  { label: 'Épique', sublabel: '> 65 min',   range: [66, 999] },
];

const KIND_ICONS: Partial<Record<ContentKind, LucideIcon>> = {
  movie: Film,
  tv: Tv,
  anime: Sparkles,
  animation: Clapperboard,
  documentary: Film,
  miniseries: Tv,
  short: Scissors,
  reality: Activity,
  special: Star,
};

const SERIES_STATUS_ICONS: Record<SeriesStatus, LucideIcon> = {
  returning: Activity,
  ended: Square,
  canceled: XCircle,
  planned: Clock3,
  inprod: LoaderCircle,
  pilot: Clapperboard,
  unknown: Circle,
};

const USER_STATUS_ICONS: Record<UserWatchStatus, LucideIcon> = {
  plan_to_watch: Star,
  in_progress: PlayCircle,
  to_resume: RotateCcw,
  completed: CheckCircle2,
  on_hold: PauseCircle,
  dropped: Trash2,
  unwatched: Eye,
};

export type SortOption = 'popularity' | 'rating' | 'year_desc' | 'year_asc' | 'title_asc' | 'title_desc';
export type AgeRating = 'all' | '10+' | '12+' | '16+' | '18+' | 'nc';

export interface FilterState {
  searchQuery:       string;
  sortBy:            SortOption;
  kinds:             ContentKind[];
  genres:            string[];
  ratingMin:         number;
  votesMin:          number;
  popularityTopN:    number | null;
  yearRange:         [number, number];
  seriesStatuses:    SeriesStatus[];
  originalLanguages: string[];
  countries:         string[];
  movieRuntimeRange: [number, number] | null;
  seasonsRange:      [number, number] | null;
  episodeRtRange:    [number, number] | null;
  availSources:        AvailabilitySource[];
  selectedProviders:   string[];
  watchableNow:        boolean;
  streamingType:       'all' | 'sub' | 'rent_buy';
  userStatuses:        UserWatchStatus[];
  selectedCollections: number[];
  selectedStudios:     number[];
  selectedRatings:     AgeRating[];
}

export const DEFAULT_FILTERS: FilterState = {
  searchQuery:       '',
  sortBy:            'popularity',
  kinds:             [],
  genres:            [],
  ratingMin:         0,
  votesMin:          0,
  popularityTopN:    null,
  yearRange:         [YEAR_MIN, YEAR_MAX],
  seriesStatuses:    [],
  originalLanguages: [],
  countries:         [],
  movieRuntimeRange: null,
  seasonsRange:      null,
  episodeRtRange:    null,
  availSources:        [],
  selectedProviders:   [],
  watchableNow:        false,
  streamingType:       'all',
  userStatuses:        [],
  selectedCollections: [],
  selectedStudios:     [],
  selectedRatings:     [],
};

const GENRE_VISIBLE_LIMIT = 12;

export interface EnrichedItem extends CatalogMeta {
  _kind:          ContentKind;
  _genres:        string[];
  _year:          number | null;
  _status:        SeriesStatus;
  _lang:          string;
  _countries:     string[];
  _rating:        number | null;   // vote_average arrondi (null si absent)
  _votes:         number;          // vote_count
  _popularity:    number;          // score popularité TMDB
  _popRank:       number;          // rang dans le type (films ou séries)
  _movieRuntime:  number | null;   // runtime film (null si absent)
  _seasonCount:   number | null;   // number_of_seasons
  _episodeCount:  number | null;   // number_of_episodes
  _episodeRuntime: number | null;  // médiane episode_run_time
  _isLocal:      boolean;
  _isDebrid:     boolean;
  _providers:    StreamingProvider[];
  _isWatchable:  boolean;
  _providerIds:  string[];
  _userStatus:   UserWatchStatus;
  _userProgress: number;        // 0–100
  _userRating:   number | null;
}

const SLIDER_CSS = `
.yr-slider{appearance:none;-webkit-appearance:none;position:absolute;width:100%;
  pointer-events:none;background:transparent;margin:0;height:0;}
.yr-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:16px;height:16px;border-radius:50%;background:white;cursor:pointer;
  pointer-events:auto;border:none;box-shadow:0 1px 4px rgba(0,0,0,.4);}
.yr-slider::-webkit-slider-runnable-track{background:transparent;}
`;

const DualRangeSlider: React.FC<{
  value: [number, number];
  onChange: (v: [number, number]) => void;
}> = ({ value, onChange }) => {
  const [lo, hi] = value;
  const range    = YEAR_MAX - YEAR_MIN;
  const pctLo    = ((lo - YEAR_MIN) / range) * 100;
  const pctHi    = ((hi - YEAR_MIN) / range) * 100;
  const zLo      = lo >= hi - Math.round(range * 0.04) ? 5 : 3;

  return (
    <div className="relative" style={{ height: '24px' }}>
      <style>{SLIDER_CSS}</style>
      <div className="absolute rounded" style={{
        top: '50%', transform: 'translateY(-50%)',
        left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.12)',
      }} />
      <div className="absolute rounded" style={{
        top: '50%', transform: 'translateY(-50%)',
        left: `${pctLo}%`, width: `${Math.max(0, pctHi - pctLo)}%`,
        height: '3px', background: 'rgba(255,255,255,0.65)',
      }} />
      <input type="range" className="yr-slider"
        min={YEAR_MIN} max={YEAR_MAX} value={lo} style={{ zIndex: zLo }}
        onChange={(e) => { const v = Math.min(parseInt(e.target.value), hi - 1); onChange([v, hi]); }}
      />
      <input type="range" className="yr-slider"
        min={YEAR_MIN} max={YEAR_MAX} value={hi} style={{ zIndex: 4 }}
        onChange={(e) => { const v = Math.max(parseInt(e.target.value), lo + 1); onChange([lo, v]); }}
      />
    </div>
  );
};

export const countActiveFilters = (f: FilterState): number => {
  let count = 0;
  if (f.kinds.length > 0) count++;
  if (f.genres.length > 0) count++;
  if (f.ratingMin > 0) count++;
  if (f.votesMin > 0) count++;
  if (f.popularityTopN !== null) count++;
  if (f.yearRange[0] !== YEAR_MIN || f.yearRange[1] !== YEAR_MAX) count++;
  if (f.seriesStatuses.length > 0) count++;
  if (f.originalLanguages.length > 0) count++;
  if (f.countries.length > 0) count++;
  if (f.movieRuntimeRange !== null) count++;
  if (f.seasonsRange !== null) count++;
  if (f.episodeRtRange !== null) count++;
  if (f.watchableNow) count++;
  if (f.availSources.length > 0) count++;
  if (f.selectedProviders.length > 0) count++;
  if (f.streamingType !== 'all') count++;
  if (f.userStatuses.length > 0) count++;
  if (f.selectedCollections.length > 0) count++;
  if (f.selectedStudios.length > 0) count++;
  if (f.selectedRatings.length > 0) count++;
  return count;
};

interface CatalogFiltersProps {
  allItems:          EnrichedItem[];
  genreItems:        EnrichedItem[];   // filtrés sans genres
  langCountryItems:  EnrichedItem[];   // filtrés sans langue/pays
  availabilityItems: EnrichedItem[];   // filtrés sans disponibilité
  filters:           FilterState;
  onChange:          (f: FilterState) => void;
  profileActive:     boolean;
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  allItems,
  genreItems,
  langCountryItems,
  availabilityItems,
  filters,
  onChange,
  profileActive,
}) => {
  const [showAllGenres,    setShowAllGenres]    = React.useState(false);
  const [showAllCountries, setShowAllCountries] = React.useState(false);

  const isDefaultYear =
    filters.yearRange[0] === YEAR_MIN && filters.yearRange[1] === YEAR_MAX;

  const hasAnyFilter =
    filters.kinds.length > 0 ||
    filters.genres.length > 0 ||
    filters.ratingMin > 0 ||
    filters.votesMin > 0 ||
    filters.popularityTopN !== null ||
    !isDefaultYear ||
    filters.seriesStatuses.length > 0 ||
    filters.originalLanguages.length > 0 ||
    filters.countries.length > 0 ||
    filters.movieRuntimeRange !== null ||
    filters.seasonsRange !== null ||
    filters.episodeRtRange !== null ||
    filters.watchableNow ||
    filters.availSources.length > 0 ||
    filters.selectedProviders.length > 0 ||
    filters.streamingType !== 'all' ||
    filters.userStatuses.length > 0;

  const hideSeriesStatus =
    filters.kinds.length > 0 &&
    filters.kinds.every((k) => k === 'movie' || k === 'short');

  // Affichage adaptatif Bloc 6
  const showMovieDuration =
    filters.kinds.length === 0 ||
    filters.kinds.some((k) => k === 'movie' || k === 'short' || k === 'documentary');
  const showSeriesDuration =
    filters.kinds.length === 0 ||
    filters.kinds.some((k) => k === 'tv' || k === 'anime' || k === 'animation' || k === 'miniseries' || k === 'reality');

  const kindCounts = React.useMemo(() => {
    const counts: Partial<Record<ContentKind, number>> = {};
    for (const item of allItems) counts[item._kind] = (counts[item._kind] ?? 0) + 1;
    return counts;
  }, [allItems]);

  const availableGenres = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of genreItems) {
      for (const g of item._genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [genreItems]);

  const displayedGenres = React.useMemo(() => {
    if (showAllGenres) return availableGenres;
    const top    = availableGenres.slice(0, GENRE_VISIBLE_LIMIT);
    const topSet = new Set(top.map((g) => g.name));
    const extras = filters.genres
      .filter((g) => !topSet.has(g))
      .map((name) => availableGenres.find((ag) => ag.name === name) ?? { name, count: 0 });
    return [...top, ...extras];
  }, [availableGenres, showAllGenres, filters.genres]);

  const hasMoreGenres = availableGenres.length > GENRE_VISIBLE_LIMIT;

  const availableLangs = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of langCountryItems) {
      if (item._lang !== 'unknown') counts.set(item._lang, (counts.get(item._lang) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, count, ...getLangMeta(code) }));
  }, [langCountryItems]);

  const availableCountries = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of langCountryItems) {
      for (const code of item._countries) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, count, ...getCountryMeta(code) }));
  }, [langCountryItems]);

  const displayedCountries = React.useMemo(() => {
    if (showAllCountries) return availableCountries;
    const top    = availableCountries.slice(0, COUNTRY_VISIBLE_LIMIT);
    const topSet = new Set(top.map((c) => c.code));
    const extras = filters.countries
      .filter((c) => !topSet.has(c))
      .map((code) => availableCountries.find((ac) => ac.code === code) ?? { code, count: 0, ...getCountryMeta(code) });
    return [...top, ...extras];
  }, [availableCountries, showAllCountries, filters.countries]);

  const hasMoreCountries = availableCountries.length > COUNTRY_VISIBLE_LIMIT;

  const hasDurationData = React.useMemo(
    () => allItems.some((i) => i._movieRuntime !== null || i._seasonCount !== null || i._episodeRuntime !== null),
    [allItems]
  );

  const hasAvailabilityData = React.useMemo(
    () => allItems.some((i) => i._isLocal || i._isDebrid || i._providers.length > 0),
    [allItems]
  );

  const availableProviders = React.useMemo(() => {
    const counts = new Map<string, { name: string; flag: string; color: string; count: number }>();
    for (const item of availabilityItems) {
      for (const p of item._providers) {
        if (!counts.has(p.id)) {
          const meta = PROVIDER_DISPLAY[p.id];
          counts.set(p.id, {
            name:  meta?.name  ?? p.name,
            flag:  meta?.flag  ?? 'INTL',
            color: meta?.color ?? '#888888',
            count: 0,
          });
        }
        counts.get(p.id)!.count++;
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, meta]) => ({ id, ...meta }));
  }, [availabilityItems]);

  const toggleKind = (k: ContentKind) =>
    onChange({ ...filters, kinds: filters.kinds.includes(k) ? filters.kinds.filter((x) => x !== k) : [...filters.kinds, k] });

  const toggleGenre = (g: string) =>
    onChange({ ...filters, genres: filters.genres.includes(g) ? filters.genres.filter((x) => x !== g) : [...filters.genres, g] });

  const toggleStatus = (s: SeriesStatus) =>
    onChange({ ...filters, seriesStatuses: filters.seriesStatuses.includes(s) ? filters.seriesStatuses.filter((x) => x !== s) : [...filters.seriesStatuses, s] });

  const toggleLang = (l: string) =>
    onChange({ ...filters, originalLanguages: filters.originalLanguages.includes(l) ? filters.originalLanguages.filter((x) => x !== l) : [...filters.originalLanguages, l] });

  const toggleCountry = (c: string) =>
    onChange({ ...filters, countries: filters.countries.includes(c) ? filters.countries.filter((x) => x !== c) : [...filters.countries, c] });

  const applyPreset = (range: [number, number]) => {
    const isCurrent = filters.yearRange[0] === range[0] && filters.yearRange[1] === range[1];
    onChange({ ...filters, yearRange: isCurrent ? [YEAR_MIN, YEAR_MAX] : range });
  };

  const toggleMovieRuntime = (range: [number, number]) => {
    const isCurrent = filters.movieRuntimeRange?.[0] === range[0] && filters.movieRuntimeRange?.[1] === range[1];
    onChange({ ...filters, movieRuntimeRange: isCurrent ? null : range });
  };

  const toggleSeasonsRange = (range: [number, number]) => {
    const isCurrent = filters.seasonsRange?.[0] === range[0] && filters.seasonsRange?.[1] === range[1];
    onChange({ ...filters, seasonsRange: isCurrent ? null : range });
  };

  const toggleEpisodeRt = (range: [number, number]) => {
    const isCurrent = filters.episodeRtRange?.[0] === range[0] && filters.episodeRtRange?.[1] === range[1];
    onChange({ ...filters, episodeRtRange: isCurrent ? null : range });
  };

  const toggleAvailSource = (s: AvailabilitySource) =>
    onChange({
      ...filters,
      availSources: filters.availSources.includes(s)
        ? filters.availSources.filter((x) => x !== s)
        : [...filters.availSources, s],
    });

  const toggleProvider = (id: string) =>
    onChange({
      ...filters,
      selectedProviders: filters.selectedProviders.includes(id)
        ? filters.selectedProviders.filter((x) => x !== id)
        : [...filters.selectedProviders, id],
    });

  const toggleUserStatus = (v: UserWatchStatus) =>
    onChange({
      ...filters,
      userStatuses: filters.userStatuses.includes(v)
        ? filters.userStatuses.filter((s) => s !== v)
        : [...filters.userStatuses, v],
    });

  return (
    <div className="space-y-7 text-sm">

      {/* En-tête + Reset */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white/90 tracking-wide uppercase">Filtres</h2>
        {hasAnyFilter && (
          <button
            onClick={() => { onChange(DEFAULT_FILTERS); setShowAllGenres(false); setShowAllCountries(false); }}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <section>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Type de contenu</h3>
        <div className="grid grid-cols-3 gap-2">
          {CONTENT_KINDS.map(({ kind, label }) => {
            const count  = kindCounts[kind] ?? 0;
            const active = filters.kinds.includes(kind);
            const KindIcon = KIND_ICONS[kind] ?? Clapperboard;
            if (count === 0) return null;
            return (
              <button key={kind} onClick={() => toggleKind(kind)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-center transition-all duration-150 border ${
                  active ? 'bg-white text-black border-white font-semibold' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                }`}
              >
                <KindIcon size={16} strokeWidth={2.2} />
                <span className="text-[10px] leading-tight">{label}</span>
                <span className={`text-[9px] font-mono ${active ? 'text-black/50' : 'text-white/25'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {availableGenres.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Genres</h3>
          <div className="flex flex-wrap gap-1.5">
            {displayedGenres.map(({ name, count }) => {
              const active = filters.genres.includes(name);
              return (
                <button key={name} onClick={() => toggleGenre(name)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 whitespace-nowrap flex items-center gap-1 ${
                    active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >
                  {name}
                  <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          {hasMoreGenres && (
            <button onClick={() => setShowAllGenres((v) => !v)}
              className="mt-2 text-[11px] text-white/35 hover:text-white/70 transition-colors"
            >
              {showAllGenres ? 'Voir moins' : `Voir tous (${availableGenres.length})`}
            </button>
          )}
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Période de sortie</h3>
        <DualRangeSlider value={filters.yearRange} onChange={(r) => onChange({ ...filters, yearRange: r })} />
        <div className="flex justify-between text-[11px] text-white/40 mt-2 mb-3 font-mono">
          <span>{filters.yearRange[0]}</span>
          <span>{filters.yearRange[1] === YEAR_MAX ? "Aujourd'hui" : filters.yearRange[1]}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onChange({ ...filters, yearRange: [YEAR_MIN, YEAR_MAX] })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
              isDefaultYear ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
            }`}
          >Tout</button>
          {DECADE_PRESETS.map(({ label, range }) => {
            const active = filters.yearRange[0] === range[0] && filters.yearRange[1] === range[1];
            return (
              <button key={label} onClick={() => applyPreset(range)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                  active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >{label}</button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Note & Popularité</h3>

        {/* Sous-bloc : Note TMDB */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Note TMDB</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {RATING_PRESETS.map(({ label, min, color }) => {
              const active = filters.ratingMin === min;
              const count  = allItems.filter((i) => min === 0 ? true : (i._rating !== null && i._rating >= min)).length;
              return (
                <button key={min} onClick={() => onChange({ ...filters, ratingMin: min })}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >
                  <span className={active ? 'text-yellow-500' : color}>★</span>
                  <span>{label}</span>
                  <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30 w-4">0</span>
            <input type="range" min={0} max={10} step={0.5}
              value={filters.ratingMin}
              onChange={(e) => onChange({ ...filters, ratingMin: parseFloat(e.target.value) })}
              className="flex-1"
              style={{ accentColor: 'white' }}
            />
            <span className="text-[10px] text-white/40 w-10 text-right font-mono">
              {filters.ratingMin > 0 ? `≥ ${filters.ratingMin}` : 'Tous'}
            </span>
          </div>
          {filters.ratingMin > 0 && filters.votesMin === 0 && (
            <p className="text-[10px] text-amber-500/70 mt-1.5 inline-flex items-center gap-1">
              <AlertTriangle size={11} />
              Inclut des titres avec très peu de votes
            </p>
          )}
        </div>

        {/* Sous-bloc : Fiabilité */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Fiabilité de la note</p>
            <span
              title="Un film avec 5 votes peut avoir 10/10. Ce filtre garantit que la note est représentative."
              className="text-[10px] text-white/20 cursor-help"
            >
              <Info size={11} />
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VOTE_PRESETS.map(({ label, min, tooltip }) => {
              const active = filters.votesMin === min;
              return (
                <button key={min} title={tooltip} onClick={() => onChange({ ...filters, votesMin: min })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 whitespace-nowrap ${
                    active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >{label}</button>
              );
            })}
          </div>
        </div>

        {/* Sous-bloc : Popularité */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Popularité TMDB</p>
            <span
              title="Classement basé sur les tendances TMDB. Indépendant de la note."
              className="text-[10px] text-white/20 cursor-help"
            >
              <Info size={11} />
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULARITY_PRESETS.map(({ label, topN }) => {
              const active = filters.popularityTopN === topN;
              return (
                <button key={label} onClick={() => onChange({ ...filters, popularityTopN: topN })}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >
                  {topN !== null && <Flame size={12} className={active ? 'text-black/50' : 'text-yellow-500'} />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {(availableLangs.length > 1 || availableCountries.length > 0) && (
        <section>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Langue & Pays</h3>

          {availableLangs.length > 1 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Langue originale</p>
              <div className="flex flex-wrap gap-1.5">
                {availableLangs.map(({ code, label, count }) => {
                  const active = filters.originalLanguages.includes(code);
                  return (
                    <button key={code} onClick={() => toggleLang(code)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                        active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10">
                        <Tv size={10} />
                      </span>
                      <span>{label}</span>
                      <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableCountries.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Pays de production</p>
              <div className="flex flex-wrap gap-1.5">
                {displayedCountries.map(({ code, label, count }) => {
                  const active = filters.countries.includes(code);
                  return (
                    <button key={code} onClick={() => toggleCountry(code)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                        active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10">
                        <UserRound size={10} />
                      </span>
                      <span>{label}</span>
                      <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              {hasMoreCountries && (
                <button onClick={() => setShowAllCountries((v) => !v)}
                  className="mt-2 text-[11px] text-white/35 hover:text-white/70 transition-colors"
                >
                  {showAllCountries ? 'Voir moins' : `Voir tous (+${availableCountries.length - COUNTRY_VISIBLE_LIMIT})`}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {hasDurationData && (showMovieDuration || showSeriesDuration) && (
        <section>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Durée & Structure</h3>

          {/* Films — durée */}
          {showMovieDuration && (
            <div className="mb-5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Durée du film</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onChange({ ...filters, movieRuntimeRange: null })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    filters.movieRuntimeRange === null ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >Toutes</button>
                {MOVIE_RUNTIME_PRESETS.map(({ label, sublabel, range }) => {
                  const active = filters.movieRuntimeRange?.[0] === range[0] && filters.movieRuntimeRange?.[1] === range[1];
                  const count  = allItems.filter((i) => i._movieRuntime !== null && i._movieRuntime >= range[0] && i._movieRuntime <= range[1]).length;
                  return (
                    <button key={label} onClick={() => toggleMovieRuntime(range)}
                      className={`flex flex-col items-start px-3 py-2 rounded-xl transition-all min-w-[86px] border ${
                        active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      <span className="text-xs font-medium inline-flex items-center gap-1.5">
                        <Clock3 size={12} />
                        {label}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>{sublabel} · {count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Séries — nombre de saisons */}
          {showSeriesDuration && (
            <div className="mb-5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Nombre de saisons</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onChange({ ...filters, seasonsRange: null })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    filters.seasonsRange === null ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >Toutes</button>
                {SEASONS_PRESETS.map(({ label, sublabel, range }) => {
                  const active = filters.seasonsRange?.[0] === range[0] && filters.seasonsRange?.[1] === range[1];
                  const count  = allItems.filter((i) => i._seasonCount !== null && i._seasonCount >= range[0] && i._seasonCount <= range[1]).length;
                  return (
                    <button key={label} onClick={() => toggleSeasonsRange(range)}
                      className={`flex flex-col items-start px-3 py-2 rounded-xl transition-all min-w-[86px] border ${
                        active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      <span className="text-xs font-medium inline-flex items-center gap-1.5">
                        <Tv size={12} />
                        {label}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>{sublabel} · {count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Séries — durée d'épisode */}
          {showSeriesDuration && (
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Durée d'épisode</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onChange({ ...filters, episodeRtRange: null })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    filters.episodeRtRange === null ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >Toutes</button>
                {EPISODE_RUNTIME_PRESETS.map(({ label, sublabel, range }) => {
                  const active = filters.episodeRtRange?.[0] === range[0] && filters.episodeRtRange?.[1] === range[1];
                  const count  = allItems.filter((i) => i._episodeRuntime !== null && i._episodeRuntime >= range[0] && i._episodeRuntime <= range[1]).length;
                  return (
                    <button key={label} onClick={() => toggleEpisodeRt(range)}
                      className={`flex flex-col items-start px-3 py-2 rounded-xl transition-all min-w-[86px] border ${
                        active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      <span className="text-xs font-medium inline-flex items-center gap-1.5">
                        <Clapperboard size={12} />
                        {label}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>{sublabel} · {count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
      {hasAvailabilityData && (
        <section>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Disponibilité</h3>

          {/* Toggle "Regardable maintenant" */}
          <button
            onClick={() => onChange({ ...filters, watchableNow: !filters.watchableNow })}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm mb-5 ${
              filters.watchableNow
                ? 'bg-green-600/20 border-green-500 text-green-400 font-medium'
                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Play size={14} />
              <span>Regardable maintenant</span>
            </span>
            <span className="text-[10px] opacity-60">Local · Debrid · Streaming</span>
          </button>

          {/* Source de disponibilité */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Source</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                { value: 'local'     as AvailabilitySource, label: 'Bibliothèque', icon: HardDrive, count: availabilityItems.filter((i) => i._isLocal).length    },
                { value: 'debrid'    as AvailabilitySource, label: 'Cache Debrid', icon: Zap, count: availabilityItems.filter((i) => i._isDebrid).length   },
                { value: 'streaming' as AvailabilitySource, label: 'Streaming',    icon: Radio, count: availabilityItems.filter((i) => i._providers.length > 0).length },
              ]).map(({ value, label, icon: SourceIcon, count }) => {
                const active = filters.availSources.includes(value);
                return (
                  <button key={value} onClick={() => toggleAvailSource(value)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                      active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                    }`}
                  >
                    <SourceIcon size={12} />
                    <span>{label}</span>
                    <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type d'accès streaming */}
          {(filters.availSources.includes('streaming') || filters.availSources.length === 0) && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Type d'accès</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'all'      as const, label: 'Tous',          icon: undefined },
                  { value: 'sub'      as const, label: 'Abonnement', icon: BadgeCheck     },
                  { value: 'rent_buy' as const, label: 'Location/Achat', icon: CreditCard },
                ] as const).map(({ value, label, icon: AccessIcon }) => (
                  <button key={value} onClick={() => onChange({ ...filters, streamingType: value })}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                      filters.streamingType === value ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                    }`}
                  >
                    {AccessIcon ? <AccessIcon size={12} /> : null}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Providers spécifiques */}
          {availableProviders.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Plateforme</p>
              <div className="flex flex-wrap gap-1.5">
                {availableProviders.map(({ id, name, flag, color, count }) => {
                  const active = filters.selectedProviders.includes(id);
                  return (
                    <button key={id} onClick={() => toggleProvider(id)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all duration-150 ${
                        active ? 'text-white border-transparent' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:border-white/25'
                      }`}
                      style={active ? { backgroundColor: color + '33', borderColor: color } : {}}
                    >
                      <span>{flag}</span>
                      <span>{name}</span>
                      <span className={`font-mono text-[10px] ${active ? 'text-white/50' : 'text-white/30'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Statut & Progression</h3>

        {/* Sous-bloc 1 : Statut TMDB (séries uniquement) */}
        {(filters.kinds.length === 0 ||
          filters.kinds.some((k) => ['tv', 'anime', 'animation', 'miniseries'].includes(k))) && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Statut de la série</p>
            <div className="flex flex-wrap gap-2">
              {SERIES_STATUS_UI.map(({ value, label, sublabel }) => {
                const active = filters.seriesStatuses.includes(value);
                const count  = allItems.filter((i) => i._status === value).length;
                const StatusIcon = SERIES_STATUS_ICONS[value];
                if (count === 0) return null;
                return (
                  <button key={value} onClick={() => toggleStatus(value)}
                    className={`flex flex-col items-start px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[110px] border ${
                      active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <StatusIcon size={13} />
                      {label}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>
                      {sublabel} · {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sous-bloc 2 : Progression utilisateur */}
        {profileActive ? (
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Ma progression</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {USER_STATUS_UI.map(({ value, label, sublabel }) => {
                const active = filters.userStatuses.includes(value);
                const count  = allItems.filter((i) => i._userStatus === value).length;
                const ProgressIcon = USER_STATUS_ICONS[value];
                return (
                  <button key={value} onClick={() => toggleUserStatus(value)}
                    className={`flex flex-col items-start px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[130px] border ${
                      active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ProgressIcon size={13} />
                      {label}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>
                      {sublabel} · {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mini barres de progression si "En cours" actif */}
            {filters.userStatuses.includes('in_progress') && (() => {
              const inProgressItems = allItems
                .filter((i) => i._userStatus === 'in_progress')
                .sort((a, b) => b._userProgress - a._userProgress)
                .slice(0, 8);
              if (inProgressItems.length === 0) return null;
              return (
                <div className="flex flex-col gap-2 mt-1 max-h-[160px] overflow-y-auto pr-1">
                  {inProgressItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-[11px] text-white/50 truncate flex-1 max-w-[140px]">
                        {item.title ?? item.name}
                      </span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${item._userProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/30 w-8 text-right font-mono">
                        {item._userProgress}%
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <UserRound size={16} className="text-white/45" />
            <span className="text-xs text-white/40 italic">
              Connecte-toi à un profil pour suivre ta progression
            </span>
          </div>
        )}
      </section>
      <section>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Tranche d'âge</h3>
        <div className="flex flex-wrap gap-1.5">
          {(['all', '10+', '12+', '16+', '18+', 'nc'] as AgeRating[]).map((rating) => {
            const isAll    = rating === 'all';
            const active   = isAll
              ? filters.selectedRatings.length === 0
              : filters.selectedRatings.includes(rating);
            const label    = isAll ? 'Tous' : rating === 'nc' ? 'Non classé' : rating;
            return (
              <button
                key={rating}
                onClick={() => {
                  if (isAll) onChange({ ...filters, selectedRatings: [] });
                  else onChange({
                    ...filters,
                    selectedRatings: filters.selectedRatings.includes(rating)
                      ? filters.selectedRatings.filter((r) => r !== rating)
                      : [...filters.selectedRatings, rating],
                  });
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                  active
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export { CatalogFilters };
