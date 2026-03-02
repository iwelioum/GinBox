// components/detail/HeroSection.tsx
// Backdrop 85vh + Ken Burns + parallax
// Logo HD centré · Boutons CTA en bas (cliquables, z-30)
// InfoSection gère la fiche détaillée en dessous

import * as React from 'react';
import { Play, Plus, Check, Download, Loader2 } from 'lucide-react';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

interface HeroSectionProps {
  item:              CatalogMeta;
  theme:             GenreTheme;
  logoUrl?:          string;
  isFavorite?:       boolean;
  isAddingToList?:   boolean;
  isPlayLoading?:    boolean;
  onPlay?:           () => void;
  onDownload?:       () => void;
  onToggleFavorite?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  item, theme, logoUrl,
  isFavorite = false, isAddingToList = false,
  isPlayLoading = false,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const parallaxRef = React.useRef<HTMLDivElement>(null);

  // Parallax au scroll
  React.useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Backdrop haute qualité
  const backdropRaw = item.backdrop_path || item.background;
  const backdropUrl = backdropRaw
    ? (backdropRaw.startsWith('http')
        ? backdropRaw.replace('/w500/', '/original/')
        : `${TMDB_IMAGE_BASE}original${backdropRaw.startsWith('/') ? '' : '/'}${backdropRaw}`)
    : null;

  const title = item.title || item.name || '';

  const titleFont = theme.fontMood === 'serif-dramatic'
    ? "'Playfair Display', Georgia, serif"
    : theme.fontMood === 'mono-tech'
    ? "'JetBrains Mono', 'Courier New', monospace"
    : 'inherit';

  return (
    <section className="relative overflow-hidden" style={{ height: '85vh' }}>

      <div
        ref={parallaxRef}
        className="absolute will-change-transform"
        style={{ top: '-15%', left: 0, right: 0, bottom: 0 }}
      >
        {backdropUrl ? (
          <div
            style={{
              width:               '100%',
              height:              '100%',
              backgroundImage:     `url(${backdropUrl})`,
              backgroundSize:      'cover',
              backgroundPosition:  'center 20%',
              animation:           'kenburns 20s ease-in-out infinite alternate',
              willChange:          'transform',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#07080f' }} />
        )}
      </div>

      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(7,8,15,0.55) 65%, rgba(7,8,15,1) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-14 gap-6"
        style={{ zIndex: 30 }}
      >
        {/* Logo HD ou titre fallback */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={title}
            style={{
              maxWidth:  480,
              maxHeight: 140,
              objectFit: 'contain',
              filter:    'drop-shadow(0 4px 28px rgba(0,0,0,0.95))',
            }}
          />
        ) : (
          <h1
            style={{
              fontFamily:  titleFont,
              fontStyle:   theme.fontMood === 'serif-dramatic' ? 'italic' : 'normal',
              fontSize:    'clamp(28px, 4vw, 58px)',
              fontWeight:  800,
              color:       '#f9f9f9',
              textShadow:  '0 4px 28px rgba(0,0,0,0.85)',
              textAlign:   'center',
              maxWidth:    '70vw',
              lineHeight:  1.1,
              margin:      0,
            }}
          >
            {title}
          </h1>
        )}

        <div className="flex items-center gap-3">

          {/* Regarder */}
          <button
            type="button"
            onClick={onPlay}
            disabled={isPlayLoading}
            className="flex items-center gap-2 px-7 py-3 rounded-full
                       text-black text-sm font-bold bg-white
                       hover:bg-white/90 transition-all duration-200 hover:scale-[1.03]
                       cursor-pointer shadow-xl disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isPlayLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Recherche...
              </>
            ) : (
              <>
                <Play size={16} className="fill-black" />
                Regarder
              </>
            )}
          </button>

          {/* Ajouter à ma liste */}
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isAddingToList}
            title={isFavorite ? 'Dans ma liste' : 'Ajouter à ma liste'}
            className="w-11 h-11 rounded-full border-2 flex items-center justify-center
                       transition-all duration-200 cursor-pointer text-white
                       hover:scale-[1.05] disabled:opacity-50"
            style={{
              borderColor:     isFavorite ? 'var(--accent, #0072D2)' : 'rgba(255,255,255,0.5)',
              backgroundColor: isFavorite
                ? 'color-mix(in srgb, var(--accent, #0072D2) 25%, transparent)'
                : 'rgba(0,0,0,0.35)',
            }}
          >
            {isFavorite ? <Check size={18} /> : <Plus size={18} />}
          </button>

          {/* Télécharger */}
          <button
            type="button"
            onClick={onDownload}
            title="Télécharger"
            className="w-11 h-11 rounded-full border-2 border-white/40 bg-black/35
                       flex items-center justify-center text-white
                       hover:border-white hover:bg-black/55 hover:scale-[1.05]
                       transition-all duration-200 cursor-pointer"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};
