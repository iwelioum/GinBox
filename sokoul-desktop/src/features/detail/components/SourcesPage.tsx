import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { client, endpoints } from '@/shared/api/client';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ResumeModal } from '@/shared/components/modals/ResumeModal';
import type { CatalogMeta, ContentType, Source } from '@/shared/types/index';
import { useLogStore } from '@/stores/logStore';
import { useProfileStore } from '@/stores/profileStore';
import { extractErrorMessage } from '@/shared/utils/error';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import { BestSourceCard, QualitySection } from './SourceCard';
import { SourcesSidebar } from './SourcesSidebar';
import { useSourceFiltering } from './useSourceFiltering';
import type { SourcesNavigationState } from './sourceUtils';

export default function SourcesPage() {
  const { id, type } = useParams<{ type: ContentType; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const normalizedType: ContentType | undefined = type === 'tv' ? 'series' : type;
  const seasonRaw  = Number(searchParams.get('season')  ?? '');
  const episodeRaw = Number(searchParams.get('episode') ?? '');
  const selectedSeason  = Number.isFinite(seasonRaw)  && seasonRaw  > 0 ? seasonRaw  : undefined;
  const selectedEpisode = Number.isFinite(episodeRaw) && episodeRaw > 0 ? episodeRaw : undefined;
  const initialMode = searchParams.get('mode');
  const navState = (location.state as SourcesNavigationState | null) ?? null;
  const fallbackPath = type && id ? `/detail/${type}/${id}` : '/';
  const returnPath = typeof navState?.returnTo === 'string' ? navState.returnTo : fallbackPath;
  const shouldReturn = navState?.fromDetail === true;
  const { addLog } = useLogStore();
  const { activeProfile } = useProfileStore();
  const { data: meta } = useQuery<CatalogMeta>({
    queryKey: ['catalogMeta', type, id],
    queryFn: () => endpoints.catalog.getMeta(type!, id!).then(r => r.data),
    enabled: !!type && !!id, staleTime: 5 * 60 * 1000,
  });
  const {
    sources, loading, fetchError, cachedAt, isStale, isForceRefresh,
    activeFilters, setActiveFilters, toggleFilter,
    sortBy, setSortBy, bestSource, sortedAndFiltered, groupedSections,
    handleRetry, handleForceRefresh,
  } = useSourceFiltering({ id, normalizedType, selectedSeason, selectedEpisode, meta });
  const titleText = meta?.title || meta?.name || 'Sources';
  const handleBack = () => { shouldReturn ? navigate(returnPath, { replace: true }) : navigate(-1); };
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{ streamUrl: string; resumeMs: number } | null>(null);

  const buildPlayerUrl = (streamUrl: string, startAt = 0) => {
    const poster = meta?.poster_path ? `${TMDB_IMAGE_BASE}w500${meta.poster_path}` : (meta?.poster ?? '');
    const rating = meta?.vote_average != null ? String(meta.vote_average.toFixed(1)) : '';
    const e = encodeURIComponent;
    return `/player?url=${e(streamUrl)}&title=${e(titleText)}&poster=${e(poster)}`
      + `&year=${e(meta?.year ?? meta?.releaseInfo ?? '')}&rating=${e(rating)}`
      + `&contentType=${e(normalizedType ?? '')}&contentId=${e(id ?? '')}`
      + (selectedSeason ? `&season=${e(String(selectedSeason))}` : '')
      + (selectedEpisode ? `&episode=${e(String(selectedEpisode))}` : '')
      + (shouldReturn ? `&returnTo=${e(returnPath)}` : '')
      + (startAt > 0 ? `&startAt=${e(String(startAt))}` : '');
  };

  const goToPlayer = (streamUrl: string, startAt = 0) => {
    const epTitle = selectedEpisode
      ? (meta?.episodes?.find(v => v.season === selectedSeason && v.episode === selectedEpisode)?.title ?? '') : '';
    navigate(buildPlayerUrl(streamUrl, startAt), {
      replace: true, state: { episodes: meta?.episodes ?? [], episodeTitle: epTitle },
    });
  };

  async function handlePlay(source: Source) {
    if (!source.magnet || launching) return;
    setLaunching(true); setLaunchError(null);
    try {
      const { data } = await client.post<{ stream_url: string }>('/debrid/unrestrict', {
        magnet: source.magnet, cached: source.cached_rd,
      });
      if (activeProfile && id) {
        try {
          const { data: pb } = await endpoints.playback.getPosition(id, activeProfile.id, selectedSeason, selectedEpisode);
          const rMs = pb?.positionMs ?? 0, dMs = pb?.durationMs ?? 0;
          const canResume = pb !== null && pb.watched !== true
            && rMs >= 30_000 && (dMs <= 0 || rMs < dMs - 15_000);
          if (canResume) { setResumePrompt({ streamUrl: data.stream_url, resumeMs: rMs }); setLaunching(false); return; }
        } catch (err: unknown) {
          addLog('warn', 'PLAYBACK', 'Resume unavailable', { err: extractErrorMessage(err) });
        }
      }
      goToPlayer(data.stream_url);
    } catch (err: unknown) {
      setLaunchError(extractErrorMessage(err, 'Debrid error')); setLaunching(false);
    }
  }

  const dlHandler = initialMode === 'download'
    ? (s: Source) => { if (s.magnet) window.electronAPI?.openExternal?.(s.magnet); } : undefined;

  return (
    <div className="fixed inset-0 bg-dp-bg text-dp-text flex flex-col z-50">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-[14px] px-[28px] py-[20px] border-b border-dp-text/5 shrink-0 bg-dp-nav">
        <div className="flex items-center gap-[14px]">
          <button onClick={handleBack} className="flex items-center gap-[6px] px-[14px] py-[8px] rounded-[8px] border border-white/15 bg-white/5 text-[#f9f9f9cc] text-[13px] font-[600] cursor-pointer whitespace-nowrap transition-colors hover:bg-white/10 hover:text-white">
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className="flex-1 text-[20px] font-[700] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {initialMode === 'download' ? `Download: ${titleText}` : titleText}
          </h1>
          <button onClick={() => navigate('/debug')} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Open debug console">
            <Bug size={18} />
          </button>
        </div>
      </header>
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-[14px]">
          <Spinner size={48} />
          <p className="text-white/50 text-[14px]">{isForceRefresh ? 'Searching for new sources...' : 'Searching for the best sources...'}</p>
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-[14px] text-center px-8">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-[22px] font-[700] m-0 text-red-400">Loading error</p>
          <p className="text-[14px] text-white/50 m-0 max-w-[400px] break-words">{fetchError}</p>
          <button onClick={handleRetry} className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[#0063e5] hover:bg-[#0483ee] text-white rounded-[6px] text-[14px] font-[600] transition-all mt-[8px]">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-[14px] text-center px-8">
          <p className="text-[22px] font-[700] m-0 text-white/50">No streams found</p>
          <p className="text-[14px] text-white/30 m-0 max-w-[320px]">This content is not available via Torrentio or Prowlarr.</p>
          <button onClick={handleForceRefresh} className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[#0063e5] hover:bg-[#0483ee] text-white rounded-[6px] text-[14px] font-[600] transition-all mt-[8px]">
            <RefreshCw size={16} /> Restart search
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <SourcesSidebar sortBy={sortBy} setSortBy={setSortBy} activeFilters={activeFilters}
            setActiveFilters={setActiveFilters} toggleFilter={toggleFilter}
            cachedAt={cachedAt} isStale={isStale} onForceRefresh={handleForceRefresh} />
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" style={{ padding: '20px 28px' }}>
            {sortedAndFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] gap-[14px] text-center">
                <p className="text-[22px] font-[700] m-0 text-white/50">No results for this filter</p>
                <p className="text-[14px] text-white/30 m-0 max-w-[320px]">Modify the filters on the left.</p>
                <button onClick={() => setActiveFilters(new Set())} className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[#0063e5] hover:bg-[#0483ee] text-white rounded-[6px] text-[14px] font-[600] transition-all mt-[8px]">
                  View all sources
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                  {sortedAndFiltered.length} source{sortedAndFiltered.length !== 1 ? 's' : ''}
                  {activeFilters.size > 0 ? ' filtered' : ' available'}
                </p>
                {bestSource && <BestSourceCard source={bestSource} onPlay={() => handlePlay(bestSource)} launching={launching} />}
                {groupedSections.map(s => (
                  <QualitySection key={s.key} label={s.label} Icon={s.Icon} color={s.color}
                    sources={s.sources} onPlay={handlePlay} onDownload={dlHandler} launching={launching} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {launchError && (
        <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 bg-red-900/90 text-dp-text px-[20px] py-[14px] rounded-[4px] border border-red-500 flex items-center gap-[12px] shadow-2xl z-50">
          <AlertTriangle size={18} />
          <span className="text-[14px] font-[600]">{launchError}</span>
          <button onClick={() => setLaunchError(null)} className="ml-[8px] px-[10px] py-[4px] bg-dp-text/20 hover:bg-dp-text/30 rounded-[4px] text-[12px] font-[700]">✕</button>
        </div>
      )}
      <ResumeModal
        isOpen={resumePrompt !== null}
        resumeTime={resumePrompt ? Math.floor(resumePrompt.resumeMs / 1000) : 0}
        onClose={() => setResumePrompt(null)}
        onRestart={() => { if (resumePrompt) { setResumePrompt(null); goToPlayer(resumePrompt.streamUrl, 0); } }}
        onResume={() => { if (resumePrompt) { setResumePrompt(null); goToPlayer(resumePrompt.streamUrl, Math.floor(resumePrompt.resumeMs / 1000)); } }}
      />
    </div>
  );
}
