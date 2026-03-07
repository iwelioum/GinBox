/**
 * Slide-in panel displaying available playback sources grouped by quality.
 * Allows the user to switch sources or refresh the list mid-playback.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ListVideo, RefreshCw, Wifi } from 'lucide-react';
import type { Source } from '../../../shared/types/index';
import { parseTorrentName } from '../../../shared/utils/parsing';

const SubIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="inline-block">
    <rect x="1" y="3" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="3" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="3" y1="8" x2="7" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

function AudioBadges({ title }: { title: string }) {
  const { t } = useTranslation();
  const parsed = parseTorrentName(title);
  if (parsed.isMultiSuspect) return (
    <>
      <span className="text-sm leading-none" title={t('player.audioFrench')}>FR</span>
      <span className="text-sm leading-none" title={t('player.audioEnglish')}>EN</span>
    </>
  );
  if (parsed.hasFrenchAudio) return (
    <span className="text-sm leading-none" title={t('player.audioFrench')}>FR</span>
  );
  if (parsed.hasSubFr) return (
    <span className="inline-flex items-center gap-0.5" title={t('player.voWithFrenchSubs')}>
      <span className="text-sm leading-none">EN</span>
      <span className="text-white/30 text-[9px] mx-0.5">/</span>
      <span className="text-sm leading-none">FR</span>
      <span className="text-white/30 ml-0.5"><SubIcon /></span>
    </span>
  );
  return null;
}

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
  return (
    <div
      className="absolute top-0 right-0 h-full w-[340px] z-40 bg-black/85 backdrop-blur-xl border-l border-white/10 flex flex-col"
      /* pointerEvents forced to auto — overlay is normally click-through */
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <span className="text-sm font-semibold text-white">{t('player.availableSources')}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshSources}
            disabled={refreshingSources || switchingSource}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-white/75 border border-white/15 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${refreshingSources ? 'animate-spin' : ''}`} />
            {refreshingSources ? t('player.refreshing') : t('player.refreshButton')}
          </button>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            X
          </button>
        </div>
      </div>

      {switchError && (
        <div className="px-4 py-3 text-[12px] text-red-300 border-b border-red-400/20 bg-red-900/20">
          {switchError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {groupedSources.map(([quality, qualitySources]) => (
          <div key={quality}>
            <div className="sticky top-0 px-4 py-1.5 bg-black/60 backdrop-blur-sm border-b border-white/[0.06] flex items-center gap-2">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{quality}</span>
              <span className="text-[10px] text-white/25">{qualitySources.length}</span>
            </div>
            {qualitySources.map((source, i) => (
              <button
                key={source.info_hash || source.title || i}
                disabled={switchingSource}
                onClick={() => onSwitchSource(source)}
                className={`w-full text-left px-4 py-2.5 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors duration-150 ${
                  isCurrent(source) ? 'bg-white/[0.08] border-l-2 border-l-blue-400/60' : ''
                } ${switchingSource ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-white/55 line-clamp-2 flex-1 leading-relaxed">{source.title}</p>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {source.cached_rd && (
                      <span className="text-[9px] text-green-400 bg-green-400/10 px-1 py-0.5 rounded border border-green-400/20 font-medium">RD</span>
                    )}
                    <AudioBadges title={source.title} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    {source.seeders}
                  </span>
                  <span>{t('sources.sizeDisplay', { size: source.size_gb.toFixed(1) })}</span>
                </div>
              </button>
            ))}
          </div>
        ))}

        {sources.length === 0 && (
          <div className="p-4 text-xs text-white/50">{t('player.noSourcesAvailable')}</div>
        )}
      </div>
    </div>
  );
}

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
