// useAmbientColor.ts — Extraction couleur dominante d'une image
// RÈGLES : Canvas 32×18px pour la perf, skip pixels trop sombres/clairs,
//          fallback silencieux si CORS échoue.

import { useState, useEffect } from 'react';

/** Provides an ambient RGB color via canvas sampling, used to tint card backgrounds and create visual continuity without the overhead of node-vibrant. */
export function useAmbientColor(imageUrl: string | undefined): string {
  const [color, setColor] = useState('30, 30, 50');

  useEffect(() => {
    if (!imageUrl) { setColor('30, 30, 50'); return; }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        // Canvas miniature pour la perf
        const canvas = document.createElement('canvas');
        canvas.width  = 32;
        canvas.height = 18;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 32, 18);
        const { data } = ctx.getImageData(0, 0, 32, 18);

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Ignorer les pixels quasi-noirs (< 25) et quasi-blancs (> 230)
          if (brightness > 25 && brightness < 230) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0 && !cancelled) {
          // Saturer légèrement la couleur (×1.2 clamped à 255)
          const sat = (v: number) => Math.min(255, Math.round((v / count) * 1.2));
          setColor(`${sat(r)}, ${sat(g)}, ${sat(b)}`);
        }
      } catch {
        // Canvas tainted (CORS) → fallback silencieux
      }
    };

    img.onerror = () => { /* fallback silencieux */ };
    img.src = imageUrl;

    return () => { cancelled = true; };
  }, [imageUrl]);

  return color;
}
