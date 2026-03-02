// ContentRail.tsx — Rail horizontal "Vivant, profond, premium"
// DESIGN : scène (backdrop) + logo Fanart centré · sans texte.
// Cards 180px (poster 2:3) / 300px (landscape 16:9).
// cubic-bezier(0.34, 1.56, 0.64, 1) · boxShadow coloré.

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CatalogMeta } from '@/shared/types';
import { endpoints } from '@/api/client';
import { extractLogo } from '@/shared/utils/tmdb';

const TMDB = 'https://image.tmdb.org/t/p/';

function toImg(path: string | undefined | null, size: string): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path.replace('/w500/', `/${size}/`);
  return `${TMDB}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface ContentRailProps {
  title:        string;
  tagline?:     string;
  items:        CatalogMeta[];
  cardVariant?: 'poster' | 'landscape';
  isTop10?:     boolean;
  seeMoreHref?: string;
  Icon?:        LucideIcon;
  accentColor?: string;
  isFeatured?:  boolean;
  emoji?:       string;
  className?:   string;
}

function PosterCard({
  item, index, isTop10, accentColor,
}: {
  item:         CatalogMeta;
  index:        number;
  isTop10?:     boolean;
  accentColor?: string;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);
  const [loaded,  setLoaded]  = React.useState(false);

  const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
  const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';
  const type       = item.type ?? item.media_type ?? 'movie';

  const { data: fanartData } = useQuery({
    queryKey: ['fanart-rail', fanartType, tmdbId],
    queryFn:  () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
    enabled:  hovered && !!tmdbId,
    staleTime: Infinity,
  });

  const logoUrl = React.useMemo(() => extractLogo(fanartData), [fanartData]);

  // Filtre : pas de backdrop → invisible dans les rails
  const rawBackdrop = item.backdrop_path ?? item.background ?? null;
  if (!rawBackdrop) return null;

  const img = toImg(rawBackdrop, 'w780') ?? '';

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: 180 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/detail/${type}/${item.id}`)}
    >
      {/* Numéro Top 10 géant — derrière la card */}
      {isTop10 && (
        <div
          className="absolute z-0 font-black leading-none select-none pointer-events-none"
          style={{
            fontFamily:       "'Syne', sans-serif",
            fontSize:         'clamp(80px, 12vw, 130px)',
            color:            'transparent',
            WebkitTextStroke: '2px rgba(255,255,255,0.12)',
            bottom:           '-12px',
            left:             '-16px',
          }}
        >
          {index + 1}
        </div>
      )}

      {/* Container image */}
      <div
        className="relative rounded-xl overflow-hidden z-10"
        style={{
          aspectRatio: '2/3',
          boxShadow: hovered
            ? `0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)${accentColor ? `, 0 0 30px ${accentColor}20` : ''}`
            : '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
          transform:  hovered ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Shimmer skeleton */}
        {!loaded && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}

        <img
          src={img}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="w-full h-full object-cover"
          style={{
            objectPosition: 'center top',
            transform:  hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />

        {/* Vignette basse */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,11,22,0.65) 0%, transparent 55%)' }}
        />

        {/* Fanart logo centré */}
        {logoUrl && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ padding: '16%', opacity: hovered ? 1 : 0.82, transition: 'opacity 0.3s ease' }}
          >
            <img
              src={logoUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.9))', maxHeight: 48 }}
            />
          </div>
        )}

        {/* Play button — visible au hover si pas de logo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: hovered && !logoUrl ? 1 : 0, transition: 'opacity 0.25s ease' }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <Play className="w-4 h-4 fill-white text-white" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Reflet glassmorphism */}
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)',
            opacity:    hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function LandscapeCard({
  item, accentColor,
}: {
  item:         CatalogMeta;
  accentColor?: string;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);
  const [loaded,  setLoaded]  = React.useState(false);

  const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
  const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';
  const type       = item.type ?? item.media_type ?? 'movie';

  const { data: fanartData } = useQuery({
    queryKey: ['fanart-rail', fanartType, tmdbId],
    queryFn:  () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
    enabled:  hovered && !!tmdbId,
    staleTime: Infinity,
  });

  const logoUrl = React.useMemo(() => extractLogo(fanartData), [fanartData]);

  // Filtre : pas de backdrop → invisible dans les rails
  const rawBackdrop = item.backdrop_path ?? item.background ?? null;
  if (!rawBackdrop) return null;

  const img = toImg(rawBackdrop, 'w780') ?? '';

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: 300 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/detail/${type}/${item.id}`)}
    >
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          aspectRatio: '16/9',
          boxShadow: hovered
            ? `0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)${accentColor ? `, 0 0 25px ${accentColor}18` : ''}`
            : '0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
          transform:  hovered ? 'scale(1.03) translateY(-3px)' : 'scale(1)',
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Shimmer skeleton */}
        {!loaded && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}

        <img
          src={img}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="w-full h-full object-cover"
          style={{
            transform:  hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />

        {/* Vignette basse */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,11,22,0.65) 0%, transparent 55%)' }}
        />

        {/* Fanart logo centré */}
        {logoUrl && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ padding: '12%', opacity: hovered ? 1 : 0.82, transition: 'opacity 0.3s ease' }}
          >
            <img
              src={logoUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.9))', maxHeight: 64 }}
            />
          </div>
        )}

        {/* Play button — visible au hover si pas de logo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: hovered && !logoUrl ? 1 : 0, transition: 'opacity 0.25s ease' }}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background:     'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              border:         '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              transform:  hovered ? 'scale(1)' : 'scale(0.8)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

const ContentRail: React.FC<ContentRailProps> = ({
  title,
  tagline,
  items,
  cardVariant = 'landscape',
  isTop10     = false,
  seeMoreHref,
  Icon,
  accentColor,
  isFeatured  = true,
  emoji,
  className,
}) => {
  const scrollRef   = React.useRef<HTMLDivElement>(null);
  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -640, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left:  640, behavior: 'smooth' });

  if (!items || items.length === 0) return null;

  const accent = accentColor ?? 'rgba(255,255,255,0.7)';

  return (
    <section className={`mb-8 w-full ${className ?? ''}`}>

      <div
        className="flex items-center justify-between mb-6"
        style={{ paddingLeft: 'var(--section-px)', paddingRight: 'var(--section-px)' }}
      >
        <div className="flex items-center gap-3">
          {/* Barre verticale colorée avec glow OU icône OU emoji */}
          {Icon ? (
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
              style={{
                background: `${accent}22`,
                border:     `1px solid ${accent}30`,
                boxShadow:  `0 0 12px ${accent}15`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
          ) : emoji ? (
            <span className="text-xl mt-0.5 flex-shrink-0 leading-none">{emoji}</span>
          ) : accentColor ? (
            <div
              style={{
                width: 4, height: 36, borderRadius: 2, flexShrink: 0,
                background: accent,
                boxShadow: `0 0 12px ${accent}88, 0 0 24px ${accent}44`,
              }}
            />
          ) : null}

          <div>
            <h2
              className="font-bold leading-tight"
              style={{
                fontFamily:    "'Syne', sans-serif",
                fontSize:      isFeatured ? 'clamp(15px, 1.5vw, 18px)' : '11px',
                fontWeight:    800,
                color:         isFeatured ? 'rgba(249,249,249,0.92)' : 'rgba(249,249,249,0.45)',
                letterSpacing: isFeatured ? '-0.02em' : '0.14em',
                textTransform: isFeatured ? 'none' : 'uppercase',
              }}
            >
              {title}
            </h2>
            {tagline && (
              <p
                className="mt-0.5"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontStyle:  'italic',
                  fontSize:   '11px',
                  color:      accentColor ? `${accentColor}99` : 'rgba(249,249,249,0.30)',
                }}
              >
                {tagline}
              </p>
            )}
          </div>
        </div>

        {/* Voir tout */}
        {seeMoreHref && (
          <a
            href={seeMoreHref}
            className="flex items-center gap-1 group/btn no-underline"
            style={{ color: 'rgba(249,249,249,0.30)' }}
          >
            <span className="text-xs font-medium transition-colors duration-200 group-hover/btn:text-white/60">
              Voir tout
            </span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </a>
        )}
      </div>

      <div className="relative group/rail">

        {/* Flèche gauche */}
        {items.length > 4 && (
          <button
            onClick={scrollLeft}
            aria-label="Défiler à gauche"
            className="absolute top-[38%] -translate-y-1/2 -left-4 z-20 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100"
            style={{ background: 'rgba(10,11,22,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.10)', color: '#F9F9F9' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
        )}

        {/* Cards */}
        <div
          ref={scrollRef}
          className={`flex overflow-x-auto pb-4 ${isTop10 ? 'gap-8' : 'gap-4'}`}
          style={{
            scrollbarWidth:    'none',
            msOverflowStyle:   'none',
            paddingLeft:  'var(--section-px)',
            paddingRight: 'var(--section-px)',
          }}
        >
          {items.map((item, index) =>
            cardVariant === 'poster' ? (
              <PosterCard
                key={item.id}
                item={item}
                index={index}
                isTop10={isTop10}
                accentColor={accentColor}
              />
            ) : (
              <LandscapeCard
                key={item.id}
                item={item}
                accentColor={accentColor}
              />
            )
          )}
        </div>

        {/* Fade droit */}
        <div
          className="absolute top-0 right-0 bottom-4 pointer-events-none z-10"
          style={{
            width:      80,
            background: 'linear-gradient(to right, transparent, var(--bg-abyss))',
          }}
        />

        {/* Flèche droite */}
        {items.length > 4 && (
          <button
            onClick={scrollRight}
            aria-label="Défiler à droite"
            className="absolute top-[38%] -translate-y-1/2 -right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100"
            style={{ background: 'rgba(10,11,22,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.10)', color: '#F9F9F9' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        )}
      </div>
    </section>
  );
};

export { ContentRail };
