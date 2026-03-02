// CollectionDetailPage.tsx — Films d'une saga
// Route : /collection/:id — données TMDB live

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery }               from '@tanstack/react-query';
import { ArrowLeft, Play }        from 'lucide-react';
import { endpoints }              from '../../../api/client';

export default function CollectionDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn:  () => endpoints.collections.getById(id!).then(r => r.data),
    enabled:  !!id,
    staleTime: 10 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: 'var(--bg-abyss)' }}>
        <div className="w-8 h-8 border-2 border-white/20
                        border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 pt-24"
           style={{ backgroundColor: 'var(--bg-abyss)' }}>
        <p className="text-2xl font-light text-white/60">Collection introuvable.</p>
        <button
          onClick={() => navigate('/collections')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold"
          style={{ backgroundColor: 'var(--primary-red)', color: 'var(--bg-abyss)' }}
        >
          <ArrowLeft size={18} /> Retour aux collections
        </button>
      </div>
    );
  }

  const backdrop = data.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-abyss)' }}>

      {/* Hero de la collection */}
      <div className="relative h-[45vh] min-h-[300px] overflow-hidden">
        {backdrop && (
          <img src={backdrop} alt={data.name}
            className="w-full h-full object-cover object-center" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t
                        from-[#0A0E1A] via-[#0A0E1A]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r
                        from-[#0A0E1A]/70 to-transparent" />

        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2
                     text-white/70 hover:text-white text-sm
                     transition-colors duration-200 z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* Titre + infos */}
        <div className="absolute bottom-0 left-0 px-8 pb-8 z-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            {data.name}
          </h1>
          <p className="text-white/45 text-sm">
            {data.parts?.length ?? 0} films dans cette saga
          </p>
        </div>
      </div>

      {/* Synopsis */}
      {data.overview && (
        <div className="px-8 py-6 max-w-3xl">
          <p className="text-white/55 text-sm leading-relaxed">
            {data.overview}
          </p>
        </div>
      )}

      {/* Grille des films */}
      <div className="px-8 pb-20">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em]
                       text-white/35 mb-5">
          Tous les films
        </h2>

        {data.parts && data.parts.length > 0 ? (
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
            {[...data.parts]
              .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
              .map(film => (
                <button
                  key={film.id}
                  onClick={() => navigate(`/detail/${film.type ?? 'movie'}/${film.id}`)}
                  className="group cursor-pointer text-left"
                >
                  {/* Affiche 2:3 */}
                  <div className="aspect-[2/3] rounded-xl overflow-hidden
                                  bg-white/[0.04] ring-1 ring-white/[0.07]
                                  group-hover:ring-white/25 mb-2
                                  transition-all duration-300">
                    {film.poster ? (
                      <img
                        src={film.poster.startsWith('http')
                          ? film.poster
                          : `https://image.tmdb.org/t/p/w342${film.poster}`}
                        alt={film.name ?? ''}
                        loading="lazy"
                        className="w-full h-full object-cover
                                   group-hover:scale-105
                                   transition-transform duration-500"
                      />
                    ) : film.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${film.poster_path}`}
                        alt={film.name ?? ''}
                        loading="lazy"
                        className="w-full h-full object-cover
                                   group-hover:scale-105
                                   transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center
                                      justify-center">
                        <Play className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white/75
                                line-clamp-2 leading-snug">
                    {film.name}
                  </p>
                  {film.year && (
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {film.year}
                    </p>
                  )}
                </button>
              ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm">
            Aucun film trouvé dans cette collection.
          </p>
        )}
      </div>
    </div>
  );
}
