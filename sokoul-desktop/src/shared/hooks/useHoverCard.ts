import * as React from 'react';

interface HoverCardState {
  itemId:   string | number | null;
  anchorRect: DOMRect | null;
}

/** Manages hover card show/hide timing to prevent flicker on fast mouse movement and disables on touch devices where hover is meaningless. */
export function useHoverCard(delay = 300) {
  const [state, setState] = React.useState<HoverCardState>({
    itemId: null, anchorRect: null,
  });
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  const onEnter = React.useCallback(
    (id: string | number, rect: DOMRect) => {
      // Désactiver sur mobile / écrans tactiles
      if (window.matchMedia('(hover: none)').matches) return;

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setState({ itemId: id, anchorRect: rect });
      }, delay);
    },
    [delay]
  );

  const onLeave = React.useCallback(() => {
    clearTimeout(timerRef.current);
    setState({ itemId: null, anchorRect: null });
  }, []);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  return { ...state, onEnter, onLeave };
}
