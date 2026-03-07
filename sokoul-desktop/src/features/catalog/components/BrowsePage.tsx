// BrowsePage.tsx — Browse library with filters
// HERO    : CinematicHero auto-slide 8s (top 8 items with backdrop)
// FILTERS : inline, just above sections (no longer sticky)
// SECTIONS: up to 15 dynamic colored sections
// DATA    : popular + top_rated (movies + series)

import * as React from 'react';
import { useNavigate }                    from 'react-router-dom';
import { useQueries, useQuery }           from '@tanstack/react-query';
import { AnimatePresence, motion }        from 'framer-motion';
import { endpoints }                      from '@/shared/api/client';
import type { CatalogMeta, ContentType, UserProgressEntry, PlaybackEntry } from '@/shared/types';
import { useProfileStore }                from '@/stores/profileStore';
import { extractLogo }                    from '@/shared/utils/tmdb';
import {
  classifyContentKind,
  expandGenres,
  extractYear,
  normalizeStatus,
} from '@/shared/utils/contentKind';
import type { RawGenre }                  from '@/shared/utils/contentKind';
import {
  CatalogFilters,
  DEFAULT_FILTERS,
  YEAR_MIN,
  YEAR_MAX,
  countActiveFilters,
  type FilterState,
  type EnrichedItem,
  type SortOption,
} from '@/features/catalog/components/CatalogFilters';
import { ContentCard }                    from '@/features/catalog/components/ContentCard';
import { HoverCard }                      from '@/features/catalog/components/HoverCard';
import { useHoverCard }                   from '@/shared/hooks/useHoverCard';
import {
  SlidersHorizontal,
  X,
  Home,
  Film,
  Tv,
  Flame,
  Clock3,
  Activity,
  CheckCircle2,
  SearchX,
  Compass,
  PlayCircle,
  Plus,
  Star,
  type LucideIcon,
} from 'lucide-react';

type CatalogId = 'popular' | 'top_rated';
const CATALOG_SOURCES: { type: ContentType; id: CatalogId }[] = [
  { type: 'movie',  id: 'popular'   },
  { type: 'movie',  id: 'top_rated' },
  { type: 'series', id: 'popular'   },
  { type: 'series', id: 'top_rated' },
];
const INITIAL_PAGES = 2;
const MORE_PAGES    = 2;

type ContentTabValue = 'all' | 'movie' | 'tv';

const TYPE_TABS: { value: ContentTabValue; label: string; icon: LucideIcon }[] = [
  { value: 'all',   label: 'All',    icon: Home },
  { value: 'movie', label: 'Films',  icon: Film },
  { value: 'tv',    label: 'Series', icon: Tv },
];

type BrowsePageMode = 'all' | 'movie' | 'series';

const MOVIE_PAGE_KINDS: FilterState['kinds']  = ['movie', 'short', 'documentary'];
const SERIES_PAGE_KINDS: FilterState['kinds'] = ['tv', 'anime', 'animation', 'miniseries'];

function getKindsForMode(mode: BrowsePageMode): FilterState['kinds'] {
  if (mode === 'movie')  return MOVIE_PAGE_KINDS;
  if (mode === 'series') return SERIES_PAGE_KINDS;
  return [];
}

function buildDefaultFilters(mode: BrowsePageMode): FilterState {
  return { ...DEFAULT_FILTERS, kinds: [...getKindsForMode(mode)] };
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popularity', label: 'Popularity'  },
  { value: 'rating',     label: 'Rating'      },
  { value: 'year_desc',  label: 'Newest'      },
  { value: 'year_asc',   label: 'Oldest'      },
  { value: 'title_asc',  label: 'A → Z'       },
  { value: 'title_desc', label: 'Z → A'       },
];

const KIND_LABELS: Record<string, string> = {
  movie:       'Movies',
  tv:          'Series',
  anime:       'Anime',
  animation:   'Animation',
  miniseries:  'Miniseries',
  documentary: 'Documentaries',
  reality:     'Reality TV',
  special:     'Specials',
  short:       'Short Films',
};

const GENRE_ACCENT: Record<string, string> = {
  'Action':          '#ef4444',
  'Science-Fiction': '#6366f1',
  'Drama':           '#a78bfa',
  'Comedy':          '#22c55e',
  'Thriller':        '#f59e0b',
  'Horror':          '#dc2626',
  'Romance':         '#ec4899',
  'Animation':       '#fb923c',
  'Fantasy':         '#8b5cf6',
  'Adventure':       '#14b8a6',
  'Mystery':         '#64748b',
  'Crime':           '#6b7280',
  'Documentary':     '#06b6d4',
  'History':         '#d97706',
  'War':             '#78716c',
  'Music':           '#f472b6',
  'Family':          '#10b981',
  'Western':         '#a04000',
  'Sci-Fi & Fantasy':'#4361ee',
  'War & Politics':  '#546e7a',
  'Reality TV':      '#00bcd4',
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 border border-white/5">
    {label}
    <button onClick={onRemove} className="text-white/30 hover:text-white transition-colors ml-0.5">
      <X size={12} />
    </button>
  </span>
);

interface ContentSection {
  id:           string;
  title:        string;
  subtitle:     string;
  accentColor:  string;
  icon?:        LucideIcon;
  items:        EnrichedItem[];
  showProgress?: boolean;
}

