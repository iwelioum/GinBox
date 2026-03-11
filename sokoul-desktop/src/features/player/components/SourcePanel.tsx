/**
 * Slide-in panel displaying available playback sources grouped by quality.
 * Allows the user to switch sources or refresh the list mid-playback.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, ListVideo } from 'lucide-react';
import type { Source } from '@/shared/types/index';
import {
  ProviderFilter, PROVIDER_TABS,
  groupLabel, sortGroup,
  SourceCard,
} from './sourcePanelHelpers';

// ── SourcePanel ────────────────────────────────────────────────

interface SourcePanelProps {
  sources:            Source[];
  groupedSources:     [string, Source[]][];
  switchingSource:    boolean;
  refreshingSources:  boolean;
  switchError:        string | null;
  isCurrent:          (source: Source) => boolean;
  onSwitchSource:     (source: Source) => void;
  onRefreshSources:   () => void;
  onClose:            () => void;
}

export function SourcePanel({
  sources,
  groupedSources,
  switchingSource,
  refreshingSources,
  switchError,
  isCurrent,
  onSwitchSource,
  onRefreshSources,
  onClose,
}: SourcePanelProps) {
  const { t } = useTranslation();

  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');

  // Only the first non-empty group is open on mount
  const [openGroup, setOpenGroup] = useState<string>(
    () => groupedSources.find(([, s]) => s.length > 0)?.[0] ?? ''
  );

  const toggleGroup = useCallback((key: string) => {
    setOpenGroup(prev => (prev === key ? '' : key));
  }, []);

  // Filter groups by selected provider
  const filteredGroups = useMemo(() => {
    if (providerFilter === 'all') return groupedSources;
    return groupedSources.map(([key, srcs]) => [
      key,
      srcs.filter(s => s.source === providerFilter),
    ] as [string, Source[]]);
  }, [groupedSources, providerFilter]);

  // Count sources per provider for tab badges
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sources.length };
    for (const s of sources) counts[s.source] = (counts[s.source] ?? 0) + 1;
    return counts;
  }, [sources]);

  return (
    <div
      className="absolute top-0 right-0 h-full min-w-[400px] max-w-[480px] z-40 bg-black/85 backdrop-blur-xl border-l border-white/10 flex flex-col"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <span className="text-sm font-semibold text-white">{t('player.availableSources')}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshSources}
            disabled={refreshingSources || switchingSource}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] text-white/75 border border-white/15 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${refreshingSources ? 'animate-spin' : ''}`} />
            {refreshingSources ? t('player.refreshing') : t('player.refreshButton')}
          </button>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            ✕
          </button>
        </div>
      </div>

      {/* Error banner */}
      {switchError && (
        <div className="px-4 py-3 text-[13px] text-red-300 border-b border-red-400/20 bg-red-900/20">
          {switchError}
        </div>
      )}

      {/* Provider filter tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] overflow-x-auto scrollbar-none">
        {PROVIDER_TABS.map(tab => {
          const count = providerCounts[tab.key] ?? 0;
          if (tab.key !== 'all' && count === 0) return null;
          const active = providerFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setProviderFilter(tab.key)}
              className={[
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5',
              ].join(' ')}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              <span className="text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {filteredGroups.map(([quality, qualitySources]) => {
          if (qualitySources.length === 0) return null;

          const isOpen    = openGroup === quality;
          const hasCached = qualitySources.some(s => s.cached_rd);
          const sorted    = sortGroup(qualitySources);

          return (
            <div key={quality}>
              {/* Group header button */}
              <button
                aria-expanded={isOpen}
                aria-controls={`group-${quality}`}
                onClick={() => toggleGroup(quality)}
                className="sticky top-0 w-full px-4 py-2 bg-black/70 backdrop-blur-sm border-b border-white/[0.06] flex items-center gap-2 hover:bg-white/[0.04] transition-colors"
              >
                <span className="flex-1 text-left flex items-center gap-2 text-[13px] font-bold text-white/60 uppercase tracking-wider">
                  {groupLabel(quality)}
                  <span className="text-white/25 font-normal">·</span>
                  <span className="text-white/35 font-normal">{qualitySources.length}</span>
                  {hasCached && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </span>
                <span className="text-white/30 text-xs">{isOpen ? '▼' : '▶'}</span>
              </button>

              {/* Accordion body — CSS grid rows animation, no arbitrary max-h */}
              <div
                id={`group-${quality}`}
                role="region"
                className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  {sorted.map((source, i) => (
                    <SourceCard
                      key={source.info_hash || source.title || i}
                      source={source}
                      current={isCurrent(source)}
                      disabled={switchingSource}
                      onSelect={() => onSwitchSource(source)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {sources.length === 0 && (
          <div className="p-4 text-xs text-white/50">{t('player.noSourcesAvailable')}</div>
        )}
      </div>
    </div>
  );
}

// ── SourceButton (unchanged) ───────────────────────────────────

interface SourceButtonProps {
  sourceCount: number;
  onClick:     () => void;
}

/** Floating button in overlay top-right corner to open the source panel */
export function SourceButton({ sourceCount, onClick }: SourceButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/15 text-white/70 text-xs font-medium hover:bg-black/70 hover:text-white transition-all duration-200"
      style={{ pointerEvents: 'auto' }}
    >
      <ListVideo className="w-4 h-4" />
      {t('player.sourcesButton')}
      <span className="text-white/35">({sourceCount})</span>
    </button>
  );
}
