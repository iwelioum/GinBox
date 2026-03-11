// HomePage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalogStore }  from '../store/catalog.store';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { useHomePersonalized } from '../hooks/useHomePersonalized';
import { useKidsFilter }    from '@/shared/hooks/useKidsFilter';
import { HeroBanner }       from './HeroBanner';
import { BrandRow }         from './BrandRow';
import { ContentRail }      from './ContentRail';
import { Skeleton }         from '@/shared/components/ui';
import type { CatalogMeta } from '@/shared/types';
import {
  RAILS, SERIES_ONLY_RAIL_KEYS, MIN_RAIL_ITEMS,
  shuffle, getPositionVariant,
} from './homeRailsConfig';

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-[var(--color-text-muted)]">
      <div className="text-[var(--color-text-muted)]">
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 20.5h.01" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-[var(--color-text-secondary)]">
        {t('home.catalogNotResponding')}
      </p>
      <p className="text-sm text-center max-w-[400px] leading-relaxed text-[var(--color-text-muted)]">
        {t('home.catalogHelpText')}
      </p>
    </div>
  );
}

interface HomePageProps {
  mode?: 'movie' | 'series';
}

// -- Main page ----------------------------------------------------------------

export default function HomePage({ mode }: HomePageProps) {
  const { t } = useTranslation();
  const { catalog, loading, error, sections } = useCatalogStore();
  const { load } = useCatalogLoader();
  const { filterForKids } = useKidsFilter<CatalogMeta>();

  const { continueWatchingItems, recentlyAddedItems, becauseYouWatched } =
    useHomePersonalized(catalog, sections);

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
      result[rail.key] = shuffle(filterForKids(deduplicated));
    }

    return result;
  }, [catalog, sections, mode, filterForKids]);

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

        {/* Continue Watching rail — only shown when there are items */}
        {continueWatchingItems.length > 0 && (
          <ContentRail
            title={t('home.continueWatching')}
            items={continueWatchingItems}
            cardVariant="landscape"
          />
        )}

        {/* Recently Added to My List */}
        {recentlyAddedItems.length > 0 && (
          <ContentRail
            title={t('home.recentlyAdded')}
            items={recentlyAddedItems}
            cardVariant="poster"
          />
        )}

        {/* Because you watched X — similarity-based recommendations */}
        {becauseYouWatched.items.length > 0 && (
          <ContentRail
            title={becauseYouWatched.title}
            items={becauseYouWatched.items}
            cardVariant="poster"
          />
        )}

        {/* Top Rated rail — items with vote_average > 7.5, sorted by rating */}
        {(() => {
          const allItems = Object.values(sections).flat();
          const topRated = allItems
            .filter(item => (item.vote_average ?? 0) >= 7.5)
            .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
            .slice(0, 20);
          if (topRated.length < 4) return null;
          return (
            <ContentRail
              title={t('home.topRated')}
              items={topRated}
              cardVariant="poster"
              accentColor="#f1c40f"
            />
          );
        })()}

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
