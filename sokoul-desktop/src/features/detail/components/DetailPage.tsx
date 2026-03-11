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
import { DetailEpisodes } from './DetailEpisodes';
import { Button } from '@/shared/components/ui/Button';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';

const CastSection = React.lazy(() => import('./CastSection').then(m => ({ default: m.CastSection })));
const GallerySection = React.lazy(() => import('./GallerySection').then(m => ({ default: m.GallerySection })));
const TrailerSection = React.lazy(() => import('./TrailerSection').then(m => ({ default: m.TrailerSection })));
const SagaSection = React.lazy(() => import('./SagaSection').then(m => ({ default: m.SagaSection })));
const StatsSection = React.lazy(() => import('./StatsSection').then(m => ({ default: m.StatsSection })));
const SimilarSection = React.lazy(() => import('./SimilarSection').then(m => ({ default: m.SimilarSection })));

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
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      {/* Backdrop — couvre hero + large zone de fondu (130vh).
          Trois couches CSS stacked sur un seul élément :
          1) fondu vertical : image visible → fond solide à 90%
          2) assombrissement gauche : lisibilité du texte hero
          3) l'image elle-même                                         */}
      {bgBackdrop && (
        <div
          style={{
            position:  'absolute',
            top: 0, left: 0, right: 0,
            height:    '100vh',
            zIndex:    0,
            backgroundImage: [
              'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 12%, transparent 48%, var(--color-bg-base) 92%)',
              'linear-gradient(to right,  rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 45%, transparent 70%)',
              `url(${bgBackdrop})`,
            ].join(', '),
            backgroundSize:     'auto, auto, cover',
            backgroundPosition: 'top, top, top center',
            backgroundRepeat:   'no-repeat',
          }}
        />
      )}

      {/* Tout le contenu est z-10 : passe au-dessus du backdrop z-0 */}
      <div className="relative z-10">

      {/* Back button — scrolls with content */}
      <button
        onClick={() => navigate(-1)}
        className="absolute left-5 top-[calc(var(--titlebar-height,0px)+var(--navbar-height,64px)+12px)] z-50
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
        backdropUrl={bgBackdrop ?? undefined}
        isFavorite={data.isFavorite}
        isAddingToList={playback.isAddingToList}
        isPlayLoading={playback.isPlayLoading}
        accentColor={data.theme.accentColor}
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

      {/* Content — remonte dans le fondu */}
      <div className="-mt-16 px-[var(--section-px)] pt-0 pb-8">
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
          <React.Suspense fallback={null}>
            <TrailerSection videos={data.videos} theme={data.theme} />
            <StatsSection item={item} theme={data.theme} />
            <CastSection credits={data.credits} theme={data.theme} />
            {data.images && <GallerySection images={data.images} />}
            {data.collection && <SagaSection collection={data.collection} currentId={Number(data.id)} />}
            <SimilarSection items={data.similar} theme={data.theme} />
          </React.Suspense>
        </div>
      </div>

      </div>{/* fin z-10 */}
    </div>
  );
};

export default DetailPage;
