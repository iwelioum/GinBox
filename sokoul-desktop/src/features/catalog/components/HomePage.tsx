// HomePage.tsx — SOKOUL v4 "CINÉMA VIVANT"
// Hero plein écran animé · Rails colorés par genre · Cards backdrop + logo

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCatalogStore } from '../store/catalog.store';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { endpoints } from '../../../api/client';
import type { CatalogMeta } from '../../../shared/types/index';
import { extractLogo, getBackdropUrl, getTmdbId } from '../../../shared/utils/tmdb';

const RAILS: Array<{
  key:       string;
  title:     string;
  subtitle:  string;
  accent:    string;
  variant:   'poster' | 'landscape';
  isTop10?:  boolean;
  genreIds?: number[] | null;
}> = [
  { key: 'continuer',      title: 'Continuer à regarder',            subtitle: "Là où tu t'es arrêté.",                       accent: '#7c3aed', variant: 'landscape', genreIds: null },
  { key: 'tendances',      title: 'Tendances du moment',             subtitle: 'Ce que tout le monde regarde.',               accent: '#f97316', variant: 'landscape', genreIds: null },
  { key: 'top10',          title: 'Panthéon des 10 incontournables', subtitle: "Les chefs-d'œuvre absolus.",                   accent: '#eab308', variant: 'poster', isTop10: true, genreIds: null },
  { key: 'action',         title: 'Action & Adrénaline',             subtitle: 'Attachez vos ceintures.',                     accent: '#ef4444', variant: 'landscape', genreIds: [28] },
  { key: 'aventure',       title: 'Aventure',                        subtitle: 'Chaque voyage commence par une première image.', accent: '#f39c12', variant: 'poster',    genreIds: [12] },
  { key: 'comedie',        title: 'Comédie',                         subtitle: 'Rire est le meilleur des soins.',             accent: '#22c55e', variant: 'poster',    genreIds: [35] },
  { key: 'drame',          title: 'Drame',                           subtitle: 'Des histoires qui restent.',                  accent: '#8e44ad', variant: 'landscape', genreIds: [18] },
  { key: 'scifi',          title: 'Science-Fiction',                  subtitle: "Des futurs que tu n'aurais jamais imaginés.", accent: '#4361ee', variant: 'landscape', genreIds: [878] },
  { key: 'thriller',       title: 'Thriller',                        subtitle: "La peur ne vient pas toujours de là où on l'attend.", accent: '#c0392b', variant: 'poster', genreIds: [53] },
  { key: 'romance',        title: 'Romance',                         subtitle: 'Pour les cœurs qui battent fort.',            accent: '#ec4899', variant: 'poster',    genreIds: [10749] },
  { key: 'horreur',        title: 'Horreur',                         subtitle: 'Éteignez les lumières… si vous osez.',        accent: '#a855f7', variant: 'landscape', genreIds: [27] },
  { key: 'fantastique',    title: 'Fantastique',                     subtitle: 'Des mondes où tout est possible.',            accent: '#8b5cf6', variant: 'poster',    genreIds: [14] },
  { key: 'animation',      title: 'Animation',                       subtitle: 'Les plus belles histoires ne sont pas toujours réelles.', accent: '#ff9f43', variant: 'poster', genreIds: [16] },
  { key: 'crime',          title: 'Crime',                           subtitle: 'Le pouvoir. La trahison. Les conséquences.',  accent: '#2c3e50', variant: 'landscape', genreIds: [80] },
  { key: 'mystere',        title: 'Mystère',                         subtitle: 'Tu pensais avoir trouvé. Tu avais tort.',     accent: '#6c3483', variant: 'poster',    genreIds: [9648] },
  { key: 'documentaire',   title: 'Documentaire',                    subtitle: 'La réalité est plus folle que la fiction.',   accent: '#2ecc71', variant: 'landscape', genreIds: [99] },
  { key: 'international',  title: 'Cinéma international',            subtitle: 'Le monde a du talent.',                       accent: '#06b6d4', variant: 'poster',    genreIds: null },
  { key: 'series',         title: 'Séries incontournables',          subtitle: "Impossible de s'arrêter.",                    accent: '#3b82f6', variant: 'landscape', genreIds: null },
  { key: 'series-action',  title: 'Séries Action & Aventure',        subtitle: 'Le suspense épisode après épisode.',          accent: '#e63946', variant: 'landscape', genreIds: [10759] },
  { key: 'anime',          title: 'Anime',                           subtitle: "L'animation japonaise a réinventé la narration.", accent: '#e74c3c', variant: 'poster', genreIds: [16] },
  { key: 'famille',        title: 'Famille',                         subtitle: 'Pour regarder ensemble, sans exception.',     accent: '#e84393', variant: 'poster',    genreIds: [10751] },
  { key: 'histoire',       title: 'Histoire',                        subtitle: "Ce qui s'est passé mérite d'être vu.",        accent: '#1a5276', variant: 'landscape', genreIds: [36] },
  { key: 'guerre',         title: 'Guerre & Épopées',                subtitle: 'Des histoires qui traversent les siècles.',   accent: '#84cc16', variant: 'poster',    genreIds: [10752] },
  { key: 'music',          title: 'Musique',                         subtitle: 'Quand les images chantent.',                  accent: '#14b8a6', variant: 'landscape', genreIds: [10402] },
  { key: 'western',        title: 'Western',                         subtitle: 'Justice, poussière et soleil couchant.',      accent: '#a04000', variant: 'poster',    genreIds: [37] },
];

