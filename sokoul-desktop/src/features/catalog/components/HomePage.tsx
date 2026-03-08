// HomePage.tsx — Premium Netflix 2025 × Infuse × Apple TV dark aesthetic redesign

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalogStore }  from '../store/catalog.store';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { HeroBanner }       from './HeroBanner';
import { BrandRow }         from './BrandRow';
import { ContentRail }      from './ContentRail';
import { Skeleton }         from '@/shared/components/ui';
import type { CatalogMeta } from '@/shared/types';

// ── Title cycling ─────────────────────────────────────────────────────────────
//
// Each rail alternates between a short label ("Action") and a contextual tagline
// ("No brakes. No mercy."). The cycle is 25 seconds per rail: 15s showing the
// label, 10s showing the tagline. Rails are staggered by one tick each (5s apart)
// so the switch rolls across the page rather than all flipping simultaneously.

const TICK_MS     = 5_000; // one tick = 5 seconds
const LABEL_TICKS = 3;     // show label for 3 ticks  (15s)
const CYCLE       = 5;     // full cycle = 5 ticks    (25s)

function useRailTitleCycle(): number {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);
  return tick;
}

function getRailDisplay(
  title:      string,
  tagline:    string | undefined,
  railIndex:  number,
  tick:       number,
): string {
  if (!tagline) return title;
  return ((tick + railIndex) % CYCLE) < LABEL_TICKS ? title : tagline;
}

// ── Rail configuration (25 distinct sections) ─────────────────────────────────

interface RailConfig {
  key:         string;
  titleKey:    string;
  taglineKey?: string;
  variant:     'poster' | 'landscape';
  accentColor?: string;
  genreIds?:   number[] | null;
}

const RAILS: RailConfig[] = [
  {
    key: 'trending',      variant: 'landscape', accentColor: '#0063e5', genreIds: null,
    titleKey:   'home.recommendedForYou',
    taglineKey: 'home.recommendedTagline',
  },
  {
    key: 'top10',         variant: 'landscape', accentColor: '#0063e5', genreIds: null,
    titleKey:   'home.newOnSokoul',
    taglineKey: 'home.newOnSokoulTagline',
  },
  {
    key: 'action',        variant: 'landscape', accentColor: '#e63946', genreIds: [28],
    titleKey:   'home.action',
    taglineKey: 'home.actionTagline',
  },
  {
    key: 'scifi',         variant: 'landscape', accentColor: '#4361ee', genreIds: [878],
    titleKey:   'home.scienceFiction',
    taglineKey: 'home.scienceFictionTagline',
  },
  {
    key: 'thriller',      variant: 'landscape', accentColor: '#c0392b', genreIds: [53],
    titleKey:   'home.thriller',
    taglineKey: 'home.thrillerTagline',
  },
  {
    key: 'horror',        variant: 'landscape', accentColor: '#8b0000', genreIds: [27],
    titleKey:   'home.horror',
    taglineKey: 'home.horrorTagline',
  },
  {
    key: 'series',        variant: 'landscape', accentColor: '#0063e5', genreIds: null,
    titleKey:   'home.tvShows',
    taglineKey: 'home.tvShowsTagline',
  },
  {
    key: 'adventure',     variant: 'landscape', accentColor: '#f39c12', genreIds: [12],
    titleKey:   'home.adventure',
    taglineKey: 'home.adventureTagline',
  },
  {
    key: 'comedy',        variant: 'landscape', accentColor: '#f4d03f', genreIds: [35],
    titleKey:   'home.comedy',
    taglineKey: 'home.comedyTagline',
  },
  {
    key: 'drama',         variant: 'landscape', accentColor: '#8e44ad', genreIds: [18],
    titleKey:   'home.drama',
    taglineKey: 'home.dramaTagline',
  },
  {
    key: 'kdrama',        variant: 'landscape', accentColor: '#c0392b', genreIds: null,
    titleKey:   'home.kDrama',
    taglineKey: 'home.kDramaTagline',
  },
  {
    key: 'fantasy',       variant: 'landscape', accentColor: '#8e44ad', genreIds: [14],
    titleKey:   'home.fantasy',
    taglineKey: 'home.fantasyTagline',
  },
  {
    key: 'crime',         variant: 'landscape', accentColor: '#2c3e50', genreIds: [80],
    titleKey:   'home.crime',
    taglineKey: 'home.crimeTagline',
  },
  {
    key: 'anime',         variant: 'landscape', accentColor: '#e74c3c', genreIds: [16],
    titleKey:   'home.anime',
    taglineKey: 'home.animeTagline',
  },
  {
    key: 'series-action', variant: 'landscape', accentColor: '#e63946', genreIds: [10759],
    titleKey:   'home.actionAdventureSeries',
    taglineKey: 'home.actionAdventureSeriesTagline',
  },
  {
    key: 'documentary',   variant: 'landscape', accentColor: '#2ecc71', genreIds: [99],
    titleKey:   'home.documentary',
    taglineKey: 'home.documentaryTagline',
  },
  {
    key: 'romance',       variant: 'landscape', accentColor: '#e91e8c', genreIds: [10749],
    titleKey:   'home.romance',
    taglineKey: 'home.romanceTagline',
  },
  {
    key: 'animation',     variant: 'landscape', accentColor: '#ff9f43', genreIds: [16],
    titleKey:   'home.animation',
    taglineKey: 'home.animationTagline',
  },
  {
    key: 'mystery',       variant: 'landscape', accentColor: '#6c3483', genreIds: [9648],
    titleKey:   'home.mystery',
    taglineKey: 'home.mysteryTagline',
  },
  {
    key: 'war',           variant: 'landscape', accentColor: '#7f8c8d', genreIds: [10752],
    titleKey:   'home.war',
    taglineKey: 'home.warTagline',
  },
  {
    key: 'history',       variant: 'landscape', accentColor: '#1a5276', genreIds: [36],
    titleKey:   'home.history',
    taglineKey: 'home.historyTagline',
  },
  {
    key: 'international', variant: 'landscape', accentColor: '#27ae60', genreIds: null,
    titleKey:   'home.fromAroundTheWorld',
    taglineKey: 'home.fromAroundTheWorldTagline',
  },
  {
    key: 'western',       variant: 'landscape', accentColor: '#a04000', genreIds: [37],
    titleKey:   'home.western',
    taglineKey: 'home.westernTagline',
  },
  {
    key: 'family',        variant: 'landscape', accentColor: '#e84393', genreIds: [10751],
    titleKey:   'home.family',
    taglineKey: 'home.familyTagline',
  },
  {
    key: 'music',         variant: 'landscape', accentColor: '#1db954', genreIds: [10402],
    titleKey:   'home.music',
    taglineKey: 'home.musicTagline',
  },
];

