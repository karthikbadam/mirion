import { useEffect, useRef } from "react";
import type { DeckState, DeckAction } from "../core/types";

export function useHash(
  state: DeckState,
  dispatch: React.Dispatch<DeckAction>,
  enabled: boolean
) {
  const isUpdatingFromHash = useRef(false);

  // On mount, read hash and navigate
  useEffect(() => {
    if (!enabled) return;

    function parseHash(): { h: number; v: number; fragment?: number } | null {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return null;
      const parts = hash.split("/").filter(Boolean);
      const h = parseInt(parts[0], 10);
      const v = parts[1] ? parseInt(parts[1], 10) : 0;
      const fragment = parts[2] ? parseInt(parts[2], 10) : undefined;
      if (isNaN(h)) return null;
      return { h, v, fragment };
    }

    function onHashChange() {
      const target = parseHash();
      if (target) {
        isUpdatingFromHash.current = true;
        dispatch({ type: "GO_TO", h: target.h, v: target.v, fragment: target.fragment });
        requestAnimationFrame(() => {
          isUpdatingFromHash.current = false;
        });
      }
    }

    onHashChange();

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [enabled, dispatch]);

  // Sync state to hash: #h or #h/v or #h/v/f
  useEffect(() => {
    if (!enabled || isUpdatingFromHash.current) return;
    let hash = `#${state.h}`;
    if (state.v > 0 || state.fragment > 0) {
      hash += `/${state.v}`;
    }
    if (state.fragment > 0) {
      hash += `/${state.fragment}`;
    }
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [enabled, state.h, state.v, state.fragment]);
}