const BG = '#0A0E1A';

/* Logo du héro — fetch fanart logo pour afficher l'image au lieu du titre texte */
function HeroLogo({ item, fallbackTitle }: { item: CatalogMeta; fallbackTitle: string }) {
  const tmdbId = getTmdbId(item);
  const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';

  const { data: fanartData } = useQuery({
    queryKey: ['fanart-hero-home', fanartType, tmdbId],
    queryFn: () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
    enabled: !!tmdbId,
    staleTime: Infinity,
  });

  const logoUrl = React.useMemo(() => extractLogo(fanartData), [fanartData]);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={fallbackTitle}
        loading="lazy"
        style={{
          maxHeight: 100, maxWidth: '45%', objectFit: 'contain',
          marginBottom: '1.1rem',
          filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.7))',
        }}
      />
    );
  }

  return (
    <h1
      style={{
        fontFamily: "'Clash Display', sans-serif",
        fontSize: 'clamp(2.2rem, 5.5vw, 5rem)',
        fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.0,
        color: '#ffffff', textShadow: '0 2px 30px rgba(0,0,0,0.8)',
        maxWidth: '60%', marginBottom: '1.1rem',
      }}
    >
      {fallbackTitle}
    </h1>
  );
}

function PlayButton({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255,255,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <Play
        style={{ width: size * 0.35, height: size * 0.35, fill: 'white', color: 'white', marginLeft: 2 }}
      />
    </div>
  );
}

