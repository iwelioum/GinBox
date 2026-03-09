// components/detail/HeroSection.tsx
// Cinematic hero — staggered animations · dynamic accent glow · premium badges

import * as React from 'react';
import { Play, Plus, Check, Download, Loader2, ChevronDown, ChevronUp, Star, Tv2, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';
import { resolveLogoOrTitle } from '@/shared/utils/logoUtils';

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

// Rating → color coding
function ratingColor(r: number): string {
  if (r >= 7.5) return '#22c55e';  // green
  if (r >= 6)   return '#f59e0b';  // amber
  return '#ef4444';                 // red
}

// Compact vote count: 12400 → "12.4k"
function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
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

  // Accent fallback
  const accent = accentColor ?? 'var(--color-accent)';

  // Resolve logo or genre-styled text
  const genreIds = item.genre_ids ?? [];
  const identity = resolveLogoOrTitle(logoUrl ?? null, null, title, genreIds, 'hero');

  // Play button glow style
  const playGlow = accentColor
    ? { boxShadow: `0 0 28px 4px ${accentColor}55, 0 4px 20px rgba(0,0,0,0.5)` }
    : {};

  return (
    <section
      ref={sectionRef}
      className="relative flex items-end"
      style={{ height: '82vh', minHeight: 560, maxHeight: 900 }}
    >
      {/* Gradient gauche — lisibilité du texte */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      {/* Accent coloré atmosphérique */}
      {accentColor && (
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-color pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 20% 80%, ${accentColor}, transparent 60%)` }}
        />
      )}

      {/* ── Contenu ── */}
      <div className="relative z-20 px-[var(--section-px)] pb-14 w-full max-w-[900px]">

        {/* Badges : type de contenu + statut série */}
        <div
          className="flex items-center gap-2 mb-4"
          style={{
            opacity:   logoReady ? 1 : 0,
            transform: logoReady ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {/* Type badge */}
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-widest uppercase"
            style={{
              background: `${accent}22`,
              border:     `1px solid ${accent}55`,
              color:      accent,
            }}
          >
            {isSeries ? <Tv2 size={11} /> : <Film size={11} />}
            {isSeries ? t('common.series') : t('common.movie')}
          </span>

          {/* Statut série (si dispo) */}
          {isSeries && seriesStatus && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase bg-white/10 border border-white/15 text-white/60">
              {seriesStatus}
            </span>
          )}
        </div>

        {/* Logo ou titre */}
        <div
          style={{
            opacity:   logoReady ? 1 : 0,
            transform: logoReady ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
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

          {/* Tagline en italique */}
          {tagline && (
            <p className="text-white/50 italic text-sm font-medium mb-4 max-w-lg leading-snug">
              {tagline}
            </p>
          )}
        </div>

        {/* Métadonnées */}
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5"
          style={{
            opacity:   metaReady ? 1 : 0,
            transform: metaReady ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {/* Rating badge coloré */}
          {ratingStr && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{
                background: `${ratingColor(rating)}22`,
                border:     `1px solid ${ratingColor(rating)}55`,
                color:      ratingColor(rating),
              }}
            >
              <Star size={11} className="fill-current" />
              {ratingStr}
              {voteCount > 0 && (
                <span className="opacity-60 font-normal">({formatVotes(voteCount)})</span>
              )}
            </span>
          )}

          {/* Séparateur */}
          {(year || runtime || (isSeries && seasons)) && ratingStr && (
            <span className="text-white/25 select-none">·</span>
          )}

          {/* Année */}
          {year && <span className="text-white/75 text-sm font-medium">{year}</span>}

          {/* Runtime ou nombre de saisons */}
          {(runtime || (isSeries && seasons)) && (
            <>
              <span className="text-white/25 select-none">·</span>
              <span className="text-white/75 text-sm font-medium">
                {isSeries && seasons
                  ? t('detail.seasons', { count: seasons })
                  : runtime}
              </span>
            </>
          )}

          {/* Genre pills (glass) */}
          {genreNames.length > 0 && (
            <>
              <span className="text-white/25 select-none">·</span>
              <div className="flex flex-wrap gap-1.5">
                {genreNames.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white/70 bg-white/10 backdrop-blur-sm border border-white/10"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Synopsis avec dégradé de fondu */}
        {item.overview && (
          <div
            className="mb-8 max-w-[680px]"
            style={{
              opacity:   synopsisReady ? 1 : 0,
              transform: synopsisReady ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <div className="relative">
              <p
                className="text-white/65 text-[0.9375rem] leading-relaxed"
                style={{
                  display:   '-webkit-box',
                  WebkitLineClamp: synopsisExpanded ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: synopsisExpanded ? 'visible' : 'hidden',
                }}
              >
                {item.overview}
              </p>
              {/* Fondu bas quand tronqué */}
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

        {/* Boutons d'action */}
        <div
          className="flex flex-wrap gap-3"
          style={{
            opacity:   btnsReady ? 1 : 0,
            transform: btnsReady ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {/* Play — accent + glow dynamique */}
          <button
            type="button"
            onClick={onPlay}
            disabled={isPlayLoading}
            className="group relative h-13 rounded-2xl px-8 overflow-hidden flex items-center gap-3 font-bold text-base text-white active:scale-[0.96] transition-all duration-200 disabled:opacity-60"
            style={{
              background: accentColor ?? 'var(--color-accent)',
              ...playGlow,
            }}
            onMouseEnter={e => {
              if (accentColor)
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 0 42px 8px ${accentColor}77, 0 6px 28px rgba(0,0,0,0.6)`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = playGlow.boxShadow ?? '';
            }}
          >
            {/* Shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-in-out pointer-events-none" />
            {isPlayLoading ? (
              <Loader2 size={21} className="animate-spin flex-shrink-0" />
            ) : (
              <Play size={21} className="fill-current flex-shrink-0" />
            )}
            <span>{isPlayLoading ? t('detail.searching') : t('common.play')}</span>
          </button>

          {/* Ma liste — verre dépoli */}
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isAddingToList}
            className="h-13 rounded-2xl px-6 flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 text-white/90 font-medium text-sm hover:bg-white/20 active:scale-[0.96] transition-all duration-200 disabled:opacity-60"
          >
            {isAddingToList ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isFavorite ? (
              <Check size={18} style={{ color: accent }} />
            ) : (
              <Plus size={18} />
            )}
            <span>{isFavorite ? t('detail.inMyList') : t('detail.addToMyList')}</span>
          </button>

          {/* Sources — icône seule */}
          <button
            type="button"
            onClick={onDownload}
            title={t('common.sources')}
            className="h-13 w-13 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 text-white/60 hover:text-white hover:bg-white/20 active:scale-[0.96] transition-all duration-200"
          >
            <Download size={19} />
          </button>
        </div>
      </div>
    </section>
  );
};
