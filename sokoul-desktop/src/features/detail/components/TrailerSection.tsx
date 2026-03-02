// components/detail/TrailerSection.tsx — Étape 10
// Vignette YouTube cliquable → modal iframe embed

import * as React from 'react';
import { Play } from 'lucide-react';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface TrailerSectionProps {
  videos?: CatalogMeta['videos'];
  theme:   GenreTheme;
}

export const TrailerSection: React.FC<TrailerSectionProps> = ({ videos, theme: _theme }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  // Chercher un trailer YouTube dans les videos
  const trailer = videos?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    ?? videos?.find(v => v.key);

  const youtubeKey = trailer?.key;

  if (!youtubeKey) return null;

  const thumbUrl = `https://img.youtube.com/vi/${youtubeKey}/maxresdefault.jpg`;

  return (
    <section className="mb-[40px]">
      <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-5">
        Bande-annonce
      </h2>

      {/* Vignette cliquable — large */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="relative w-full max-w-[900px] aspect-video rounded-2xl overflow-hidden
                   group cursor-pointer block shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
      >
        <img
          src={thumbUrl}
          alt="Bande-annonce"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay sombre + texte "Bande-annonce" en bas à gauche */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                        group-hover:from-black/50 transition-all duration-300" />
        <span className="absolute bottom-4 left-5 text-white/60 text-[11px] font-semibold
                         uppercase tracking-[0.15em]">
          Bande-annonce officielle
        </span>
        {/* Bouton play centré */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center
                       bg-white/15 backdrop-blur-sm border border-white/30
                       group-hover:scale-110 group-hover:bg-white/25
                       transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            <Play size={34} className="fill-white text-white ml-1.5" />
          </div>
        </div>
      </button>

      {/* Modal YouTube */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video mx-4"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="w-full h-full rounded-xl"
              title="Bande-annonce"
            />
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 bg-black/60 text-white border-none
                       w-9 h-9 rounded-full cursor-pointer hover:bg-black/85
                       flex items-center justify-center text-base"
          >✕</button>
        </div>
      )}
    </section>
  );
};
