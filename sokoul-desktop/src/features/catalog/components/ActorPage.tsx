// ActorPage.tsx — Premium actor page with filmography
// RULES: Immersive header (blurred backdrop), filmography in rails,
//        data fetched via getPersonMovies.

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Film } from 'lucide-react';
import { endpoints } from '@/shared/api/client';
import { useAmbientColor } from '../../../shared/hooks/useAmbientColor';
import { ContentRail } from './ContentRail';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { Button } from '../../../shared/components/ui/Button';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { QueryErrorState } from '../../../shared/components/ui/QueryErrorState';
import { useKidsFilter } from '@/shared/hooks/useKidsFilter';
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

  const { data, isLoading, isError, error, refetch } = useQuery<{ metas: CatalogMeta[] }>({
    queryKey: ['personMovies', id],
    queryFn:  () => endpoints.catalog.getPersonMovies(id!).then((r) => r.data),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  });

  const { filterForKids } = useKidsFilter<CatalogMeta>();
  const name        = state.name ?? t('actor.fallbackName');
  const profilePath = state.profilePath;
  const profileUrl  = profilePath
    ? `${TMDB_IMAGE_BASE}w342${profilePath.startsWith('/') ? '' : '/'}${profilePath}`
    : undefined;

  // Ambient color — backdrop generated from the profile photo
  const ambientColor = useAmbientColor(profileUrl);

  const allMeta = filterForKids(data?.metas ?? []);
  const movies  = allMeta.filter((m) => (m.type || m.media_type) === 'movie');
  const series  = allMeta.filter((m) => (m.type || m.media_type) !== 'movie');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] px-8 pt-24">
        <div className="flex items-end gap-6 mb-10">
          <Skeleton variant="card" className="w-[120px] h-[180px] rounded-xl" />
          <div className="flex-1">
            <Skeleton variant="text" width="260px" height="40px" className="mb-3" />
            <Skeleton variant="text" width="140px" height="16px" />
          </div>
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="poster" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <QueryErrorState error={error as Error} refetch={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-white overflow-x-hidden">

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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg-base)]/50 to-[var(--color-bg-base)]" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ top: 'calc(var(--titlebar-height) + var(--navbar-height) + 8px)' }}
          className="absolute left-5 z-50 flex items-center gap-1.5 px-4 py-2 bg-transparent  text-white/90 rounded text-[13px] font-medium transition-colors duration-200 hover:bg-black/60 hover:text-white"
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

      <div className="bg-[var(--color-bg-base)] pb-16">

        {allMeta.length === 0 && (
          <EmptyState
            icon={<Film />}
            title={t('actor.noTitlesFound')}
            description={t('actor.noTitlesDesc', { defaultValue: 'No movies or series found in the catalog for this person.' })}
          />
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
