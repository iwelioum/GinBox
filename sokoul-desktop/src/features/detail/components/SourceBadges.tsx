import { Zap, Languages, Globe } from 'lucide-react';
import type { Source } from '@/shared/types/index';
import type { TorrentMeta } from './sourceUtils';

/* ─── Badge styles (compiled once) ─── */

const BADGE_BASE = {
  display:       'inline-flex' as const,
  alignItems:    'center'      as const,
  gap:           3,
  borderRadius:  6,
  padding:       '2px 7px',
  fontSize:      10,
  fontWeight:    700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  whiteSpace:    'nowrap'    as const,
  lineHeight:    1.4,
} as const;

function mkBadge(bg: string, color: string, border: string) {
  return { ...BADGE_BASE, background: bg, color, border };
}

const BS = {
  rd:     mkBadge('rgba(34,197,94,0.18)',   '#22c55e', '1px solid rgba(34,197,94,0.35)'),
  hdr:    mkBadge('rgba(249,115,22,0.18)',  '#f97316', '1px solid rgba(249,115,22,0.35)'),
  dv:     mkBadge('rgba(168,85,247,0.18)',  '#a855f7', '1px solid rgba(168,85,247,0.35)'),
  hdr10:  mkBadge('rgba(245,158,11,0.18)',  '#f59e0b', '1px solid rgba(245,158,11,0.35)'),
  remux:  mkBadge('rgba(6,182,212,0.18)',   '#06b6d4', '1px solid rgba(6,182,212,0.35)'),
  bluray: mkBadge('rgba(59,130,246,0.18)',  '#3b82f6', '1px solid rgba(59,130,246,0.35)'),
  webdl:  mkBadge('rgba(148,163,184,0.18)', '#94a3b8', '1px solid rgba(148,163,184,0.35)'),
  webrip: mkBadge('rgba(100,116,139,0.18)', '#64748b', '1px solid rgba(100,116,139,0.35)'),
  hdtv:   mkBadge('rgba(107,114,128,0.18)', '#9ca3af', '1px solid rgba(107,114,128,0.35)'),
  fr:     mkBadge('rgba(99,102,241,0.18)',  '#818cf8', '1px solid rgba(99,102,241,0.35)'),
  multi:  mkBadge('rgba(251,191,36,0.18)',  '#fbbf24', '1px solid rgba(251,191,36,0.35)'),
  vo:     mkBadge('rgba(107,114,128,0.18)', '#9ca3af', '1px solid rgba(107,114,128,0.35)'),
};

/* ─── Small badge components ─── */

function FlagFR() {
  return (
    <svg width="14" height="10" viewBox="0 0 16 12" fill="none"
      style={{ borderRadius: 2, flexShrink: 0, display: 'block' }}>
      <rect width="16" height="12" rx="2" fill="#ED2939" />
      <rect width="10.67" height="12" fill="#fff" />
      <rect width="5.33"  height="12" fill="#002395" />
    </svg>
  );
}

function BadgeLang({ m }: { m: TorrentMeta }) {
  if (m.hasFrenchAudio) return <span style={BS.fr}><FlagFR /> VF</span>;
  if (m.hasSubFr)       return <span style={BS.fr}><FlagFR /> ST</span>;
  if (m.isMultiSuspect) return <span style={BS.multi}><Languages size={9} /> MULTI</span>;
  return <span style={BS.vo}><Globe size={9} /> VO</span>;
}

function BadgeHDR({ hdr }: { hdr: 'DV' | 'HDR10+' | 'HDR' }) {
  if (hdr === 'DV')     return <span style={BS.dv}>DV</span>;
  if (hdr === 'HDR10+') return <span style={BS.hdr10}>HDR10+</span>;
  return <span style={BS.hdr}>HDR</span>;
}

function BadgeVideoSrc({ title }: { title: string }) {
  const u = title.toUpperCase();
  if (u.includes('REMUX'))                                                    return <span style={BS.remux}>REMUX</span>;
  if (u.includes('WEB-DL') || u.includes('WEBDL'))                           return <span style={BS.webdl}>WEB-DL</span>;
  if (u.includes('BLURAY') || u.includes('BLU-RAY') || u.includes('BDRIP')) return <span style={BS.bluray}>BluRay</span>;
  if (u.includes('WEBRIP') || u.includes('WEB-RIP'))                         return <span style={BS.webrip}>WEBRip</span>;
  if (u.includes('HDTV'))                                                     return <span style={BS.hdtv}>HDTV</span>;
  return null;
}

/* ─── Composite badge row ─── */

export function SourceBadges({ meta, source }: { meta: TorrentMeta; source: Source }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
      {source.cached_rd && <span style={BS.rd}><Zap size={9} /> RD</span>}
      <BadgeLang m={meta} />
      {meta.hdr !== null && <BadgeHDR hdr={meta.hdr} />}
      <BadgeVideoSrc title={source.title} />
    </div>
  );
}
