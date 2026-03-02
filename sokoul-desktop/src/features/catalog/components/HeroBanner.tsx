// NOM — HeroBanner.tsx — Rôle: Bannière principale hero avec parallaxe et slideshow
// RÈGLES : High-quality FanArt backgrounds, logo HD, contenu enrichi.

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CatalogMeta } from '@/shared/types';
import { endpoints } from '@/api/client';
import { Play, Plus, Check } from 'lucide-react';
import { useProfileStore } from '@/shared/stores/profileStore';
import { useAddToList, useRemoveFromList, useListItems, useLists } from '@/shared/hooks/useLists';
import { getLogo, getCleanImages, FanartResponse } from '@/shared/utils/fanart';
import { useAmbientColor } from '@/shared/hooks/useAmbientColor';
import { Info } from 'lucide-react';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

interface HeroBannerProps {
  items: CatalogMeta[];
}

const HeroBanner: React.FC<HeroBannerProps> = ({ items }) => {
  const navigate = useNavigate();
  const { activeProfile } = useProfileStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotation toutes les 8 secondes
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(i => (i + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  const activeItem = items[currentIndex];
  if (!activeItem) return null;

  // --- Détails complets pour le synopsis (CatalogItem ne transporte pas description) ---
  const { data: metaDetails } = useQuery<CatalogMeta>({
    queryKey: ['meta-hero', activeItem.id, activeItem.type],
    queryFn: async () => endpoints.catalog.getMeta(
      activeItem.type || activeItem.media_type || 'movie',
      activeItem.id
    ).then(res => res.data),
    enabled: !!activeItem.id,
    staleTime: Infinity,
  });

  // --- Données enrichies Fanart.tv pour l'item actif ---
  const { data: fanartData } = useQuery<FanartResponse>({
    queryKey: ['fanart-hero', activeItem.id, activeItem.type],
    queryFn: async () => {
      const tmdbId = activeItem.id.split(':').pop() || activeItem.id;
      const fanartType = (activeItem.media_type || activeItem.type) === 'movie' ? 'movie' : 'tv';
      return endpoints.fanart.get(fanartType, tmdbId).then(res => res.data as FanartResponse);
    },
    enabled: !!activeItem.id && !!activeItem.type,
    staleTime: Infinity,
  });

  // --- Extraction des données ---
  const mediaType = activeItem.media_type || activeItem.type || 'movie';
  const fanartMediaType = (mediaType === 'series' ? 'tv' : mediaType) as 'movie' | 'tv';

  const title = activeItem.title || activeItem.name || '';
  const year = activeItem.release_date
    ? new Date(activeItem.release_date).getFullYear()
    : (activeItem.releaseInfo || activeItem.year);
  const overview = metaDetails?.description || activeItem.overview || activeItem.description;
  const rating = metaDetails?.vote_average || activeItem.vote_average;
  const genres = metaDetails?.genres || activeItem.genres;

  const logoUrl = fanartData ? getLogo(fanartData, fanartMediaType) : null;

  // Ambient Mode — couleur dominante du backdrop (poster comme fallback)
  const ambientImageUrl = getImageUrl(
    activeItem.backdrop_path || activeItem.background || activeItem.poster_path || activeItem.poster,
    'w780'
  );
  const ambientColor = useAmbientColor(ambientImageUrl);

  function getImageUrl(path?: string, size: string = 'original') {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Ma Liste logic
  const { data: lists = [] } = useLists();
  const favoritesList = lists.find(l => l.listType === 'favorites' || l.name?.toLowerCase() === 'ma liste');
  const { data: favItems = [] } = useListItems(favoritesList?.id ?? null);
  const isFavorite = favItems.some(i => i.contentId === activeItem.id);
  const addToList = useAddToList();
  const removeFromList = useRemoveFromList();

  const handleToggleFavorite = () => {
    if (!favoritesList || !activeItem) return;
    if (isFavorite) {
      removeFromList.mutate({ listId: favoritesList.id, contentId: activeItem.id });
    } else {
      addToList.mutate({
        listId: favoritesList.id,
        contentId: activeItem.id,
        contentType: activeItem.type || activeItem.media_type || 'movie',
      });
    }
  };

  return (
    <div ref={containerRef} className="relative h-[75vh] overflow-hidden">
      {/* Background avec parallaxe — translateY selon scrollY */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${scrollY * 0.4}px) scale(1.1)` }}
      >
        {items.map((m, i) => {
          const fanartBg = fanartData && i === currentIndex ? getCleanImages(fanartData, fanartMediaType)[0] : undefined;
          // Fallback : backdrop TMDB → poster (CatalogItem list n'a que poster)
          const bgUrl = fanartBg
            || getImageUrl(m.backdrop_path || m.background, 'original')
            || getImageUrl(m.poster_path || m.poster, 'original');
          return (
            <img
              key={m.id}
              src={bgUrl}
              alt={m.title || m.name}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: i === currentIndex ? 1 : 0 }}
              loading="lazy"
            />
          );
        })}
      </div>

      {/* Ambient glow — couleur dominante du film irradiée */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 25% 70%, rgba(${ambientColor}, 0.22) 0%, transparent 60%)`,
          mixBlendMode: 'screen',
          transition: 'background 1.5s ease',
          zIndex: 1,
        }}
      />

      {/* Gradients multicouches */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent pointer-events-none" style={{ zIndex: 2 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/20 pointer-events-none" style={{ zIndex: 2 }} />

      {/* Contenu textuel — ancré en bas à gauche */}
      <div className="absolute bottom-20 left-12 space-y-4 max-w-lg" style={{ zIndex: 3 }}>
        {/* Logo HD du film */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={title}
            className="h-20 object-contain drop-shadow-2xl"
          />
        ) : (
          <h1 className="text-5xl font-black text-white drop-shadow-2xl">
            {title}
          </h1>
        )}

        <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
          {overview}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-3">
          {rating != null && rating > 0 && (
            <span className="text-green-400 font-semibold text-sm">
              ⭐ {rating.toFixed(1)}
            </span>
          )}
          {year && <span className="text-white/50 text-sm">{year}</span>}
          {genres?.slice(0, 2).map((g) => {
            const label = typeof g === 'string' ? g : g.name;
            const key = typeof g === 'string' ? g : g.id;
            return (
              <span key={key} className="text-xs text-white/60 border border-white/20 px-2 py-0.5 rounded">
                {label}
              </span>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/sources/${mediaType}/${activeItem.id}`)}
            className="flex items-center gap-2 bg-white text-black font-bold
                             px-6 py-2.5 rounded-lg hover:bg-white/90 transition-colors"
          >
            <Play size={20} className="fill-current" /> Lecture
          </button>
          {activeProfile && (
            <button
              onClick={handleToggleFavorite}
              disabled={addToList.isPending || removeFromList.isPending}
              className="flex items-center gap-2 bg-white/20 text-white font-semibold
                             px-6 py-2.5 rounded-lg hover:bg-white/30 backdrop-blur-sm
                             transition-colors border border-white/20"
            >
              {isFavorite ? <Check size={20} /> : <Plus size={20} />}
              {isFavorite ? 'Dans ma liste' : 'Ma liste'}
            </button>
          )}
          <button
            onClick={() => navigate(`/detail/${mediaType}/${activeItem.id}`)}
            className="flex items-center gap-2 bg-white/10 text-white font-semibold
                       px-5 py-2.5 rounded-lg hover:bg-white/20 backdrop-blur-sm
                       transition-colors border border-white/15"
          >
            <Info size={18} /> Plus d'infos
          </button>
        </div>
      </div>

      {/* Barres de progression animées */}
      <div className="absolute bottom-6 left-12 flex gap-2 items-center" style={{ zIndex: 3 }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className="cursor-pointer"
            style={{ padding: '4px 0' }}
          >
            <div
              className="rounded-full overflow-hidden"
              style={{
                width:      i === currentIndex ? '48px' : '8px',
                height:     '3px',
                background: 'rgba(255,255,255,0.25)',
                transition: 'width 0.3s ease',
              }}
            >
              {i === currentIndex && (
                <div
                  key={`bar-${currentIndex}`}
                  className="h-full rounded-full bg-white"
                  style={{ animation: 'hero-progress 8s linear forwards' }}
                />
              )}
              {i < currentIndex && (
                <div className="h-full w-full bg-white/70 rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export { HeroBanner };
