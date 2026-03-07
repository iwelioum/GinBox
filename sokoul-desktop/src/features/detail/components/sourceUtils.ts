import { Sparkles, Monitor, Tv, Film, type LucideIcon } from 'lucide-react';
import { parseTorrentName } from '@/shared/utils/parsing';

/* ─── Types ─── */

export interface RefreshState { counter: number; force: boolean }
export interface SourcesNavigationState { fromDetail?: boolean; returnTo?: string }
export type TorrentMeta = ReturnType<typeof parseTorrentName>;
export type SortKey = 'score' | 'quality' | 'seeders' | 'size';

/* ─── Module-level regex (compiled once, never per render) ─── */

const SE_RE         = /[Ss](\d{1,2})[Ee](\d{1,2})/;
const TEAM_RE       = /-([A-Za-z0-9]{2,20})(?:\.\w{2,4})?$/;
const CODEC_NAME_RE = /^(x265|x264|hevc|avc|h265|h264|av1|265|264)$/i;
const STRIP_QUALITY  = /\b(2160p|4k|uhd|1080p|720p|480p)\b/gi;
const STRIP_LANG     = /\b(multi|french|vff|truefrench|vostfr|subfrench)\b/gi;
const STRIP_SOURCE   = /\b(remux|web-dl|webdl|bluray|bdrip|webrip|hdtv)\b/gi;
const STRIP_CODEC    = /\b(x265|hevc|h265|x264|avc|h264|av1)\b/gi;
const STRIP_HDR      = /\b(hdr10\+?|hdr|dv)\b/gi;
const STRIP_YEAR_BRK = /\[\d{4}\]/g;
const STRIP_BRACKET  = /\[[^\]]*\]/g;
const STRIP_SEP      = /[.\-_]+/g;
const STRIP_WS       = /\s+/g;

/* ─── Utilities ─── */

export function formatCacheAge(cachedAt: number): string {
  const age = Math.floor(Date.now() / 1000) - cachedAt;
  if (age < 60)     return 'just now';
  if (age < 3600)   return `${Math.floor(age / 60)} min ago`;
  if (age < 86_400) return `${Math.floor(age / 3600)}h ago`;
  return `${Math.floor(age / 86_400)}d ago`;
}

export function cleanTitle(raw: string, meta: TorrentMeta): string {
  const u = raw.toUpperCase();
  const parts: string[] = [];

  const seMatch = raw.match(SE_RE);
  if (seMatch) parts.push(`S${seMatch[1].padStart(2, '0')}E${seMatch[2].padStart(2, '0')}`);

  if      (u.includes('REMUX'))                                                   parts.push('Remux');
  else if (u.includes('WEB-DL') || u.includes('WEBDL'))                          parts.push('WEB-DL');
  else if (u.includes('BLURAY') || u.includes('BLU-RAY') || u.includes('BDRIP')) parts.push('BluRay');
  else if (u.includes('WEBRIP') || u.includes('WEB-RIP'))                        parts.push('WEBRip');
  else if (u.includes('HDTV'))                                                    parts.push('HDTV');

  if      (meta.hdr === 'DV')     parts.push('DV');
  else if (meta.hdr === 'HDR10+') parts.push('HDR10+');
  else if (meta.hdr === 'HDR')    parts.push('HDR');

  const teamMatch = raw.match(TEAM_RE);
  if (teamMatch?.[1] && !CODEC_NAME_RE.test(teamMatch[1])) {
    parts.push(teamMatch[1]);
  }

  if (parts.length > 0) return parts.join(' · ');

  return raw
    .replace(STRIP_QUALITY, '').replace(STRIP_LANG, '')
    .replace(STRIP_SOURCE, '').replace(STRIP_CODEC, '')
    .replace(STRIP_HDR, '')
    .replace(STRIP_YEAR_BRK, '').replace(STRIP_BRACKET, '')
    .replace(STRIP_SEP, ' ').replace(STRIP_WS, ' ').trim() || raw;
}

/* ─── Constants ─── */

export const QUALITY_SECTIONS = [
  { key: '4k',    label: '4K Ultra HD', Icon: Sparkles as LucideIcon, color: '#f59e0b' },
  { key: '1080p', label: 'Full HD',     Icon: Monitor  as LucideIcon, color: '#3b82f6' },
  { key: '720p',  label: 'HD',          Icon: Tv       as LucideIcon, color: '#22c55e' },
  { key: 'sd',    label: 'Standard',    Icon: Film     as LucideIcon, color: '#6b7280' },
] as const;

export const FILTER_GROUPS = [
  { label: 'Quality', tags: ['4K/2160p', '1080p', '720p', 'SD']       },
  { label: 'Audio',   tags: ['VF/FR', 'VOSTFR', 'VO', 'Multi']        },
  { label: 'Codec',   tags: ['HEVC/x265', 'AVC/x264', 'AV1', 'Remux'] },
  { label: 'Source',  tags: ['BluRay', 'WEB-DL', 'WEBRip', 'HDTV']    },
] as const;

export const SORT_LABELS: [SortKey, string][] = [
  ['score', 'Relevance'], ['quality', 'Quality'],
  ['seeders', 'Seeds'],   ['size', 'Size'],
];

export const QUALITY_ORDER: Record<string, number> = {
  '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'unknown': 0,
};

/* ─── Derived types & helpers ─── */

export type QKey = typeof QUALITY_SECTIONS[number]['key'];
export type FilterTag = typeof FILTER_GROUPS[number]['tags'][number];

export function getQKey(m: TorrentMeta): QKey {
  if (m.quality === '2160p') return '4k';
  if (m.quality === '1080p') return '1080p';
  if (m.quality === '720p')  return '720p';
  return 'sd';
}

export function matchFilter(tag: FilterTag, m: TorrentMeta, u: string): boolean {
  switch (tag) {
    case '4K/2160p':  return m.quality === '2160p';
    case '1080p':     return m.quality === '1080p';
    case '720p':      return m.quality === '720p';
    case 'SD':        return m.quality === '480p' || m.quality === 'unknown';
    case 'VF/FR':     return m.hasFrenchAudio;
    case 'VOSTFR':    return m.hasSubFr;
    case 'VO':        return !m.hasFrenchAudio && !m.hasSubFr && !m.isMultiSuspect;
    case 'Multi':     return m.isMultiSuspect;
    case 'HEVC/x265': return m.codec === 'x265';
    case 'AVC/x264':  return m.codec === 'x264';
    case 'AV1':       return m.codec === 'AV1';
    case 'Remux':     return u.includes('REMUX');
    case 'BluRay':    return u.includes('BLURAY') || u.includes('BLU-RAY') || u.includes('BDRIP');
    case 'WEB-DL':    return u.includes('WEB-DL') || u.includes('WEBDL');
    case 'WEBRip':    return u.includes('WEBRIP') || u.includes('WEB-RIP');
    case 'HDTV':      return u.includes('HDTV');
  }
}
