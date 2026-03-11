// DetailPage.tsx — Premium cinematic detail layout
// Full-viewport hero with layered backdrop, scroll-driven section reveals

import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { useDetailData } from '../hooks/useDetailData';
import { useDetailPlayback } from '../hooks/useDetailPlayback';

import { DetailSkeleton } from './DetailSkeleton';
import { HeroSection } from './HeroSection';
import { InfoSection } from './InfoSection';
import { DetailEpisodes } from './DetailEpisodes';
import { Button } from '@/shared/components/ui/Button';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';

const CastSection = React.lazy(() => import('./CastSection').then(m => ({ default: m.CastSection })));
const GallerySection = React.lazy(() => import('./GallerySection').then(m => ({ default: m.GallerySection })));
const TrailerSection = React.lazy(() => import('./TrailerSection').then(m => ({ default: m.TrailerSection })));
const SagaSection = React.lazy(() => import('./SagaSection').then(m => ({ default: m.SagaSection })));
const StatsSection = React.lazy(() => import('./StatsSection').then(m => ({ default: m.StatsSection })));
const SimilarSection = React.lazy(() => import('./SimilarSection').then(m => ({ default: m.SimilarSection })));

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const DetailPage: React.FC = () => {
  const { t } = useTranslation();
  const data = useDetailData();
  const playback = useDetailPlayback(data);
  const navigate = useNavigate();

  if (!data.isValidType) return <Navigate to="/" replace />;
  if (data.metaLoading || data.creditsLoading) return <DetailSkeleton />;

  if (data.metaError || !data.item) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center
                      text-[var(--color-text-secondary)] gap-4">
        <p>{t('detail.errorLoading')}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>← {t('common.back')}</Button>
      </div>
    );
  }

  const { item, type } = data;
  const backdropRaw = item.backdrop_path || item.background;
  const bgBackdrop = backdropRaw
    ? (backdropRaw.startsWith('http')
        ? backdropRaw.replace('/w500/', '/original/')
        : `${TMDB_IMAGE_BASE}original${backdropRaw.startsWith('/') ? '' : '/'}${backdropRaw}`)
    : null;

  const accent = data.theme.accentColor ?? 'var(--color-accent)';

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-base)]">

      {/* ── Cinematic backdrop ─────────────────────────────────────────── */}
      {bgBackdrop && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-[var(--detail-hero-height)] bg-cover bg-top bg-no-repeat"
            style={{ backgroundImage: `url(${bgBackdrop})` }}
          />
          <div className="absolute inset-x-0 top-0 h-[var(--detail-hero-height)]
                          bg-gradient-to-b from-black/40 via-transparent via-40% to-[var(--color-bg-base)]" />
          <div className="absolute inset-x-0 top-0 h-[var(--detail-hero-height)]
                          bg-gradient-to-r from-black/80 via-black/30 via-50% to-transparent" />
          <div
            className="absolute inset-x-0 top-0 h-[var(--detail-hero-height)] accent-glow-pulse
                       mix-blend-color pointer-events-none"
            style={{ background: `radial-gradient(ellipse 80% 60% at 15% 75%, ${accent}, transparent 65%)` }}
          />
          <div className="absolute inset-x-0 bottom-0 h-48 -translate-y-[calc(100vh-var(--detail-hero-height))]
                          bg-gradient-to-t from-[var(--color-bg-base)] to-transparent pointer-events-none" />
        </>
      )}

      {/* ── Content layer ──────────────────────────────────────────────── */}
      <div className="relative z-10">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          onClick={() => navigate(-1)}
          className="fixed left-5 top-[calc(var(--titlebar-height,0px)+var(--navbar-height,64px)+12px)] z-50
                     flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-[var(--color-bg-glass)] backdrop-blur-xl
                     text-[var(--color-text-primary)]/90 text-sm font-medium
                     border border-[var(--color-border)]
                     hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-medium)]
                     transition-colors duration-200
                     focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
        >
          <ChevronLeft size={16} />
          {type === 'movie' ? t('detail.backToMovies') : t('detail.backToSeries')}
        </motion.button>

        {/* Hero */}
        <HeroSection
          item={item}
          theme={data.theme}
          logoUrl={data.logoUrl ?? undefined}
          backdropUrl={bgBackdrop ?? undefined}
          isFavorite={data.isFavorite}
          isAddingToList={playback.isAddingToList}
          isPlayLoading={playback.isPlayLoading}
          accentColor={data.theme.accentColor}
          onPlay={playback.handlePlay}
          onDownload={playback.handleDownload}
          onToggleFavorite={data.activeProfile ? playback.handleToggleFavorite : () => {}}
        />

        {/* Play error toast */}
        <AnimatePresence>
          {playback.playError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              role="alert"
              aria-live="assertive"
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                         bg-[var(--color-danger)]/15 backdrop-blur-xl
                         text-[var(--color-text-primary)] px-5 py-3 rounded-xl
                         border border-[var(--color-danger)]/30
                         flex items-center gap-3 shadow-2xl"
            >
              <span className="text-sm font-semibold">{playback.playError}</span>
              <button
                onClick={() => playback.setPlayError(null)}
                className="ml-2 px-3 py-1 rounded-lg bg-[var(--color-white-8)]
                           hover:bg-[var(--color-white-15)] text-xs font-bold transition-colors"
              >✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content sections ─────────────────────────────────────── */}
        <div className="-mt-12 px-[var(--section-px)] pb-8">
          {/* Info metadata grid */}
          <RevealSection>
            <InfoSection item={item} theme={data.theme} />
          </RevealSection>

          {/* Episodes (series only) */}
          {data.isSeries && data.seasons.length > 0 && (
            <RevealSection className="mt-8">
              <DetailEpisodes
                seasons={data.seasons}
                episodesOfSeason={data.episodesOfSeason}
                episodeVideos={data.episodeVideos}
                selectedSeason={data.selectedSeason}
                selectedEpisode={data.selectedEpisode}
                selectedEpisodeData={data.selectedEpisodeData}
                getEpisodeProgress={data.getEpisodeProgress}
                isPlayLoading={playback.isPlayLoading}
                onSelectSeason={data.setSelectedSeason}
                onSelectEpisode={data.setSelectedEpisode}
                onWatchEpisode={playback.handleWatchEpisode}
              />
            </RevealSection>
          )}

          {/* Below-fold sections */}
          <div className="max-w-[var(--detail-content-max)] mx-auto pt-10 pb-24 space-y-14">
            <React.Suspense fallback={
              <div className="space-y-8">
                <div className="h-4 w-28 rounded skeleton-shimmer" />
                <div className="flex gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-[72px] h-[72px] rounded-full skeleton-shimmer" />
                  ))}
                </div>
              </div>
            }>
              {/* Cast & crew */}
              <RevealSection><CastSection credits={data.credits} theme={data.theme} /></RevealSection>

              {/* Trailers */}
              <RevealSection><TrailerSection videos={data.videos} theme={data.theme} /></RevealSection>

              {/* Stats & ratings */}
              <RevealSection><StatsSection item={item} theme={data.theme} /></RevealSection>

              {/* Gallery */}
              {data.images && <RevealSection><GallerySection images={data.images} /></RevealSection>}

              {/* Collection/saga */}
              {data.collection && (
                <RevealSection>
                  <SagaSection collection={data.collection} currentId={Number(data.id)} />
                </RevealSection>
              )}

              {/* Similar content */}
              <RevealSection><SimilarSection items={data.similar} theme={data.theme} /></RevealSection>
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
