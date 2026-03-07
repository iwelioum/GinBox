// DetailPage.tsx — Disney+ detail layout (composer)
// Delegates data-fetching to useDetailData/useDetailPlayback hooks
// and episode UI to DetailEpisodes sub-component.

import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

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
  const data = useDetailData();
  const playback = useDetailPlayback(data);
  const navigate = useNavigate();

  // Bug fix: validate route type param — redirect on invalid type
  if (!data.isValidType) return <Navigate to="/" replace />;

  if (data.metaLoading || data.creditsLoading) return <DetailSkeleton />;

  if (data.metaError || !data.item) {
    return (
      <div className="min-h-screen bg-dp-bg flex flex-col items-center justify-center text-dp-text/60 gap-4">
        <p>Error loading content.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
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
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 250px)',
        overflowX: 'hidden',
        display: 'block',
        top: 72,
        padding: '0 calc(3.5vw + 5px)',
      }}
    >
      {/* Background — fixed, opacity 0.8 */}
      {bgBackdrop ? (
        <div style={{ left: 0, opacity: 0.8, position: 'fixed', right: 0, top: 0, zIndex: -1 }}>
          <img alt="" src={bgBackdrop} style={{ width: '100vw', height: '100vh', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#040714' }} />
      )}

      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          left: 20,
          top: 'calc(var(--titlebar-height, 0px) + var(--navbar-height, 70px) + 8px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.4)',
          color: 'rgba(249,249,249,0.8)',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 500,
          border: '1px solid rgba(249,249,249,0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <ChevronLeft size={16} />
        {type === 'movie' ? 'Movies' : 'Series'}
      </button>

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

      {playback.playError && (
        <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 bg-red-900/90 text-dp-text px-[20px] py-[14px] rounded-[4px] border border-red-500 flex items-center gap-[12px] shadow-2xl z-50">
          <span className="text-[14px] font-[600]">{playback.playError}</span>
          <button onClick={() => playback.setPlayError(null)} className="ml-[8px] px-[10px] py-[4px] bg-dp-text/20 hover:bg-dp-text/30 rounded-[4px] text-[12px] font-[700]">✕</button>
        </div>
      )}

      <div className="relative" style={{ zIndex: 10 }}>
        <InfoSection item={item} theme={data.theme} />

        {data.isSeries && data.seasons.length > 0 && (
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
        )}

        <div className="max-w-[1400px] mx-auto px-[calc(3.5vw+5px)] pt-2 pb-[100px] flex flex-col gap-[48px]">
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