function CinematicHero({ items }: { items: CatalogMeta[] }) {
  const navigate  = useNavigate();
  const [idx,     setIdx]     = React.useState(0);
  const [prevIdx, setPrevIdx] = React.useState<number | null>(null);
  const [fading,  setFading]  = React.useState(false);
  const timerRef  = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const featured = items.slice(0, 8);
  const current  = featured[idx];

  const goTo = React.useCallback((next: number) => {
    if (fading || next === idx) return;
    setPrevIdx(idx);
    setFading(true);
    setTimeout(() => {
      setIdx(next);
      setPrevIdx(null);
      setFading(false);
    }, 600);
  }, [fading, idx]);

  const resetInterval = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx(prev => {
        const next = (prev + 1) % featured.length;
        setPrevIdx(prev);
        setFading(true);
        setTimeout(() => { setPrevIdx(null); setFading(false); }, 600);
        return next;
      });
    }, 8000);
  }, [featured.length]);

  React.useEffect(() => {
    if (featured.length < 2) return;
    resetInterval();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [featured.length, resetInterval]);

  if (!current) return null;

  const backdrop = getBackdropUrl(current, 'original')
    ?? (current.poster_path ? `https://image.tmdb.org/t/p/w780${current.poster_path}` : null)
    ?? current.poster
    ?? null;

  const prevBackdrop = prevIdx !== null
    ? (getBackdropUrl(featured[prevIdx], 'original') ?? null)
    : null;

  const title    = current.title ?? current.name ?? 'Sans titre';
  const overview = current.overview ?? current.description ?? '';
  const rating   = current.vote_average ?? 0;
  const year     = current.release_date?.slice(0, 4) ?? (current.year ? String(current.year) : null);

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: '92vh', minHeight: 520, maxHeight: 900 }}
    >
      {prevBackdrop && (
        <div
          className="absolute inset-0"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease', zIndex: 1 }}
        >
          <img src={prevBackdrop} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{ opacity: fading ? 0.4 : 1, transition: 'opacity 0.6s ease', zIndex: 2 }}
      >
        {backdrop && (
          <img
            src={backdrop}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.04)', transition: 'transform 8s ease' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to right,  rgba(4,8,20,0.95) 0%, rgba(4,8,20,0.55) 50%, rgba(4,8,20,0.15) 100%),
              linear-gradient(to top,    rgba(4,8,20,1)    0%, rgba(4,8,20,0.0)  40%),
              linear-gradient(to bottom, rgba(4,8,20,0.65) 0%, transparent       22%)
            `,
          }}
        />
      </div>

      <div
        className="absolute inset-0 flex flex-col justify-end"
        style={{ padding: '0 5% 7% 5%', zIndex: 10 }}
      >
        {/* Badges */}
        <div className="flex items-center gap-2.5 mb-5">
          <span
            style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.18em', padding: '4px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
            }}
          >
            {current.type === 'series' ? 'Série' : 'Film'}
          </span>
          {year && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {year}
            </span>
          )}
          {rating > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fde047', letterSpacing: '0.01em' }}>
              ★ {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Logo ou Titre */}
        <HeroLogo item={current} fallbackTitle={title} />

        {/* Synopsis */}
        {overview && (
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              maxWidth: '42%', fontSize: 'clamp(0.85rem, 1.05vw, 1rem)',
              lineHeight: 1.7, color: 'rgba(255,255,255,0.68)',
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              marginBottom: '2rem',
            }}
          >
            {overview}
          </p>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(`/detail/${current.type ?? 'movie'}/${current.id}`)}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, #4361ee 0%, #7c3aed 100%)',
              color: '#fff', letterSpacing: '0.02em',
              boxShadow: '0 8px 32px rgba(67,97,238,0.45), 0 0 0 1px rgba(255,255,255,0.12)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 14px 44px rgba(67,97,238,0.65), 0 0 0 1px rgba(255,255,255,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(67,97,238,0.45), 0 0 0 1px rgba(255,255,255,0.12)';
            }}
          >
            <Play className="w-4 h-4 fill-white" />
            Regarder
          </button>

          <button
            onClick={() => navigate(`/detail/${current.type ?? 'movie'}/${current.id}`)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm"
            style={{
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.82)',
              border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.38)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
            }}
          >
            <Info className="w-4 h-4" />
            Plus d'infos
          </button>
        </div>

        {/* Dots de navigation */}
        <div className="flex items-center gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resetInterval(); }}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === idx ? 28 : 7, height: 7, borderRadius: 4, padding: 0, border: 'none',
                background: i === idx ? '#4361ee' : 'rgba(255,255,255,0.25)',
                cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Flèches hero */}
      {featured.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20"
            onClick={() => { goTo((idx - 1 + featured.length) % featured.length); resetInterval(); }}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(4,8,20,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.55)'; }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20"
            onClick={() => { goTo((idx + 1) % featured.length); resetInterval(); }}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(4,8,20,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.55)'; }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Fade bas */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: 140, background: `linear-gradient(to top, ${BG} 0%, transparent 100%)`, zIndex: 10 }}
      />
    </div>
  );
}

function useCardLogic(item: CatalogMeta) {
  const [hovered, setHovered] = React.useState(false);
  const [loaded,  setLoaded]  = React.useState(false);
  const tmdbId     = getTmdbId(item);
  const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';

  const { data: fanartData } = useQuery({
    queryKey:  ['fanart-card', fanartType, tmdbId],
    queryFn:   () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
    enabled:   hovered && !!tmdbId,
    staleTime: Infinity,
  });

  const logoUrl = React.useMemo(() => extractLogo(fanartData), [fanartData]);

  return { hovered, setHovered, loaded, setLoaded, logoUrl };
}

function CardOverlay({
  logoUrl, hovered, title,
}: { logoUrl: string | null; hovered: boolean; title: string }) {
  return (
    <>
      {/* Vignette basse */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(4,8,20,0.72) 0%, transparent 55%)' }}
      />

      {logoUrl ? (
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{
            padding: '0 12% 14%',
            opacity: hovered ? 1 : 0.78,
            transition: 'opacity 0.3s ease',
          }}
        >
          <img
            src={logoUrl}
            alt={title}
            className="max-w-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.95))', maxHeight: 56 }}
          />
        </div>
      ) : (
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            padding: '0 10% 12%',
            opacity: hovered ? 0 : 0.85,
            transition: 'opacity 0.25s ease',
          }}
        >
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              textShadow: '0 1px 8px rgba(0,0,0,0.9)',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </p>
        </div>
      )}

      {/* Bouton play au hover */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: 'none',
        }}
      >
        <PlayButton size={logoUrl ? 40 : 48} />
      </div>
    </>
  );
}

function PosterCard({
  item, accent, index, isTop10,
}: { item: CatalogMeta; accent: string; index: number; isTop10?: boolean }) {
  const navigate = useNavigate();
  const { hovered, setHovered, loaded, setLoaded, logoUrl } = useCardLogic(item);

  const img = getBackdropUrl(item)
    ?? (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null)
    ?? item.poster
    ?? null;

  if (!img) return null;

  const title = item.title ?? item.name ?? '';

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: 'clamp(130px, 11vw, 190px)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/detail/${item.type ?? 'movie'}/${item.id}`)}
    >
      {isTop10 && (
        <div
          className="absolute z-0 font-black select-none pointer-events-none"
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 'clamp(70px, 9vw, 110px)', color: 'transparent',
            WebkitTextStroke: '2px rgba(255,255,255,0.1)',
            bottom: -10, left: -8, lineHeight: 1,
          }}
        >
          {index + 1}
        </div>
      )}

      <div
        className="relative z-10 overflow-hidden"
        style={{
          aspectRatio: '2/3', borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          boxShadow: hovered
            ? `0 22px 48px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(255,255,255,0.16), 0 0 32px ${accent}40`
            : '0 4px 18px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          transform:  hovered ? 'scale(1.06) translateY(-6px)' : 'scale(1) translateY(0)',
          transition: 'all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}

        <img
          src={img}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: 'center top',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />

        <CardOverlay logoUrl={logoUrl} hovered={hovered} title={title} />
      </div>
    </div>
  );
}

