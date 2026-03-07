import type { Source } from '../types/index';
import type { StreamPreferences } from '@/stores/preferencesStore';

/**
 * Metadata extracted from a torrent file name.
 */
export interface TorrentMeta {
  quality: '2160p' | '1080p' | '720p' | '480p' | 'unknown';
  hdr: 'DV' | 'HDR10+' | 'HDR' | null;
  hasFrenchAudio: boolean;
  hasSubFr: boolean;
  isMultiSuspect: boolean;
  codec: string;
  source: string;
}

/**
 * Parses a torrent file name to extract quality, language,
 * codec, etc. metadata following a set of precise rules.
 *
 * @param name The torrent file name.
 * @returns A TorrentMeta object with the extracted information.
 */
export function parseTorrentName(name: string): TorrentMeta {
  const upperName = name.toUpperCase();
  const lowerName = name.toLowerCase();

  // 1. Quality
  let quality: TorrentMeta['quality'] = 'unknown';
  if (upperName.includes('2160P') || upperName.includes('4K')) quality = '2160p';
  else if (upperName.includes('1080P')) quality = '1080p';
  else if (upperName.includes('720P')) quality = '720p';
  else if (upperName.includes('480P')) quality = '480p';

  // 2. HDR
  let hdr: TorrentMeta['hdr'] = null;
  if (upperName.includes('DOLBY.VISION') || /\bDV\b/.test(upperName)) hdr = 'DV';
  else if (upperName.includes('HDR10+')) hdr = 'HDR10+';
  else if (/\bHDR\b/.test(upperName) && !upperName.includes('SDR')) hdr = 'HDR';

  // 3. French language (FR) detection following specified rules and order
  let hasFrenchAudio = false;
  let hasSubFr = false;
  let isMultiSuspect = false;
  
  // Rule 1: Highest priority for confirmed French audio
  if (upperName.includes('TRUEFRENCH') || upperName.includes('VFF')) {
    hasFrenchAudio = true;
  }
  // Rule 5: VOSTFR/SUBFRENCH indicates subtitles, and overrides other generic FR audio tags
  else if (upperName.includes('VOSTFR') || upperName.includes('SUBFRENCH')) {
    hasSubFr = true;
    hasFrenchAudio = false; // As per the rule
  }
  // Rule 2 & 3: Standard French audio tags (including MULTI+VF/FRENCH case)
  else if (upperName.includes('FRENCH') || upperName.includes('.VF.') || upperName.includes('-VF-') || upperName.includes('_VF_')) {
    hasFrenchAudio = true;
  }
  // Rule 4: MULTI "alone" (i.e. without another FR audio tag detected by previous rules)
  else if (upperName.includes('MULTI')) {
    isMultiSuspect = true;
    hasFrenchAudio = false; // As per the rule
  }

  // 4. Codec
  let codec = 'unknown';
  const codecMatch = lowerName.match(/x265|hevc|h265|x264|avc|h264|av1/);
  if (codecMatch) {
    const found = codecMatch[0];
    if (['x265', 'hevc', 'h265'].includes(found)) codec = 'x265';
    else if (['x264', 'avc', 'h264'].includes(found)) codec = 'x264';
    else if (found === 'av1') codec = 'AV1';
  }

  // 5. Source (Release Group)
  let source = 'unknown';
  const sourceMatch = name.match(/-(\w+)(\.\w{3,4})?$/);
  if (sourceMatch && sourceMatch[1]) {
    // Ensure the group is not a technical tag like a codec
    if (!/x264|x265|h264|h265|avc|hevc/i.test(sourceMatch[1])) {
        source = sourceMatch[1];
    }
  }

  return {
    quality,
    hdr,
    hasFrenchAudio,
    hasSubFr,
    isMultiSuspect,
    codec,
    source,
  };
}

/** Ranks and selects the optimal streaming source based on user preferences (language, quality, RD cache), falling back gracefully when no perfect match exists. */
export function pickBestSource(
  sources: Source[],
  prefs: StreamPreferences
): Source | null {
  if (sources.length === 0) return null;

  let candidates = sources.filter(s => s.playable);
  if (candidates.length === 0) return null;

  if (prefs.preferredLanguage === 'fr') {
    const frSources = candidates.filter(s => {
      const parsed = parseTorrentName(s.title);
      return parsed.hasFrenchAudio || parsed.isMultiSuspect;
    });
    if (frSources.length > 0) candidates = frSources;
  }

  const qualityOrder = ['480p', '720p', '1080p', '2160p'];
  const minIdx = qualityOrder.indexOf(prefs.minQuality);
  const normalizeQuality = (value: string): string => {
    const q = value.toLowerCase();
    if (q === '4k') return '2160p';
    if (q.includes('2160')) return '2160p';
    if (q.includes('1080')) return '1080p';
    if (q.includes('720')) return '720p';
    if (q.includes('480')) return '480p';
    return 'unknown';
  };
  const qualFiltered = candidates.filter(s => {
    const idx = qualityOrder.indexOf(normalizeQuality(s.quality));
    return idx >= minIdx;
  });
  if (qualFiltered.length > 0) candidates = qualFiltered;

  if (prefs.preferCachedRD) {
    const rdCached = candidates.filter(s => s.cached_rd);
    if (rdCached.length > 0) candidates = rdCached;
  }

  const sortedByScore = [...candidates].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return sortedByScore[0] ?? null;
}
