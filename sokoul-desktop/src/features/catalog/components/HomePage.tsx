// HomePage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalogStore }  from '../store/catalog.store';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { HeroBanner }       from './HeroBanner';
import { BrandRow }         from './BrandRow';
import { ContentRail }      from './ContentRail';
import { Skeleton }         from '@/shared/components/ui';
import type { CatalogMeta } from '@/shared/types';

// -- Rail title display (deterministic alternation) --------------------------
//
// Each rail shows either its genre name OR its tagline, never both.
// Even-indexed visible rails → genre name ("Action")
// Odd-indexed visible rails  → tagline ("No brakes. No mercy.")
// Titles are stable — no animation, no cycling, no timer.

// Fisher-Yates shuffle for randomizing items within a rail
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// -- Rail rhythm (deterministic variant cycle) --------------------------------
//
// Position pattern across the page (from VISUAL_IDENTITY_PROMPT):
//   1 → landscape | 2 → landscape | 3 → POSTER | 4 → landscape
//   5 → landscape | 6 → landscape | 7 → POSTER | 8+ → repeat from 2

/**
 * Returns the card variant for a given visible rail position.
 * Poster rails appear at every 4th position starting at 3 (3, 7, 11, 15…).
 */
function getPositionVariant(position: number): 'landscape' | 'poster' {
  if (position < 3) return 'landscape';
  return (position - 3) % 4 === 0 ? 'poster' : 'landscape';
}

// -- Rail configuration (25 distinct sections) --------------------------------

interface RailConfig {
  key:         string;
  titleKey:    string;
  taglineKey?: string;
  accentColor?: string;
  genreIds?:   number[] | null;
}

const RAILS: RailConfig[] = [
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

// -- Loading / Error states --------------------------------------------------

function LoadingState(): React.ReactElement {
  return (
    <div className="flex gap-4 overflow-hidden py-5">
      <Skeleton variant="rail" count={5} />
    </div>
  );
}

function ErrorState(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, color: 'rgba(249,249,249,0.4)' }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(249,249,249,0.6)' }}>
        {t('home.catalogNotResponding')}
      </p>
      <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
        {t('home.catalogHelpText')}
      </p>
    </div>
  );
}

// -- Rail classification for mode-based filtering ----------------------------
//
// 'series-only' rails are fetched exclusively from the series endpoint.
// 'movie-only'  rails are fetched exclusively from the movie endpoint.
// 'mixed'       rails contain both types (trending, top10, international).

const SERIES_ONLY_RAIL_KEYS = new Set(['series', 'series-action', 'anime', 'kdrama']);

// Minimum visible items in a rail after type-filtering before the rail is hidden.
const MIN_RAIL_ITEMS = 2;

interface HomePageProps {
  mode?: 'movie' | 'series';
}

// -- Main page ----------------------------------------------------------------

