// utils/extractColor.ts — Dominant color extraction via canvas
// Returns { accent, muted, dark } in hex + injects CSS vars
// Fallback on failure: indigo tints

/** Three-tier color palette extracted from content images, used to theme detail pages and cards dynamically. */
export interface ColorPalette {
  accent: string; // most vivid color
  muted:  string; // dark/saturated version
  dark:   string; // very dark background
}

const FALLBACK: ColorPalette = {
  accent: '#6366f1',
  muted:  '#1e1b4b',
  dark:   '#07080f',
};

function dominantFromCanvas(canvas: HTMLCanvasElement): [number, number, number] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [99, 102, 241];

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let r = 0, g = 0, b = 0, n = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue; // skip transparent pixels
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }

  if (n === 0) return [99, 102, 241];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function darken(r: number, g: number, b: number, f: number): [number, number, number] {
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f)];
}

/** Samples a tiny 32x18 canvas for performance and resolves a color palette from any image URL, with CORS-safe fallback to indigo tones. */
export async function extractPalette(imageUrl: string): Promise<ColorPalette> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = 32;
        canvas.height = 18;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(FALLBACK); return; }

        ctx.drawImage(img, 0, 0, 32, 18);
        const [r, g, b] = dominantFromCanvas(canvas);

        const [mr, mg, mb] = darken(r, g, b, 0.35);
        const [dr, dg, db] = darken(r, g, b, 0.12);

        resolve({
          accent: toHex(r, g, b),
          muted:  toHex(mr, mg, mb),
          dark:   toHex(dr, dg, db),
        });
      } catch {
        resolve(FALLBACK);
      }
    };

    img.onerror = () => resolve(FALLBACK);

    // Add a lightweight cache-buster to work around CORS on some CDNs
    img.src = imageUrl.includes('?') ? imageUrl : `${imageUrl}?w=32`;
  });
}

/** Injects palette colors as CSS custom properties on a specific element, enabling scoped theming without global state pollution. */
export function applyPalette(el: HTMLElement, palette: ColorPalette, transitionMs = 1200) {
  el.style.setProperty('--accent',      palette.accent);
  el.style.setProperty('--accent-muted', palette.muted);
  el.style.setProperty('--accent-dark',  palette.dark);
  el.style.setProperty('--palette-transition', `${transitionMs}ms`);
}
