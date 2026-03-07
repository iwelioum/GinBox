// components/detail/InfoSection.tsx — Step 7
// Holographic poster (3D Tilt) + complete metadata
// Glass card adapted to the genre theme

import * as React from 'react';
import Tilt from 'react-parallax-tilt';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';
import { GLASS_VARIANTS } from '../../../shared/utils/glassStyles';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

interface InfoSectionProps {
  item:  CatalogMeta;
  theme: GenreTheme;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ item, theme }) => {
  const [hoverPoster, setHoverPoster] = React.useState(false);
  const glass = GLASS_VARIANTS[theme.glassStyle];

  const posterRaw = item.poster_path || item.poster;
  const posterUrl = posterRaw
    ? posterRaw.startsWith('http') ? posterRaw
      : `${TMDB_IMAGE_BASE}w500${posterRaw.startsWith('/') ? '' : '/'}${posterRaw}`
    : null;

  const title    = item.title    || item.name    || '';
  const overview = item.overview || item.description;
  const voteAvg  = item.vote_average ;
  const voteCount= item.vote_count   ;
  const runtime  = item.runtime      ;
  const year     = item.release_date
    ? new Date(item.release_date).getFullYear()
    : (item.releaseInfo || item.year);
  const status   = item.status       ;
  const language = item.original_language;
  const country  = Array.isArray(item.origin_country) ? item.origin_country[0] : undefined;
  const director = item.director     ;
  const studio   = item.studio       ;

  const genreList: string[] = Array.isArray(item.genres)
    ? item.genres.map(g => typeof g === 'string' ? g : g.name ?? '').filter(Boolean)
    : [];

  // Fallback if nothing to display
  if (!posterUrl && !overview && !voteAvg && genreList.length === 0) return null;

  const formatRuntime = (min: number) => {
    const h = Math.floor(min / 60); const m = min % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}min` : ''}` : `${m}min`;
  };

  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', fr: 'French', ja: 'Japanese', ko: 'Korean',
    es: 'Spanish', de: 'German', it: 'Italian', pt: 'Portuguese',
    zh: 'Chinese', ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
  };

  const tagline = item.tagline;

  return (
    <section className="relative z-10 max-w-[1400px] mx-auto px-[calc(3.5vw+5px)] -mt-16 pb-2">
      <div
        className="rounded-2xl p-8 flex gap-10"
        style={{ ...glass }}
      >
        {posterUrl && (
          <div
            className="hidden md:block flex-shrink-0"
            onMouseEnter={() => setHoverPoster(true)}
            onMouseLeave={() => setHoverPoster(false)}
          >
            <Tilt
              tiltMaxAngleX={12}
              tiltMaxAngleY={12}
              glareEnable={true}
              glareMaxOpacity={0.2}
              scale={1.03}
              className="rounded-xl overflow-hidden relative"
              style={{ width: 220 }}
            >
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-auto block"
                style={{
                  boxShadow: '0 30px 50px rgba(0,0,0,0.7)',
                  outline: '2px solid rgba(var(--accent-rgb, 0,114,210), 0.4)',
                  outlineOffset: '-2px',
                }}
              />
              {/* Holographic rainbow overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,0,128,0.3) 0%, rgba(0,255,255,0.3) 33%, rgba(128,255,0,0.3) 66%, rgba(255,128,0,0.3) 100%)',
                  mixBlendMode: 'color-dodge',
                  opacity: hoverPoster ? 1 : 0,
                }}
              />
            </Tilt>
          </div>
        )}

        <div className="flex flex-col gap-5 flex-1 min-w-0">

          {/* Title + tagline */}
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-1">
              {title}
            </h1>
            {tagline && (
              <p className="text-[14px] text-white/45 italic font-light">
                "{tagline}"
              </p>
            )}
          </div>

          {/* Genres */}
          {genreList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genreList.map(g => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    borderColor: 'rgba(var(--accent-rgb, 0,114,210), 0.4)',
                    color:       'var(--accent, #0072D2)',
                    background:  'rgba(var(--accent-rgb, 0,114,210), 0.1)',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Rating + quick stats */}
          <div className="flex items-center flex-wrap gap-4 text-sm">
            {voteAvg != null && voteAvg > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 text-xl font-bold">★</span>
                <span className="text-white font-bold text-lg">{voteAvg.toFixed(1)}</span>
                {voteCount && (
                  <span className="text-white/40 text-xs">({voteCount.toLocaleString('en-US')} votes)</span>
                )}
              </div>
            )}
            {year     && <span className="text-white/60">{year}</span>}
            {runtime  && runtime > 0 && <span className="text-white/60">{formatRuntime(runtime)}</span>}
            {status === 'returning' && (
              <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Ongoing
              </span>
            )}
            {status === 'ended' && (
              <span className="text-white/30 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />
                Ended
              </span>
            )}
          </div>

          {/* Synopsis */}
          {overview && (
            <p className="text-white/75 leading-relaxed text-[14px] max-w-3xl">
              {overview}
            </p>
          )}

          {/* Secondary info */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-white/40 border-t border-white/10 pt-4 mt-1">
            {director && <span><span className="text-white/60 font-medium">Dir. </span>{director}</span>}
            {studio   && <span><span className="text-white/60 font-medium">Studio </span>{studio}</span>}
            {country  && <span><span className="text-white/60 font-medium">Country </span>{country}</span>}
            {language && <span><span className="text-white/60 font-medium">Language </span>{LANGUAGE_NAMES[language] ?? language.toUpperCase()}</span>}
          </div>
        </div>
      </div>
    </section>
  );
};
