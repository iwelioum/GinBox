// ContentCard.tsx — Carte de contenu (film/série)
// DESIGN : scène (backdrop) en fond + logo Fanart centré.
//          Pas de texte titre/année sur les cards.
//          HoverCard Netflix-style (popup info, délai 500ms).

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CatalogMeta } from '@/shared/types';
import { endpoints } from '@/api/client';
import { getLogo, getCleanImages, FanartResponse } from '@/shared/utils/fanart';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/';

interface CardMediaImages {
  scenes?:  string[];
  posters?: string[];
  logos?:   string[];
  banners?: string[];
  seasons?: string[];
}

interface ContentCardProps {
  item:           CatalogMeta;
  variant:        'landscape' | 'poster';
  className?:     string;
  onHoverEnter?:  (id: string | number, rect: DOMRect) => void;
  onHoverLeave?:  () => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, variant, className, onHoverEnter, onHoverLeave }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered]     = React.useState(false);
  const [showPanel, setShowPanel]     = React.useState(false);
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Délai 500ms — évite les survols accidentels (landscape uniquement)
  const handleMouseEnter = () => {
    setIsHovered(true);
    hoverTimer.current = setTimeout(() => setShowPanel(true), 500);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPanel(false);
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
  };

  // Détails complets pour le synopsis (HoverCard)
  const { data: metaData } = useQuery<CatalogMeta>({
    queryKey: ['meta-card', item.id, item.type],
    queryFn:  async () => endpoints.catalog.getMeta(
      item.type || item.media_type || 'movie',
      item.id
    ).then(res => res.data),
    enabled:   isHovered,
    staleTime: Infinity,
  });

  // Fanart — logo + images propres (lazy, uniquement au survol)
  const { data: fanartData } = useQuery<FanartResponse>({
    queryKey: ['fanart', item.id, item.type],
    queryFn:  async () => {
      const tmdbId     = item.id.split(':').pop() || item.id;
      const fanartType = (item.media_type || item.type) === 'movie' ? 'movie' : 'tv';
      return endpoints.fanart.get(fanartType, tmdbId).then((res) => res.data as FanartResponse);
    },
    enabled:   isHovered,
    staleTime: Infinity,
  });

  // Images scènes — chargées immédiatement (priorisées si dispo)
  const mediaType = item.media_type || item.type || 'movie';
  const { data: cardImages } = useQuery<CardMediaImages>({
    queryKey: ['card-images', mediaType, item.id],
    queryFn:  () =>
      endpoints.catalog
        .getImages(mediaType as string, item.id as string)
        .then((r) => r.data),
    enabled:   !!mediaType && !!item.id,
    staleTime: Infinity,
  });

  const backdropPath   = item.backdrop_path || item.background;
  const title          = item.title || item.name || '';
  const year           = (item.release_date || item.releaseInfo || item.year?.toString() || '').substring(0, 4);
  const fanartMT       = (mediaType === 'series' ? 'tv' : mediaType) as 'movie' | 'tv';

  const getImageUrl = (path?: string, width = 'w780') => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path.replace('/w500/', `/${width}/`);
    return `${TMDB_IMG_BASE}${width}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Image principale : scène HD > backdrop TMDB
  const sceneImg   = cardImages?.scenes?.[0] ?? null;
  const backdropImg = sceneImg ?? getImageUrl(backdropPath, 'w780') ?? null;

  // HoverCard thumbnail et logo
  const hoverBg = sceneImg
    ?? (fanartData ? getCleanImages(fanartData, fanartMT)[0] : undefined)
    ?? backdropPath;
  const hoverImageUrl = getImageUrl(hoverBg, 'w1280');
  const logoUrl = (fanartData ? getLogo(fanartData, fanartMT) : null)
    ?? cardImages?.logos?.[0]
    ?? null;

  const goSources = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/sources/${mediaType}/${item.id}`);
  };
  const goDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/detail/${mediaType}/${item.id}`);
  };

  // ── Variante POSTER — 2:3, scène en fond + logo Fanart ──
  if (variant === 'poster') {
    // Pas de backdrop/scène → invisible dans les rails et grilles
    if (!backdropImg) return null;

    return (
      <div
        onClick={goDetails}
        onMouseEnter={(e) => {
          setIsHovered(true);
          onHoverEnter?.(item.id, (e.currentTarget as HTMLElement).getBoundingClientRect());
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHoverLeave?.();
        }}
        className={`group relative cursor-pointer flex-shrink-0 w-36 md:w-44 ${className ?? ''}`}
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 border-2 border-transparent transition-all duration-300 group-hover:border-white/40 group-hover:shadow-2xl">
          <img
            src={backdropImg}
            alt=""
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Vignette basse */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none" />

          {/* Fanart logo centré — visible dès que chargé */}
          {logoUrl && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ padding: '16%', opacity: isHovered ? 1 : 0.82, transition: 'opacity 0.3s ease' }}
            >
              <img
                src={logoUrl}
                alt=""
                loading="lazy"
                className="max-w-full max-h-full object-contain"
                style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.9))', maxHeight: 48 }}
              />
            </div>
          )}
        </div>
        {/* Pas de titre, pas d'année */}
      </div>
    );
  }

  // ── Variante LANDSCAPE — 16:9, scène + logo + HoverCard ──
  if (!backdropImg) return null;

  return (
    <div
      className={`relative flex-shrink-0 w-[250px] ${className ?? ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carte de base */}
      <div
        className="relative w-[250px] aspect-video rounded bg-zinc-900 overflow-hidden shadow-lg border-2 border-transparent transition-all duration-300 cursor-pointer"
        onClick={goDetails}
      >
        <img
          src={backdropImg}
          alt=""
          className="w-full h-full object-cover block transition-transform duration-500"
          style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          loading="lazy"
        />

        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.65)] via-[rgba(0,0,0,0.2)] to-transparent pointer-events-none" />

        {/* Fanart logo centré */}
        <div className="absolute inset-0 flex items-center justify-center p-[12%] pointer-events-none">
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              loading="lazy"
              className="max-w-full max-h-full object-contain"
              style={{
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.9))',
                maxHeight: 64,
                opacity: isHovered ? 1 : 0.82,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}
        </div>
      </div>

      {/* HoverCard panneau flottant */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[140%] min-w-[300px] z-[60] rounded-xl overflow-hidden shadow-2xl shadow-black/70 bg-[#181818] border border-white/10"
            style={{ transformOrigin: 'bottom center' }}
          >
            {/* Thumbnail 16:9 → détails */}
            <div
              className="relative aspect-video bg-zinc-900 cursor-pointer overflow-hidden"
              onClick={goDetails}
            >
              {hoverImageUrl ? (
                <img
                  src={hoverImageUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={title}
                  className="absolute bottom-3 left-3 h-10 max-w-[70%] object-contain drop-shadow-lg"
                  loading="lazy"
                />
              )}
            </div>

            {/* Actions + métadonnées */}
            <div className="p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={goSources}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black text-sm font-bold px-4 py-1.5 rounded-md hover:bg-white/85 transition-colors"
                >
                  <Play size={18} className="fill-current" /> Lecture
                </button>
                <button
                  onClick={goDetails}
                  title="Ajouter à ma liste"
                  className="w-9 h-8 rounded-md border border-white/30 flex items-center justify-center text-white hover:border-white hover:bg-white/10 transition-all"
                >
                  <Plus size={17} />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  title="J'aime"
                  className="w-9 h-8 rounded-md border border-white/30 flex items-center justify-center text-white hover:border-white hover:bg-white/10 transition-all"
                >
                  <ThumbsUp size={15} />
                </button>
                <button
                  onClick={goDetails}
                  title="Plus d'infos"
                  className="ml-auto w-9 h-8 rounded-md border border-white/30 flex items-center justify-center text-white hover:border-white hover:bg-white/10 transition-all"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Note + Année + HD */}
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                {item.vote_average != null && item.vote_average > 0 && (
                  <span className="text-green-400 font-bold">
                    {Math.round(item.vote_average * 10)}% recommandé
                  </span>
                )}
                {year && (
                  <span className="text-white/50 border border-white/15 px-1.5 py-0.5 rounded">
                    {year}
                  </span>
                )}
                <span className="text-white/50 border border-white/15 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  HD
                </span>
              </div>

              {/* Genres */}
              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {item.genres.slice(0, 3).map((g, i, arr) => {
                    const label = typeof g === 'string' ? g : g.name;
                    const key = typeof g === 'string' ? g : g.id;
                    return (
                      <span key={key || i} className="text-xs text-white/55">
                        {label}{i < arr.length - 1 && <span className="ml-2 text-white/20">•</span>}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Synopsis */}
              {(metaData?.description || item.overview || item.description) && (
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                  {metaData?.description || item.overview || item.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { ContentCard };
