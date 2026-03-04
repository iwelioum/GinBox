// HomePage.tsx — Exact replica of Home.js from Disney+ clone
//
// Container: position relative, top 72px, padding 0 calc(3.5vw + 5px)
// ::after with home-background.png
// ImgSlider → Viewers → CategoryRow sections

import * as React from 'react';
import { useCatalogStore }  from '../store/catalog.store';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { HeroBanner }       from './HeroBanner';
import { BrandRow }         from './BrandRow';
import { ContentRail }      from './ContentRail';
import type { CatalogMeta } from '@/shared/types';

// ── Configuration des rails ──────────────────────────────────────────────────

const RAILS: Array<{
  key:          string;
  title:        string;
  variant:      'poster' | 'landscape';
  accentColor?: string;
  genreIds?:    number[] | null;
}> = [
  { key: 'continuer',     title: 'Continuer à regarder',      variant: 'landscape', accentColor: '#0063e5', genreIds: null },
  { key: 'tendances',     title: 'Recommandés pour vous',     variant: 'landscape', accentColor: '#0063e5', genreIds: null },
  { key: 'top10',         title: 'Nouveautés sur Sokoul',      variant: 'landscape', accentColor: '#0063e5', genreIds: null },
  { key: 'action',        title: 'Action',                     variant: 'landscape', accentColor: '#e63946', genreIds: [28] },
  { key: 'aventure',      title: 'Aventure',                   variant: 'landscape', accentColor: '#f39c12', genreIds: [12] },
  { key: 'comedie',       title: 'Comédie',                    variant: 'landscape', accentColor: '#f4d03f', genreIds: [35] },
  { key: 'drame',         title: 'Drame',                      variant: 'landscape', accentColor: '#8e44ad', genreIds: [18] },
  { key: 'scifi',         title: 'Science-Fiction',             variant: 'landscape', accentColor: '#4361ee', genreIds: [878] },
  { key: 'thriller',      title: 'Thriller',                    variant: 'landscape', accentColor: '#c0392b', genreIds: [53] },
  { key: 'horreur',       title: 'Horreur',                    variant: 'landscape', accentColor: '#8b0000', genreIds: [27] },
  { key: 'fantastique',   title: 'Fantastique',                variant: 'landscape', accentColor: '#8e44ad', genreIds: [14] },
  { key: 'animation',     title: 'Animation',                  variant: 'landscape', accentColor: '#ff9f43', genreIds: [16] },
  { key: 'crime',         title: 'Crime',                      variant: 'landscape', accentColor: '#2c3e50', genreIds: [80] },
  { key: 'mystere',       title: 'Mystère',                    variant: 'landscape', accentColor: '#6c3483', genreIds: [9648] },
  { key: 'documentaire',  title: 'Documentaire',               variant: 'landscape', accentColor: '#2ecc71', genreIds: [99] },
  { key: 'romance',       title: 'Romance',                    variant: 'landscape', accentColor: '#e91e8c', genreIds: [10749] },
  { key: 'series',        title: 'Séries',                     variant: 'landscape', accentColor: '#0063e5', genreIds: null },
  { key: 'series-action', title: 'Séries Action & Aventure',   variant: 'landscape', accentColor: '#e63946', genreIds: [10759] },
  { key: 'anime',         title: 'Animé',                      variant: 'landscape', accentColor: '#e74c3c', genreIds: [16] },
  { key: 'famille',       title: 'Famille',                    variant: 'landscape', accentColor: '#e84393', genreIds: [10751] },
];

// ── Loading/Error states ─────────────────────────────────────────────────────

function LoadingState(): React.ReactElement {
  return (
    <p style={{ color: 'rgba(249,249,249,0.45)', fontSize: 13, padding: '20px 0', letterSpacing: '1px' }}>
      Chargement des catégories...
    </p>
  );
}

function ErrorState(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, color: 'rgba(249,249,249,0.4)' }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(249,249,249,0.6)' }}>
        Le catalogue ne répond pas.
      </p>
      <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
        Vérifiez que le backend Rust est démarré et que TMDB_API_KEY est configuré.
      </p>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function HomePage() {
  const { catalog, loading, error, sections } = useCatalogStore();
  const { load } = useCatalogLoader();

  React.useEffect(() => {
    document.title = 'Sokoul — Accueil';
    void load();
  }, [load]);

  // Compute rail items
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
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 250px)', top: 72, padding: '0 calc(3.5vw + 5px)' }}>
      <LoadingState />
    </div>
  );
  if (error && !catalog) return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 250px)', top: 72, padding: '0 calc(3.5vw + 5px)' }}>
      <ErrorState />
    </div>
  );

  const heroItems = getItems('tendances').length > 0
    ? getItems('tendances')
    : getItems('top10').length > 0
      ? getItems('top10')
      : Object.values(sections).flat().slice(0, 8);

  return (
    <>
      {/* Container — exact Home.js: position relative, top 72px, padding, ::after bg */}
      <main
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 250px)',
          overflowX: 'hidden',
          display: 'block',
          top: 72,
          padding: '0 calc(3.5vw + 5px)',
        }}
      >
        {/* ::after background — rendered as a fixed div */}
        <div
          style={{
            background: 'url("/images/home-background.png") center center / cover no-repeat fixed',
            position: 'absolute',
            inset: 0,
            opacity: 1,
            zIndex: -1,
          }}
        />

        {/* ImgSlider */}
        {heroItems.length > 0 && <HeroBanner items={heroItems.slice(0, 5)} />}

        {/* Viewers */}
        <BrandRow />

        {/* CategoryRow sections */}
        {loading && <LoadingState />}
        {RAILS.map(rail => {
          const items = getItems(rail.key);
          if (!items || items.length === 0) return null;
          return (
            <ContentRail
              key={rail.key}
              title={rail.title}
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
