import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Source } from '@/shared/types/index';
import { Play, Download } from 'lucide-react';
import { parseTorrentName } from '@/shared/utils/parsing';
import { SourceBadges } from './SourceBadges';

function ProviderBadge({ provider }: { provider: string }) {
  const config: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    torrentio: { bg: '#1a1a2e', color: '#7c6aff', label: 'Torrentio', icon: '⚡' },
    prowlarr:  { bg: '#1a2a1a', color: '#4ade80', label: 'Prowlarr',  icon: '🔍' },
    wastream:  { bg: '#2a1a10', color: '#fb923c', label: 'Wastream',  icon: '🌊' },
  };
  const c = config[provider] ?? { bg: '#1a1a1a', color: '#6b7280', label: provider || 'Unknown', icon: '?' };
  return (
    <span
      style={{ background: c.bg, color: c.color }}
      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
    >
      {c.icon} {c.label}
    </span>
  );
}

interface SourceRowProps {
  source: Source;
  onPlay: () => void;
  onDownload?: () => void;
}

export function SourceRow({ source, onPlay, onDownload }: SourceRowProps) {
  const { t } = useTranslation();
  const meta = useMemo(() => parseTorrentName(source.title), [source.title]);

  return (
    <div className="flex items-center justify-between gap-[12px] w-full px-[16px] py-[14px] rounded-[10px] border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-150 group">
      
      <SourceBadges meta={meta} source={source} />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] text-white/90 truncate font-medium block">
          {source.title}
        </span>
      </div>

      {/* Metadata */}
      <div className="hidden sm:flex items-center gap-[16px] shrink-0">
        <span className="text-[13px] text-white/50 w-[60px] text-right font-mono">
          {source.size_gb.toFixed(1)} GB
        </span>
        
        <span className="text-[13px] text-white/50 w-[50px] text-right flex items-center justify-end gap-[4px]">
          {source.seeders}S
        </span>
        
        <ProviderBadge provider={source.source} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[8px] shrink-0">
        <button
          className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-white/10 hover:bg-[#0063e5] hover:text-white text-white/70 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          title={t('detail.startPlayback')}
          aria-label={t('detail.startPlayback')}
        >
          <Play size={18} className="fill-current ml-0.5" />
        </button>

        {onDownload && (
          <button
            className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            title={t('detail.downloadRealDebrid')}
            aria-label={t('detail.downloadRealDebrid')}
          >
            <Download size={18} />
          </button>
        )}
      </div>

    </div>
  );
}
