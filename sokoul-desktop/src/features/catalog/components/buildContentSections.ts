// buildContentSections.ts — Builds the editorial content sections for BrowsePage

import { Flame, Star, Activity, Compass, PlayCircle } from 'lucide-react';
import type { EnrichedItem } from '@/features/catalog/components/CatalogFilters';
import { GENRE_ACCENT, type BrowsePageMode, type ContentSectionData } from './browseConstants';

export function buildContentSections(
  filteredItems: EnrichedItem[],
  mode: BrowsePageMode,
  t: (key: string, opts?: Record<string, unknown>) => string,
): ContentSectionData[] {
  const sections: ContentSectionData[] = [];
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
      .slice(0, 25),
  );
  if (continueWatching.length > 0) {
    sections.push({
      id: 'continue', title: t('catalog.continueWatching'),
      subtitle: t('catalog.continueWatchingSub'),
      accentColor: '#7c3aed', icon: PlayCircle,
      items: continueWatching, showProgress: true,
    });
  }

  // 2. Trending now
  const trending = dedup(
    [...filteredItems]
      .sort((a, b) => (b._popularity ?? 0) - (a._popularity ?? 0))
      .slice(0, 25),
  );
  if (trending.length > 0) {
    sections.push({
      id: 'trending', title: t('catalog.trendingNow'),
      subtitle: t('catalog.trendingNowSub'),
      accentColor: '#f97316', icon: Flame,
      items: trending,
    });
  }

  // 3. Top rated (≥ 7.5)
  const topRated = dedup(
    filteredItems
      .filter(i => (i._rating ?? 0) >= 7.5)
      .sort((a, b) => (b._rating ?? 0) - (a._rating ?? 0))
      .slice(0, 25),
  );
  if (topRated.length > 0) {
    sections.push({
      id: 'top-rated', title: t('catalog.topRated'),
      subtitle: t('catalog.topRatedSub'),
      accentColor: '#eab308', icon: Star,
      items: topRated,
    });
  }

  // 4. Recent releases (last 3 years)
  const recentItems = dedup(
    filteredItems
      .filter(i => i._year !== null && i._year >= currentYear - 3)
      .slice(0, 25),
  );
  if (recentItems.length > 0) {
    sections.push({
      id: 'recent', title: t('catalog.recentReleases'),
      subtitle: t('catalog.recentReleasesSub', { startYear: currentYear - 3, endYear: currentYear }),
      accentColor: '#22c55e',
      items: recentItems,
    });
  }

  // 5. New this year
  const newItems = dedup(
    filteredItems.filter(i => i._year === currentYear).slice(0, 25),
  );
  if (newItems.length > 0) {
    sections.push({
      id: 'new-this-year', title: t('catalog.newInYear', { year: currentYear }),
      subtitle: t('catalog.newInYearSub'),
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
      filteredItems.filter(i => i._genres.includes(genre)).slice(0, 25),
    );
    if (genreList.length >= 3) {
      sections.push({
        id: `genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
        title: genre,
        subtitle: t('catalog.editorialSub'),
        accentColor: GENRE_ACCENT[genre] ?? '#6b7280',
        icon: Compass,
        items: genreList,
      });
    }
  }

  // 21. International cinema
  const international = dedup(
    filteredItems
      .filter(i => i._lang !== 'en' && i._lang !== 'fr' && i._lang !== 'unknown')
      .slice(0, 25),
  );
  if (international.length >= 3 && sections.length < 21) {
    sections.push({
      id: 'international', title: t('catalog.internationalCinema'),
      subtitle: t('catalog.internationalCinemaSub'),
      accentColor: '#06b6d4',
      items: international,
    });
  }

  // 22. Classics (before 1995)
  const classics = dedup(
    filteredItems
      .filter(i => i._year !== null && i._year < 1995)
      .sort((a, b) => (b._rating ?? 0) - (a._rating ?? 0))
      .slice(0, 25),
  );
  if (classics.length >= 3 && sections.length < 22) {
    sections.push({
      id: 'classics', title: t('catalog.timelessClassics'),
      subtitle: t('catalog.timelessClassicsSub'),
      accentColor: '#d97706',
      items: classics,
    });
  }

  // 23. Currently airing series (mode ≠ movie)
  if (mode !== 'movie' && sections.length < 23) {
    const returning = dedup(
      filteredItems.filter(i => i._status === 'returning').slice(0, 25),
    );
    if (returning.length >= 3) {
      sections.push({
        id: 'returning', title: t('catalog.currentlyAiring'),
        subtitle: t('catalog.currentlyAiringSub'),
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
        .slice(0, 25),
    );
    if (animeAnim.length >= 3) {
      sections.push({
        id: 'anime-animation', title: t('catalog.animeAnimation'),
        subtitle: t('catalog.animeAnimationSub'),
        accentColor: '#fb923c',
        items: animeAnim,
      });
    }
  }

  // 25. Hidden gems
  if (sections.length < 25) {
    const hidden = dedup(
      filteredItems
        .filter(i => (i._rating ?? 0) >= 7.0 && (i._popularity ?? 0) < 50)
        .sort((a, b) => (b._rating ?? 0) - (a._rating ?? 0))
        .slice(0, 25),
    );
    if (hidden.length >= 3) {
      sections.push({
        id: 'hidden-gems', title: t('catalog.hiddenGems'),
        subtitle: t('catalog.hiddenGemsSub'),
        accentColor: '#a78bfa',
        items: hidden,
      });
    }
  }

  return sections.slice(0, 25);
}
