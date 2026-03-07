// useDominantColor.ts — Extracts a dominant tint from the hero image via a
// 1×1 canvas sample.  The canvas work is deferred with requestIdleCallback
// (falling back to setTimeout) so it never blocks a render frame.

import { useState, useEffect } from 'react';
import type { CatalogMeta }    from '@/shared/types';
import { DEFAULT_TINT, imgUrl } from './heroBannerUtils';

export function useDominantColor(slide: CatalogMeta | undefined): string {
  const [dominantTint, setDominantTint] = useState(DEFAULT_TINT);

  const url = slide
    ? (imgUrl(slide.backdrop_path ?? slide.background, 'original')
       ?? imgUrl(slide.poster_path ?? slide.poster, 'w1280'))
    : null;

  useEffect(() => {
    if (!url) { setDominantTint(DEFAULT_TINT); return; }

    let cancelled = false;
    const img       = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const extract = () => {
        if (cancelled) return;
        try {
          const canvas  = document.createElement('canvas');
          canvas.width  = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          const r = Math.min(Math.round(d[0] * 0.20), 32);
          const g = Math.min(Math.round(d[1] * 0.20), 32);
          const b = Math.min(Math.round(d[2] * 0.28), 46);
          setDominantTint(`rgba(${r},${g},${b},0.97)`);
        } catch (_err: unknown) {
          setDominantTint(DEFAULT_TINT);
        }
      };

      // Defer canvas work to avoid blocking renders
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(extract);
      } else {
        setTimeout(extract, 0);
      }
    };

    img.onerror = () => setDominantTint(DEFAULT_TINT);
    img.src = url;

    return () => { cancelled = true; };
  }, [url]);

  return dominantTint;
}
