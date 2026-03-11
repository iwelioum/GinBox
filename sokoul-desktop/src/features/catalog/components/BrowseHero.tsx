// BrowseHero.tsx — Cinematic hero carousel with auto-slide

import * as React from 'react';
import { useQueries }                    from '@tanstack/react-query';
import { useTranslation }               from 'react-i18next';
import { AnimatePresence, motion }       from 'framer-motion';
import { endpoints }                     from '@/shared/api/client';
import { extractLogo }                   from '@/shared/utils/tmdb';
import { TMDB_IMAGE_BASE }              from '@/shared/constants/tmdb';
import { PlayCircle, Plus }              from 'lucide-react';
import type { EnrichedItem }             from '@/features/catalog/components/CatalogFilters';

interface BrowseHeroProps {
  items:  EnrichedItem[];
  onPlay: (item: EnrichedItem) => void;
  onInfo: (item: EnrichedItem) => void;
}

export function BrowseHero({ items, onPlay, onInfo }: BrowseHeroProps) {
  const { t } = useTranslation();

  const heroItems = React.useMemo(
    () => items.filter(i => !!(i.backdrop_path || i.background)).slice(0, 8),
    [items],
  );
  const [idx,    setIdx]    = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => { setIdx(0); }, [items]);

  React.useEffect(() => {
    if (paused || heroItems.length <= 1) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % heroItems.length), 8000);
    return () => clearInterval(timer);
  }, [paused, heroItems.length]);

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
        : `${TMDB_IMAGE_BASE}original${rawBg.startsWith('/') ? '' : '/'}${rawBg}`)
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors"
              >
                <PlayCircle size={17} /> {t('common.watch')}
              </button>
              <button
                onClick={() => onInfo(current)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/25 bg-black/30 text-white text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-colors"
              >
                <Plus size={17} /> {t('common.moreInfo')}
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
              className="rounded-full transition-[width,background-color] duration-300"
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

