import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { parseTorrentName } from '@/shared/utils/parsing';
import type { Source } from '@/shared/types/index';
import { cleanTitle } from './sourceUtils';
import { SourceBadges } from './SourceBadges';

/* ─── Exported components ─── */

export function InlineSourceRow({
  source, onPlay, onDownload, launching,
}: {
  source: Source; onPlay: () => void; onDownload?: () => void; launching: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();
  const meta  = useMemo(() => parseTorrentName(source.title), [source.title]);
  const label = useMemo(() => cleanTitle(source.title, meta), [source.title, meta]);
  const ok    = source.playable;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={ok && !launching ? onPlay : undefined}
      className={[
        'flex items-center gap-2.5 px-3 py-2.5 select-none',
        'transition-[background,border-color] duration-[var(--transition-fast)]',
        !ok ? 'cursor-not-allowed opacity-45' : launching ? 'cursor-wait' : 'cursor-pointer',
        hovered && ok
          ? 'border-l-2 border-l-white/[0.28] bg-[var(--color-white-4)]'
          : 'border-l-2 border-l-transparent bg-transparent',
      ].join(' ')}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className={[
          'text-sm text-white/[0.92] truncate transition-[font-weight] duration-100',
          hovered && ok ? 'font-semibold' : 'font-medium',
        ].join(' ')}>
          {label}
        </span>
        <SourceBadges meta={meta} source={source} />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {source.size_gb > 0 && (
          <>
            <span className="text-xs font-semibold text-white/[0.55] whitespace-nowrap">
              {t('sources.sizeDisplay', { size: source.size_gb.toFixed(1) })}
            </span>
            <span className="text-[var(--color-white-20)] text-xs">·</span>
          </>
        )}
        <span className="flex items-center gap-[3px] text-xs font-semibold text-white/45 whitespace-nowrap">
          <Zap size={10} /> {source.seeders}
        </span>
        {onDownload && (
          <button
            onClick={e => { e.stopPropagation(); onDownload(); }}
            title={t('common.download')}
            className="bg-transparent border-none cursor-pointer text-white/[0.35] px-1 py-0.5
                       flex items-center transition-colors duration-[120ms]
                       hover:text-white/70"
          >
            <Download size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

export function BestSourceCard({
  source, onPlay, launching,
}: { source: Source; onPlay: () => void; launching: boolean }) {
  const m = useMemo(() => parseTorrentName(source.title), [source.title]);
  const tLabel = useMemo(() => cleanTitle(source.title, m), [source.title, m]);
  const { t } = useTranslation();
  return (
    <div className="p-3.5 px-4 rounded-[var(--radius-lg)] border border-[var(--color-white-12)]
                    bg-white/5 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/30">
          {t('sources.bestAvailableSource')}
        </span>
        <span className="text-sm font-medium text-white/[0.88] truncate">
          {tLabel}
        </span>
        <SourceBadges meta={m} source={source} />
      </div>
      <button
        onClick={onPlay} disabled={launching}
        className={[
          'shrink-0 px-5 py-[9px] rounded-[var(--radius-card)] bg-white text-black',
          'border-none text-sm font-bold transition-opacity duration-[var(--transition-fast)]',
          launching ? 'cursor-wait opacity-70' : 'cursor-pointer opacity-100',
        ].join(' ')}
      >
        {t('sources.play')}
      </button>
    </div>
  );
}

export function QualitySection({
  label, Icon, color, sources, onPlay, onDownload, launching,
}: {
  label: string; Icon: LucideIcon; color: string; sources: Source[];
  onPlay: (s: Source) => void; onDownload?: (s: Source) => void; launching: boolean;
}) {
  const { t } = useTranslation();
  if (sources.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 pb-2 mb-1 border-b border-[var(--color-border)]">
        <Icon size={12} style={{ color }} className="shrink-0" />
        <span className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-white/40">
          {t(label)}
        </span>
        <span className="text-xs font-bold text-white/[0.22]">
          ({sources.length})
        </span>
      </div>
      <div>
        {sources.map(s => (
          <InlineSourceRow
            key={s.info_hash || s.magnet}
            source={s} onPlay={() => onPlay(s)}
            onDownload={onDownload ? () => onDownload(s) : undefined}
            launching={launching}
          />
        ))}
      </div>
    </div>
  );
}
