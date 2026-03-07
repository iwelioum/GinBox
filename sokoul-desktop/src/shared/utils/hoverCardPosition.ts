// utils/hoverCardPosition.ts

const CARD_WIDTH  = 320;
const CARD_OFFSET = 8; // px above the original card

/** Prevents hover cards from overflowing viewport edges by clamping position and flipping vertical placement when space above is insufficient. */
export function calcHoverPosition(anchor: DOMRect): {
  top: number; left: number; transformOrigin: string;
} {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Centered horizontally on the original card
  let left = anchor.left + anchor.width / 2 - CARD_WIDTH / 2;

  // Horizontal clamp: do not exceed edges
  left = Math.max(8, Math.min(left, vw - CARD_WIDTH - 8));

  // Vertical: default above the card, otherwise below
  const estimatedHeight = 300; // approximate hover card height
  let top = anchor.top - CARD_OFFSET;
  let origin = 'bottom center';

  if (top - estimatedHeight < 8) {
    // Not enough space above → display below
    top = anchor.bottom + CARD_OFFSET;
    origin = 'top center';
  } else {
    top = top - estimatedHeight;
  }

  // Clamp vertical
  top = Math.max(8, Math.min(top, vh - estimatedHeight - 8));

  return { top, left, transformOrigin: origin };
}
