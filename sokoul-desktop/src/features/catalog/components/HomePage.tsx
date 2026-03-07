// HomePage.tsx

import * as React from 'react';
import { useCatalogStore }  from '../store/catalog.store';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { HeroBanner }       from './HeroBanner';
import { BrandRow }         from './BrandRow';
import { ContentRail }      from './ContentRail';
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
  title:       string;
  tagline?:    string;
  variant:     'poster' | 'landscape';
  accentColor?: string;
  genreIds?:   number[] | null;
}

const RAILS: RailConfig[] = [
  {
    key: 'trending',      variant: 'landscape', accentColor: '#0063e5', genreIds: null,
    title:   'Recommended for You',
    tagline: "The best of what's streaming right now.",
  },
  {
    key: 'top10',         variant: 'landscape', accentColor: '#0063e5', genreIds: null,
    title:   'New on Sokoul',
    tagline: 'Fresh arrivals, first on Sokoul.',
  },
  {
    key: 'action',        variant: 'landscape', accentColor: '#e63946', genreIds: [28],
    title:   'Action',
    tagline: 'No brakes. No mercy.',
  },
  {
    key: 'scifi',         variant: 'landscape', accentColor: '#4361ee', genreIds: [878],
    title:   'Science Fiction',
    tagline: 'Futures you never could have imagined.',
  },
  {
    key: 'thriller',      variant: 'landscape', accentColor: '#c0392b', genreIds: [53],
    title:   'Thriller',
    tagline: "Fear doesn't always come from where you expect.",
  },
  {
    key: 'horror',        variant: 'landscape', accentColor: '#8b0000', genreIds: [27],
    title:   'Horror',
    tagline: "For the nights you don't want to sleep.",
  },
  {
    key: 'series',        variant: 'landscape', accentColor: '#0063e5', genreIds: null,
    title:   'TV Shows',
    tagline: 'One episode in. You watch ten.',
  },
  {
    key: 'adventure',     variant: 'landscape', accentColor: '#f39c12', genreIds: [12],
    title:   'Adventure',
    tagline: 'Every journey begins with the first frame.',
  },
  {
    key: 'comedy',        variant: 'landscape', accentColor: '#f4d03f', genreIds: [35],
    title:   'Comedy',
    tagline: 'Because laughing feels good.',
  },
  {
    key: 'drama',         variant: 'landscape', accentColor: '#8e44ad', genreIds: [18],
    title:   'Drama',
    tagline: 'Stories that stay with you.',
  },
  {
    key: 'kdrama',        variant: 'landscape', accentColor: '#c0392b', genreIds: null,
    title:   'K-Drama',
    tagline: 'You will cry. And you will want more.',
  },
  {
    key: 'fantasy',       variant: 'landscape', accentColor: '#8e44ad', genreIds: [14],
    title:   'Fantasy',
    tagline: 'Worlds where anything is possible.',
  },
  {
    key: 'crime',         variant: 'landscape', accentColor: '#2c3e50', genreIds: [80],
    title:   'Crime',
    tagline: 'Power. Betrayal. Consequences.',
  },
  {
    key: 'anime',         variant: 'landscape', accentColor: '#e74c3c', genreIds: [16],
    title:   'Anime',
    tagline: 'Worlds that exist nowhere else.',
  },
  {
    key: 'series-action', variant: 'landscape', accentColor: '#e63946', genreIds: [10759],
    title:   'Action & Adventure Series',
    tagline: 'Suspense episode after episode.',
  },
  {
    key: 'documentary',   variant: 'landscape', accentColor: '#2ecc71', genreIds: [99],
    title:   'Documentary',
    tagline: 'Reality is stranger than fiction.',
  },
  {
    key: 'romance',       variant: 'landscape', accentColor: '#e91e8c', genreIds: [10749],
    title:   'Romance',
    tagline: 'For those who still believe in happy endings.',
  },
  {
    key: 'animation',     variant: 'landscape', accentColor: '#ff9f43', genreIds: [16],
    title:   'Animation',
    tagline: 'The best stories are not always real.',
  },
  {
    key: 'mystery',       variant: 'landscape', accentColor: '#6c3483', genreIds: [9648],
    title:   'Mystery',
    tagline: 'You thought you figured it out. You were wrong.',
  },
  {
    key: 'war',           variant: 'landscape', accentColor: '#7f8c8d', genreIds: [10752],
    title:   'War',
    tagline: 'Real stories of those who fell.',
  },
  {
    key: 'history',       variant: 'landscape', accentColor: '#1a5276', genreIds: [36],
    title:   'History',
    tagline: 'What happened deserves to be seen.',
  },
  {
    key: 'international', variant: 'landscape', accentColor: '#27ae60', genreIds: null,
    title:   'From Around the World',
    tagline: 'The best cinema has no borders.',
  },
  {
    key: 'western',       variant: 'landscape', accentColor: '#a04000', genreIds: [37],
    title:   'Western',
    tagline: 'Justice, dust, and a setting sun.',
  },
  {
    key: 'family',        variant: 'landscape', accentColor: '#e84393', genreIds: [10751],
    title:   'Family',
    tagline: 'Watch together, everyone included.',
  },
  {
    key: 'music',         variant: 'landscape', accentColor: '#1db954', genreIds: [10402],
    title:   'Music',
    tagline: 'When images sing.',
  },
];

// ── Loading / Error states ────────────────────────────────────────────────────

function LoadingState(): React.ReactElement {
  return (
    <p style={{ color: 'rgba(249,249,249,0.45)', fontSize: 13, padding: '20px 0', letterSpacing: '1px' }}>
      Loading catalog…
    </p>
  );
}

function ErrorState(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, color: 'rgba(249,249,249,0.4)' }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(249,249,249,0.6)' }}>
        The catalog is not responding.
      </p>
      <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
        Make sure the Rust backend is running and TMDB_API_KEY is configured.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
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
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 250px)', top: 0, padding: '0 calc(3.5vw + 5px)' }}>
      <LoadingState />
    </div>
  );
  if (error && !catalog) return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 250px)', top: 0, padding: '0 calc(3.5vw + 5px)' }}>
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
      <main
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 250px)',
          overflowX: 'hidden',
          display: 'block',
          top: 0,
          padding: '0 calc(3.5vw + 5px)',
        }}
      >
        <div
          style={{
            background: 'url("/images/home-background.png") center center / cover no-repeat fixed',
            position: 'absolute',
            inset: 0,
            opacity: 1,
            zIndex: -1,
          }}
        />

        {heroItems.length > 0 && <HeroBanner items={heroItems.slice(0, 5)} />}

        <BrandRow />

        {loading && <LoadingState />}

        {RAILS.map((rail, index) => {
          const items = getItems(rail.key);
          if (!items || items.length === 0) return null;
          return (
            <ContentRail
              key={rail.key}
              title={getRailDisplay(rail.title, rail.tagline, index, tick)}
              items={items}
              cardVariant={rail.variant}
              accentColor={rail.accentColor}
            />
          );
        })}

        {Object.values(sections).every(arr => arr.length === 0) && !loading && <ErrorState />}
      </main>
    </>
  );
}
