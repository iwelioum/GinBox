import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, AlertTriangle, RefreshCw, Bug,
  Sparkles, Monitor, Tv, Film,
  Zap, Languages, Globe, Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { client, endpoints } from '../../../api/client';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { SourceRow } from './SourceRow'; // conservé
import { ResumeModal } from '../../../shared/components/modals/ResumeModal';
import type { CatalogMeta, ContentType, Source } from '../../../shared/types/index';
import { useLogStore } from '../../../shared/stores/logStore';
import { useProfileStore } from '../../../shared/stores/profileStore';
import { usePreferencesStore } from '../../../shared/stores/preferencesStore';
import { parseTorrentName, pickBestSource } from '../../../shared/utils/parsing';
import { extractErrorMessage } from '../../../shared/utils/error';

function formatCacheAge(cachedAt: number): string {
  const age = Math.floor(Date.now() / 1000) - cachedAt;
  if (age < 60)     return "à l'instant";
  if (age < 3600)   return `il y a ${Math.floor(age / 60)} min`;
  if (age < 86_400) return `il y a ${Math.floor(age / 3600)} h`;
  return `il y a ${Math.floor(age / 86_400)} j`;
}

interface RefreshState { counter: number; force: boolean; }
interface SourcesNavigationState { fromDetail?: boolean; returnTo?: string; }

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

function cleanTitle(raw: string, meta: ReturnType<typeof parseTorrentName>): string {
  const u = raw.toUpperCase();
  const parts: string[] = [];

  const seMatch = raw.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
  if (seMatch) parts.push(`S${seMatch[1].padStart(2, '0')}E${seMatch[2].padStart(2, '0')}`);

  if      (u.includes('REMUX'))                                            parts.push('Remux');
  else if (u.includes('WEB-DL') || u.includes('WEBDL'))                   parts.push('WEB-DL');
  else if (u.includes('BLURAY') || u.includes('BLU-RAY') || u.includes('BDRIP')) parts.push('BluRay');
  else if (u.includes('WEBRIP') || u.includes('WEB-RIP'))                 parts.push('WEBRip');
  else if (u.includes('HDTV'))                                             parts.push('HDTV');

  if      (meta.hdr === 'DV')    parts.push('DV');
  else if (meta.hdr === 'HDR10+') parts.push('HDR10+');
  else if (meta.hdr === 'HDR')   parts.push('HDR');

  const teamMatch = raw.match(/-([A-Za-z0-9]{2,20})(?:\.\w{2,4})?$/);
  if (teamMatch?.[1] && !/^(x265|x264|hevc|avc|h265|h264|av1|265|264)$/i.test(teamMatch[1])) {
    parts.push(teamMatch[1]);
  }

  if (parts.length > 0) return parts.join(' · ');

  return raw
    .replace(/\b(2160p|4k|uhd|1080p|720p|480p)\b/gi, '')
    .replace(/\b(multi|french|vff|truefrench|vostfr|subfrench)\b/gi, '')
    .replace(/\b(remux|web-dl|webdl|bluray|bdrip|webrip|hdtv)\b/gi, '')
    .replace(/\b(x265|hevc|h265|x264|avc|h264|av1)\b/gi, '')
    .replace(/\b(hdr10\+?|hdr|dv)\b/gi, '')
    .replace(/\[\d{4}\]/g, '').replace(/\[[^\]]*\]/g, '')
    .replace(/[.\-_]+/g, ' ').replace(/\s+/g, ' ').trim() || raw;
}

const BADGE_BASE = {
  display:        'inline-flex' as const,
  alignItems:     'center'      as const,
  gap:            3,
  borderRadius:   6,
  padding:        '2px 7px',
  fontSize:       10,
  fontWeight:     700,
  letterSpacing:  '0.08em',
  textTransform:  'uppercase' as const,
  whiteSpace:     'nowrap'    as const,
  lineHeight:     1.4,
} as const;

function mkBadge(bg: string, color: string, border: string) {
  return { ...BADGE_BASE, background: bg, color, border };
}

