// CollectionsPage.tsx — Sagas & Movie Universes
// Infinite scroll, search, category filters, live TMDB data

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate }            from 'react-router-dom';
import { useInfiniteQuery }       from '@tanstack/react-query';
import { Search, Film, ChevronRight } from 'lucide-react';
import { endpoints }              from '@/shared/api/client';
import type { CollectionItem }    from '../../../shared/types/index';
import { TMDB_IMAGE_BASE }       from '@/shared/constants/tmdb';
import { getGenreStyleByKey }     from '@/shared/config/genreTypography';

const CATEGORIES = [
  { key: 'all',     labelKey: 'collections.categoryAll' },
  { key: 'action',  labelKey: 'collections.categoryAction' },
  { key: 'fantasy', labelKey: 'collections.categoryFantasy' },
  { key: 'scifi',   labelKey: 'collections.categorySciFi' },
  { key: 'horror',  labelKey: 'collections.categoryHorror' },
  { key: 'anime',   labelKey: 'collections.categoryAnime' },
  { key: 'comedy',  labelKey: 'collections.categoryComedy' },
  { key: 'drama',   labelKey: 'collections.categoryDrama' },
] as const;

function detectCategory(name: string): string {
  const n = name.toLowerCase();
  if (/star wars|marvel|avengers|alien|matrix|terminator|predator|robocop|tron|jurassic|planet.*apes|dune|hunger|back.*future/i.test(n)) return 'scifi';
  if (/harry potter|seigneur|hobbit|narnia|fantast|dragon|magic|fantastic beasts/i.test(n)) return 'fantasy';
  if (/fast|bourne|mission|bond|007|die hard|john wick|expendable|equalizer|kingsman|top gun|transformers|rush hour/i.test(n)) return 'action';
  if (/halloween|friday|elm|conjuring|saw|scream|paranormal|insidious|annabelle|purge|nightmare|it\b/i.test(n)) return 'horror';
  if (/shrek|ice age|toy story|cars|finding|despicable|minion|kung fu panda|frozen|madagascar|monster|dragon|hotel transylvania|wreck|big hero|paddington|puss/i.test(n)) return 'anime';
  if (/hangover|horrible|pitch perfect|detective pikachu/i.test(n)) return 'comedy';
  if (/godfather|ocean|twilight|fifty shades|after\b|knives out/i.test(n)) return 'drama';
  return 'other';
}

