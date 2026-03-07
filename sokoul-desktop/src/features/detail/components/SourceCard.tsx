import { useState } from 'react';
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
  const meta  = parseTorrentName(source.title);
  const label = cleanTitle(source.title, meta);
  const ok    = source.playable;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={ok && !launching ? onPlay : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        borderLeft:  hovered && ok ? '2px solid rgba(255,255,255,0.28)' : '2px solid transparent',
        background:  hovered && ok ? 'rgba(255,255,255,0.04)' : 'transparent',
        cursor:      !ok ? 'not-allowed' : launching ? 'wait' : 'pointer',
        opacity:     ok ? 1 : 0.45,
        transition:  'background 0.15s ease, border-color 0.15s ease',
        userSelect:  'none',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 13, fontWeight: hovered && ok ? 600 : 500, color: 'rgba(249,249,249,0.92)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'font-weight 0.1s',
        }}>
          {label}
        </span>
        <SourceBadges meta={meta} source={source} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {source.size_gb > 0 && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(249,249,249,0.55)', whiteSpace: 'nowrap' }}>
              {source.size_gb.toFixed(1)} Go
            </span>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10 }}>·</span>
          </>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: 'rgba(249,249,249,0.45)', whiteSpace: 'nowrap' }}>
          <Zap size={10} /> {source.seeders}
        </span>
        {onDownload && (
          <button
            onClick={e => { e.stopPropagation(); onDownload(); }}
            title="Download"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', padding: '2px 4px',
              display: 'flex', alignItems: 'center', transition: 'color 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
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
  const m = parseTorrentName(source.title);
  const t = cleanTitle(source.title, m);
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(249,249,249,0.3)' }}>
          Best available source
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(249,249,249,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t}
        </span>
        <SourceBadges meta={m} source={source} />
      </div>
      <button
        onClick={onPlay} disabled={launching}
        style={{
          flexShrink: 0, padding: '9px 20px', borderRadius: 8,
          background: '#fff', color: '#000', border: 'none',
          fontSize: 13, fontWeight: 700,
          cursor: launching ? 'wait' : 'pointer',
          opacity: launching ? 0.7 : 1, transition: 'opacity 0.15s',
        }}
      >
        ▶ Play
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
  if (sources.length === 0) return null;
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingBottom: 8, marginBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Icon size={12} style={{ color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(249,249,249,0.4)' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(249,249,249,0.22)' }}>
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
