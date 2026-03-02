// components/home/PerfectMoment.tsx — Tâche 4.3
// "Le Moment Parfait" — 3 suggestions selon l'heure réelle

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CatalogMeta } from '../../../shared/types/index';
import {
  Sun,
  UtensilsCrossed,
  Clapperboard,
  Sunset,
  Moon,
  Stars,
  type LucideIcon,
} from 'lucide-react';

const TMDB_BASE = 'https://image.tmdb.org/t/p/';

interface TimeContext {
  hours:  number[];
  label:  string;
  icon:   LucideIcon;
  desc:   string;
  maxMin: number;
}

const CONTEXTS: TimeContext[] = [
  { hours: [6, 7, 8],            label: 'Ce matin',           icon: Sun,              desc: '< 2h',    maxMin: 120 },
  { hours: [12, 13],             label: 'Pendant le déjeuner',icon: UtensilsCrossed,  desc: '< 45 min',maxMin: 45  },
  { hours: [14, 15, 16, 17],     label: "L'après-midi",       icon: Clapperboard,     desc: '< 3h',    maxMin: 180 },
  { hours: [18, 19, 20],         label: 'Ce soir',            icon: Sunset,           desc: '< 2h30',  maxMin: 150 },
  { hours: [21, 22, 23],         label: 'Avant de dormir',    icon: Moon,             desc: '< 1h40',  maxMin: 100 },
  { hours: [0, 1, 2, 3, 4, 5],   label: 'Cette nuit',         icon: Stars,            desc: '< 1h',    maxMin: 60  },
];

interface PerfectMomentProps {
  movies: CatalogMeta[];
  series: CatalogMeta[];
}

export const PerfectMoment: React.FC<PerfectMomentProps> = ({ movies, series }) => {
  const navigate = useNavigate();
  const hour = new Date().getHours();

  const ctx = CONTEXTS.find(c => c.hours.includes(hour)) ?? CONTEXTS[3];
  const ContextIcon = ctx.icon;

  // Sélection stable basée sur l'heure (évite le re-shuffle au re-render)
  const goodMovies = movies.filter(m => (m.vote_average ?? 0) >= 7);
  const goodSeries = series.filter(s => (s.vote_average ?? 0) >= 7);
  const otherMovies = movies.filter(m => (m.vote_average ?? 0) >= 6 && (m.vote_average ?? 0) < 7);

  const pick = (arr: CatalogMeta[], offset: number): CatalogMeta | null =>
    arr.length > 0 ? arr[(hour + offset) % arr.length] : null;

  const suggestions = [
    pick(goodMovies, 0),
    pick(goodSeries, 1),
    pick(goodMovies.length >= 6 ? goodMovies.slice(3) : otherMovies, 3),
  ].filter(Boolean) as CatalogMeta[];

  if (suggestions.length === 0) return null;

  return (
    <section
      style={{
        padding:      '0 var(--section-px)',
        marginBottom: '40px',
      }}
    >
      {/* En-tête */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center">
          <ContextIcon size={16} />
        </span>
        <h2 className="text-[22px] font-bold tracking-[0.5px]" style={{ color: 'var(--text-sand)' }}>
          {ctx.label}
        </h2>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background:  'var(--glass-surface)',
            color:       'var(--text-muted)',
            border:      'var(--glass-border)',
          }}
        >
          {ctx.desc}
        </span>
      </div>

      {/* Cards suggestions */}
      <div className="flex gap-4">
        {suggestions.map((item, idx) => {
          const imgRaw = item.backdrop_path
            || item.background
            || item.poster_path
            || item.poster;
          const imgUrl = imgRaw
            ? (imgRaw.startsWith('http')
                ? imgRaw
                : `${TMDB_BASE}w500${imgRaw.startsWith('/') ? '' : '/'}${imgRaw}`)
            : null;
          const title  = item.title || item.name || '';
          const type   = item.type || item.media_type || 'movie';
          const labels = ['Film', 'Série', 'À découvrir'];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/detail/${type}/${item.id}`)}
              className="relative flex-shrink-0 w-[280px] aspect-video rounded-xl
                         overflow-hidden group cursor-pointer
                         transition-transform duration-300 hover:scale-[1.03]"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                border: 'var(--glass-border)',
                background: 'var(--glass-surface)',
              }}
            >
              {/* Image */}
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500
                             group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'var(--bg-obsidian-light)' }}
                />
              )}

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                }}
              />

              {/* Badge type */}
              <span
                className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.1em]
                           px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(30,26,24,0.65)',
                  backdropFilter: 'blur(6px)',
                  color: 'var(--text-sand)',
                  border: 'var(--glass-border)',
                }}
              >
                {labels[idx] ?? type}
              </span>

              {/* Infos */}
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-[13px] font-semibold truncate leading-tight">
                  {title}
                </p>
                {item.vote_average != null && item.vote_average > 0 && (
                  <p className="text-yellow-400 text-[11px] font-medium mt-0.5">
                    ★ {item.vote_average.toFixed(1)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
