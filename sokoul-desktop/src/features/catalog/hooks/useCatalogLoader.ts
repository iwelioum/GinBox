/**
 * Fetches all catalog sections in parallel and populates the catalog store.
 * Separated from the store to enforce the boundary: stores hold state,
 * hooks orchestrate side effects. Uses Promise.allSettled so a single
 * failing genre does not break the entire homepage.
 */

import { useCallback } from 'react';
import { useCatalogStore } from '../store/catalog.store';
import { endpoints } from '@/shared/api/client';
import type { CatalogMeta } from '../../../shared/types/index';

/**
 * Orchestrates 24 parallel API calls to hydrate the catalog store on startup.
 * Lives in a hook (not the store) to enforce separation: stores = pure state, hooks = side effects.
 * Uses Promise.allSettled so one failing genre never breaks the entire homepage.
 */
export function useCatalogLoader() {
  const { loading, setLoading, setError, setSections, setLoadedAt, isStale } = useCatalogStore();

  const load = useCallback(async () => {
    if (loading) return;
    if (!isStale()) return;

    setLoading(true);
    setError(null);

    try {
      const [
        popularMovies, popularSeries, topRated,
        action, comedy, romance, horror, music, war,
        adventure, scifi, thriller, fantasy, crime, drama,
        animation, family, documentary, history, mystery, western,
        seriesAction, animeJp, kdrama,
      ] = await Promise.allSettled([
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

      const movies = ok(popularMovies, []);

      const sections: Record<string, CatalogMeta[]> = {
        trending:      movies,
        top10:         ok(topRated, []).slice(0, 10),
        action:        ok(action,       []),
        comedy:        ok(comedy,       []),
        romance:       ok(romance,      []),
        horror:        ok(horror,       []),
        international: movies
          .filter(m => m.original_language && m.original_language !== 'en')
          .slice(0, 20),
        series:        ok(popularSeries, []),
        music:         ok(music,        []),
        war:           ok(war,          []),
        adventure:     ok(adventure,    []),
        scifi:         ok(scifi,        []),
        thriller:      ok(thriller,     []),
        fantasy:       ok(fantasy,      []),
        crime:         ok(crime,        []),
        drama:         ok(drama,        []),
        animation:     ok(animation,    []),
        family:        ok(family,       []),
        documentary:   ok(documentary,  []),
        history:       ok(history,      []),
        mystery:       ok(mystery,      []),
        western:       ok(western,      []),
        'series-action': ok(seriesAction, []),
        anime:           ok(animeJp,      []),
        kdrama:          ok(kdrama,       []),
      };

      setSections(sections);
      setLoadedAt(Date.now());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [loading, isStale, setLoading, setError, setSections, setLoadedAt]);

  return { load };
}
