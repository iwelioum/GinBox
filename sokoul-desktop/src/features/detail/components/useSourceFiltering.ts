import { useState, useEffect, useMemo } from 'react';
import { parseTorrentName, pickBestSource } from '@/shared/utils/parsing';
import { extractErrorMessage } from '@/shared/utils/error';
import { endpoints } from '@/shared/api/client';
import { useLogStore } from '@/stores/logStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import type { Source, ContentType, CatalogMeta } from '@/shared/types/index';
import {
  FILTER_GROUPS, QUALITY_SECTIONS, QUALITY_ORDER,
  getQKey, matchFilter,
  type SortKey, type FilterTag, type RefreshState,
} from './sourceUtils';

interface UseSourceFilteringArgs {
  id: string | undefined;
  normalizedType: ContentType | undefined;
  selectedSeason: number | undefined;
  selectedEpisode: number | undefined;
  meta: CatalogMeta | undefined;
}

export function useSourceFiltering({
  id, normalizedType, selectedSeason, selectedEpisode, meta,
}: UseSourceFilteringArgs) {
  const addLog = useLogStore(s => s.addLog);
  const prefs = usePreferencesStore(s => ({
    preferredLanguage: s.preferredLanguage,
    minQuality: s.minQuality,
    preferCachedRD: s.preferCachedRD,
    autoPlay: s.autoPlay,
    uiLanguage: s.uiLanguage,
  }));

  const [sources,      setSources]      = useState<Source[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [cachedAt,     setCachedAt]     = useState<number | null>(null);
  const [isStale,      setIsStale]      = useState(false);
  const [refreshState, setRefreshState] = useState<RefreshState>({ counter: 0, force: false });
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortBy,       setSortBy]       = useState<SortKey>('score');

  const toggleFilter = (tag: string) => setActiveFilters(prev => {
    const next = new Set(prev);
    if (next.has(tag)) next.delete(tag); else next.add(tag);
    return next;
  });

  const handleRetry        = () => setRefreshState(s => ({ counter: s.counter + 1, force: false }));
  const handleForceRefresh = () => setRefreshState(s => ({ counter: s.counter + 1, force: true }));

  useEffect(() => {
    if (!id || !normalizedType) return;
    let isMounted = true;
    const { force } = refreshState;

    async function loadSources() {
      setLoading(true); setFetchError(null);
      addLog('info', 'SOURCES', 'Source search started', {
        type: normalizedType, id, force, season: selectedSeason, episode: selectedEpisode,
      });
      try {
        const params: Record<string, string | number | boolean> = {};
        if (meta?.year)      params.year    = meta.year;
        if (force)           params.force   = true;
        if (selectedSeason)  params.season  = selectedSeason;
        if (selectedEpisode) params.episode = selectedEpisode;

        const { data } = await endpoints.sources.get(normalizedType!, id!, params);
        if (!isMounted) return;

        const loaded: Source[] = Array.isArray(data) ? data : (data.results || []);
        addLog('success', 'SOURCES', `Sources received (${loaded.length})`, {
          force, cachedAt: data.cached_at, isStale: data.is_stale,
          season: selectedSeason, episode: selectedEpisode,
        });

        if (data.cached_at) setCachedAt(data.cached_at);
        setIsStale(data.is_stale ?? false);

        loaded.sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;
          const mA = parseTorrentName(a.title), mB = parseTorrentName(b.title);
          const aHasFr = mA.hasFrenchAudio || mA.isMultiSuspect;
          const bHasFr = mB.hasFrenchAudio || mB.isMultiSuspect;
          if (aHasFr && !bHasFr) return -1;
          if (!aHasFr && bHasFr) return  1;
          const qA = QUALITY_ORDER[mA.quality] ?? 0, qB = QUALITY_ORDER[mB.quality] ?? 0;
          if (qA !== qB) return qB - qA;
          return b.seeders - a.seeders;
        });

        setSources(loaded);
      } catch (err: unknown) {
        if (isMounted) {
          setFetchError(extractErrorMessage(err, 'Network error'));
          addLog('error', 'SOURCES', 'API error', { err });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSources();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, normalizedType, selectedSeason, selectedEpisode, refreshState.counter]);

  const parsed = useMemo(
    () => sources.map(s => ({ source: s, meta: parseTorrentName(s.title) })),
    [sources]
  );

  const filteredSources = useMemo(() => {
    if (activeFilters.size === 0) return sources;
    return parsed
      .filter(({ source, meta: m }) => {
        const u = source.title.toUpperCase();
        for (const group of FILTER_GROUPS) {
          const active = (group.tags as readonly string[]).filter(t => activeFilters.has(t)) as FilterTag[];
          if (active.length === 0) continue;
          if (!active.some(tag => matchFilter(tag, m, u, source.source))) return false;
        }
        return true;
      })
      .map(({ source }) => source);
  }, [parsed, activeFilters]);

  const bestSource = useMemo(() => pickBestSource(filteredSources, prefs), [filteredSources, prefs]);

  const sortedAndFiltered = useMemo(() => {
    if (sortBy === 'score') return filteredSources;
    const metaMap = new Map(parsed.map(({ source, meta }) => [source, meta]));
    return [...filteredSources].sort((a, b) => {
      switch (sortBy) {
        case 'quality': {
          const qA = QUALITY_ORDER[metaMap.get(a)?.quality ?? 'unknown'] ?? 0;
          const qB = QUALITY_ORDER[metaMap.get(b)?.quality ?? 'unknown'] ?? 0;
          return qB - qA;
        }
        case 'seeders':  return b.seeders - a.seeders;
        case 'size':     return b.size_gb - a.size_gb;
        default:         return 0;
      }
    });
  }, [filteredSources, sortBy, parsed]);

  const groupedSections = useMemo(() => {
    const metaMap = new Map(parsed.map(({ source, meta }) => [source, meta]));
    return QUALITY_SECTIONS.map(s => ({
      ...s,
      sources: sortedAndFiltered.filter(src => getQKey(metaMap.get(src) ?? parseTorrentName(src.title)) === s.key),
    }));
  }, [sortedAndFiltered, parsed]);

  return {
    sources, loading, fetchError, cachedAt, isStale,
    isForceRefresh: refreshState.force,
    activeFilters, setActiveFilters, toggleFilter,
    sortBy, setSortBy,
    bestSource, sortedAndFiltered, groupedSections,
    handleRetry, handleForceRefresh,
  };
}
