// ActorPage.tsx — Page acteur premium avec filmographie
// RÈGLES : Header immersif (backdrop flou), filmographie en rails,
//          données récupérées via getPersonMovies.

import * as React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { endpoints } from '../../../api/client';
import { useAmbientColor } from '../../../shared/hooks/useAmbientColor';
import { ContentRail } from './ContentRail';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { Button } from '../../../shared/components/ui/Button';
import type { CatalogMeta } from '../../../shared/types/index';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

interface ActorLocationState {
  name?: string;
  profilePath?: string;
}

const ActorPage: React.FC = () => {
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

  const name        = state.name ?? 'Acteur';
  const profilePath = state.profilePath;
  const profileUrl  = profilePath
    ? `${TMDB_IMAGE_BASE}w342${profilePath.startsWith('/') ? '' : '/'}${profilePath}`
    : undefined;

  // Ambient color — backdrop généré depuis la photo de profil
  const ambientColor = useAmbientColor(profileUrl);

  // Partitionner films / séries
  const movies  = data?.metas.filter((m) => (m.type || m.media_type) === 'movie')  ?? [];
  const series  = data?.metas.filter((m) => (m.type || m.media_type) !== 'movie')  ?? [];
  const allMeta = data?.metas ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B16] flex items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0B16] flex flex-col items-center justify-center text-white/60 gap-4">
        <p>Impossible de charger la filmographie.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B16] text-white overflow-x-hidden">

      <div className="relative h-[55vh] overflow-hidden">

        {/* Backdrop flou : photo de profil agrandie */}
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

        {/* Gradient bas → section body */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0B1680] to-[#0A0B16]" />

        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          style={{ top: 'calc(var(--titlebar-height) + var(--navbar-height) + 8px)' }}
          className="absolute left-5 z-50 flex items-center gap-1.5 px-4 py-2 bg-transparent backdrop-blur-sm text-white/90 rounded text-[13px] font-medium transition-all duration-200 hover:bg-black/60 hover:text-white"
        >
          <ChevronLeft size={18} />
          Retour
        </button>

        {/* Contenu positionné en bas */}
        <div className="absolute bottom-0 left-0 right-0 px-[calc(3.5vw+5px)] pb-10 flex items-end gap-6">

          {/* Photo de profil */}
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
                {allMeta.length} titre{allMeta.length > 1 ? 's' : ''} au catalogue
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0A0B16] pb-16">

        {allMeta.length === 0 && (
          <div className="text-center text-white/40 py-24">
            Aucun titre trouvé pour cet acteur.
          </div>
        )}

        {/* Films */}
        {movies.length > 0 && (
          <div className="mt-8">
            <ContentRail
              title="Films"
              items={movies}
              cardVariant="poster"
            />
          </div>
        )}

        {/* Séries */}
        {series.length > 0 && (
          <div className="mt-4">
            <ContentRail
              title="Séries"
              items={series}
              cardVariant="poster"
            />
          </div>
        )}

        {/* Tout (si pas de distinction film/série) */}
        {movies.length === 0 && series.length === 0 && allMeta.length > 0 && (
          <div className="mt-8">
            <ContentRail
              title="Filmographie"
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
