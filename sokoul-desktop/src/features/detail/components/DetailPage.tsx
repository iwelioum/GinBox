// DetailPage.tsx — Refonte layout immersif
// Backdrop plein écran · Trailer prominent · Glassmorphism

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

// Utils & hooks
import { resolveTheme }             from '../../../shared/utils/genreTheme';
import { useDynamicAccentColor }    from '../../../shared/hooks/useDynamicAccentColor';
import { useDetailQuery }           from '../hooks/useDetailQuery';
import { useCreditsQuery }          from '../hooks/useCreditsQuery';
import { useImagesQuery }           from '../hooks/useImagesQuery';
import { useVideosQuery }           from '../hooks/useVideosQuery';
import { useSimilarQuery }          from '../hooks/useSimilarQuery';
import { useCollectionQuery }       from '../../catalog/hooks/useCollectionQuery';
import { useProfileStore }          from '../../../shared/stores/profileStore';
import { usePreferencesStore }      from '../../../shared/stores/preferencesStore';
import { getLogo, type FanartResponse } from '../../../shared/utils/fanart';
import { pickBestSource }           from '../../../shared/utils/parsing';
import { extractErrorMessage }      from '../../../shared/utils/error';
import { formatDuration }           from '../../../shared/utils/time';
import { useLists, useListItems, useAddToList, useRemoveFromList } from '../../../shared/hooks/useLists';
import { endpoints }                from '../../../api/client';

// Sections
import { DetailSkeleton }  from './DetailSkeleton';
import { HeroSection }     from './HeroSection';
import { InfoSection }     from './InfoSection';
import { CastSection }     from './CastSection';
import { GallerySection }  from './GallerySection';
import { TrailerSection }  from './TrailerSection';
import { SagaSection }     from './SagaSection';
import { StatsSection }    from './StatsSection';
import { SimilarSection }  from './SimilarSection';

import { Button } from '../../../shared/components/ui/Button';
import type { ContentType, PlaybackEntry, Source } from '../../../shared/types/index';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

const DetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: ContentType; id: string }>();
  const navigate      = useNavigate();
  const { activeProfile } = useProfileStore();
  const prefs = usePreferencesStore();
  const [isPlayLoading, setIsPlayLoading] = React.useState(false);
  const [playError, setPlayError] = React.useState<string | null>(null);
  const isSeries = type === 'series' || type === 'tv';
  const sourceType: ContentType | undefined = type === 'tv' ? 'series' : type;
  const [selectedSeason, setSelectedSeason] = React.useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = React.useState<number>(1);

  const { data: item,    isLoading: metaLoading, error: metaError } = useDetailQuery(type!, id!);
  const { data: credits, isLoading: creditsLoading }                 = useCreditsQuery(type!, id!);
  const { data: images }    = useImagesQuery(type!, id!);
  const { data: videos }    = useVideosQuery(type!, id!);
  const { data: similar }   = useSimilarQuery(type!, id!);
  const { data: collection } = useCollectionQuery(item?.belongs_to_collection?.id);

  const episodeVideos = React.useMemo(() => {
    const raw = item?.episodes ?? [];
    return raw
      .filter(v => (v.season ?? 0) > 0 && (v.episode ?? 0) > 0)
      .sort((a, b) => ((a.season ?? 0) - (b.season ?? 0)) || ((a.episode ?? 0) - (b.episode ?? 0)));
  }, [item?.episodes]);

  const seasons = React.useMemo(() => {
    return [...new Set(episodeVideos.map(v => v.season as number))].sort((a, b) => a - b);
  }, [episodeVideos]);

  const episodesOfSeason = React.useMemo(() => {
    return episodeVideos
      .filter(v => v.season === selectedSeason)
      .sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
  }, [episodeVideos, selectedSeason]);

  const selectedEpisodeData = React.useMemo(() => {
    return episodesOfSeason.find(v => v.episode === selectedEpisode);
  }, [episodesOfSeason, selectedEpisode]);

  const { data: playbackHistory = [], isFetched: playbackHistoryFetched } = useQuery<PlaybackEntry[]>({
    queryKey: ['playback-history', activeProfile?.id, id],
    queryFn: async () => {
      if (!activeProfile?.id || !id) return [];
      const { data } = await endpoints.playback.history(activeProfile.id, 1200);
      return data.filter(entry => {
        if (entry.contentId !== id) return false;
        return entry.contentType === 'series' || entry.contentType === 'tv';
      });
    },
    enabled: isSeries && !!activeProfile?.id && !!id,
    staleTime: 30_000,
  });

  const episodeProgressMap = React.useMemo(() => {
    const map = new Map<string, PlaybackEntry>();
    for (const entry of playbackHistory) {
      if ((entry.season ?? 0) <= 0 || (entry.episode ?? 0) <= 0) continue;
      map.set(`${entry.season}-${entry.episode}`, entry);
    }
    return map;
  }, [playbackHistory]);

  const getEpisodeProgress = React.useCallback((season?: number, episode?: number) => {
    if ((season ?? 0) <= 0 || (episode ?? 0) <= 0) return undefined;
    return episodeProgressMap.get(`${season}-${episode}`);
  }, [episodeProgressMap]);

  const selectedEpisodeProgress = React.useMemo(() => {
    return getEpisodeProgress(selectedSeason, selectedEpisode);
  }, [getEpisodeProgress, selectedSeason, selectedEpisode]);

  const lastProgressEpisode = React.useMemo(() => {
    let latest: PlaybackEntry | null = null;
    for (const entry of playbackHistory) {
      if ((entry.season ?? 0) <= 0 || (entry.episode ?? 0) <= 0) continue;
      if (!latest || entry.updatedAt > latest.updatedAt) {
        latest = entry;
      }
    }
    return latest;
  }, [playbackHistory]);

  React.useEffect(() => {
    if (!isSeries || !item?.episodes?.length) return;
    console.debug('[DetailPage] meta.episodes sample', item.episodes[0]);
  }, [isSeries, item?.episodes]);

  React.useEffect(() => {
    if (!isSeries || !playbackHistoryFetched || !lastProgressEpisode) return;
    if ((lastProgressEpisode.season ?? 0) <= 0 || (lastProgressEpisode.episode ?? 0) <= 0) return;
    setSelectedSeason(lastProgressEpisode.season ?? 1);
    setSelectedEpisode(lastProgressEpisode.episode ?? 1);
  }, [
    isSeries,
    playbackHistoryFetched,
    lastProgressEpisode?.season,
    lastProgressEpisode?.episode,
  ]);

  React.useEffect(() => {
    if (!isSeries || seasons.length === 0) return;
    setSelectedSeason(current => (seasons.includes(current) ? current : seasons[0]));
  }, [isSeries, seasons]);

  React.useEffect(() => {
    if (!isSeries || episodesOfSeason.length === 0) return;
    setSelectedEpisode(current => {
      if (episodesOfSeason.some(v => v.episode === current)) return current;
      return episodesOfSeason[0].episode ?? 1;
    });
  }, [isSeries, episodesOfSeason]);

  const { data: fanart } = useQuery<FanartResponse | null>({
    queryKey: ['fanart', type, id],
    queryFn: async (): Promise<FanartResponse | null> => {
      if (!id || !type) return null;
      const tmdbId    = id.split(':')[1] || id;
      const fanartType = type === 'movie' ? 'movie' : 'tv';
      try { return (await endpoints.fanart.get(fanartType, tmdbId)).data as FanartResponse; }
      catch { return null; }
    },
    enabled:   !!id && !!type,
    staleTime: Infinity,
  });

  const genreNames: string[] = (item?.genres ?? []).map(g =>
    typeof g === 'string' ? g : (g as { name: string }).name
  );
  const theme = resolveTheme(genreNames);

  const posterRaw = item?.poster_path || item?.poster;
  useDynamicAccentColor(posterRaw ?? null);

  const { data: lists = [] }    = useLists();
  const favoritesList           = lists.find(l => l.listType === 'favorites' || l.name?.toLowerCase() === 'ma liste');
  const { data: favItems = [] } = useListItems(favoritesList?.id ?? null);
  const isFavorite              = favItems.some(fav => fav.contentId === id);
  const addToList               = useAddToList();
  const removeFromList          = useRemoveFromList();

  const detailPath = type && id ? `/detail/${type}/${id}` : '';
  const sourceNavState = detailPath ? { fromDetail: true, returnTo: detailPath } : undefined;
  const getEpisodeTitle = React.useCallback((season: number, episode: number) => {
    return episodeVideos.find(v => v.season === season && v.episode === episode)?.title;
  }, [episodeVideos]);

  const handleWatchEpisode = async (
    season: number,
    episode: number,
    resumeAt?: number
  ) => {
    if (!id || !item || isPlayLoading) return;
    setIsPlayLoading(true);
    setPlayError(null);

    try {
      const { data: sourcePayload } = await endpoints.sources.get('series', id, { season, episode });
      const sources: Source[] = Array.isArray(sourcePayload)
        ? sourcePayload
        : (sourcePayload.results ?? []);

      const best = pickBestSource(sources, prefs);
      if (!best) {
        setPlayError('Aucune source disponible pour cet épisode.');
        return;
      }
      if (!best.magnet) {
        setPlayError('Impossible de lancer cette source.');
        return;
      }

      const { data } = await endpoints.debrid.unrestrict(best.magnet, best.cached_rd);
      const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : (item.poster ?? '');
      const ratingStr = item.vote_average != null ? String(item.vote_average.toFixed(1)) : '';
      const resumeMs = resumeAt && resumeAt > 0 ? resumeAt : 0;
      const startAtParam = resumeMs > 0
        ? `&startAt=${encodeURIComponent(String(Math.floor(resumeMs / 1000)))}`
        : '';
      const playerUrl =
        `/player?url=${encodeURIComponent(data.stream_url)}` +
        `&title=${encodeURIComponent(item.title || item.name || '')}` +
        `&poster=${encodeURIComponent(posterUrl)}` +
        `&year=${encodeURIComponent(String(item.year ?? item.releaseInfo ?? ''))}` +
        `&rating=${encodeURIComponent(ratingStr)}` +
        `&contentType=series` +
        `&contentId=${encodeURIComponent(id)}` +
        `&season=${encodeURIComponent(String(season))}` +
        `&episode=${encodeURIComponent(String(episode))}` +
        startAtParam +
        (detailPath ? `&returnTo=${encodeURIComponent(detailPath)}` : '');

      navigate(playerUrl, {
        replace: true,
        state: {
          sources,
          current: best,
          mediaId: id,
          mediaType: 'series',
          season,
          episode,
          resumeAt: resumeMs,
          episodeTitle: getEpisodeTitle(season, episode),
          episodes: episodeVideos,
          fromDetail: true,
          returnTo: detailPath,
        },
      });
    } catch (err: unknown) {
      setPlayError(extractErrorMessage(err, 'Erreur lors du lancement'));
    } finally {
      setIsPlayLoading(false);
    }
  };

  const handlePlay = async () => {
    if (!type || !id || !item || isPlayLoading) return;

    if (isSeries) {
      await handleWatchEpisode(
        selectedSeason,
        selectedEpisode,
        selectedEpisodeProgress?.positionMs
      );
      return;
    }

    setIsPlayLoading(true);
    setPlayError(null);

    try {
      if (!sourceType) return;
      const { data: sourcePayload } = await endpoints.sources.get(sourceType, id);
      const sources: Source[] = Array.isArray(sourcePayload)
        ? sourcePayload
        : (sourcePayload.results ?? []);

      const best = pickBestSource(sources, prefs);
      if (!best) {
        setPlayError('Aucune source disponible pour ce contenu.');
        return;
      }
      if (!best.magnet) {
        setPlayError('Impossible de lancer cette source.');
        return;
      }

      const { data } = await endpoints.debrid.unrestrict(best.magnet, best.cached_rd);
      const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : (item.poster ?? '');
      const ratingStr = item.vote_average != null ? String(item.vote_average.toFixed(1)) : '';
      const playerUrl =
        `/player?url=${encodeURIComponent(data.stream_url)}` +
        `&title=${encodeURIComponent(item.title || item.name || '')}` +
        `&poster=${encodeURIComponent(posterUrl)}` +
        `&year=${encodeURIComponent(String(item.year ?? item.releaseInfo ?? ''))}` +
        `&rating=${encodeURIComponent(ratingStr)}` +
        `&contentType=${encodeURIComponent(sourceType)}` +
        `&contentId=${encodeURIComponent(id)}` +
        (detailPath ? `&returnTo=${encodeURIComponent(detailPath)}` : '');

      navigate(playerUrl, {
        replace: true,
        state: {
          sources,
          current: best,
          mediaId: id,
          mediaType: sourceType,
          fromDetail: true,
          returnTo: detailPath,
        },
      });
    } catch (err: unknown) {
      setPlayError(extractErrorMessage(err, 'Erreur lors du lancement'));
    } finally {
      setIsPlayLoading(false);
    }
  };
  const handleDownload = () => {
    if (!sourceType || !id) return;
    navigate(`/sources/${sourceType}/${id}?mode=download`, { replace: true, state: sourceNavState });
  };
  const handleToggleFavorite = () => {
    if (!favoritesList || !item) return;
    const contentType = item.type || item.media_type || 'movie';
    if (isFavorite) removeFromList.mutate({ listId: favoritesList.id, contentId: item.id });
    else            addToList.mutate({ listId: favoritesList.id, contentId: item.id, contentType });
  };

  if (metaLoading || creditsLoading) return <DetailSkeleton />;

  if (metaError || !item) {
    return (
      <div className="min-h-screen bg-[#07080f] flex flex-col items-center justify-center
                      text-white/60 gap-4">
        <p>Erreur lors du chargement du contenu.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>← Retour</Button>
      </div>
    );
  }

  const getImageUrl = (path: string | undefined, size: string): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
  };
  const upgradeQuality = (url: string | undefined, newSize: string) =>
    url?.replace('/w500/', `/${newSize}/`);

  const logoUrl = getLogo(fanart, type === 'movie' ? 'movie' : 'tv')
                  || images?.logos?.[0]
                  || null;

  // Backdrop haute qualité — fond cinématique plein écran
  const backdropRaw = item.backdrop_path || item.background;
  const bgBackdrop  = backdropRaw
    ? (backdropRaw.startsWith('http')
        ? backdropRaw.replace('/w500/', '/original/')
        : `${TMDB_IMAGE_BASE}original${backdropRaw.startsWith('/') ? '' : '/'}${backdropRaw}`)
    : null;

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-[#F8F9FA]"
      style={{ background: '#0A0B16' }}
    >
          FOND CINÉMATIQUE — backdrop plein écran, visible en scroll
          Couche 1 : image haute définition (opacity 0.30)
          Couche 2 : gradient sombre pour lisibilité
      {bgBackdrop && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <div
            style={{
              position:           'absolute',
              inset:              0,
              backgroundImage:    `url(${bgBackdrop})`,
              backgroundSize:     'cover',
              backgroundPosition: 'center 15%',
              opacity:            0.55,
            }}
          />
          {/* Dégradé : transparent en haut (le hero montre le backdrop brut),
              de plus en plus sombre au fur et à mesure qu'on scrolle */}
          <div
            style={{
              position:   'absolute',
              inset:      0,
              background: `
                linear-gradient(
                  to bottom,
                  rgba(10,11,22,0)    0%,
                  rgba(10,11,22,0.15) 20%,
                  rgba(10,11,22,0.55) 50%,
                  rgba(10,11,22,0.80) 75%,
                  rgba(10,11,22,0.96) 100%
                ),
                linear-gradient(
                  to right,
                  rgba(10,11,22,0.6)  0%,
                  transparent        55%
                )
              `,
            }}
          />
        </div>
      )}

      {/* Sans backdrop : fond sombre uni */}
      {!bgBackdrop && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 0, background: '#0A0B16' }}
        />
      )}

      <button
        onClick={() => navigate(-1)}
        className="fixed left-5 z-50 flex items-center gap-1.5 px-4 py-2
                   bg-black/40 backdrop-blur-md text-white/80 rounded-full
                   text-[13px] font-medium transition-all duration-200
                   hover:bg-black/70 hover:text-white border border-white/10"
        style={{ top: 'calc(var(--titlebar-height, 0px) + var(--navbar-height, 70px) + 8px)' }}
      >
        <ChevronLeft size={16} />
        {type === 'movie' ? 'Films' : 'Séries'}
      </button>

          HERO — 100vh plein écran cinématique
      <HeroSection
        item={item}
        theme={theme}
        logoUrl={logoUrl ?? undefined}
        isFavorite={isFavorite}
        isAddingToList={addToList.isPending || removeFromList.isPending}
        isPlayLoading={isPlayLoading}
        onPlay={handlePlay}
        onDownload={handleDownload}
        onToggleFavorite={activeProfile ? handleToggleFavorite : () => {}}
      />

      {playError && (
        <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-[20px] py-[14px] rounded-[10px] border border-red-500 flex items-center gap-[12px] shadow-2xl backdrop-blur-md z-50">
          <span className="text-[14px] font-[600]">{playError}</span>
          <button onClick={() => setPlayError(null)} className="ml-[8px] px-[10px] py-[4px] bg-white/20 hover:bg-white/30 rounded text-[12px] font-[700]">✕</button>
        </div>
      )}

          CONTENU — z-10, visible au dessus du fond
      <div className="relative" style={{ zIndex: 10 }}>

        <InfoSection item={item} theme={theme} />

        {isSeries && seasons.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-[calc(3.5vw+5px)] pb-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-lg p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white/85 m-0">Saison & épisode</h2>
                {selectedEpisodeData && (
                  <span className="text-xs text-white/45">
                    S{String(selectedSeason).padStart(2, '0')}E{String(selectedEpisode).padStart(2, '0')}
                  </span>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
                {seasons.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSelectedSeason(s);
                      const firstEpisode = episodeVideos.find(v => v.season === s)?.episode ?? 1;
                      setSelectedEpisode(firstEpisode);
                    }}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedSeason === s
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/60 hover:bg-white/18'
                    }`}
                  >
                    Saison {s}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {episodesOfSeason.map(ep => {
                  const stillUrl = getImageUrl(ep.still_path, 'w300');
                  const isSelectedEpisode = selectedEpisode === ep.episode;
                  const progress = getEpisodeProgress(ep.season, ep.episode);
                  const canResume =
                    !!progress &&
                    !progress.watched &&
                    (progress.positionMs ?? 0) > 0;
                  return (
                    <div
                      key={`${ep.season}-${ep.episode}`}
                      onClick={() => setSelectedEpisode(ep.episode ?? 1)}
                      className={`group flex items-start gap-3 p-3 rounded-xl text-left cursor-pointer transition-colors duration-200 ${
                        isSelectedEpisode
                          ? 'bg-white/[0.08] ring-1 ring-white/25'
                          : 'bg-white/[0.04] hover:bg-white/[0.07]'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedEpisode(ep.episode ?? 1);
                        }
                      }}
                    >
                      {stillUrl ? (
                        <div className="relative flex-shrink-0 w-[120px] aspect-video rounded-lg overflow-hidden bg-white/10">
                          <img
                            src={stillUrl}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            alt={ep.title ?? `Épisode ${ep.episode}`}
                          />
                          {progress && progress.progressPct > 0 && !progress.watched && (
                            <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-white/20">
                              <div
                                className="h-full bg-white/70"
                                style={{ width: `${Math.min(100, Math.max(0, progress.progressPct))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative flex-shrink-0 w-[120px] aspect-video rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                          <span className="text-white/20 text-xs">E{ep.episode}</span>
                          {progress && progress.progressPct > 0 && !progress.watched && (
                            <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-white/20">
                              <div
                                className="h-full bg-white/70"
                                style={{ width: `${Math.min(100, Math.max(0, progress.progressPct))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/35 flex-shrink-0">
                            {ep.episode}
                          </span>
                          <span className="text-sm font-medium text-white/85 truncate">
                            {ep.title ?? `Épisode ${ep.episode}`}
                          </span>
                          {ep.runtime && (
                            <span className="text-xs text-white/30 flex-shrink-0 ml-auto">
                              {ep.runtime} min
                            </span>
                          )}
                        </div>
                        {ep.overview && (
                          <p className="text-[11px] text-white/45 line-clamp-2 leading-relaxed">
                            {ep.overview}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {progress?.watched && (
                            <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                              ✓ Vu
                            </span>
                          )}
                          {canResume && (
                            <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                              ↩ Reprendre à {formatDuration(progress.positionMs)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleWatchEpisode(
                                ep.season ?? selectedSeason,
                                ep.episode ?? 1,
                                canResume ? progress?.positionMs : undefined
                              );
                            }}
                            disabled={isPlayLoading}
                            className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90 transition-all duration-200 ${
                              isSelectedEpisode
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                            } ${isPlayLoading ? 'cursor-default opacity-70' : ''}`}
                          >
                            {canResume ? '↩ Reprendre' : '▶ Lire'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <div className="max-w-[1400px] mx-auto px-[calc(3.5vw+5px)] pt-2 pb-[100px] flex flex-col gap-[48px]">

          {/* 1. BANDE-ANNONCE — en premier, mise en avant */}
          <TrailerSection videos={videos} theme={theme} />

          {/* 2. STATS — chiffres animés (note, votes, budget, box-office) */}
          <StatsSection item={item} theme={theme} />

          {/* 3. CASTING — scroll horizontal */}
          <CastSection credits={credits} theme={theme} />

          {/* 4. GALERIE — Scènes / Affiches / Logos avec lightbox */}
          {images && <GallerySection images={images} />}

          {/* 5. SAGA / COLLECTION — si appartient à une collection */}
          {collection && <SagaSection collection={collection} currentId={Number(id)} />}

          {/* 6. SIMILAIRES — recommandations */}
          <SimilarSection items={similar} theme={theme} />

        </div>
      </div>
    </div>
  );
};

export default DetailPage;
