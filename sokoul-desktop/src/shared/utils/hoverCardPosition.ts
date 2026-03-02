// utils/hoverCardPosition.ts

const CARD_WIDTH  = 320;
const CARD_OFFSET = 8; // px au-dessus de la card originale

/** Prevents hover cards from overflowing viewport edges by clamping position and flipping vertical placement when space above is insufficient. */
export function calcHoverPosition(anchor: DOMRect): {
  top: number; left: number; transformOrigin: string;
} {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Centré horizontalement sur la card originale
  let left = anchor.left + anchor.width / 2 - CARD_WIDTH / 2;

  // Clamp horizontal : ne pas dépasser les bords
  left = Math.max(8, Math.min(left, vw - CARD_WIDTH - 8));

  // Vertical : par défaut au-dessus de la card, sinon en dessous
  const estimatedHeight = 300; // hauteur approximative du hover card
  let top = anchor.top - CARD_OFFSET;
  let origin = 'bottom center';

  if (top - estimatedHeight < 8) {
    // Pas assez de place en haut → afficher en dessous
    top = anchor.bottom + CARD_OFFSET;
    origin = 'top center';
  } else {
    top = top - estimatedHeight;
  }

  // Clamp vertical
  top = Math.max(8, Math.min(top, vh - estimatedHeight - 8));

  return { top, left, transformOrigin: origin };
}
