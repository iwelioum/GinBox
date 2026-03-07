/**
 * Fetches all catalog sections in parallel and populates the catalog store.
 * Separated from the store to enforce the boundary: stores hold state,
 * hooks orchestrate side effects. Uses Promise.allSettled so a single
 * failing genre does not break the entire homepage.
 *
 * Tracks which sections failed so the UI can report degraded state.
 */

import { useCallback } from 'react';
import { useCatalogStore } from '../store/catalog.store';
import { endpoints } from '@/shared/api/client';
import type { CatalogMeta } from '../../../shared/types/index';

/** Threshold: if this fraction or more of calls fail, treat the backend as unavailable. */
const DEGRADED_THRESHOLD = 0.5;

/** Section keys in the same order as the Promise.allSettled array. */
const SECTION_KEYS = [
  'trending', 'series', 'top10',
  'action', 'comedy', 'romance', 'horror', 'music', 'war',
  'adventure', 'scifi', 'thriller', 'fantasy', 'crime', 'drama',
  'animation', 'family', 'documentary', 'history', 'mystery', 'western',
  'series-action', 'anime', 'kdrama',
] as const;

/**
 * Orchestrates 24 parallel API calls to hydrate the catalog store on startup.
 * Lives in a hook (not the store) to enforce separation: stores = pure state, hooks = side effects.
 * Uses Promise.allSettled so one failing genre never breaks the entire homepage.
 */
export function useCatalogLoader() {
  const { loading, setLoading, setError, setSections, setFailedSections, setLoadedAt, isStale } = useCatalogStore();

  const load = useCallback(async () => {
    if (loading) return;
    if (!isStale()) return;

    setLoading(true);
    setError(null);
    setFailedSections([]);

    const results = await Promise.allSettled([
      endpoints.catalog.get('movie',  'popular'  ).then(r => r.data.metas),
      endpoints.catalog.get('series', 'popular'  ).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'top_rated').then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '28'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '35'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '10749' }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '27'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '10402' }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '10752' }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '12'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '878'   }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '53'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '14'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '80'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '18'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '16'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '10751' }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '99'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '36'    }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '9648'  }).then(r => r.data.metas),
      endpoints.catalog.get('movie',  'genre',    { genre: '37'    }).then(r => r.data.metas),
      endpoints.catalog.get('series', 'genre',    { genre: '10759' }).then(r => r.data.metas),
      endpoints.catalog.get('series', 'genre',    { genre: '16'    }).then(r => r.data.metas),
      endpoints.catalog.get('series', 'language', { language: 'ko' }).then(r => r.data.metas),
    ]);

    const ok = <T,>(res: PromiseSettledResult<T>, fallback: T): T =>
      res.status === 'fulfilled' ? res.value : fallback;

    // Track which sections failed
    const failed: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') failed.push(SECTION_KEYS[i]);
    });

    const failRatio = failed.length / SECTION_KEYS.length;

    if (failRatio >= DEGRADED_THRESHOLD) {
      // More than half failed — backend is effectively unavailable
      setError('backend_unavailable');
      setFailedSections(failed);
      setLoading(false);
      return;
    }

    if (failed.length > 0) {
      console.warn('[Catalog] Partial load failure for sections:', failed);
      setFailedSections(failed);
    }

    const movies = ok(results[0], []);

    const sections: Record<string, CatalogMeta[]> = {
      trending:      movies,
      top10:         ok(results[2], []).slice(0, 10),
      action:        ok(results[3],  []),
      comedy:        ok(results[4],  []),
      romance:       ok(results[5],  []),
      horror:        ok(results[6],  []),
      international: movies
        .filter(m => m.original_language && m.original_language !== 'en')
        .slice(0, 20),
      series:        ok(results[1],  []),
      music:         ok(results[7],  []),
      war:           ok(results[8],  []),
      adventure:     ok(results[9],  []),
      scifi:         ok(results[10], []),
      thriller:      ok(results[11], []),
      fantasy:       ok(results[12], []),
      crime:         ok(results[13], []),
      drama:         ok(results[14], []),
      animation:     ok(results[15], []),
      family:        ok(results[16], []),
      documentary:   ok(results[17], []),
      history:       ok(results[18], []),
      mystery:       ok(results[19], []),
      western:       ok(results[20], []),
      'series-action': ok(results[21], []),
      anime:           ok(results[22], []),
      kdrama:          ok(results[23], []),
    };

    setSections(sections);
    setLoadedAt(Date.now());
    setLoading(false);
  }, [loading, isStale, setLoading, setError, setFailedSections, setSections, setLoadedAt]);

  return { load };
}
