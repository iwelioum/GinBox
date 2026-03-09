// HeroBanner.tsx -- Cinematic hero v3 (composer)
//
// Sub-components: HeroSlide, HeroIndicators
// Hooks:          useHeroRotation, useDominantColor
// Shared logic:   heroBannerUtils

import * as React        from 'react';
import { useQueries }    from '@tanstack/react-query';
import { endpoints }     from '@/shared/api/client';
import { extractLogo }   from '@/shared/utils/tmdb';
import type { CatalogMeta } from '@/shared/types';
import { MAX_SLIDES }       from './heroBannerUtils';
import { useHeroRotation }  from './useHeroRotation';
import { useDominantColor } from './useDominantColor';
import { HeroSlide }        from './HeroSlide';
import { HeroIndicators }   from './HeroIndicators';

// -- Types -------------------------------------------------------------------

interface HeroBannerProps {
  items: CatalogMeta[];
}

// -- HeroBanner ---------------------------------------------------------------

const HeroBanner: React.FC<HeroBannerProps> = ({ items }) => {
  const slides = items.slice(0, MAX_SLIDES);

  const {
    current, direction, paused,
    setCurrent, setDirection, setPaused,
  } = useHeroRotation(slides.length);

  // Fanart logos (preloaded for all slides)
  const fanartQueries = useQueries({
    queries: slides.map(item => {
      const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
      const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';
      return {
        queryKey:  ['hero-fanart-home', fanartType, tmdbId] as const,
        queryFn:   () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
        staleTime: Infinity,
      };
    }),
  });

  if (slides.length === 0) return null;

  const safeIdx      = Math.min(current, slides.length - 1);
  const item         = slides[safeIdx];
  const heroLogo     = extractLogo(fanartQueries[safeIdx]?.data);
  const dominantTint = useDominantColor(item);

  const handleDotSelect = (i: number) => {
    setDirection(i > safeIdx ? 1 : -1);
    setCurrent(i);
    setPaused(false);
  };

  return (
    <div
      style={{
        position:    'relative',
        marginLeft:  'calc(-3.5vw - 5px)',
        marginRight: 'calc(-3.5vw - 5px)',
        marginTop:   0,
        height:      '65vh',
        minHeight:    520,
        overflow:    'hidden',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <HeroSlide
        item={item}
        safeIdx={safeIdx}
        direction={direction}
        paused={paused}
        dominantTint={dominantTint}
        heroLogo={heroLogo}
        slideCount={slides.length}
      />

      {slides.length > 1 && (
        <HeroIndicators
          slides={slides}
          safeIdx={safeIdx}
          paused={paused}
          onSelect={handleDotSelect}
        />
      )}
    </div>
  );
};

export { HeroBanner };
