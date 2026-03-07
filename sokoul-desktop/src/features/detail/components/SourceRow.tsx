import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { Source } from '../../../shared/types/index';
import { Play, Download, Zap, Volume2, MessageSquare, AlertTriangle } from 'lucide-react';
import { parseTorrentName } from '../../../shared/utils/parsing';

interface SourceRowProps {
  source: Source;
  onPlay: () => void;
  onDownload?: () => void;
}

export function SourceRow({ source, onPlay, onDownload }: SourceRowProps) {
  const { t } = useTranslation();
  const meta = parseTorrentName(source.title);
  const badgeStyle = "flex items-center gap-1.5 px-[7px] py-[3px] rounded-[4px] text-[11px] font-[800] whitespace-nowrap";

  return (
    <div className="flex items-center justify-between gap-[12px] w-full px-[16px] py-[14px] rounded-[10px] border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-150 group">
      
      {/* Badges Container */}
      <div className="flex items-center gap-[6px] shrink-0">
        {meta.hasFrenchAudio && (
          <span className={`${badgeStyle} bg-green-600 text-white`}>
            <Volume2 size={12} strokeWidth={3} /> FR
          </span>
        )}
        {meta.hasSubFr && (
          <span className={`${badgeStyle} bg-gray-600 text-gray-300`}>
            <MessageSquare size={12} strokeWidth={3} /> FR
          </span>
        )}
        {meta.isMultiSuspect && (
          <span title={t('detail.frAudioUnconfirmed')} className={`${badgeStyle} bg-orange-600 text-white`}>
            <AlertTriangle size={12} strokeWidth={3} /> MULTI
          </span>
        )}
        {meta.quality === '2160p' && <span className={`${badgeStyle} bg-purple-700 text-white`}>2160p</span>}
        {meta.quality === '1080p' && <span className={`${badgeStyle} bg-blue-700 text-white`}>1080p</span>}
        {meta.hdr === 'DV' && <span className={`${badgeStyle} bg-pink-700 text-white`}>DV</span>}
        {meta.hdr === 'HDR10+' && <span className={`${badgeStyle} bg-amber-600 text-white`}>HDR10+</span>}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] text-white/90 truncate font-medium block">
          {source.title}
        </span>
      </div>

      {/* Metadata */}
      <div className="hidden sm:flex items-center gap-[16px] shrink-0">
        {source.cached_rd ? (
          <span className="flex items-center gap-[4px] text-[12px] font-[700] text-[#34D399]">
            <Zap size={14} className="fill-current" /> RD Cache
          </span>
        ) : (
          <span className="text-[12px] text-white/30 font-medium">Non-cache</span>
        )}
        
        <span className="text-[13px] text-white/50 w-[60px] text-right font-mono">
          {source.size_gb.toFixed(1)} GB
        </span>
        
        <span className="text-[13px] text-white/50 w-[50px] text-right flex items-center justify-end gap-[4px]">
          {source.seeders}S
        </span>
        
        <span className="text-[12px] text-white/30 uppercase w-[70px] text-right">
          {source.source}
        </span>
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
          >
            <Download size={18} />
          </button>
        )}
      </div>

    </div>
  );
}
