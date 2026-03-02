/**
 * Converts raw seconds from MPV's time-pos property into a human-readable M:SS string
 * for the player progress bar. Returns '0:00' for NaN/zero to avoid broken UI.
 */
export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
