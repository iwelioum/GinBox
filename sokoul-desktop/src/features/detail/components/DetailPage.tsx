// DetailPage.tsx — Cinematic detail page orchestrator
// Lazy-loads all sections with ScrollReveal + section rhythm (dense/visual alternation)

import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { useDetailData } from '../hooks/useDetailData';
import { useDetailPlayback } from '../hooks/useDetailPlayback';
import { ScrollReveal } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/Button';

import { DetailSkeleton } from './sections/DetailSkeleton';
import { HeroExperience } from './sections/HeroExperience';
import { WatchProgress } from './sections/WatchProgress';
import { ComingSoonSection } from './sections/ComingSoonSection';

const UniverseStats = React.lazy(() => import('./sections/UniverseStats').then(m => ({ default: m.UniverseStats })));
const TrailerExperience = React.lazy(() => import('./sections/TrailerExperience').then(m => ({ default: m.TrailerExperience })));
const StoryWorld = React.lazy(() => import('./sections/StoryWorld').then(m => ({ default: m.StoryWorld })));
const EpisodeExplorer = React.lazy(() => import('./sections/EpisodeExplorer').then(m => ({ default: m.EpisodeExplorer })));
const CharacterUniverse = React.lazy(() => import('./sections/CharacterUniverse').then(m => ({ default: m.CharacterUniverse })));
const CollectionUniverse = React.lazy(() => import('./sections/CollectionUniverse').then(m => ({ default: m.CollectionUniverse })));
const GalleryExperience = React.lazy(() => import('./sections/GalleryExperience').then(m => ({ default: m.GalleryExperience })));
const ProductionDetails = React.lazy(() => import('./sections/ProductionDetails').then(m => ({ default: m.ProductionDetails })));
const RecommendationEngine = React.lazy(() => import('./sections/RecommendationEngine').then(m => ({ default: m.RecommendationEngine })));

const SectionSkeleton = () => (
  <div className="px-16 py-16 space-y-4">
    <div className="h-8 w-32 shimmer rounded" />
    <div className="h-48 shimmer rounded-2xl" />
  </div>
);

const DetailPage: React.FC = () => {
  const { t } = useTranslation();
  const data = useDetailData();
  const playback = useDetailPlayback(data);
  const navigate = useNavigate();

  if (!data.isValidType) return <Navigate to="/" replace />;
  if (data.metaLoading || data.creditsLoading) return <DetailSkeleton />;

  if (data.metaError || !data.item) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center text-[var(--color-text-secondary)] gap-4">
        <p>{t('detail.errorLoading')}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>← {t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-base)]">
      {/* Back button — fixed context nav */}
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
        {data.type === 'movie' ? t('detail.backToMovies') : t('detail.backToSeries')}
      </motion.button>

      {/* Section 1 — Hero (visual) */}
      <HeroExperience
        data={data}
        onPlay={playback.handlePlay}
        onToggleFavorite={data.activeProfile ? playback.handleToggleFavorite : () => {}}
        isPlayLoading={playback.isPlayLoading}
        isFavorite={data.isFavorite}
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
              aria-label="Dismiss error"
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 2 — Watch Progress (dense, conditional) */}
      {data.isSeries && (
        <WatchProgress data={data} onResume={playback.handlePlay} />
      )}

      {/* Lazy-loaded sections */}
      <React.Suspense fallback={<SectionSkeleton />}>
        {/* Section 3 — Universe Stats (dense) */}
        <ScrollReveal>
          <UniverseStats data={data} />
        </ScrollReveal>

        {/* Section 4 — Trailer Experience (visual) */}
        <ScrollReveal>
          <TrailerExperience
            videos={data.videos}
            synopsis={data.item?.overview || data.item?.description}
          />
        </ScrollReveal>

        {/* Section 5 — Story World (dense) */}
        <ScrollReveal>
          <StoryWorld data={data} />
        </ScrollReveal>

        {/* Section 6 — Episode Explorer (visual, series only) */}
        {data.isSeries && data.seasons.length > 0 && (
          <ScrollReveal>
            <EpisodeExplorer data={data} onWatchEpisode={playback.handleWatchEpisode} />
          </ScrollReveal>
        )}

        {/* Section 7 — Character Universe (visual) */}
        <ScrollReveal>
          <CharacterUniverse credits={data.credits} isLoading={data.creditsLoading} />
        </ScrollReveal>

        {/* Section 8 — Collection Universe (visual) */}
        {data.collection && (
          <ScrollReveal>
            <CollectionUniverse collection={data.collection} currentId={data.id} />
          </ScrollReveal>
        )}

        {/* Section 9 — Soundtrack (dense, coming soon) */}
        <ScrollReveal>
          <ComingSoonSection title="Soundtrack" icon="🎵" description="Soundtrack data integration coming in a future update." />
        </ScrollReveal>

        {/* Section 10 — Awards (dense, coming soon) */}
        <ScrollReveal>
          <ComingSoonSection title="Awards & Legacy" icon="🏆" description="Awards and accolades data coming soon." />
        </ScrollReveal>

        {/* Section 11 — Behind the Scenes (visual, coming soon) */}
        <ScrollReveal>
          <ComingSoonSection title="Behind the Scenes" icon="🎬" description="Behind the scenes content coming soon." />
        </ScrollReveal>

        {/* Section 12 — Gallery Experience (visual) */}
        {data.images && (
          <ScrollReveal>
            <GalleryExperience images={data.images} />
          </ScrollReveal>
        )}

        {/* Section 13 — Cultural Impact (dense, coming soon) */}
        <ScrollReveal>
          <ComingSoonSection title="Cultural Impact" icon="🌍" description="Cultural impact scores and memorable quotes coming soon." />
        </ScrollReveal>

        {/* Section 14 — Trivia (visual, coming soon) */}
        <ScrollReveal>
          <ComingSoonSection title="Trivia & Facts" icon="💡" description="Fun facts and trivia coming in a future update." />
        </ScrollReveal>

        {/* Section 15 — Production Details (dense) */}
        <ScrollReveal>
          <ProductionDetails data={data} />
        </ScrollReveal>

        {/* Section 16 — Recommendations (visual) */}
        <ScrollReveal>
          <RecommendationEngine similar={data.similar} contentType={data.type} />
        </ScrollReveal>
      </React.Suspense>

      {/* Bottom spacing */}
      <div className="h-24" />
    </div>
  );
};

export default DetailPage;
