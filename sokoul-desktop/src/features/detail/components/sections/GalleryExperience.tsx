import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';

type TabId = 'all' | 'backdrops' | 'posters';

interface GalleryExperienceProps {
  images?: {
    backdrops?: { file_path: string }[];
    posters?: { file_path: string }[];
    logos?: string[];
  };
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export function GalleryExperience({ images }: GalleryExperienceProps) {
  const [tab, setTab] = useState<TabId>('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const backdrops = useMemo(() => images?.backdrops?.map(b => b.file_path) ?? [], [images?.backdrops]);
  const posters = useMemo(() => images?.posters?.map(p => p.file_path) ?? [], [images?.posters]);

  const displayImages = useMemo(() => {
    switch (tab) {
      case 'backdrops': return backdrops;
      case 'posters': return posters;
      default: return [...backdrops, ...posters];
    }
  }, [tab, backdrops, posters]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: backdrops.length + posters.length },
    { id: 'backdrops', label: 'Scenes', count: backdrops.length },
    { id: 'posters', label: 'Posters', count: posters.length },
  ];

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const nextImage = useCallback(() =>
    setLightboxIdx(prev => prev !== null ? (prev + 1) % displayImages.length : null), [displayImages.length]);
  const prevImage = useCallback(() =>
    setLightboxIdx(prev => prev !== null ? (prev - 1 + displayImages.length) % displayImages.length : null), [displayImages.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  }, [closeLightbox, nextImage, prevImage]);

  if (displayImages.length === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader title="Gallery" subtitle={`${displayImages.length} images`} />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.filter(t => t.count > 0).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${t.id === tab
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-glass)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }
              `}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div
          className="columns-3 gap-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {displayImages.slice(0, 18).map((path, i) => (
            <motion.button
              key={path}
              variants={fadeUp}
              onClick={() => setLightboxIdx(i)}
              className="break-inside-avoid mb-3 rounded-xl overflow-hidden block w-full group focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              aria-label={`View image ${i + 1}`}
            >
              <img
                src={buildTmdbImageUrl(path, 'w500') ?? undefined}
                alt=""
                sizes="33vw"
                className="w-full h-auto object-cover transition-all duration-300 group-hover:scale-[1.05] group-hover:brightness-110"
                loading="lazy"
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIdx !== null && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
              onClick={closeLightbox}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="dialog"
              aria-label="Image lightbox"
            >
              <button onClick={closeLightbox} className="absolute top-6 right-6 text-white text-2xl hover:opacity-70" aria-label="Close">✕</button>
              <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-6 text-white text-3xl hover:opacity-70" aria-label="Previous">←</button>
              <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-6 text-white text-3xl hover:opacity-70" aria-label="Next">→</button>
              <motion.img
                key={lightboxIdx}
                src={buildTmdbImageUrl(displayImages[lightboxIdx], 'original') ?? undefined}
                alt=""
                className="max-w-5xl max-h-[85vh] rounded-2xl object-contain"
                initial={prefersReducedMotion ? false : { scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                onClick={e => e.stopPropagation()}
              />
              <p className="absolute bottom-6 text-sm text-[var(--color-text-muted)]">
                {lightboxIdx + 1} / {displayImages.length}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
