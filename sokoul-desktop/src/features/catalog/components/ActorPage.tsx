// ActorPage.tsx — Premium actor page with filmography
// RULES: Immersive header (blurred backdrop), filmography in rails,
//        data fetched via getPersonMovies.

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { endpoints } from '@/shared/api/client';
import { useAmbientColor } from '../../../shared/hooks/useAmbientColor';
import { ContentRail } from './ContentRail';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { Button } from '../../../shared/components/ui/Button';
import type { CatalogMeta } from '../../../shared/types/index';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';

interface ActorLocationState {
  name?: string;
  profilePath?: string;
}

const ActorPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ActorLocationState;

  const { data, isLoading, error } = useQuery<{ metas: CatalogMeta[] }>({
    queryKey: ['personMovies', id],
    queryFn:  () => endpoints.catalog.getPersonMovies(id!).then((r) => r.data),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  });

  const name        = state.name ?? t('actor.fallbackName');
  const profilePath = state.profilePath;
  const profileUrl  = profilePath
    ? `${TMDB_IMAGE_BASE}w342${profilePath.startsWith('/') ? '' : '/'}${profilePath}`
    : undefined;

  // Ambient color — backdrop generated from the profile photo
  const ambientColor = useAmbientColor(profileUrl);

  // Partition movies / series
  const movies  = data?.metas.filter((m) => (m.type || m.media_type) === 'movie')  ?? [];
  const series  = data?.metas.filter((m) => (m.type || m.media_type) !== 'movie')  ?? [];
  const allMeta = data?.metas ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#040714] flex items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#040714] flex flex-col items-center justify-center text-white/60 gap-4">
        <p>{t('actor.unableToLoad')}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>{t('actor.back')}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040714] text-white overflow-x-hidden">

      <div className="relative h-[55vh] overflow-hidden">

        {/* Blurred backdrop: enlarged profile photo */}
        {profileUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{
              backgroundImage: `url(${profileUrl})`,
              filter: 'blur(28px) brightness(0.35)',
              transform: 'scale(1.15)',
            }}
          />
        )}

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 60%, rgba(${ambientColor}, 0.28) 0%, transparent 65%)`,
            mixBlendMode: 'screen',
            transition: 'background 1.2s ease',
          }}
        />

        {/* Bottom gradient → body section */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#04071480] to-[#040714]" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ top: 'calc(var(--titlebar-height) + var(--navbar-height) + 8px)' }}
          className="absolute left-5 z-50 flex items-center gap-1.5 px-4 py-2 bg-transparent  text-white/90 rounded text-[13px] font-medium transition-all duration-200 hover:bg-black/60 hover:text-white"
        >
          <ChevronLeft size={18} />
          {t('actor.back')}
        </button>

        {/* Content positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-[calc(3.5vw+5px)] pb-10 flex items-end gap-6">

          {/* Profile photo */}
          {profileUrl && (
            <img
              src={profileUrl}
              alt={name}
              className="w-[120px] h-[180px] rounded-xl object-cover object-top shadow-2xl flex-shrink-0 border border-white/10"
            />
          )}

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-[clamp(28px,4vw,52px)] font-black leading-none drop-shadow-lg mb-2">
              {name}
            </h1>
            {allMeta.length > 0 && (
              <p className="text-white/50 text-sm font-medium">
                {t('actor.titleInCatalog', { count: allMeta.length })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#040714] pb-16">

        {allMeta.length === 0 && (
          <div className="text-center text-white/40 py-24">
            {t('actor.noTitlesFound')}
          </div>
        )}

        {/* Movies */}
        {movies.length > 0 && (
          <div className="mt-8">
            <ContentRail
              title={t('actor.movies')}
              items={movies}
              cardVariant="poster"
            />
          </div>
        )}

        {/* Series */}
        {series.length > 0 && (
          <div className="mt-4">
            <ContentRail
              title={t('actor.series')}
              items={series}
              cardVariant="poster"
            />
          </div>
        )}

        {/* All (if no movie/series distinction) */}
        {movies.length === 0 && series.length === 0 && allMeta.length > 0 && (
          <div className="mt-8">
            <ContentRail
              title={t('actor.filmography')}
              items={allMeta}
              cardVariant="poster"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActorPage;
