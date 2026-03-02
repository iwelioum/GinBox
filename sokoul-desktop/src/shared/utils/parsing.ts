import type { Source } from '../types/index';
import type { StreamPreferences } from '../stores/preferencesStore';

/**
 * Métadonnées extraites d'un nom de fichier de torrent.
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
 * Analyse un nom de fichier torrent pour en extraire les métadonnées de qualité,
 * langue, codec, etc. en suivant un ensemble de règles précises.
 *
 * @param name Le nom de fichier du torrent.
 * @returns Un objet TorrentMeta avec les informations extraites.
 */
export function parseTorrentName(name: string): TorrentMeta {
  const upperName = name.toUpperCase();
  const lowerName = name.toLowerCase();

  // 1. Qualité
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

  // 3. Détection de la langue (FR) en suivant les règles et l'ordre spécifié
  let hasFrenchAudio = false;
  let hasSubFr = false;
  let isMultiSuspect = false;
  
  // Règle 1: Priorité la plus haute pour l'audio français confirmé
  if (upperName.includes('TRUEFRENCH') || upperName.includes('VFF')) {
    hasFrenchAudio = true;
  }
  // Règle 5: VOSTFR/SUBFRENCH indique des sous-titres, et prime sur les autres tags audio FR génériques
  else if (upperName.includes('VOSTFR') || upperName.includes('SUBFRENCH')) {
    hasSubFr = true;
    hasFrenchAudio = false; // Conformément à la règle
  }
  // Règle 2 & 3: Tags audio français standards (incluant le cas MULTI+VF/FRENCH)
  else if (upperName.includes('FRENCH') || upperName.includes('.VF.') || upperName.includes('-VF-') || upperName.includes('_VF_')) {
    hasFrenchAudio = true;
  }
  // Règle 4: MULTI "seul" (c-à-d. sans autre tag audio FR détecté par les règles précédentes)
  else if (upperName.includes('MULTI')) {
    isMultiSuspect = true;
    hasFrenchAudio = false; // Conformément à la règle
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
    // S'assurer que le groupe n'est pas un tag technique comme un codec
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
