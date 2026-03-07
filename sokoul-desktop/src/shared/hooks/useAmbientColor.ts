// useAmbientColor.ts — Dominant color extraction from an image
// RULES: Canvas 32×18px for performance, skip pixels too dark/bright,
//        silent fallback if CORS fails.

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
        // Miniature canvas for performance
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
          // Ignore near-black (< 25) and near-white (> 230) pixels
          if (brightness > 25 && brightness < 230) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0 && !cancelled) {
          // Slightly saturate the color (×1.2 clamped to 255)
          const sat = (v: number) => Math.min(255, Math.round((v / count) * 1.2));
          setColor(`${sat(r)}, ${sat(g)}, ${sat(b)}`);
        }
      } catch {
        // Canvas tainted (CORS) → silent fallback
      }
    };

    img.onerror = () => { /* silent fallback */ };
    img.src = imageUrl;

    return () => { cancelled = true; };
  }, [imageUrl]);

  return color;
}