function LandscapeCard({ item, accent }: { item: CatalogMeta; accent: string }) {
  const navigate = useNavigate();
  const { hovered, setHovered, loaded, setLoaded, logoUrl } = useCardLogic(item);

  const img = getBackdropUrl(item);
  if (!img) return null;

  const title = item.title ?? item.name ?? '';

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: 'clamp(240px, 22vw, 320px)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/detail/${item.type ?? 'movie'}/${item.id}`)}
    >
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: '16/9', borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          boxShadow: hovered
            ? `0 22px 48px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(255,255,255,0.16), 0 0 36px ${accent}40`
            : '0 4px 18px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          transform:  hovered ? 'scale(1.04) translateY(-4px)' : 'scale(1) translateY(0)',
          transition: 'all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}

        <img
          src={img}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />

        <CardOverlay logoUrl={logoUrl} hovered={hovered} title={title} />
      </div>

      {/* Logo uniquement, pas de titre texte */}
    </div>
  );
}

function Rail({
  title, subtitle, items, accent, variant, isTop10 = false,
}: {
  title:     string;
  subtitle?: string;
  items:     CatalogMeta[];
  accent:    string;
  variant:   'poster' | 'landscape';
  isTop10?:  boolean;
}) {
  const railRef                = React.useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft] = React.useState(false);
  const [canRight, setCanRight]= React.useState(true);

  if (!items || items.length === 0) return null;

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: 'smooth' });
    setTimeout(updateArrows, 400);
  };

  const arrowBase: React.CSSProperties = {
    position: 'absolute', top: '40%', transform: 'translateY(-50%)',
    width: 36, height: 80, zIndex: 20,
    background: 'rgba(4,8,20,0.72)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', cursor: 'pointer',
    transition: 'opacity 0.2s, background 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <section className="relative w-full" style={{ marginBottom: '2.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '0 4% 1.1rem' }}>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 3, height: 32, borderRadius: 2, flexShrink: 0,
              background: accent,
              boxShadow: `0 0 10px ${accent}80, 0 0 22px ${accent}38`,
            }}
          />
          <div>
            <h2
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: 'clamp(13px, 1.4vw, 19px)',
                fontWeight: 800, letterSpacing: '-0.025em',
                color: 'rgba(249,249,249,0.97)', lineHeight: 1.2,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 11, fontStyle: 'italic',
                  color: `${accent}bb`, marginTop: 2,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <button
          style={{
            color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none',
            cursor: 'pointer', transition: 'color 0.2s',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        >
          Tout voir <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Flèches latérales */}
      <button
        className="hidden md:flex scroll-btn"
        onClick={() => scroll('left')}
        style={{
          ...arrowBase,
          left: 0, borderLeft: 'none', borderRadius: '0 10px 10px 0',
          opacity: canLeft ? 1 : 0, pointerEvents: canLeft ? 'auto' : 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.92)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.72)'; }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        className="hidden md:flex scroll-btn"
        onClick={() => scroll('right')}
        style={{
          ...arrowBase,
          right: 0, borderRight: 'none', borderRadius: '10px 0 0 10px',
          opacity: canRight ? 1 : 0, pointerEvents: canRight ? 'auto' : 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.92)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,8,20,0.72)'; }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Rail scrollable */}
      <div className="relative" style={{ padding: '0 4%' }}>
        <div
          ref={railRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
        >
          {items.map((item, i) =>
            variant === 'landscape' ? (
              <LandscapeCard key={item.id ?? i} item={item} accent={accent} />
            ) : (
              <PosterCard key={item.id ?? i} item={item} accent={accent} index={i} isTop10={isTop10} />
            )
          )}
        </div>
        {/* Fade bords */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ width: '3%', background: `linear-gradient(to right, ${BG} 0%, transparent 100%)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0"
          style={{ width: '7%', background: `linear-gradient(to left, ${BG} 0%, transparent 100%)` }}
        />
      </div>
    </section>
  );
}

function SkeletonCard({ aspect }: { aspect: '16/9' | '2/3' }) {
  return (
    <div
      className="flex-shrink-0 skeleton-shimmer"
      style={{
        width: aspect === '16/9' ? 280 : 150,
        aspectRatio: aspect,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.05)',
      }}
    />
  );
}

function LoadingState() {
  return (
    <div style={{ padding: '4%' }}>
      <div
        className="skeleton-shimmer"
        style={{ height: '58vh', borderRadius: 18, marginBottom: '3rem' }}
      />
      {(['16/9', '2/3', '16/9'] as const).map((aspect, i) => (
        <div key={i} style={{ marginBottom: '2.5rem' }}>
          <div
            style={{ height: 18, width: 160, borderRadius: 6, background: 'rgba(255,255,255,0.07)', marginBottom: '1rem' }}
          />
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, j) => (
              <SkeletonCard key={j} aspect={aspect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh', gap: 16, color: 'rgba(255,255,255,0.4)' }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
        Le catalogue ne répond pas.
      </p>
      <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 400, lineHeight: 1.7 }}>
        Vérifiez que le backend Rust est démarré et que{' '}
        <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
          TMDB_API_KEY
        </code>{' '}
        est configuré dans{' '}
        <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
          .env
        </code>
      </p>
    </div>
  );
}

export default function HomePage() {
  const { catalog, loading, error, greeting, sections } = useCatalogStore();
  const { load } = useCatalogLoader();

  React.useEffect(() => {
    document.title = 'Sokoul — Accueil';
    void load();
  }, [load]);

  // Pré-calcul de tous les rails : filtrage genre + déduplication en une seule passe
  const railItems = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Record<string, CatalogMeta[]> = {};

    for (const rail of RAILS) {
      const raw = sections[rail.key] ?? (catalog as Record<string, CatalogMeta[]> | null)?.[rail.key] ?? [];

      let filtered = raw;

      // Filtrage par genre TMDB si défini dans la config du rail
      if (rail.genreIds) {
        const byGenre = raw.filter(item =>
          item.genre_ids?.some((id: number) => rail.genreIds!.includes(id))
        );
        if (byGenre.length >= 4) filtered = byGenre;
      }

      // Filtrage type série
      if (rail.key === 'series') {
        filtered = filtered.filter(item => item.type === 'series');
      }

      // Déduplication : exclure les IDs déjà vus (sauf top10)
      const deduplicated = filtered.filter(item => !seen.has(item.id));
      if (rail.key !== 'top10') {
        deduplicated.forEach(item => seen.add(item.id));
      }

      result[rail.key] = deduplicated;
    }

    return result;
  }, [catalog, sections]);

  const getItems = (key: string): CatalogMeta[] => railItems[key] ?? [];

  if (loading && !catalog) return (
    <div style={{ background: BG, minHeight: '100vh' }}><LoadingState /></div>
  );
  if (error && !catalog) return (
    <div style={{ background: BG, minHeight: '100vh' }}><ErrorState /></div>
  );

  const heroItems = getItems('tendances').length > 0
    ? getItems('tendances')
    : getItems('top10').length > 0
      ? getItems('top10')
      : Object.values(sections).flat().slice(0, 8);

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#f9f9f9', overflowX: 'hidden' }}>
      {heroItems.length > 0 && <CinematicHero items={heroItems} />}

      {greeting && (
        <div
          style={{
            padding: '2rem 4% 0.5rem',
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)',
            fontWeight: 700, letterSpacing: '-0.02em',
            color: 'rgba(249,249,249,0.88)',
          }}
        >
          {greeting}
        </div>
      )}

      <div style={{ paddingBottom: '4rem', marginTop: greeting ? '1.5rem' : 0 }}>
        {RAILS.map(rail => {
          const items = getItems(rail.key);
          if (!items || items.length === 0) return null;
          return (
            <Rail
              key={rail.key}
              title={rail.title}
              subtitle={rail.subtitle}
              items={items}
              accent={rail.accent}
              variant={rail.variant}
              isTop10={rail.isTop10}
            />
          );
        })}
        {Object.values(sections).every(arr => arr.length === 0) && !loading && <ErrorState />}
      </div>
    </div>
  );
}