function resolveCardArtwork(item: EnrichedItem): string | null {
  const artwork = item.backdrop_path || item.background || item.poster_path || item.poster;
  if (!artwork) return null;
  if (artwork.startsWith('http')) return artwork;
  return `https://image.tmdb.org/t/p/w500${artwork.startsWith('/') ? '' : '/'}${artwork}`;
}

function resolveContentTypeFromItem(
  item: Pick<CatalogMeta, 'type' | 'media_type'>,
  mode: BrowsePageMode,
): ContentType {
  const rawType = (item.type ?? item.media_type ?? (mode === 'movie' ? 'movie' : 'series')).toString().toLowerCase();
  return rawType === 'movie' ? 'movie' : 'series';
}

function EditorialCard({
  item,
  sectionId,
  showProgress,
  onOpen,
  playbackEntry,
}: {
  item:         EnrichedItem;
  sectionId:    string;
  showProgress: boolean;
  onOpen:       (item: EnrichedItem) => void;
  playbackEntry?: PlaybackEntry;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [loaded,  setLoaded]  = React.useState(false);

  const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
  const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';

  const { data: fanartData } = useQuery({
    queryKey:  ['fanart-editorial', sectionId, fanartType, tmdbId],
    queryFn:   () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
    enabled:   hovered && !!tmdbId,
    staleTime: Infinity,
  });

  const logoUrl = React.useMemo(() => extractLogo(fanartData), [fanartData]);

  const rawArtwork = (showProgress && playbackEntry?.stillPath)
    ? playbackEntry.stillPath
    : (item.backdrop_path || item.background || null);
  if (!rawArtwork) return null;

  const artwork = rawArtwork.startsWith('http')
    ? rawArtwork.replace('/w500/', '/w780/')
    : `https://image.tmdb.org/t/p/w780${rawArtwork.startsWith('/') ? '' : '/'}${rawArtwork}`;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex-shrink-0 w-[260px] aspect-video rounded-xl overflow-hidden bg-white/[0.04]"
      style={{
        border:     hovered ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.10)',
        transform:  hovered ? 'scale(1.04) translateY(-4px)' : 'scale(1)',
        boxShadow:  hovered
          ? '0 22px 48px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(255,255,255,0.18)'
          : '0 4px 18px rgba(0,0,0,0.5)',
        transition: 'all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}

      <img
        src={artwork}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover"
        style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s ease' }}
      />

      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(4,8,20,0.65) 0%, transparent 55%)' }}
      />

      {logoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ padding: '12%', opacity: hovered ? 1 : 0.82, transition: 'opacity 0.3s ease' }}
        >
          <img
            src={logoUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.9))', maxHeight: 64 }}
          />
        </div>
      )}

      {showProgress && playbackEntry?.season != null && playbackEntry?.episode != null && (
        <div className="absolute bottom-5 left-0 right-0 px-3">
          <p className="text-[11px] font-semibold text-white/80 truncate">
            S{String(playbackEntry.season).padStart(2, '0')}E{String(playbackEntry.episode).padStart(2, '0')}
            {playbackEntry.episodeTitle ? ` — ${playbackEntry.episodeTitle}` : ''}
          </p>
        </div>
      )}

      {showProgress && item._userProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-cyan-400"
            style={{ width: `${Math.min(100, Math.max(0, item._userProgress))}%` }}
          />
        </div>
      )}
    </button>
  );
}