// ── Loading / Error states ────────────────────────────────────────────────────

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-[--color-text-secondary]">
      <p className="text-lg font-semibold text-[--color-text-primary]">
        {t('home.catalogNotResponding')}
      </p>
      <p className="text-sm text-center max-w-md leading-relaxed">
        {t('home.catalogHelpText')}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { t } = useTranslation();
  const { catalog, loading, error, sections } = useCatalogStore();
  const { load } = useCatalogLoader();
  const tick = useRailTitleCycle();

  React.useEffect(() => {
    document.title = 'Sokoul';
    void load();
  }, [load]);

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

      const deduplicated = filtered.filter(item => !seen.has(item.id));
      deduplicated.forEach(item => seen.add(item.id));
      result[rail.key] = deduplicated;
    }

    return result;
  }, [catalog, sections]);

  const getItems = (key: string): CatalogMeta[] => railItems[key] ?? [];

  if (loading && !catalog) return (
    <div className="relative min-h-[calc(100vh-250px)] top-0 px-[--section-px]">
      <LoadingState />
    </div>
  );
  if (error && !catalog) return (
    <div className="relative min-h-[calc(100vh-250px)] top-0 px-[--section-px]">
      <ErrorState />
    </div>
  );

  const heroItems = getItems('trending').length > 0
    ? getItems('trending')
    : getItems('top10').length > 0
      ? getItems('top10')
      : Object.values(sections).flat().slice(0, 8);

  return (
    <>
      {/* Full-width hero (extends behind navbar, no padding-top) */}
      {heroItems.length > 0 && <HeroBanner items={heroItems.slice(0, 5)} />}

      {/* Content rails section with slight overlap for depth */}
      <div className="relative z-10 -mt-20 bg-[--color-bg-base]">
        <div className="px-[--section-px] space-y-8">
          <BrandRow />

          {loading && <LoadingState />}

          {RAILS.map((rail, index) => {
            const items = getItems(rail.key);
            if (!items || items.length === 0) return null;
            return (
              <ContentRail
                key={rail.key}
                title={getRailDisplay(t(rail.titleKey), rail.taglineKey ? t(rail.taglineKey) : undefined, index, tick)}
                items={items}
                cardVariant={rail.variant}
                accentColor={rail.accentColor}
              />
            );
          })}

          {Object.values(sections).every(arr => arr.length === 0) && !loading && <ErrorState />}
        </div>
      </div>
    </>
  );
}
