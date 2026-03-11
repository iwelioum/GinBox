// sourcePanelHelpers.tsx — Presentational helpers for SourcePanel.
// Extracted to keep SourcePanel.tsx under 300 lines (AGENTS.md Rule 4).

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Source } from '@/shared/types/index';
import { parseTorrentName } from '@/shared/utils/parsing';

// ── Provider filter ────────────────────────────────────────────

export type ProviderFilter = 'all' | 'torrentio' | 'prowlarr' | 'wastream';

export const PROVIDER_TABS: { key: ProviderFilter; icon: string; label: string }[] = [
  { key: 'all',        icon: '',   label: 'All' },
  { key: 'torrentio',  icon: '⚡', label: 'Torrentio' },
  { key: 'prowlarr',   icon: '🔍', label: 'Prowlarr' },
  { key: 'wastream',   icon: '🌊', label: 'Wastream' },
];

// ── Release / codec detection ──────────────────────────────────

export type ReleaseType = 'REMUX' | 'WEB-DL' | 'BLURAY' | 'WEBRIP' | 'HDTV';

export function detectReleaseType(title: string): ReleaseType | null {
  const u = title.toUpperCase();
  if (u.includes('REMUX'))                                     return 'REMUX';
  if (u.includes('WEB-DL')   || u.includes('WEBDL'))          return 'WEB-DL';
  if (u.includes('BLURAY')   || u.includes('BLU-RAY') || u.includes('BDRIP')) return 'BLURAY';
  if (u.includes('WEBRIP')   || u.includes('WEB-RIP'))        return 'WEBRIP';
  if (u.includes('HDTV'))                                      return 'HDTV';
  return null;
}

export function getCodecLabel(codec: string): string | null {
  if (codec === 'x265') return 'H.265';
  if (codec === 'x264') return 'H.264';
  if (codec === 'AV1')  return 'AV1';
  return null;
}

export const RELEASE_CLASS: Record<ReleaseType, string> = {
  REMUX:    'bg-purple-900/60 text-purple-200',
  'WEB-DL': 'bg-blue-900/60 text-blue-200',
  BLURAY:   'bg-indigo-900/60 text-indigo-200',
  WEBRIP:   'bg-cyan-900/60 text-cyan-200',
  HDTV:     'bg-zinc-700 text-zinc-300',
};

const QUALITY_LABEL: Record<string, string> = {
  '4k': '4K', sd: 'Autres', unknown: 'Autres',
};

export function groupLabel(key: string): string {
  return QUALITY_LABEL[key] ?? key.toUpperCase();
}

export function sortGroup(sources: Source[]): Source[] {
  return [...sources].sort((a, b) => {
    if (a.cached_rd !== b.cached_rd) return a.cached_rd ? -1 : 1;
    const sd = (b.seeders ?? 0) - (a.seeders ?? 0);
    if (sd !== 0) return sd;
    return (b.size_gb ?? 0) - (a.size_gb ?? 0);
  });
}

// ── SubIcon ────────────────────────────────────────────────────

export const SubIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="inline-block">
    <rect x="1" y="3" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="3" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="3" y1="8" x2="7" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// ── SourceCard ─────────────────────────────────────────────────

export function SourceCard({
  source,
  current,
  disabled,
  onSelect,
}: {
  source: Source;
  current: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  const parsed      = useMemo(() => parseTorrentName(source.title), [source.title]);
  const releaseType = useMemo(() => detectReleaseType(source.title), [source.title]);
  const codecLabel  = useMemo(() => getCodecLabel(parsed.codec), [parsed.codec]);
  const isDDL       = source.source === 'wastream';

  const hasAnyMeta =
    releaseType !== null ||
    codecLabel !== null  ||
    parsed.hdr !== null  ||
    parsed.hasFrenchAudio ||
    parsed.hasSubFr      ||
    parsed.isMultiSuspect ||
    isDDL;

  const displayTitle = !hasAnyMeta && source.title.length > 40
    ? `${source.title.slice(0, 40)}…`
    : source.title;

  return (
    <button
      tabIndex={disabled ? -1 : 0}
      disabled={disabled}
      onClick={() => { if (!current) onSelect(); }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !current) {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={current}
      className={[
        'w-full text-left px-4 py-3 border-b border-white/[0.06]',
        'transition-colors duration-150',
        current
          ? 'bg-white/[0.10] border-l-2 border-l-blue-400/60'
          : 'hover:bg-white/[0.06]',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {/* Title */}
      <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed mb-2">
        {displayTitle}
      </p>

      {/* Row 1 — technical badges */}
      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        {source.cached_rd && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-300 font-medium">RD</span>
          </span>
        )}
        {releaseType && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RELEASE_CLASS[releaseType]}`}>
            {releaseType}
          </span>
        )}
        {codecLabel && (
          <span className="text-[10px] bg-zinc-700/50 text-zinc-400 px-1.5 py-0.5 rounded">
            {codecLabel}
          </span>
        )}
        {parsed.hdr === 'DV' && (
          <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">DV</span>
        )}
        {(parsed.hdr === 'HDR10+' || parsed.hdr === 'HDR') && (
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
            {parsed.hdr}
          </span>
        )}
        {isDDL && (
          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
            DDL
          </span>
        )}
      </div>

      {/* Row 2 — audio / language badges */}
      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        {parsed.isMultiSuspect ? (
          <>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded" title={t('player.audioFrench')}>FR</span>
            <span className="text-[10px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded" title={t('player.audioEnglish')}>EN</span>
          </>
        ) : parsed.hasFrenchAudio ? (
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded" title={t('player.audioFrench')}>FR</span>
        ) : parsed.hasSubFr ? (
          <span className="inline-flex items-center gap-0.5" title={t('player.voWithFrenchSubs')}>
            <span className="text-[10px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded">EN</span>
            <span className="text-white/30 text-[9px] mx-0.5">/</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              FR <SubIcon />
            </span>
          </span>
        ) : (
          <span className="text-[10px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded">EN</span>
        )}
      </div>

      {/* Row 3 — seeders + size */}
      <div className="flex items-center gap-3 text-[10px] text-white/30">
        {!isDDL && (
          <span className="flex items-center gap-1">
            <span>📶</span>
            {(source.seeders ?? 0) > 0 ? source.seeders : '—'}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span>💾</span>
          {(source.size_gb ?? 0) > 0 ? `${source.size_gb.toFixed(1)} GB` : '—'}
        </span>
      </div>
    </button>
  );
}