const BS = {
  rd:     mkBadge('rgba(34,197,94,0.18)',    '#22c55e', '1px solid rgba(34,197,94,0.35)'),
  hdr:    mkBadge('rgba(249,115,22,0.18)',   '#f97316', '1px solid rgba(249,115,22,0.35)'),
  dv:     mkBadge('rgba(168,85,247,0.18)',   '#a855f7', '1px solid rgba(168,85,247,0.35)'),
  hdr10:  mkBadge('rgba(245,158,11,0.18)',   '#f59e0b', '1px solid rgba(245,158,11,0.35)'),
  remux:  mkBadge('rgba(6,182,212,0.18)',    '#06b6d4', '1px solid rgba(6,182,212,0.35)'),
  bluray: mkBadge('rgba(59,130,246,0.18)',   '#3b82f6', '1px solid rgba(59,130,246,0.35)'),
  webdl:  mkBadge('rgba(148,163,184,0.18)', '#94a3b8',  '1px solid rgba(148,163,184,0.35)'),
  webrip: mkBadge('rgba(100,116,139,0.18)', '#64748b',  '1px solid rgba(100,116,139,0.35)'),
  hdtv:   mkBadge('rgba(107,114,128,0.18)', '#9ca3af',  '1px solid rgba(107,114,128,0.35)'),
  fr:     mkBadge('rgba(99,102,241,0.18)',  '#818cf8',  '1px solid rgba(99,102,241,0.35)'),
  multi:  mkBadge('rgba(251,191,36,0.18)',  '#fbbf24',  '1px solid rgba(251,191,36,0.35)'),
  vo:     mkBadge('rgba(107,114,128,0.18)', '#9ca3af',  '1px solid rgba(107,114,128,0.35)'),
};

function BadgeRD() {
  return <span style={BS.rd}><Zap size={9} /> RD</span>;
}

function BadgeLang({ m }: { m: ReturnType<typeof parseTorrentName> }) {
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
  if (u.includes('REMUX'))                                             return <span style={BS.remux}>REMUX</span>;
  if (u.includes('WEB-DL') || u.includes('WEBDL'))                   return <span style={BS.webdl}>WEB-DL</span>;
  if (u.includes('BLURAY') || u.includes('BLU-RAY') || u.includes('BDRIP')) return <span style={BS.bluray}>BluRay</span>;
  if (u.includes('WEBRIP') || u.includes('WEB-RIP'))                 return <span style={BS.webrip}>WEBRip</span>;
  if (u.includes('HDTV'))                                             return <span style={BS.hdtv}>HDTV</span>;
  return null;
}

const QUALITY_SECTIONS = [
  { key: '4k',    label: '4K Ultra HD', Icon: Sparkles as LucideIcon, color: '#f59e0b' },
  { key: '1080p', label: 'Full HD',     Icon: Monitor  as LucideIcon, color: '#3b82f6' },
  { key: '720p',  label: 'HD',          Icon: Tv       as LucideIcon, color: '#22c55e' },
  { key: 'sd',    label: 'Standard',    Icon: Film     as LucideIcon, color: '#6b7280' },
] as const;

type QKey = typeof QUALITY_SECTIONS[number]['key'];

function getQKey(m: ReturnType<typeof parseTorrentName>): QKey {
  if (m.quality === '2160p') return '4k';
  if (m.quality === '1080p') return '1080p';
  if (m.quality === '720p')  return '720p';
  return 'sd';
}

