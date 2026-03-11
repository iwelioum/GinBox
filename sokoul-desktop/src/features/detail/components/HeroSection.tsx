// components/detail/HeroSection.tsx
// Cinematic hero — staggered animations · dynamic accent glow · premium badges

import * as React from 'react';
import { ChevronDown, ChevronUp, Tv2, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';
import { resolveLogoOrTitle } from '@/shared/utils/logoUtils';
import { HeroMetaBadges, HeroActions } from './heroSectionParts';

interface HeroSectionProps {
  item:              CatalogMeta;
  theme:             GenreTheme;
  logoUrl?:          string;
  backdropUrl?:      string;
  isFavorite?:       boolean;
  isAddingToList?:   boolean;
  isPlayLoading?:    boolean;
  accentColor?:      string;
  onPlay?:           () => void;
  onDownload?:       () => void;
  onToggleFavorite?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  item, theme: _theme, logoUrl, backdropUrl,
  isFavorite = false, isAddingToList = false,
  isPlayLoading = false, accentColor,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const { t } = useTranslation();

  // Staggered visibility states
  const [logoReady,    setLogoReady]    = React.useState(false);
  const [metaReady,    setMetaReady]    = React.useState(false);
  const [synopsisReady,setSynopsisReady]= React.useState(false);
  const [btnsReady,    setBtnsReady]    = React.useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = React.useState(false);

  const sectionRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    setLogoReady(false); setMetaReady(false);
    setSynopsisReady(false); setBtnsReady(false); setSynopsisExpanded(false);

    const t1 = setTimeout(() => setLogoReady(true),     200);
    const t2 = setTimeout(() => setMetaReady(true),     380);
    const t3 = setTimeout(() => setSynopsisReady(true), 520);
    const t4 = setTimeout(() => setBtnsReady(true),     640);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [item.id]);

  // Parallax scroll
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || !backdropUrl) return;
    const onScroll = () =>
      el.style.setProperty('--parallax-y', `${window.scrollY * 0.3}px`);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [backdropUrl]);

  // Data derivations
  const title        = item.title || item.name || '';
  const year         = (item.release_date || item.first_air_date || item.releaseInfo || '').toString().slice(0, 4);
  const runtime      = item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '';
  const rating       = item.vote_average ?? 0;
  const ratingStr    = rating > 0 ? rating.toFixed(1) : '';
  const voteCount    = item.vote_count ?? 0;
  const genreNames   = (item.genres ?? []).map(g => typeof g === 'string' ? g : (g as { name: string }).name);
  const isSeries     = item.type === 'series' || item.type === 'tv';
  const seasons      = item.number_of_seasons;
  const tagline      = item.tagline;
  const seriesStatus = item.status;
  const accent       = accentColor ?? 'var(--color-accent)';

  // Resolve logo or genre-styled text
  const genreIds = item.genre_ids ?? [];
  const identity = resolveLogoOrTitle(logoUrl ?? null, null, title, genreIds, 'hero');

  return (
    <section
      ref={sectionRef}
      className="relative flex items-end"
      style={{ height: '82vh', minHeight: 560, maxHeight: 900 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      {accentColor && (
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-color pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 20% 80%, ${accentColor}, transparent 60%)` }}
        />
      )}

      <div className="relative z-20 px-[var(--section-px)] pb-14 w-full max-w-[900px]">

        {/* Content type + series status badges */}
        <div
          className="flex items-center gap-2 mb-4"
          style={{
            opacity:   logoReady ? 1 : 0,
            transform: logoReady ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-bold tracking-widest uppercase"
            style={{ background: `${accent}22`, border: `1px solid ${accent}55`, color: accent }}
          >
            {isSeries ? <Tv2 size={11} /> : <Film size={11} />}
            {isSeries ? t('common.series') : t('common.movie')}
          </span>
          {isSeries && seriesStatus && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[13px] font-semibold tracking-wider uppercase bg-white/10 border border-white/15 text-white/60">
              {seriesStatus}
            </span>
          )}
        </div>

        {/* Logo or title */}
        <div style={{
          opacity: logoReady ? 1 : 0,
          transform: logoReady ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          {identity.kind === 'logo' ? (
            <img
              alt={title}
              src={identity.url}
              className="max-w-[600px] min-w-[180px] w-[34vw] mb-3 drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 6px 32px rgba(0,0,0,0.9))' }}
            />
          ) : (
            <h1
              className="mb-3 drop-shadow-2xl [text-wrap:balance]"
              style={{
                fontFamily: identity.style.fontFamily,
                fontSize: identity.style.fontSize,
                fontWeight: identity.style.fontWeight,
                letterSpacing: identity.style.letterSpacing,
                textTransform: identity.style.textTransform,
                fontStyle: identity.style.fontStyle,
                color: identity.style.color,
                textShadow: identity.style.textShadow,
                lineHeight: 1.05,
              }}
            >
              {title}
            </h1>
          )}
          {tagline && (
            <p className="text-white/50 italic text-sm font-medium mb-4 max-w-lg leading-snug">{tagline}</p>
          )}
        </div>

        <HeroMetaBadges
          visible={metaReady}
          ratingStr={ratingStr} rating={rating} voteCount={voteCount}
          year={year} runtime={runtime} isSeries={isSeries} seasons={seasons}
          genreNames={genreNames}
        />

        {/* Synopsis with fade */}
        {item.overview && (
          <div
            className="mb-8 max-w-[680px]"
            style={{
              opacity: synopsisReady ? 1 : 0,
              transform: synopsisReady ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <div className="relative">
              <p
                className="text-white/65 text-[0.9375rem] leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: synopsisExpanded ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: synopsisExpanded ? 'visible' : 'hidden',
                }}
              >
                {item.overview}
              </p>
              {!synopsisExpanded && item.overview.length > 160 && (
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-transparent to-transparent pointer-events-none" />
              )}
            </div>
            {item.overview.length > 160 && (
              <button
                type="button"
                onClick={() => setSynopsisExpanded(v => !v)}
                className="mt-2 flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs font-medium transition-colors group"
              >
                {synopsisExpanded ? (
                  <><ChevronUp size={13} className="group-hover:-translate-y-0.5 transition-transform" /> {t('common.showLess')}</>
                ) : (
                  <><ChevronDown size={13} className="group-hover:translate-y-0.5 transition-transform" /> {t('common.showMore')}</>
                )}
              </button>
            )}
          </div>
        )}

        <HeroActions
          visible={btnsReady}
          accent={accent} accentColor={accentColor}
          isFavorite={isFavorite} isAddingToList={isAddingToList} isPlayLoading={isPlayLoading}
          onPlay={onPlay} onDownload={onDownload} onToggleFavorite={onToggleFavorite}
        />
      </div>
    </section>
  );
};