export default function CollectionsPage() {
  const { t } = useTranslation();
  const navigate                  = useNavigate();
  const [search,  setSearch]      = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('all');
  const loaderRef                 = React.useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey:  ['collections', 'all'],
    queryFn:   ({ pageParam = 1 }) =>
      endpoints.collections.getAll(pageParam as number, 24)
        .then(r => r.data),
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.total_pages
        ? allPages.length + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 10 * 60_000,
  });

  React.useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allCollections: CollectionItem[] = React.useMemo(() =>
    data?.pages.flatMap(p => p.collections) ?? [],
    [data]
  );

  const filtered = React.useMemo(() => {
    let result = allCollections;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.overview?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter(c => detectCategory(c.name) === activeCategory);
    }

    return result;
  }, [allCollections, search, activeCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: 'var(--bg-abyss)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20
                          border-t-white/80 rounded-full animate-spin" />
          <span className="text-white/40 text-sm">
            {t('collections.loading')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20"
         style={{ backgroundColor: 'var(--bg-abyss)' }}>

      <div className="px-8 pt-24 pb-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1"
                style={{ color: 'var(--text-main)' }}>
              {t('collections.heading')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('collections.franchiseCount', { count: allCollections.length })}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder={t('collections.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl
                         bg-white/[0.06] border border-white/[0.08]
                         text-white/80 text-sm placeholder:text-white/30
                         focus:outline-none focus:border-white/20
                         focus:bg-white/[0.08] transition-all duration-200"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                flex-shrink-0 px-4 py-1.5 rounded-full text-xs
                font-medium transition-all duration-200
                ${activeCategory === cat.key
                  ? 'bg-white text-black'
                  : 'bg-white/[0.07] text-white/55 border border-white/[0.08] hover:bg-white/[0.12] hover:text-white/80'}
              `}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            {search ? t('collections.noSagaFoundFor', { search }) : t('collections.noSagaFound')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(collection => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onClick={() => navigate(`/collection/${collection.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <div ref={loaderRef} className="py-8 flex justify-center">
        {isFetchingNextPage && (
          <div className="w-6 h-6 border-2 border-white/15
                          border-t-white/50 rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}

function CollectionCard({
  collection,
  onClick,
}: {
  collection: CollectionItem;
  onClick:    () => void;
}) {
  const { t } = useTranslation();
  const backdrop = collection.backdrop_path
    ? (collection.backdrop_path.startsWith('http')
        ? collection.backdrop_path
        : `${TMDB_IMAGE_BASE}original${collection.backdrop_path}`)
    : null;

  const poster = collection.poster_path
    ? (collection.poster_path.startsWith('http')
        ? collection.poster_path
        : `${TMDB_IMAGE_BASE}w342${collection.poster_path}`)
    : null;

  // Map collection category to genre typography
  const category = detectCategory(collection.name);
  const genreKey = category === 'scifi' ? 'sci-fi'
    : category === 'anime' ? 'animation'
    : category === 'other' ? 'default'
    : category;
  const genreStyle = getGenreStyleByKey(genreKey);

  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer
                 group text-left ring-1 ring-white/[0.07]
                 hover:ring-white/25 transition-all duration-300"
      style={{ aspectRatio: '21/9' }}
    >
      {backdrop ? (
        <img
          src={backdrop}
          alt={collection.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover
                     group-hover:scale-[1.04]
                     transition-transform duration-700"
        />
      ) : poster ? (
        <img
          src={poster}
          alt={collection.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover
                     group-hover:scale-[1.04]
                     transition-transform duration-700"
        />
      ) : (
        <div className="absolute inset-0 bg-white/[0.04]
                        flex items-center justify-center">
          <Film className="w-12 h-12 text-white/15" />
        </div>
      )}

      {/* Left gradient → transparent */}
      <div className="absolute inset-0"
           style={{
             background: `linear-gradient(
               to right,
               rgba(4,7,20,0.92) 0%,
               rgba(4,7,20,0.60) 35%,
               rgba(4,7,20,0.10) 65%,
               transparent 100%
             )`,
           }} />

      {/* Subtle bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t
                      from-[#040714]/50 via-transparent to-transparent" />

      {/* Text content — genre-styled title */}
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <h3
          className="leading-tight line-clamp-2 mb-1"
          style={{
            fontFamily: genreStyle.fontFamily,
            fontSize: 'clamp(0.9rem, 1.8vw, 1.25rem)',
            fontWeight: genreStyle.fontWeight,
            letterSpacing: genreStyle.letterSpacing,
            textTransform: genreStyle.textTransform,
            fontStyle: genreStyle.fontStyle,
            color: genreStyle.color,
            textShadow: genreStyle.textShadow,
          }}
        >
          {collection.name}
        </h3>

        {/* Film count + Explore — visible on hover */}
        <div className="flex items-center gap-3
                        opacity-0 group-hover:opacity-100
                        translate-y-1 group-hover:translate-y-0
                        transition-all duration-300">
          {collection.parts_count > 0 && (
            <span className="text-[11px] text-white/45">
              {t('collections.filmCount', { count: collection.parts_count })}
            </span>
          )}
          <span className="text-xs font-semibold text-white/80 flex items-center gap-1">
            {t('collections.exploreUniverse')}
            <ChevronRight className="w-3.5 h-3.5 text-white/60" />
          </span>
        </div>
      </div>
    </button>
  );
}
