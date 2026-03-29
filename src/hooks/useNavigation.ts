import { useEffect, useCallback } from "react";
import type { DeckAction, DeckState } from "../core/types";

interface UseNavigationOptions {
  state: DeckState;
  dispatch: React.Dispatch<DeckAction>;
  keyboard?: boolean;
  touch?: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  onOpenSpeaker?: () => void;
}

export function useNavigation({
  state,
  dispatch,
  keyboard = true,
  touch = true,
  containerRef,
  onOpenSpeaker,
}: UseNavigationOptions) {
  const handleNext = useCallback(() => dispatch({ type: "NEXT" }), [dispatch]);
  const handlePrev = useCallback(() => dispatch({ type: "PREV" }), [dispatch]);

  // Keyboard
  useEffect(() => {
    if (!keyboard) return;

    function onKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Overview mode: arrow keys navigate the grid, Enter/Space selects
      if (state.overview) {
        switch (e.key) {
          case "Escape":
            e.preventDefault();
            dispatch({ type: "TOGGLE_OVERVIEW" });
            return;
          case "ArrowRight":
            e.preventDefault();
            dispatch({ type: "GO_TO", h: state.h + 1, v: 0 });
            return;
          case "ArrowLeft":
            e.preventDefault();
            dispatch({ type: "GO_TO", h: state.h - 1, v: 0 });
            return;
          case "ArrowDown":
            e.preventDefault();
            dispatch({ type: "GO_TO", h: state.h, v: state.v + 1 });
            return;
          case "ArrowUp":
            e.preventDefault();
            dispatch({ type: "GO_TO", h: state.h, v: state.v - 1 });
            return;
          case " ":
          case "Enter":
            e.preventDefault();
            dispatch({ type: "TOGGLE_OVERVIEW" });
            return;
          default:
            return;
        }
      }

      // Normal mode
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
        case "Enter":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "Backspace":
          e.preventDefault();
          handlePrev();
          break;
        case "Home":
          e.preventDefault();
          dispatch({ type: "GO_TO", h: 0, v: 0 });
          break;
        case "End":
          e.preventDefault();
          dispatch({ type: "GO_TO", h: Number.MAX_SAFE_INTEGER, v: Number.MAX_SAFE_INTEGER });
          break;
        case "Escape":
          e.preventDefault();
          dispatch({ type: "TOGGLE_OVERVIEW" });
          break;
        case "s":
        case "S":
          if (!e.ctrlKey && !e.metaKey) {
            onOpenSpeaker?.();
          }
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboard, state.overview, state.h, state.v, handleNext, handlePrev, dispatch, onOpenSpeaker]);

  // Touch/swipe — disabled in overview mode
  useEffect(() => {
    if (!touch || state.overview) return;
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 50) return;

      if (absDx > absDy) {
        if (dx < 0) handleNext();
        else handlePrev();
      } else {
        if (dy < 0) handleNext();
        else handlePrev();
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [touch, state.overview, containerRef, handleNext, handlePrev]);
}
