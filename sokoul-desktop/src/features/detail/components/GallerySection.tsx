// components/detail/GallerySection.tsx — Premium image gallery
// Tabbed horizontal scroll with lightbox, hover zoom, and scroll snap

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export interface MediaImages {
  scenes:  string[];
  posters: string[];
  logos:   string[];
  banners: string[];
  seasons: string[];
}

type MediaTab = 'scenes' | 'posters' | 'logos' | 'banners' | 'seasons';

interface GallerySectionProps {
  images: MediaImages;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ images }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<MediaTab>('scenes');
  const [lightboxIdx, setLightboxIdx] = React.useState<number>(-1);

  const currentImages = (images[activeTab] ?? []).slice(0, 20);
  const slides = currentImages.map(url => ({ src: url }));

  const allTabs: { key: MediaTab; label: string; count: number }[] = [
    { key: 'scenes',  label: t('detail.scenes'),  count: images.scenes?.length ?? 0  },
    { key: 'posters', label: t('detail.posters'), count: images.posters?.length ?? 0 },
    { key: 'logos',   label: t('detail.logos'),    count: images.logos?.length ?? 0   },
    { key: 'banners', label: 'Banners',           count: images.banners?.length ?? 0 },
    { key: 'seasons', label: 'Seasons',           count: images.seasons?.length ?? 0 },
  ];
  const tabs = allTabs.filter(t => t.count > 0);
  if (tabs.length === 0) return null;

  const ASPECT: Record<MediaTab, string> = {
    scenes: '16 / 9', posters: '2 / 3', logos: '16 / 5', banners: '21 / 9', seasons: '2 / 3',
  };
  const WIDTHS: Record<MediaTab, number> = {
    scenes: 280, posters: 120, logos: 200, banners: 320, seasons: 120,
  };
  const aspectRatio = ASPECT[activeTab];
  const thumbW = WIDTHS[activeTab];

  return (
    <section>
      {/* Header + tabs */}
      <div className="flex items-center gap-5 mb-5">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
          {t('detail.scenesAndImages')}
        </h2>
        {tabs.length > 1 && (
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-3 py-1.5 rounded-full text-sm font-semibold
                            transition-all duration-200 cursor-pointer border
                            focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none ${
                  activeTab === tab.key
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border-medium)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {tab.label}
                <span className="ml-1 opacity-50">({tab.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery with animated tab transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-3 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory
                     scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {currentImages.map((url, i) => (
            <button
              key={`${activeTab}-${i}`}
              type="button"
              onClick={() => setLightboxIdx(i)}
              className="flex-shrink-0 relative overflow-hidden rounded-xl group cursor-zoom-in snap-start
                         focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none
                         transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              style={{ width: thumbW, aspectRatio }}
            >
              <img
                src={url}
                alt={`${t(`detail.${activeTab}`)} ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover
                           transition-transform duration-500 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40
                              transition-colors duration-300 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-lg
                                 transition-all duration-300 scale-75 group-hover:scale-100
                                 drop-shadow-lg">
                  ⊕
                </span>
              </div>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>

      <Lightbox
        open={lightboxIdx >= 0}
        close={() => setLightboxIdx(-1)}
        slides={slides}
        index={lightboxIdx}
        on={{ view: ({ index }) => setLightboxIdx(index) }}
        styles={{ container: { backgroundColor: 'var(--color-bg-base)' } }}
      />
    </section>
  );
};
