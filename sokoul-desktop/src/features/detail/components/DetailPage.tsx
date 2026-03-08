// DetailPage.tsx — Netflix 2025 × Infuse × Apple TV detail layout
// Premium dark aesthetic with full-width hero and premium typography

import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useDetailData } from '../hooks/useDetailData';
import { useDetailPlayback } from '../hooks/useDetailPlayback';

import { DetailSkeleton } from './DetailSkeleton';
import { HeroSection } from './HeroSection';
import { InfoSection } from './InfoSection';
import { CastSection } from './CastSection';
import { GallerySection } from './GallerySection';
import { TrailerSection } from './TrailerSection';
import { SagaSection } from './SagaSection';
import { StatsSection } from './StatsSection';
import { SimilarSection } from './SimilarSection';
import { DetailEpisodes } from './DetailEpisodes';
import { Button } from '@/shared/components/ui/Button';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';

const DetailPage: React.FC = () => {
  const { t } = useTranslation();
  const data = useDetailData();
  const playback = useDetailPlayback(data);
  const navigate = useNavigate();

  // Bug fix: validate route type param — redirect on invalid type
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

  const { item, type } = data;
  const backdropRaw = item.backdrop_path || item.background;
  const bgBackdrop = backdropRaw
    ? (backdropRaw.startsWith('http')
        ? backdropRaw.replace('/w500/', '/original/')
        : `${TMDB_IMAGE_BASE}original${backdropRaw.startsWith('/') ? '' : '/'}${backdropRaw}`)
    : null;

  return (
    <div className="bg-[var(--color-bg-base)] min-h-screen">
      {/* Full-width backdrop with gradients */}
      {bgBackdrop && (
        <div className="fixed inset-0 z-0">
          <img 
            src={bgBackdrop} 
            alt="" 
            className="w-full h-full object-cover"
          />
          {/* Double gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/80 to-transparent" />
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed left-5 top-[calc(var(--titlebar-height,0px)+var(--navbar-height,64px)+12px)] z-50 
                   flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 text-[var(--color-text-primary)]/90 
                   text-sm font-medium border border-white/10 hover:bg-black/60 transition-colors"
      >
        <ChevronLeft size={16} />
        {type === 'movie' ? t('detail.backToMovies') : t('detail.backToSeries')}
      </button>

      {/* Hero Section */}
      <HeroSection
        item={item}
        theme={data.theme}
        logoUrl={data.logoUrl ?? undefined}
        isFavorite={data.isFavorite}
        isAddingToList={playback.isAddingToList}
        isPlayLoading={playback.isPlayLoading}
        onPlay={playback.handlePlay}
        onDownload={playback.handleDownload}
        onToggleFavorite={data.activeProfile ? playback.handleToggleFavorite : () => {}}
      />

      {/* Play Error */}
      {playback.playError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/90 text-[var(--color-text-primary)] 
                        px-5 py-3 rounded-lg border border-red-500 flex items-center gap-3 shadow-2xl z-50">
          <span className="text-sm font-semibold">{playback.playError}</span>
          <button 
            onClick={() => playback.setPlayError(null)} 
            className="ml-2 px-3 py-1 bg-[var(--color-text-primary)]/20 hover:bg-[var(--color-text-primary)]/30 
                       rounded text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-[var(--section-px)] py-8">
        <InfoSection item={item} theme={data.theme} />

        {data.isSeries && data.seasons.length > 0 && (
          <div className="space-y-8">
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
          </div>
        )}

        <div className="max-w-[1400px] mx-auto pt-8 pb-24 space-y-8">
          <TrailerSection videos={data.videos} theme={data.theme} />
          <StatsSection item={item} theme={data.theme} />
          <CastSection credits={data.credits} theme={data.theme} />
          {data.images && <GallerySection images={data.images} />}
          {data.collection && <SagaSection collection={data.collection} currentId={Number(data.id)} />}
          <SimilarSection items={data.similar} theme={data.theme} />
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
