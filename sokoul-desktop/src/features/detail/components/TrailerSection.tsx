// components/detail/TrailerSection.tsx — Multiple trailers with type labels
// Glass card · Ambient glow · YouTube modal

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, X } from 'lucide-react';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface TrailerSectionProps {
  videos?: CatalogMeta['videos'];
  theme:   GenreTheme;
}

export const TrailerSection: React.FC<TrailerSectionProps> = ({ videos, theme: _theme }) => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = React.useState<string | null>(null);

  const ytVideos = React.useMemo(
    () => (videos ?? []).filter(v => v.site === 'YouTube' && v.key).slice(0, 6),
    [videos],
  );

  if (ytVideos.length === 0) return null;

  const mainTrailer = ytVideos.find(v => v.type === 'Trailer') ?? ytVideos[0];
  const others = ytVideos.filter(v => v !== mainTrailer);

  return (
    <section>
      <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-5">
        {t('detail.trailer')}{ytVideos.length > 1 ? 's' : ''}
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[var(--color-white-8)] scrollbar-track-transparent">
        {/* Main trailer — large */}
        <TrailerCard
          videoKey={mainTrailer.key!}
          label={mainTrailer.type ?? t('detail.officialTrailer')}
          name={mainTrailer.name}
          large
          onClick={() => setActiveKey(mainTrailer.key!)}
        />
        {/* Other trailers — smaller */}
        {others.map(v => (
          <TrailerCard
            key={v.key}
            videoKey={v.key!}
            label={v.type ?? 'Video'}
            name={v.name}
            onClick={() => setActiveKey(v.key!)}
          />
        ))}
      </div>

      {/* Modal */}
      {activeKey && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setActiveKey(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setActiveKey(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={t('detail.trailer')}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <div className="relative w-full max-w-4xl aspect-video mx-4" onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${activeKey}?autoplay=1&rel=0`}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="w-full h-full rounded-xl"
              title={t('detail.trailer')}
            />
          </div>
          <button
            type="button"
            onClick={() => setActiveKey(null)}
            className="absolute top-4 right-4 bg-[var(--color-bg-glass)] backdrop-blur-xl
                       text-[var(--color-text-primary)] border border-[var(--color-border)]
                       w-10 h-10 rounded-full flex items-center justify-center
                       hover:bg-[var(--color-bg-overlay)] transition-colors
                       focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </section>
  );
};

function TrailerCard({ videoKey, label, name, large, onClick }: {
  videoKey: string; label: string; name?: string; large?: boolean; onClick: () => void;
}) {
  const thumbUrl = `https://img.youtube.com/vi/${videoKey}/maxresdefault.jpg`;
  const w = large ? 'w-full max-w-[640px]' : 'w-[280px] flex-shrink-0';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${w} relative aspect-video rounded-xl overflow-hidden group cursor-pointer
                  shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]
                  transition-shadow duration-300
                  focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none`}
    >
      <img
        src={thumbUrl}
        alt={name ?? label}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                       group-hover:from-black/50 transition-colors duration-300" />
      {/* Label */}
      <span className="absolute bottom-3 left-4 text-[var(--color-text-muted)] text-xs font-semibold
                        uppercase tracking-[0.15em]">
        {label}
      </span>
      {name && (
        <span className="absolute bottom-3 right-4 text-[var(--color-text-secondary)] text-xs
                          font-medium truncate max-w-[50%]">
          {name}
        </span>
      )}
      {/* Play circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center
                        bg-[var(--color-white-15)] border border-[var(--color-white-20)]
                        group-hover:scale-110 group-hover:bg-[var(--color-white-20)]
                        transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
          <Play size={28} className="fill-white text-white ml-1" />
        </div>
      </div>
    </button>
  );
}