function InlineSourceRow({
  source, onPlay, onDownload, launching,
}: {
  source: Source;
  onPlay: () => void;
  onDownload?: () => void;
  launching: boolean;
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
        display:     'flex',
        alignItems:  'center',
        gap:          10,
        padding:      '10px 12px',
        borderLeft:   hovered && ok ? '2px solid rgba(255,255,255,0.28)' : '2px solid transparent',
        background:   hovered && ok ? 'rgba(255,255,255,0.04)'           : 'transparent',
        cursor:       !ok ? 'not-allowed' : launching ? 'wait' : 'pointer',
        opacity:      ok ? 1 : 0.45,
        transition:   'background 0.15s ease, border-color 0.15s ease',
        userSelect:   'none',
      }}
    >
      {/* Gauche : titre + badges */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize:      13,
          fontWeight:    hovered && ok ? 600 : 500,
          color:         'rgba(249,249,249,0.92)',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
          transition:    'font-weight 0.1s',
        }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
          {source.cached_rd && <BadgeRD />}
          <BadgeLang m={meta} />
          {meta.hdr !== null && <BadgeHDR hdr={meta.hdr} />}
          <BadgeVideoSrc title={source.title} />
        </div>
      </div>

      {/* Droite : taille · seeds */}
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
          <Zap size={10} />
          {source.seeders}
        </span>
        {onDownload && (
          <button
            onClick={e => { e.stopPropagation(); onDownload(); }}
            title="Télécharger"
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

function BestSourceCard({
  source, onPlay, launching,
}: { source: Source; onPlay: () => void; launching: boolean }) {
  const m = parseTorrentName(source.title);
  const t = cleanTitle(source.title, m);
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(249,249,249,0.3)' }}>
          Meilleure source disponible
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(249,249,249,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {source.cached_rd && <BadgeRD />}
          <BadgeLang m={m} />
          {m.hdr !== null && <BadgeHDR hdr={m.hdr} />}
          <BadgeVideoSrc title={source.title} />
        </div>
      </div>
      <button
        onClick={onPlay}
        disabled={launching}
        style={{
          flexShrink: 0, padding: '9px 20px', borderRadius: 8,
          background: '#fff', color: '#000', border: 'none',
          fontSize: 13, fontWeight: 700,
          cursor: launching ? 'wait' : 'pointer',
          opacity: launching ? 0.7 : 1, transition: 'opacity 0.15s',
        }}
      >
        ▶ Lancer
      </button>
    </div>
  );
}

function QualitySection({
  label, Icon, color, sources, onPlay, onDownload, launching,
}: {
  label: string;
  Icon: LucideIcon;
  color: string;
  sources: Source[];
  onPlay: (s: Source) => void;
  onDownload?: (s: Source) => void;
  launching: boolean;
}) {
  if (sources.length === 0) return null;
  return (
    <div>
      {/* Header section */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingBottom: 8, marginBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Icon size={12} style={{ color, flexShrink: 0 }} />
        <span style={{
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.12em', color: 'rgba(249,249,249,0.4)',
        }}>
          {label}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(249,249,249,0.22)' }}>
          ({sources.length})
        </span>
      </div>
      {/* Lignes sources */}
      <div>
        {sources.map(s => (
          <InlineSourceRow
            key={s.info_hash || s.magnet}
            source={s}
            onPlay={() => onPlay(s)}
            onDownload={onDownload ? () => onDownload(s) : undefined}
            launching={launching}
          />
        ))}
      </div>
    </div>
  );
}

export default function SourcesPage() {
  const { id, type } = useParams<{ type: ContentType; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const normalizedType: ContentType | undefined = type === 'tv' ? 'series' : type;
  const seasonRaw   = Number(searchParams.get('season')  ?? '');
  const episodeRaw  = Number(searchParams.get('episode') ?? '');
  const selectedSeason  = Number.isFinite(seasonRaw)  && seasonRaw  > 0 ? seasonRaw  : undefined;
  const selectedEpisode = Number.isFinite(episodeRaw) && episodeRaw > 0 ? episodeRaw : undefined;
  const initialMode = searchParams.get('mode');
  const navigationState = (location.state as SourcesNavigationState | null) ?? null;
  const fallbackDetailPath  = type && id ? `/detail/${type}/${id}` : '/';
  const returnToDetailPath  = typeof navigationState?.returnTo === 'string'
    ? navigationState.returnTo : fallbackDetailPath;
  const shouldReturnToDetail = navigationState?.fromDetail === true;

  const [sources,    setSources]    = useState<Source[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cachedAt,   setCachedAt]   = useState<number | null>(null);
  const [isStale,    setIsStale]    = useState(false);
  const [refreshState, setRefreshState] = useState<RefreshState>({ counter: 0, force: false });

  const { addLog }        = useLogStore();
  const { activeProfile } = useProfileStore();
  const prefs             = usePreferencesStore();
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const toggleFilter = (tag: string) => setActiveFilters(prev => {
    const next = new Set(prev);
    if (next.has(tag)) next.delete(tag); else next.add(tag);
    return next;
  });
  type SortKey = 'score' | 'quality' | 'seeders' | 'size';
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const SORT_LABELS: [SortKey, string][] = [
    ['score',   'Pertinence'],
    ['quality', 'Qualité'],
    ['seeders', 'Seeds'],
    ['size',    'Taille'],
  ];
  const bestSource = useMemo(() => pickBestSource(sources, prefs), [sources, prefs]);

  const { data: meta } = useQuery<CatalogMeta>({
    queryKey: ['catalogMeta', type, id],
    queryFn:  () => endpoints.catalog.getMeta(type!, id!).then(r => r.data),
    enabled:  !!type && !!id,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!id || !normalizedType) return;
    const sourceType = normalizedType;
    const contentId  = id;
    let isMounted    = true;
    const { force }  = refreshState;

    async function loadSources() {
      setLoading(true); setFetchError(null);
      addLog('info', 'SOURCES', 'Recherche sources démarrée', {
        type: sourceType, id: contentId, force, season: selectedSeason, episode: selectedEpisode,
      });
      try {
        const params: Record<string, string | number | boolean> = {};
        if (meta?.year)      params.year    = meta.year;
        if (force)           params.force   = true;
        if (selectedSeason)  params.season  = selectedSeason;
        if (selectedEpisode) params.episode = selectedEpisode;

        const { data } = await endpoints.sources.get(sourceType, contentId, params);
        if (!isMounted) return;

        let loaded: Source[] = Array.isArray(data) ? data : (data.results || []);
        addLog('success', 'SOURCES', `Sources reçues (${loaded.length})`, {
          force, cachedAt: data.cached_at, isStale: data.is_stale,
          season: selectedSeason, episode: selectedEpisode,
        });

        if (data.cached_at) setCachedAt(data.cached_at);
        setIsStale(data.is_stale ?? false);

        const qualityOrder: Record<string, number> = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'unknown': 0 };
        loaded.sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;
          const mA = parseTorrentName(a.title), mB = parseTorrentName(b.title);
          if (mA.hasFrenchAudio && !mB.hasFrenchAudio) return -1;
          if (!mA.hasFrenchAudio && mB.hasFrenchAudio) return  1;
          const qA = qualityOrder[mA.quality] ?? 0, qB = qualityOrder[mB.quality] ?? 0;
          if (qA !== qB) return qB - qA;
          return b.seeders - a.seeders;
        });

        setSources(loaded);
      } catch (err: unknown) {
        if (isMounted) {
          setFetchError(extractErrorMessage(err, 'Erreur reseau'));
          addLog('error', 'SOURCES', 'Erreur API', { err });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSources();
    return () => { isMounted = false; };
  }, [id, normalizedType, selectedSeason, selectedEpisode, refreshState.counter]);

  const handleRetry        = () => setRefreshState(s => ({ counter: s.counter + 1, force: false }));
  const handleForceRefresh = () => setRefreshState(s => ({ counter: s.counter + 1, force: true  }));
  const handleBack = () => {
    if (shouldReturnToDetail) { navigate(returnToDetailPath, { replace: true }); return; }
    navigate(-1);
  };

  const titleText = meta?.title || meta?.name || 'Sources';

  const [launching,    setLaunching]    = useState(false);
  const [launchError,  setLaunchError]  = useState<string | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{ streamUrl: string; resumeMs: number } | null>(null);

  const buildPlayerUrl = (streamUrl: string, startAtSeconds = 0) => {
    const posterUrl  = meta?.poster_path ? `https://image.tmdb.org/t/p/w500${meta.poster_path}` : (meta?.poster ?? '');
    const ratingStr  = meta?.vote_average != null ? String(meta.vote_average.toFixed(1)) : '';
    const returnToParam = shouldReturnToDetail ? `&returnTo=${encodeURIComponent(returnToDetailPath)}` : '';
    const startAtParam  = startAtSeconds > 0 ? `&startAt=${encodeURIComponent(String(startAtSeconds))}` : '';
    return (
      `/player?url=${encodeURIComponent(streamUrl)}` +
      `&title=${encodeURIComponent(titleText)}` +
      `&poster=${encodeURIComponent(posterUrl)}` +
      `&year=${encodeURIComponent(meta?.year ?? meta?.releaseInfo ?? '')}` +
      `&rating=${encodeURIComponent(ratingStr)}` +
      `&contentType=${encodeURIComponent(normalizedType ?? '')}` +
      `&contentId=${encodeURIComponent(id ?? '')}` +
      (selectedSeason  ? `&season=${encodeURIComponent(String(selectedSeason))}`  : '') +
      (selectedEpisode ? `&episode=${encodeURIComponent(String(selectedEpisode))}` : '') +
      returnToParam + startAtParam
    );
  };

  const goToPlayer = (streamUrl: string, startAtSeconds = 0) => {
    const episodeTitle = selectedEpisode
      ? (meta?.episodes?.find(v => v.season === selectedSeason && v.episode === selectedEpisode)?.title ?? '')
      : '';
    navigate(buildPlayerUrl(streamUrl, startAtSeconds), {
      replace: true,
      state: { episodes: meta?.episodes ?? [], episodeTitle },
    });
  };

  async function handlePlay(source: Source) {
    if (!source.magnet || launching) return;
    setLaunching(true); setLaunchError(null);
    try {
      const { data } = await client.post<{ stream_url: string }>('/debrid/unrestrict', {
        magnet: source.magnet, cached: source.cached_rd,
      });
      const streamUrl = data.stream_url;

      if (activeProfile && id) {
        try {
          const { data: playback } = await endpoints.playback.getPosition(
            id, activeProfile.id, selectedSeason, selectedEpisode,
          );
          const resumeMs   = playback?.positionMs  ?? 0;
          const durationMs = playback?.durationMs  ?? 0;
          const canResume  = playback !== null && playback.watched !== true &&
            resumeMs >= 30_000 && (durationMs <= 0 || resumeMs < durationMs - 15_000);
          if (canResume) { setResumePrompt({ streamUrl, resumeMs }); setLaunching(false); return; }
        } catch (err: unknown) {
          addLog('warn', 'PLAYBACK', 'Reprise indisponible', { err: extractErrorMessage(err) });
        }
      }

      goToPlayer(streamUrl);
    } catch (err: unknown) {
      setLaunchError(extractErrorMessage(err, 'Erreur debrid'));
      setLaunching(false);
    }
  }

  const FILTER_GROUPS = [
    { label: 'Qualité', tags: ['4K/2160p', '1080p', '720p', 'SD']            },
    { label: 'Audio',   tags: ['VF/FR', 'VOSTFR', 'VO', 'Multi']             },
    { label: 'Codec',   tags: ['HEVC/x265', 'AVC/x264', 'AV1', 'Remux']      },
    { label: 'Source',  tags: ['BluRay', 'WEB-DL', 'WEBRip', 'HDTV']         },
  ] as const;

  type FilterTag = typeof FILTER_GROUPS[number]['tags'][number];

  function matchFilter(tag: FilterTag, m: ReturnType<typeof parseTorrentName>, u: string): boolean {
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

  const filteredSources = useMemo(() => {
    if (activeFilters.size === 0) return sources;
    return sources.filter(source => {
      const u = source.title.toUpperCase();
      const m = parseTorrentName(source.title);
      for (const group of FILTER_GROUPS) {
        const active = (group.tags as readonly string[]).filter(t => activeFilters.has(t)) as FilterTag[];
        if (active.length === 0) continue;
        if (!active.some(tag => matchFilter(tag, m, u))) return false;
      }
      return true;
    });
  }, [sources, activeFilters]);

  // Tri configurable par l'utilisateur
  const qOrder: Record<string, number> = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'unknown': 0 };
  const sortedAndFiltered = useMemo(() => {
    if (sortBy === 'score') return filteredSources;
    return [...filteredSources].sort((a, b) => {
      switch (sortBy) {
        case 'quality':  return (qOrder[parseTorrentName(b.title).quality] ?? 0) - (qOrder[parseTorrentName(a.title).quality] ?? 0);
        case 'seeders':  return b.seeders - a.seeders;
        case 'size':     return b.size_gb - a.size_gb;
        default:         return 0;
      }
    });
  }, [filteredSources, sortBy]);

  // Groupement par section qualité
  const groupedSections = useMemo(() =>
    QUALITY_SECTIONS.map(s => ({
      ...s,
      sources: sortedAndFiltered.filter(src => getQKey(parseTorrentName(src.title)) === s.key),
    }))
  , [sortedAndFiltered]);

  useEffect(() => {
    if (!bestSource) return;
    console.debug('[Sources] Best source score', {
      title: bestSource.title, score: bestSource.score, language: bestSource.language,
    });
  }, [bestSource]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0d1117] to-[#1a1d29] text-[#f9f9f9] flex flex-col z-50">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-[14px] px-[28px] py-[20px] border-b border-white/5 shrink-0 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-[14px]">
          <button onClick={handleBack} className="flex items-center gap-[6px] px-[14px] py-[8px] rounded-[8px] border border-white/15 bg-white/5 text-[#f9f9f9cc] text-[13px] font-[600] cursor-pointer whitespace-nowrap transition-colors hover:bg-white/10 hover:text-white">
            <ChevronLeft size={16} /> Retour
          </button>
          <h1 className="flex-1 text-[20px] font-[700] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {initialMode === 'download' ? `Télécharger : ${titleText}` : titleText}
          </h1>
          <button onClick={() => navigate('/debug')} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Ouvrir la console de debug">
            <Bug size={18} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-[14px]">
          <Spinner size={48} />
          <p className="text-white/50 text-[14px]">
            {refreshState.force ? 'Recherche de nouvelles sources...' : 'Recherche des meilleures sources...'}
          </p>
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-[14px] text-center px-8">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-[22px] font-[700] m-0 text-red-400">Erreur de chargement</p>
          <p className="text-[14px] text-white/50 m-0 max-w-[400px] break-words">{fetchError}</p>
          <button onClick={handleRetry} className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[#0063e5] hover:bg-[#0483ee] text-white rounded-[6px] text-[14px] font-[600] transition-all mt-[8px]">
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-[14px] text-center px-8">
          <p className="text-[22px] font-[700] m-0 text-white/50">Aucun flux trouvé</p>
          <p className="text-[14px] text-white/30 m-0 max-w-[320px]">Ce contenu n'est pas disponible via Torrentio ou Prowlarr.</p>
          <button onClick={handleForceRefresh} className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[#0063e5] hover:bg-[#0483ee] text-white rounded-[6px] text-[14px] font-[600] transition-all mt-[8px]">
            <RefreshCw size={16} /> Relancer la recherche
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          <aside style={{
            width: 210, flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 14px',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 20,
            scrollbarWidth: 'none',
          }}>

            {/* Trier par */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', marginBottom: 8, margin: '0 0 8px 2px' }}>
                Trier par
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SORT_LABELS.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '7px 10px', borderRadius: 7, border: 'none',
                      background: sortBy === key ? 'rgba(255,255,255,0.09)' : 'transparent',
                      color: sortBy === key ? 'rgba(249,249,249,0.92)' : 'rgba(249,249,249,0.38)',
                      fontSize: 12, fontWeight: sortBy === key ? 700 : 500,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: sortBy === key ? '#4361ee' : 'rgba(255,255,255,0.12)',
                      transition: 'background 0.12s',
                    }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Groupes de filtres */}
            {FILTER_GROUPS.map(group => {
              const groupActive = [...activeFilters].some(t => (group.tags as readonly string[]).includes(t));
              return (
                <div key={group.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', margin: 0 }}>
                      {group.label}
                    </p>
                    {groupActive && (
                      <button
                        onClick={() => setActiveFilters(prev => {
                          const next = new Set(prev);
                          for (const t of group.tags) next.delete(t);
                          return next;
                        })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: 9, padding: '1px 3px' }}
                      >✕</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {group.tags.map(tag => {
                      const on = activeFilters.has(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleFilter(tag)}
                          style={{
                            padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                            border:     on ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.07)',
                            background: on ? 'rgba(255,255,255,0.10)'           : 'rgba(255,255,255,0.02)',
                            color:      on ? 'rgba(249,249,249,0.92)'           : 'rgba(249,249,249,0.35)',
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                            textTransform: 'uppercase', whiteSpace: 'nowrap',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Effacer + Cache + Actualiser */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeFilters.size > 0 && (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'underline', textAlign: 'left', padding: 0 }}
                >
                  Effacer tous les filtres
                </button>
              )}
              {cachedAt && (
                <p style={{ fontSize: 10, color: isStale ? '#fbbf24' : 'rgba(255,255,255,0.22)', margin: 0, lineHeight: 1.4 }}>
                  {isStale ? 'Resultats anciens' : `Mis a jour ${formatCacheAge(cachedAt)}`}
                </p>
              )}
              <button
                onClick={handleForceRefresh}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 10px', borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(249,249,249,0.55)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                <RefreshCw size={12} /> Actualiser
              </button>
            </div>
          </aside>

          <div
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            style={{ padding: '20px 28px' }}
          >
            {sortedAndFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] gap-[14px] text-center">
                <p className="text-[22px] font-[700] m-0 text-white/50">Aucun résultat pour ce filtre</p>
                <p className="text-[14px] text-white/30 m-0 max-w-[320px]">Modifiez les filtres à gauche.</p>
                <button onClick={() => setActiveFilters(new Set())} className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[#0063e5] hover:bg-[#0483ee] text-white rounded-[6px] text-[14px] font-[600] transition-all mt-[8px]">
                  Voir toutes les sources
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                {/* Compteur */}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                  {sortedAndFiltered.length} source{sortedAndFiltered.length !== 1 ? 's' : ''}
                  {activeFilters.size > 0 ? ` filtrées` : ' disponibles'}
                </p>

                {/* Meilleure source */}
                {bestSource && (
                  <BestSourceCard
                    source={bestSource}
                    onPlay={() => handlePlay(bestSource)}
                    launching={launching}
                  />
                )}

                {/* Sections par qualité */}
                {groupedSections.map(section => (
                  <QualitySection
                    key={section.key}
                    label={section.label}
                    Icon={section.Icon}
                    color={section.color}
                    sources={section.sources}
                    onPlay={handlePlay}
                    onDownload={
                      initialMode === 'download'
                        ? (s) => { if (s.magnet) window.electronAPI?.openExternal?.(s.magnet); }
                        : undefined
                    }
                    launching={launching}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast erreur lancement */}
      {launchError && (
        <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-[20px] py-[14px] rounded-[10px] border border-red-500 flex items-center gap-[12px] shadow-2xl backdrop-blur-md z-50">
          <AlertTriangle size={18} />
          <span className="text-[14px] font-[600]">{launchError}</span>
          <button onClick={() => setLaunchError(null)} className="ml-[8px] px-[10px] py-[4px] bg-white/20 hover:bg-white/30 rounded text-[12px] font-[700]">✕</button>
        </div>
      )}

      <ResumeModal
        isOpen={resumePrompt !== null}
        resumeTime={resumePrompt ? Math.floor(resumePrompt.resumeMs / 1000) : 0}
        onClose={() => setResumePrompt(null)}
        onRestart={() => {
          if (!resumePrompt) return;
          const s = resumePrompt.streamUrl;
          setResumePrompt(null);
          goToPlayer(s, 0);
        }}
        onResume={() => {
          if (!resumePrompt) return;
          const s = resumePrompt.streamUrl;
          const t = Math.floor(resumePrompt.resumeMs / 1000);
          setResumePrompt(null);
          goToPlayer(s, t);
        }}
      />
    </div>
  );
}
