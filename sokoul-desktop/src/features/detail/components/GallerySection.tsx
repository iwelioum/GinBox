// components/detail/GallerySection.tsx — Step 9
// Horizontal scroll with yet-another-react-lightbox
// Tabs: Scenes / Posters / Logos

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export interface MediaImages {
  scenes:  string[];
  posters: string[];
  logos:   string[];
  banners: string[];
  seasons: string[];
}

type MediaTab = 'scenes' | 'posters' | 'logos';

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
    { key: 'scenes',  label: t('detail.scenes'),   count: images.scenes.length  },
    { key: 'posters', label: t('detail.posters'), count: images.posters.length },
    { key: 'logos',   label: t('detail.logos'),    count: images.logos.length   },
  ];
  const tabs = allTabs.filter(t => t.count > 0);
  if (tabs.length === 0) return null;

  const aspectRatio =
    activeTab === 'posters' ? '2 / 3' :
    activeTab === 'logos'   ? '16 / 5' :
    '16 / 9';

  const thumbW =
    activeTab === 'posters' ? 120 :
    activeTab === 'logos'   ? 200 :
    280;

  return (
    <section className="mb-[40px]">

      {/* Title + tabs */}
      <div className="flex items-center gap-[20px] mb-4">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest m-0">
          {t('detail.scenesAndImages')}
        </h2>
        {tabs.length > 1 && (
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 rounded-full text-[13px] font-[600]
                            transition-opacity duration-200 cursor-pointer border ${
                  activeTab === tab.key
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-white/20 text-white/40 hover:border-white/40'
                }`}
                style={activeTab === tab.key ? {
                  background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                } : {}}
              >
                {tab.label}
                <span className="ml-1 opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scroll horizontal */}
      <div
        className="flex gap-3 overflow-x-auto pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {currentImages.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIdx(i)}
            className="flex-shrink-0 relative overflow-hidden rounded-lg group cursor-zoom-in focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
            style={{ width: thumbW, aspectRatio }}
          >
            <img
              src={url}
              alt={`${t(`detail.${activeTab}`)} ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover
                         transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30
                            transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xl
                               transition-opacity duration-300 drop-shadow-lg">
                ⊕
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* yet-another-react-lightbox */}
      <Lightbox
        open={lightboxIdx >= 0}
        close={() => setLightboxIdx(-1)}
        slides={slides}
        index={lightboxIdx}
        on={{ view: ({ index }) => setLightboxIdx(index) }}
        styles={{
          container: { backgroundColor: 'rgba(0,0,0,0.93)' },
        }}
      />
    </section>
  );
};