function EditorialRail({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  items,
  showProgress = false,
  onOpen,
  playbackLookup,
}: {
  title:          string;
  subtitle:       string;
  icon?:          LucideIcon;
  accentColor?:   string;
  items:          EnrichedItem[];
  showProgress?:  boolean;
  onOpen:         (item: EnrichedItem) => void;
  playbackLookup?: Map<string, PlaybackEntry>;
}) {
  if (items.length === 0) return null;
  const sectionId = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2.5">
          {accentColor ? (
            <div
              style={{
                width: 4, height: 36, borderRadius: 2, flexShrink: 0,
                background: accentColor,
                boxShadow: `0 0 12px ${accentColor}88, 0 0 24px ${accentColor}44`,
              }}
            />
          ) : Icon ? (
            <span className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center">
              <Icon size={16} className="text-white/80" />
            </span>
          ) : null}
          <div>
            <h2
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: 'clamp(13px, 1.4vw, 18px)', fontWeight: 800,
                letterSpacing: '-0.025em', color: 'rgba(249,249,249,0.95)',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '11px', fontStyle: 'italic',
                  color: accentColor ? `${accentColor}cc` : 'rgba(249,249,249,0.40)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <span className="text-[11px] text-white/30 font-mono">{items.length} titles</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {items.slice(0, 25).map((item) => (
          <EditorialCard
            key={`${sectionId}-${item.id}`}
            item={item}
            sectionId={sectionId}
            showProgress={showProgress}
            onOpen={onOpen}
            playbackEntry={playbackLookup?.get(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

function BrowseHero({
  items,
  onPlay,
  onInfo,
}: {
  items:  EnrichedItem[];
  onPlay: (item: EnrichedItem) => void;
  onInfo: (item: EnrichedItem) => void;
}) {
  const heroItems = React.useMemo(
    () => items.filter(i => !!(i.backdrop_path || i.background)).slice(0, 8),
    [items]
  );
  const [idx,    setIdx]    = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => { setIdx(0); }, [items]);

  React.useEffect(() => {
    if (paused || heroItems.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % heroItems.length), 8000);
    return () => clearInterval(t);
  }, [paused, heroItems.length]);

  // Preload Fanart logos for all hero items
  const fanartQueries = useQueries({
    queries: heroItems.map(item => {
      const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
      const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';
      return {
        queryKey:  ['hero-fanart', fanartType, tmdbId] as const,
        queryFn:   () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
        staleTime: Infinity,
      };
    }),
  });

  if (heroItems.length === 0) return null;

  const safeIdx  = Math.min(idx, heroItems.length - 1);
  const current  = heroItems[safeIdx];
  const heroLogo = extractLogo(fanartQueries[safeIdx]?.data);

  const rawBg  = current.backdrop_path || current.background || null;
  const bgImg  = rawBg
    ? (rawBg.startsWith('http')
        ? rawBg.replace('/w500/', '/original/')
        : `https://image.tmdb.org/t/p/original${rawBg.startsWith('/') ? '' : '/'}${rawBg}`)
    : null;

  const title    = current.title || current.name || '';
  const synopsis = current.overview || current.description || '';
  const year     = String(current._year ?? '').substring(0, 4);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '70vh', minHeight: 520 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backgrounds with crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${safeIdx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}
          className="absolute inset-0"
        >
          {bgImg ? (
            <img src={bgImg} alt="" className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(4,7,20,0.95) 28%, rgba(4,7,20,0.45) 62%, transparent 100%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(4,7,20,1) 0%, rgba(4,7,20,0.25) 38%, transparent 65%)' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-16 px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${safeIdx}`}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-xl"
          >
            {/* Logo or Title */}
            {heroLogo ? (
              <img
                src={heroLogo}
                alt={title}
                loading="lazy"
                style={{
                  maxHeight: 72, maxWidth: 340, objectFit: 'contain',
                  marginBottom: 14,
                  filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.9))',
                  display: 'block',
                }}
              />
            ) : (
              <h1
                style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: 'clamp(1.8rem, 4vw, 4rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  marginBottom: 12,
                  lineHeight: 1.05,
                }}
              >
                {title}
              </h1>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {year && <span className="text-sm text-white/55">{year}</span>}
              {current._rating && (
                <span className="text-sm text-green-400 font-semibold">
                  {Math.round(current._rating * 10)}%
                </span>
              )}
              {current._genres.slice(0, 3).map(g => (
                <span key={g} className="text-xs px-2 py-0.5 rounded-md border border-white/15 bg-black/30 text-white/65">
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            {synopsis && (
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  color: 'rgba(249,249,249,0.60)',
                  lineHeight: 1.65,
                  marginBottom: 20,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}
              >
                {synopsis}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPlay(current)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-white/90 transition-all"
              >
                <PlayCircle size={17} /> Watch
              </button>
              <button
                onClick={() => onInfo(current)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/25 bg-black/30 text-white text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-all"
              >
                <Plus size={17} /> More info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots */}
      {heroItems.length > 1 && (
        <div className="absolute bottom-5 right-10 flex items-center gap-1.5">
          {heroItems.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setPaused(true); }}
              className="rounded-full transition-all duration-300"
              style={{
                width:      i === safeIdx ? 20 : 6,
                height:     6,
                background: i === safeIdx ? 'white' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function medianRuntime(runtimes: number[]): number | null {
  const valid = runtimes.filter((r) => r > 0);
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function applyFiltersWithoutGenres(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  const [yMin, yMax] = filters.yearRange;
  const isDefaultYear = yMin === YEAR_MIN && yMax === YEAR_MAX;

  return items.filter((item) => {
    if (filters.kinds.length > 0 && !filters.kinds.includes(item._kind)) return false;

    if (!isDefaultYear && item._year !== null) {
      if (item._year < yMin || item._year > yMax) return false;
    }

    if (filters.seriesStatuses.length > 0 && item._kind !== 'movie' && item._kind !== 'short') {
      if (!filters.seriesStatuses.includes(item._status)) return false;
    }

    if (filters.ratingMin > 0) {
      if (item._rating === null || item._rating < filters.ratingMin) return false;
    }

    if (filters.votesMin > 0 && item._votes < filters.votesMin) return false;

    if (filters.popularityTopN !== null && item._popRank > filters.popularityTopN) return false;

    if (filters.originalLanguages.length > 0 && !filters.originalLanguages.includes(item._lang)) return false;
    if (filters.countries.length > 0 && !filters.countries.some((c) => item._countries.includes(c))) return false;

    if (filters.movieRuntimeRange !== null) {
      const isMovieLike = item._kind === 'movie' || item._kind === 'short';
      if (isMovieLike && item._movieRuntime !== null) {
        const [min, max] = filters.movieRuntimeRange;
        if (item._movieRuntime < min || item._movieRuntime > max) return false;
      }
    }

    if (filters.seasonsRange !== null) {
      const isSeries = item._kind !== 'movie' && item._kind !== 'short';
      if (isSeries && item._seasonCount !== null) {
        const [min, max] = filters.seasonsRange;
        if (item._seasonCount < min || item._seasonCount > max) return false;
      }
    }

    if (filters.episodeRtRange !== null) {
      const isSeries = item._kind !== 'movie' && item._kind !== 'short';
      if (isSeries && item._episodeRuntime !== null) {
        const [min, max] = filters.episodeRtRange;
        if (item._episodeRuntime < min || item._episodeRuntime > max) return false;
      }
    }

    if (!matchesAvailability(item, filters)) return false;
    if (!matchesUserStatus(item, filters)) return false;

    return true;
  });
}

function applyFiltersWithoutLangCountry(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  const [yMin, yMax] = filters.yearRange;
  const isDefaultYear = yMin === YEAR_MIN && yMax === YEAR_MAX;

  return items.filter((item) => {
    if (filters.kinds.length > 0 && !filters.kinds.includes(item._kind)) return false;
    if (filters.genres.length > 0 && !filters.genres.some((g) => item._genres.includes(g))) return false;

    if (!isDefaultYear && item._year !== null) {
      if (item._year < yMin || item._year > yMax) return false;
    }

    if (filters.seriesStatuses.length > 0 && item._kind !== 'movie' && item._kind !== 'short') {
      if (!filters.seriesStatuses.includes(item._status)) return false;
    }

    if (filters.ratingMin > 0) {
      if (item._rating === null || item._rating < filters.ratingMin) return false;
    }

    if (filters.votesMin > 0 && item._votes < filters.votesMin) return false;

    if (filters.popularityTopN !== null && item._popRank > filters.popularityTopN) return false;

    if (filters.movieRuntimeRange !== null) {
      const isMovieLike = item._kind === 'movie' || item._kind === 'short';
      if (isMovieLike && item._movieRuntime !== null) {
        const [min, max] = filters.movieRuntimeRange;
        if (item._movieRuntime < min || item._movieRuntime > max) return false;
      }
    }

    if (filters.seasonsRange !== null) {
      const isSeries = item._kind !== 'movie' && item._kind !== 'short';
      if (isSeries && item._seasonCount !== null) {
        const [min, max] = filters.seasonsRange;
        if (item._seasonCount < min || item._seasonCount > max) return false;
      }
    }

    if (filters.episodeRtRange !== null) {
      const isSeries = item._kind !== 'movie' && item._kind !== 'short';
      if (isSeries && item._episodeRuntime !== null) {
        const [min, max] = filters.episodeRtRange;
        if (item._episodeRuntime < min || item._episodeRuntime > max) return false;
      }
    }

    if (!matchesAvailability(item, filters)) return false;
    if (!matchesUserStatus(item, filters)) return false;

    return true;
  });
}

function matchesAvailability(item: EnrichedItem, filters: FilterState): boolean {
  if (filters.watchableNow && !item._isWatchable) return false;

  if (filters.availSources.length > 0) {
    const hasLocal  = filters.availSources.includes('local')     && item._isLocal;
    const hasDebrid = filters.availSources.includes('debrid')    && item._isDebrid;
    const hasStream = filters.availSources.includes('streaming') && item._providers.length > 0;
    if (!hasLocal && !hasDebrid && !hasStream) return false;
  }

  if (filters.selectedProviders.length > 0) {
    if (!filters.selectedProviders.some((id) => item._providerIds.includes(id))) return false;
  }

  if (filters.streamingType !== 'all' && item._providers.length > 0) {
    if (filters.streamingType === 'sub') {
      if (!item._providers.some((p) => p.type === 'sub')) return false;
    } else if (filters.streamingType === 'rent_buy') {
      if (!item._providers.some((p) => p.type === 'rent' || p.type === 'buy')) return false;
    }
  }

  return true;
}

function matchesUserStatus(item: EnrichedItem, filters: FilterState): boolean {
  if (filters.userStatuses.length === 0) return true;
  return filters.userStatuses.includes(item._userStatus);
}

function applyFiltersWithoutAvailability(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  const withoutGenres = applyFiltersWithoutGenres(items, filters);
  if (filters.genres.length === 0) return withoutGenres;
  return withoutGenres.filter((item) =>
    filters.genres.some((g) => item._genres.includes(g))
  );
}

function applyFilters(items: EnrichedItem[], filters: FilterState): EnrichedItem[] {
  return applyFiltersWithoutAvailability(items, filters).filter((item) =>
    matchesAvailability(item, filters)
  );
}

export default function BrowsePage({ mode = 'all' }: { mode?: BrowsePageMode }) {
  const navigate = useNavigate();
  const [filters, setFilters]           = React.useState<FilterState>(() => buildDefaultFilters(mode));
  const [loadedPages, setLoadedPages]   = React.useState(INITIAL_PAGES);
  const [drawerOpen, setDrawerOpen]     = React.useState(false);
  const { itemId, anchorRect, onEnter, onLeave } = useHoverCard(300);
  const scopedKinds = React.useMemo(() => getKindsForMode(mode), [mode]);
  const resultsSectionRef = React.useRef<HTMLDivElement | null>(null);

  const resolveItemType = React.useCallback((item: Pick<CatalogMeta, 'type' | 'media_type'>): ContentType => {
    return resolveContentTypeFromItem(item, mode);
  }, [mode]);

  const openDetails = React.useCallback((item: CatalogMeta) => {
    const normalizedType = resolveItemType(item);
    navigate(`/detail/${normalizedType}/${encodeURIComponent(item.id)}`);
  }, [navigate, resolveItemType]);

  const openSources = React.useCallback((item: CatalogMeta) => {
    const normalizedType = resolveItemType(item);
    navigate(`/sources/${normalizedType}/${encodeURIComponent(item.id)}`);
  }, [navigate, resolveItemType]);

  const setScopedFilters = React.useCallback((next: React.SetStateAction<FilterState>) => {
    setFilters((prev) => {
      const resolved =
        typeof next === 'function'
          ? (next as (value: FilterState) => FilterState)(prev)
          : next;
      if (mode === 'all') return resolved;
      return { ...resolved, kinds: [...scopedKinds] };
    });
  }, [mode, scopedKinds]);

  const [searchInput, setSearchInput] = React.useState(filters.searchQuery);

  React.useEffect(() => {
    setFilters(buildDefaultFilters(mode));
    setLoadedPages(INITIAL_PAGES);
  }, [mode]);

  React.useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setScopedFilters(f => f.searchQuery === searchInput ? f : { ...f, searchQuery: searchInput });
    }, 150);
    return () => clearTimeout(handler);
  }, [searchInput, setScopedFilters]);

  const activeProfile = useProfileStore((s) => s.activeProfile);
  const profileId     = activeProfile?.id ?? null;

  const { data: userProgressResponse } = useQuery({
    queryKey:  ['user-progress', profileId],
    queryFn:   () => endpoints.userProgress.list(profileId!),
    enabled:   profileId !== null,
    staleTime: 30_000,
  });

  const userProgressList = userProgressResponse?.data ?? [];

  const userProgressMap = React.useMemo(
    () => new Map<string, UserProgressEntry>(userProgressList.map((e: UserProgressEntry) => [e.contentId, e])),
    [userProgressList]
  );

  const { data: playbackHistoryRes } = useQuery({
    queryKey:  ['playback-history', profileId],
    queryFn:   () => endpoints.playback.history(profileId!, 50).then(r => r.data),
    enabled:   profileId !== null,
    staleTime: 30_000,
  });
  const playbackHistoryMap = React.useMemo(() => {
    const map = new Map<string, PlaybackEntry>();
    for (const e of (playbackHistoryRes ?? [])) {
      // content_id stored with prefix "tmdb:12345", item.id is "12345"
      const key = e.contentId.includes(':') ? e.contentId.split(':').pop()! : e.contentId;
      if (!map.has(key)) map.set(key, e);
    }
    return map;
  }, [playbackHistoryRes]);

  const catalogSources = React.useMemo(() => {
    if (mode === 'movie')  return CATALOG_SOURCES.filter(({ type }) => type === 'movie');
    if (mode === 'series') return CATALOG_SOURCES.filter(({ type }) => type === 'series');
    return CATALOG_SOURCES;
  }, [mode]);

  const queries = React.useMemo(
    () =>
      catalogSources.flatMap(({ type, id }) =>
        Array.from({ length: loadedPages }, (_, i) => ({
          queryKey:  ['library', type, id, i + 1] as const,
          queryFn:   () =>
            endpoints.catalog
              .get(type, id, { page: String(i + 1) })
              .then((r) => (r.data.metas ?? []) as CatalogMeta[]),
          staleTime: 10 * 60 * 1000,
        }))
      ),
    [catalogSources, loadedPages]
  );

  const results   = useQueries({ queries });
  const isLoading = results.some((r) => r.isLoading);

  const rawItems = React.useMemo(() => {
    const all: CatalogMeta[] = [];
    for (const r of results) { if (r.data) all.push(...r.data); }
    const seen = new Set<string>();
    return all.filter((item) => item.id && !seen.has(item.id) && seen.add(item.id));
  }, [results]);

  const enrichedItems = React.useMemo<EnrichedItem[]>(() => {
    const moviesByPop  = [...rawItems].filter((i) => i.type === 'movie')
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const seriesByPop  = [...rawItems].filter((i) => i.type !== 'movie')
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const movieRankMap = new Map(moviesByPop.map((item, i) => [item.id, i + 1]));
    const showRankMap  = new Map(seriesByPop.map((item, i) => [item.id, i + 1]));

    return rawItems.map((item) => {
      const va      = item.vote_average;
      const runtime = item.runtime;
      const epRt    = item.episode_run_time;

      const rawType   = item.type || item.media_type || 'movie';
      const mediaType = rawType === 'series' ? 'tv' : rawType;
      const contentId = `${mediaType}:${item.id}`;
      const prog      = userProgressMap.get(contentId);

      const isToResume =
        prog?.status === 'completed' &&
        normalizeStatus(item.status) === 'returning' &&
        item.number_of_episodes != null &&
        prog.progress < 100;

      return {
        ...item,
        _kind:           classifyContentKind(item),
        _genres:         expandGenres((item.genres ?? []) as RawGenre[]),
        _year:           extractYear(item),
        _status:         normalizeStatus(item.status),
        _lang:           item.original_language?.toLowerCase() ?? 'unknown',
        _countries:      (item.origin_country ?? []).map((c) => c.toUpperCase()),
        _rating:         (typeof va === 'number' && va > 0) ? Math.round(va * 10) / 10 : null,
        _votes:          item.vote_count ?? 0,
        _popularity:     item.popularity ?? 0,
        _popRank:        (item.type === 'movie' ? movieRankMap : showRankMap).get(item.id) ?? 9999,
        _movieRuntime:   (typeof runtime === 'number' && runtime > 0) ? runtime : null,
        _seasonCount:    item.number_of_seasons ?? null,
        _episodeCount:   item.number_of_episodes ?? null,
        _episodeRuntime: epRt ? medianRuntime(epRt) : null,
        _isLocal:        item.availability?.isLocal           ?? false,
        _isDebrid:       item.availability?.isDebridCached    ?? false,
        _providers:      item.availability?.streamingProviders ?? [],
        _isWatchable:    item.availability?.isWatchableNow    ?? false,
        _providerIds:    (item.availability?.streamingProviders ?? []).map((p) => p.id),
        _userStatus:     isToResume ? 'to_resume' : (prog?.status ?? 'unwatched'),
        _userProgress:   playbackHistoryMap.get(item.id)?.progressPct ?? prog?.progress ?? 0,
        _userRating:     prog?.rating ?? null,
      };
    });
  }, [rawItems, userProgressMap, playbackHistoryMap]);

  const genreItems = React.useMemo(
    () => applyFiltersWithoutGenres(enrichedItems, filters),
    [enrichedItems, filters]
  );
  const langCountryItems = React.useMemo(
    () => applyFiltersWithoutLangCountry(enrichedItems, filters),
    [enrichedItems, filters]
  );
  const availabilityItems = React.useMemo(
    () => applyFiltersWithoutAvailability(enrichedItems, filters),
    [enrichedItems, filters]
  );

  const filteredItems = React.useMemo(() => {
    let list = applyFilters(enrichedItems, filters);

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter((item) =>
        (item.title ?? item.name ?? '').toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b._rating ?? 0) - (a._rating ?? 0);
        case 'year_desc':
          return (b._year ?? 0) - (a._year ?? 0);
        case 'year_asc':
          return (a._year ?? 0) - (b._year ?? 0);
        case 'title_asc':
          return (a.title ?? a.name ?? '').localeCompare(b.title ?? b.name ?? '');
        case 'title_desc':
          return (b.title ?? b.name ?? '').localeCompare(a.title ?? a.name ?? '');
        case 'popularity':
        default:
          return (b._popularity ?? 0) - (a._popularity ?? 0);
      }
    });

    return list;
  }, [enrichedItems, filters]);

  const activeFiltersCount = React.useMemo(() => {
    if (mode === 'all') return countActiveFilters(filters);
    return countActiveFilters({ ...filters, kinds: [] });
  }, [filters, mode]);

  const currentKindTab = React.useMemo(() => {
    if (filters.kinds.length === 0) return 'all';
    const movieKinds  = ['movie', 'short', 'documentary'] as const;
    const seriesKinds = ['tv', 'anime', 'animation', 'miniseries'] as const;
    if (filters.kinds.length === movieKinds.length && movieKinds.every(k => filters.kinds.includes(k))) return 'movie';
    if (filters.kinds.length === seriesKinds.length && seriesKinds.every(k => filters.kinds.includes(k))) return 'tv';
    return 'custom';
  }, [filters.kinds]);

  const handleTabClick = (val: ContentTabValue) => {
    if (val === 'all')        setScopedFilters(f => ({ ...f, kinds: [] }));
    else if (val === 'movie') setScopedFilters(f => ({ ...f, kinds: ['movie', 'short', 'documentary'] }));
    else if (val === 'tv')    setScopedFilters(f => ({ ...f, kinds: ['tv', 'anime', 'animation', 'miniseries'] }));
  };

  const contentSections = React.useMemo<ContentSection[]>(() => {
    const sections: ContentSection[] = [];
    const seen = new Set<string>();
    const currentYear = new Date().getFullYear();

    const dedup = (items: EnrichedItem[]): EnrichedItem[] => {
      const unique = items.filter(i => !seen.has(i.id));
      unique.forEach(i => seen.add(i.id));
      return unique;
    };

    // 1. Continue watching
    const continueWatching = dedup(
      filteredItems
        .filter(i => i._userProgress > 5 && i._userProgress < 95)
        .sort((a, b) => b._userProgress - a._userProgress)
        .slice(0, 25)
    );
    if (continueWatching.length > 0) {
      sections.push({
        id: 'continue', title: 'Continue watching',
        subtitle: 'Resume instantly at the right moment',
        accentColor: '#7c3aed', icon: PlayCircle,
        items: continueWatching, showProgress: true,
      });
    }

    // 2. Trending now
    const trending = dedup(
      [...filteredItems]
        .sort((a, b) => (b._popularity ?? 0) - (a._popularity ?? 0))
        .slice(0, 25)
    );
    if (trending.length > 0) {
      sections.push({
        id: 'trending', title: 'Trending now',
        subtitle: 'The titles capturing the most attention',
        accentColor: '#f97316', icon: Flame,
        items: trending,
      });
    }

    // 3. Top rated (≥ 7.5)
    const topRated = dedup(
      filteredItems
        .filter(i => (i._rating ?? 0) >= 7.5)
        .sort((a, b) => (b._rating ?? 0) - (a._rating ?? 0))
        .slice(0, 25)
    );
    if (topRated.length > 0) {
      sections.push({
        id: 'top-rated', title: 'Top rated',
        subtitle: 'Critical quality and audience acclaim',
        accentColor: '#eab308', icon: Star,
        items: topRated,
      });
    }

    // 4. Recent releases (last 3 years)
    const recentItems = dedup(
      filteredItems
        .filter(i => i._year !== null && i._year >= currentYear - 3)
        .slice(0, 25)
    );
    if (recentItems.length > 0) {
      sections.push({
        id: 'recent', title: 'Recent releases',
        subtitle: `Focus ${currentYear - 3}–${currentYear}`,
        accentColor: '#22c55e',
        items: recentItems,
      });
    }

    // 5. New this year
    const newItems = dedup(
      filteredItems
        .filter(i => i._year === currentYear)
        .slice(0, 25)
    );
    if (newItems.length > 0) {
      sections.push({
        id: 'new-this-year', title: `New in ${currentYear}`,
        subtitle: 'This year\'s releases',
        accentColor: '#10b981',
        items: newItems,
      });
    }

    // 6–20. Top 15 genres by item count
    const genreCounts = new Map<string, number>();
    for (const item of filteredItems) {
      for (const genre of new Set(item._genres)) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
    }
    const topGenres = [...genreCounts.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    for (const [genre] of topGenres) {
      if (sections.length >= 20) break;
      const genreList = dedup(
        filteredItems
          .filter(i => i._genres.includes(genre))
          .slice(0, 25)
      );
      if (genreList.length >= 3) {
        sections.push({
          id: `genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
          title: genre,
          subtitle: 'Editorial selection by genre',
          accentColor: GENRE_ACCENT[genre] ?? '#6b7280',
          icon: Compass,
          items: genreList,
        });
      }
    }

    // 21. International cinema (neither English nor French)
    const international = dedup(
      filteredItems
        .filter(i => i._lang !== 'en' && i._lang !== 'fr' && i._lang !== 'unknown')
        .slice(0, 25)
    );
    if (international.length >= 3 && sections.length < 21) {
      sections.push({
        id: 'international', title: 'International cinema',
        subtitle: 'Works from around the world',
        accentColor: '#06b6d4',
        items: international,
      });
    }

    // 22. Classics (before 1995)
    const classics = dedup(
      filteredItems
        .filter(i => i._year !== null && i._year < 1995)
        .sort((a, b) => (b._rating ?? 0) - (a._rating ?? 0))
        .slice(0, 25)
    );
    if (classics.length >= 3 && sections.length < 22) {
      sections.push({
        id: 'classics', title: 'Timeless classics',
        subtitle: 'Foundational works from before 1995',
        accentColor: '#d97706',
        items: classics,
      });
    }

    // 23. Currently airing series (mode ≠ movie)
    if (mode !== 'movie' && sections.length < 23) {
      const returning = dedup(
        filteredItems
          .filter(i => i._status === 'returning')
          .slice(0, 25)
      );
      if (returning.length >= 3) {
        sections.push({
          id: 'returning', title: 'Currently airing series',
          subtitle: 'New seasons and returning episodes',
          accentColor: '#3b82f6', icon: Activity,
          items: returning,
        });
      }
    }

    // 24. Anime & Animation
    if (sections.length < 24) {
      const animeAnim = dedup(
        filteredItems
          .filter(i => i._kind === 'anime' || i._kind === 'animation')
          .slice(0, 25)
      );
      if (animeAnim.length >= 3) {
        sections.push({
          id: 'anime-animation', title: 'Anime & Animation',
          subtitle: 'Animated universes from all horizons',
          accentColor: '#fb923c',
          items: animeAnim,
        });
      }
    }

    // 25. Hidden gems (high rating, low popularity)
    if (sections.length < 25) {
      const hidden = dedup(
        filteredItems
          .filter(i => (i._rating ?? 0) >= 7.0 && (i._popularity ?? 0) < 50)
          .sort((a, b) => (b._rating ?? 0) - (a._rating ?? 0))
          .slice(0, 25)
      );
      if (hidden.length >= 3) {
        sections.push({
          id: 'hidden-gems', title: 'Hidden gems',
          subtitle: 'Treasures few have discovered',
          accentColor: '#a78bfa',
          items: hidden,
        });
      }
    }

    return sections.slice(0, 25);
  }, [filteredItems, mode]);

  const canLoadMore = loadedPages < 8;
  const isSearching = filters.searchQuery.trim().length > 0;

  return (
    <div
      className="flex flex-col min-h-screen bg-[#040714] text-white"
      style={{ paddingTop: 'var(--navbar-height)' }}
    >
      {!isSearching && (
        <BrowseHero
          items={filteredItems}
          onPlay={openSources}
          onInfo={openDetails}
        />
      )}

      <main className="flex-1 min-w-0 px-8 pt-6 pb-10 flex flex-col">

        <div className="flex items-center gap-3 mb-4 flex-wrap">

          {/* Type tabs (all mode only) */}
          {mode === 'all' && (
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
              {TYPE_TABS.map((tab) => {
                const isActive = currentKindTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => handleTabClick(tab.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                      ${isActive
                        ? 'bg-white text-black shadow-lg shadow-black/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <tab.icon size={15} strokeWidth={2.2} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Spacer to push filter button to the right */}
          <div className="flex-1" />

          {/* Filter button — right-aligned */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border
              ${activeFiltersCount > 0
                ? 'bg-white/15 border-white/40 text-white'
                : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
          >
            <SlidersHorizontal size={15} strokeWidth={2.2} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5
                               bg-blue-500 text-white text-[10px] font-bold
                               rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs text-white/30 mr-1">
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
            </span>

            {mode === 'all' && filters.kinds.length > 0 && (
              <FilterChip
                label={filters.kinds.map(k => KIND_LABELS[k]).join(', ')}
                onRemove={() => setScopedFilters(f => ({ ...f, kinds: [] }))}
              />
            )}
            {filters.genres.length > 0 && (
              <FilterChip
                label={filters.genres.join(', ')}
                onRemove={() => setScopedFilters(f => ({ ...f, genres: [] }))}
              />
            )}
            {(filters.yearRange[0] !== YEAR_MIN || filters.yearRange[1] !== YEAR_MAX) && (
              <FilterChip
                label={`${filters.yearRange[0]}–${filters.yearRange[1] === YEAR_MAX ? 'Today' : filters.yearRange[1]}`}
                onRemove={() => setScopedFilters(f => ({ ...f, yearRange: [YEAR_MIN, YEAR_MAX] }))}
              />
            )}
            {filters.ratingMin > 0 && (
              <FilterChip
                label={`≥ ${filters.ratingMin} ★`}
                onRemove={() => setScopedFilters(f => ({ ...f, ratingMin: 0 }))}
              />
            )}
            {filters.originalLanguages.length > 0 && (
              <FilterChip
                label={filters.originalLanguages.join(', ').toUpperCase()}
                onRemove={() => setScopedFilters(f => ({ ...f, originalLanguages: [] }))}
              />
            )}
            {filters.availSources.length > 0 && (
              <FilterChip
                label="Availability"
                onRemove={() => setScopedFilters(f => ({ ...f, availSources: [] }))}
              />
            )}

            <button
              onClick={() => setScopedFilters(buildDefaultFilters(mode))}
              className="text-xs text-red-400/60 hover:text-red-400 ml-2 transition-colors font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {!isLoading && contentSections.length > 0 && !isSearching && (
          <div className="mb-6">
            {contentSections.map((section) => (
              <EditorialRail
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                accentColor={section.accentColor}
                icon={section.icon}
                items={section.items}
                showProgress={section.showProgress}
                onOpen={openDetails}
                playbackLookup={section.id === 'continue' ? playbackHistoryMap : undefined}
              />
            ))}
          </div>
        )}

        {isLoading && rawItems.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/30">
            <SearchX size={46} className="mb-4 text-white/25" />
            <p className="text-base font-medium">No results for these filters</p>
            <button
              onClick={() => setScopedFilters(buildDefaultFilters(mode))}
              className="mt-4 text-sm text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
            >
              Reset filters
            </button>
          </div>
        ) : isSearching ? (
          <>
            <div
              ref={resultsSectionRef}
              className="grid scroll-mt-24 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3"
            >
              {filteredItems.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  variant="poster"
                  onHoverEnter={onEnter}
                  onHoverLeave={onLeave}
                />
              ))}
            </div>

            {itemId !== null && anchorRect !== null && (() => {
              const hoverItem = filteredItems.find((i) => i.id === String(itemId));
              return hoverItem
                ? <HoverCard item={hoverItem} anchorRect={anchorRect} onLeave={onLeave} />
                : null;
            })()}

            {canLoadMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setLoadedPages((p) => p + MORE_PAGES)}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-full border border-white/20 text-sm text-white/70 hover:border-white/50 hover:text-white transition-all disabled:opacity-40"
                >
                  {isLoading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Load more button outside search */
          canLoadMore && !isLoading ? (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setLoadedPages((p) => p + MORE_PAGES)}
                className="px-8 py-3 rounded-full border border-white/10 text-sm text-white/40 hover:border-white/30 hover:text-white/70 transition-all"
              >
                Load more titles
              </button>
            </div>
          ) : null
        )}
      </main>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60  z-[100]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-[380px] z-[101]
                          bg-[#0d0f1a] border-l border-white/10
                          flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500 text-[10px] font-bold text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              <CatalogFilters
                allItems={enrichedItems}
                genreItems={genreItems}
                langCountryItems={langCountryItems}
                availabilityItems={availabilityItems}
                filters={filters}
                onChange={setScopedFilters}
                profileActive={activeProfile !== null}
              />
            </div>

            <div className="flex items-center justify-between px-6 py-5 border-t border-white/10 bg-[#0d0f1a]">
              <button
                onClick={() => setScopedFilters(buildDefaultFilters(mode))}
                className="text-sm font-medium text-white/40 hover:text-white transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg active:scale-95"
              >
                View {filteredItems.length} results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