export default function HomePage({ mode }: HomePageProps) {
  const { t } = useTranslation();
  const { catalog, loading, error, sections } = useCatalogStore();
  const { load } = useCatalogLoader();

  React.useEffect(() => {
    if (mode === 'movie') {
      document.title = 'Sokoul — Films';
    } else if (mode === 'series') {
      document.title = 'Sokoul — Séries';
    } else {
      document.title = 'Sokoul';
    }
    void load();
  }, [load, mode]);

  const railItems = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Record<string, CatalogMeta[]> = {};

    for (const rail of RAILS) {
      const raw = sections[rail.key] ?? (catalog as Record<string, CatalogMeta[]> | null)?.[rail.key] ?? [];

      let filtered = raw;

      if (rail.genreIds) {
        const byGenre = raw.filter(item =>
          item.genre_ids?.some((id: number) => rail.genreIds!.includes(id))
        );
        if (byGenre.length >= 4) filtered = byGenre;
      }

      if (rail.key === 'series') {
        filtered = filtered.filter(item => item.type === 'series');
      }

      // Apply type filter when a mode is active
      if (mode === 'movie') {
        // Exclude rails that are exclusively for series content
        if (SERIES_ONLY_RAIL_KEYS.has(rail.key)) {
          result[rail.key] = [];
          continue;
        }
        // For mixed rails, keep only movies
        filtered = filtered.filter(
          item => item.type === 'movie' || item.media_type === 'movie'
        );
      } else if (mode === 'series') {
        // For non-series rails, keep only series/tv items
        if (!SERIES_ONLY_RAIL_KEYS.has(rail.key)) {
          filtered = filtered.filter(
            item =>
              item.type === 'series' ||
              item.type === 'tv' ||
              item.media_type === 'series' ||
              item.media_type === 'tv'
          );
        }
      }

      const deduplicated = filtered.filter(item => !seen.has(item.id));
      deduplicated.forEach(item => seen.add(item.id));
      result[rail.key] = shuffle(deduplicated);
    }

    return result;
  }, [catalog, sections, mode]);

  const getItems = (key: string): CatalogMeta[] => railItems[key] ?? [];

  if (loading && !catalog) return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 250px)', top: 0, padding: '0 var(--section-px)' }}>
      <LoadingState />
    </div>
  );
  if (error && !catalog) return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 250px)', top: 0, padding: '0 var(--section-px)' }}>
      <ErrorState />
    </div>
  );

  const heroItems = React.useMemo(() => {
    const trending = getItems('trending');
    const top10    = getItems('top10');

    if (mode === 'movie') {
      const movieTrending = trending.filter(
        item => item.type === 'movie' || item.media_type === 'movie'
      );
      if (movieTrending.length > 0) return shuffle(movieTrending);
      const movieTop10 = top10.filter(
        item => item.type === 'movie' || item.media_type === 'movie'
      );
      if (movieTop10.length > 0) return shuffle(movieTop10);
      return shuffle(
        Object.values(sections).flat().filter(
          item => item.type === 'movie' || item.media_type === 'movie'
        )
      ).slice(0, 8);
    }

    if (mode === 'series') {
      const seriesTrending = trending.filter(
        item => item.type === 'series' || item.type === 'tv' || item.media_type === 'series' || item.media_type === 'tv'
      );
      if (seriesTrending.length > 0) return shuffle(seriesTrending);
      const seriesSection = getItems('series');
      if (seriesSection.length > 0) return shuffle(seriesSection);
      return shuffle(
        Object.values(sections).flat().filter(
          item => item.type === 'series' || item.type === 'tv' || item.media_type === 'series' || item.media_type === 'tv'
        )
      ).slice(0, 8);
    }

    // Default (home page): no mode filter
    if (trending.length > 0) return shuffle(trending);
    if (top10.length > 0) return shuffle(top10);
    return shuffle(Object.values(sections).flat()).slice(0, 8);
  }, [getItems, sections, mode]);

  return (
    <>
      <main
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 250px)',
          overflowX: 'hidden',
          display: 'block',
          top: 0,
          padding: '0 var(--section-px)',
          background: 'url("/images/home-background.png") center center / cover no-repeat fixed',
        }}
      >

        {heroItems.length > 0 && <HeroBanner items={heroItems.slice(0, 5)} />}

        {!mode && <BrandRow />}

        {loading && <LoadingState />}

        {(() => {
          let visibleIndex = 0;
          return RAILS.map((rail) => {
            const items = getItems(rail.key);
            if (!items || items.length < (mode ? MIN_RAIL_ITEMS : 1)) return null;

            const pos = visibleIndex;
            visibleIndex++;

            // Alternating title: even → genre name, odd → tagline
            const displayTitle = pos % 2 === 0
              ? t(rail.titleKey)
              : (rail.taglineKey ? t(rail.taglineKey) : t(rail.titleKey));

            return (
              <ContentRail
                key={rail.key}
                title={displayTitle}
                items={items}
                cardVariant={getPositionVariant(pos)}
                accentColor={rail.accentColor}
              />
            );
          });
        })()}

        {Object.values(sections).every(arr => arr.length === 0) && !loading && <ErrorState />}
      </main>
    </>
  );
}
