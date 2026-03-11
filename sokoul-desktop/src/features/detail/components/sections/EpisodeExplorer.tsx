import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import type { UseDetailDataResult } from '../../hooks/useDetailData';
import type { EpisodeVideo } from '@/shared/types/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRuntime(minutes?: number): string {
  if (!minutes) return '';
  return `${minutes} min`;
}

// ── Season Dropdown ───────────────────────────────────────────────────────────

interface SeasonDropdownProps {
  seasons: number[];
  selectedSeason: number;
  seasonEpisodeCounts: Map<number, number>;
  onSelect: (season: number) => void;
}

function SeasonDropdown({ seasons, selectedSeason, seasonEpisodeCounts, onSelect }: SeasonDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = useCallback((s: number) => {
    onSelect(s);
    setIsOpen(false);
  }, [onSelect]);

  if (seasons.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-200"
        style={{
          borderColor: 'var(--color-border-medium)',
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-primary)',
        }}
      >
        Saison {selectedSeason}
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            aria-label="Sélectionner une saison"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full right-0 mt-1 min-w-[240px] rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-medium)',
              boxShadow: 'var(--depth-elevated)',
            }}
          >
            {seasons.map((s, i) => {
              const count = seasonEpisodeCounts.get(s) ?? 0;
              const isActive = s === selectedSeason;
              return (
                <div key={s}>
                  {i > 0 && (
                    <hr
                      className="mx-4"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  )}
                  <div
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(s)}
                    className="px-5 py-4 cursor-pointer flex justify-between items-center transition-colors duration-150"
                    style={isActive ? { color: 'var(--color-accent)' } : { color: 'var(--color-text-primary)' }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-glass)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '';
                    }}
                  >
                    <span className="text-sm font-semibold">Saison {s}</span>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {count} épisode{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
            <hr className="mx-4" style={{ borderColor: 'var(--color-border)' }} />
            <div
              className="py-4 text-sm font-medium text-center cursor-pointer"
              style={{ color: 'var(--color-accent)' }}
              onClick={() => setIsOpen(false)}
            >
              Voir tous les épisodes
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Episode Row ───────────────────────────────────────────────────────────────

interface EpisodeRowProps {
  ep: EpisodeVideo;
  progressPct?: number;
  onWatch: () => void;
}

function EpisodeRow({ ep, progressPct, onWatch }: EpisodeRowProps) {
  const runtime = formatRuntime(ep.runtime);
  const thumbSrc = ep.still_path ? buildTmdbImageUrl(ep.still_path, 'w300') ?? undefined : undefined;

  return (
    <div
      className="group flex items-start gap-4 px-4 py-4 rounded-xl cursor-pointer transition-colors duration-200"
      onClick={onWatch}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onWatch(); }}
      aria-label={ep.title || `Episode ${ep.episode}`}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-glass)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      {/* [1] Episode number */}
      <div
        className="w-8 flex-shrink-0 text-lg font-medium text-center mt-1"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {ep.episode}
      </div>

      {/* [2] Thumbnail */}
      <div className="w-[200px] flex-shrink-0 aspect-video rounded-lg overflow-hidden relative group/thumb">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'var(--color-bg-overlay)' }} />
        )}

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <Play size={14} fill="white" color="white" />
          </div>
        </div>

        {/* Progress bar */}
        {progressPct !== undefined && progressPct > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: 'var(--color-border)' }}
          >
            <div
              className="h-full"
              style={{
                width: `${Math.min(progressPct, 100)}%`,
                background: 'var(--color-accent)',
              }}
            />
          </div>
        )}
      </div>

      {/* [3] Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          <h4
            className="text-sm font-semibold line-clamp-1 transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {ep.title || `Episode ${ep.episode}`}
          </h4>
          {runtime && (
            <span className="text-sm flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
              {runtime}
            </span>
          )}
        </div>
        {ep.overview && (
          <p
            className="text-sm line-clamp-3 leading-6 mt-1.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {ep.overview}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Virtualized Episode List ──────────────────────────────────────────────────

const VIRTUAL_THRESHOLD = 24;
const ESTIMATED_ROW_HEIGHT = 120;

interface EpisodeListProps {
  episodes: EpisodeVideo[];
  getEpisodeProgress: UseDetailDataResult['getEpisodeProgress'];
  onWatchEpisode: (season: number, episode: number, resumeAt?: number) => void;
}

function EpisodeList({ episodes, getEpisodeProgress, onWatchEpisode }: EpisodeListProps) {
  const useVirtual = episodes.length > VIRTUAL_THRESHOLD;
  const listRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: episodes.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT + 8,
    overscan: 4,
    enabled: useVirtual,
  });

  if (!useVirtual) {
    return (
      <div className="flex flex-col">
        {episodes.map(ep => {
          const prog = getEpisodeProgress(ep.season, ep.episode);
          return (
            <EpisodeRow
              key={`${ep.season}-${ep.episode}`}
              ep={ep}
              progressPct={prog?.progressPct}
              onWatch={() => onWatchEpisode(ep.season ?? 1, ep.episode ?? 1, prog?.positionMs)}
            />
          );
        })}
      </div>
    );
  }

  const totalHeight = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={listRef}
      className="overflow-y-auto scrollbar-hide"
      style={{ maxHeight: '640px' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {virtualItems.map(virtualRow => {
          const ep = episodes[virtualRow.index];
          const prog = getEpisodeProgress(ep.season, ep.episode);
          return (
            <div
              key={`${ep.season}-${ep.episode}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: '8px',
              }}
            >
              <EpisodeRow
                ep={ep}
                progressPct={prog?.progressPct}
                onWatch={() => onWatchEpisode(ep.season ?? 1, ep.episode ?? 1, prog?.positionMs)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface EpisodeExplorerProps {
  data: UseDetailDataResult;
  onWatchEpisode: (season: number, episode: number, resumeAt?: number) => void;
}

export function EpisodeExplorer({ data, onWatchEpisode }: EpisodeExplorerProps) {
  const {
    seasons, selectedSeason, setSelectedSeason, setSelectedEpisode,
    episodesOfSeason, getEpisodeProgress, isSeries,
  } = data;

  const seasonEpisodeCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const s of seasons) {
      counts.set(s, (data.episodeVideos ?? []).filter(v => v.season === s).length);
    }
    return counts;
  }, [seasons, data.episodeVideos]);

  const handleSelectSeason = useCallback((s: number) => {
    setSelectedSeason(s);
    setSelectedEpisode(1);
  }, [setSelectedSeason, setSelectedEpisode]);

  if (!isSeries || seasons.length === 0) return null;

  return (
    <section className="px-8 py-12">
      {/* Header row */}
      <div className="flex justify-between items-center mb-6">
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Episodes
        </h2>
        <SeasonDropdown
          seasons={seasons}
          selectedSeason={selectedSeason}
          seasonEpisodeCounts={seasonEpisodeCounts}
          onSelect={handleSelectSeason}
        />
      </div>

      {/* Episode list — animated on season change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSeason}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
          exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
        >
          <EpisodeList
            episodes={episodesOfSeason}
            getEpisodeProgress={getEpisodeProgress}
            onWatchEpisode={onWatchEpisode}
          />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
