import {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Children,
  isValidElement,
  useContext,
  type ReactNode,
} from "react";
import { useDeck, SlideContext, DeckContext } from "../core/context";
import type { SlideProps, VerticalSlideProps } from "../core/types";

/**
 * Check if any direct children are Slide.Vertical
 */
function hasVerticals(children: ReactNode): boolean {
  let found = false;
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as { displayName?: string })?.displayName === "Slide.Vertical"
    ) {
      found = true;
    }
  });
  return found;
}

/**
 * Build a slide ID consistent with how Notes.tsx looks them up.
 * Flat slides: "0", "1", "2"
 * Vertical slides: "1.0", "1.1", "1.2"
 */
function slideId(h: number, v: number, isVertical: boolean): string {
  return isVertical ? `${h}.${v}` : `${h}`;
}

/**
 * Hook that provides fragment registration callbacks. Each Fragment calls
 * registerFragment(order) on mount and unregisterFragment(order) on unmount.
 * The hook batches updates via requestAnimationFrame and dispatches
 * SET_FRAGMENT_COUNT with the max registered order.
 */
function useFragmentRegistration(
  dispatch: (action: { type: "SET_FRAGMENT_COUNT"; id: string; count: number }) => void,
  id: string,
) {
  const ordersRef = useRef(new Set<number>());
  const pendingRef = useRef<number | null>(null);

  const scheduleUpdate = useCallback(() => {
    if (pendingRef.current !== null) {
      cancelAnimationFrame(pendingRef.current);
    }
    pendingRef.current = requestAnimationFrame(() => {
      pendingRef.current = null;
      const orders = ordersRef.current;
      const maxOrder = orders.size > 0 ? Math.max(...orders) : 0;
      dispatch({ type: "SET_FRAGMENT_COUNT", id, count: maxOrder });
    });
  }, [dispatch, id]);

  const registerFragment = useCallback(
    (order: number) => {
      ordersRef.current.add(order);
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  const unregisterFragment = useCallback(
    (order: number) => {
      ordersRef.current.delete(order);
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  // Clean up pending rAF on unmount
  useEffect(() => {
    return () => {
      if (pendingRef.current !== null) {
        cancelAnimationFrame(pendingRef.current);
      }
    };
  }, []);

  return { registerFragment, unregisterFragment };
}

// --- Vertical sub-slide ---

export function Vertical({ children, transition: vertTrans, className = "", style }: VerticalSlideProps) {
  const deck = useContext(DeckContext);
  const parentSlide = useContext(SlideContext);
  if (!deck || !parentSlide) return null;

  const h = parentSlide.h;

  // Claim vertical index from Deck-scoped counter (stable via ref)
  const indexRef = useRef<number | null>(null);
  if (indexRef.current === null) {
    const current = deck.counters.vMap.get(h) ?? 0;
    deck.counters.vMap.set(h, current + 1);
    indexRef.current = current;
  }
  const v = indexRef.current;
  const id = slideId(h, v, true);

  const isActive = deck.state.h === h && deck.state.v === v;
  const fragmentIndex = isActive ? deck.state.fragment : 0;
  const transition = vertTrans ?? deck.transition;

  const { registerFragment, unregisterFragment } = useFragmentRegistration(deck.dispatch, id);

  // Register on mount
  useEffect(() => {
    deck.dispatch({
      type: "REGISTER_SLIDE",
      entry: { id, h, v, fragmentCount: 0, notes: "", transition },
    });
    return () => {
      deck.dispatch({ type: "UNREGISTER_SLIDE", id });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let slideState: "active" | "past" | "future";
  if (isActive) {
    slideState = "active";
  } else if (h < deck.state.h || (h === deck.state.h && v < deck.state.v)) {
    slideState = "past";
  } else {
    slideState = "future";
  }

  const ctxValue = useMemo(
    () => ({ id, h, v, isActive, fragmentIndex, registerFragment, unregisterFragment }),
    [id, h, v, isActive, fragmentIndex, registerFragment, unregisterFragment],
  );

  // Overview mode
  const overviewTransform = deck.overview ? deck.overviewTransforms[id] : undefined;
  const isOverviewActive = deck.overview && h === deck.state.h && v === deck.state.v;

  const handleClick = useCallback(() => {
    if (deck.overview) {
      deck.dispatch({ type: "GO_TO", h, v });
      deck.dispatch({ type: "TOGGLE_OVERVIEW" });
    }
  }, [deck, h, v]);

  const verticalStyle = {
    ...style,
    ...(deck.overview && overviewTransform
      ? { transform: overviewTransform, cursor: "pointer" as const }
      : {}),
  };

  return (
    <SlideContext.Provider value={ctxValue}>
      <div
        className={`mirion-slide ${className}`}
        data-state={slideState}
        data-transition={transition}
        data-overview={deck.overview || undefined}
        data-overview-active={isOverviewActive || undefined}
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${h + 1}.${v + 1}`}
        aria-hidden={!isActive && !deck.overview}
        style={verticalStyle}
        onClick={handleClick}
      >
        {children}
      </div>
    </SlideContext.Provider>
  );
}
Vertical.displayName = "Slide.Vertical";

// --- Slide ---

function SlideComponent({ children, transition: slideTrans, className = "", style }: SlideProps) {
  const deck = useDeck();

  // Claim horizontal index from Deck-scoped counter (stable via ref)
  const indexRef = useRef<number | null>(null);
  if (indexRef.current === null) {
    indexRef.current = deck.counters.h++;
  }
  const h = indexRef.current;
  const resolvedTransition = slideTrans ?? deck.transition;
  const isVertical = hasVerticals(children);

  // Fragment registration — used by flat slides only, but hooks must be called unconditionally
  const { registerFragment, unregisterFragment } = useFragmentRegistration(deck.dispatch, `${h}`);
  const noopRegister = useCallback(() => {}, []);
  const noopUnregister = useCallback(() => {}, []);

  if (isVertical) {
    // Parent container for vertical slides — provides SlideContext with h for children
    const parentCtx = useMemo(
      () => ({ id: `${h}`, h, v: -1, isActive: false, fragmentIndex: 0, registerFragment: noopRegister, unregisterFragment: noopUnregister }),
      [h, noopRegister, noopUnregister],
    );
    return (
      <SlideContext.Provider value={parentCtx}>
        {children}
      </SlideContext.Provider>
    );
  }

  // Regular flat slide
  const v = 0;
  const id = slideId(h, v, false);
  const isActive = deck.state.h === h && deck.state.v === v;
  const fragmentIndex = isActive ? deck.state.fragment : 0;

  // Register on mount
  useEffect(() => {
    deck.dispatch({
      type: "REGISTER_SLIDE",
      entry: { id, h, v, fragmentCount: 0, notes: "", transition: resolvedTransition },
    });
    return () => {
      deck.dispatch({ type: "UNREGISTER_SLIDE", id });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let slideState: "active" | "past" | "future";
  if (isActive) {
    slideState = "active";
  } else if (h < deck.state.h) {
    slideState = "past";
  } else {
    slideState = "future";
  }

  const ctxValue = useMemo(
    () => ({ id, h, v, isActive, fragmentIndex, registerFragment, unregisterFragment }),
    [id, h, v, isActive, fragmentIndex, registerFragment, unregisterFragment],
  );

  // Overview mode
  const overviewTransform = deck.overview ? deck.overviewTransforms[id] : undefined;
  const isOverviewActive = deck.overview && h === deck.state.h && v === deck.state.v;

  const handleClick = useCallback(() => {
    if (deck.overview) {
      deck.dispatch({ type: "GO_TO", h, v });
      deck.dispatch({ type: "TOGGLE_OVERVIEW" });
    }
  }, [deck, h, v]);

  const slideStyle = {
    ...style,
    ...(deck.overview && overviewTransform
      ? { transform: overviewTransform, cursor: "pointer" as const }
      : {}),
  };

  return (
    <SlideContext.Provider value={ctxValue}>
      <div
        className={`mirion-slide ${className}`}
        data-state={slideState}
        data-transition={resolvedTransition}
        data-overview={deck.overview || undefined}
        data-overview-active={isOverviewActive || undefined}
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${h + 1}`}
        aria-hidden={!isActive && !deck.overview}
        style={slideStyle}
        onClick={handleClick}
      >
        {children}
      </div>
    </SlideContext.Provider>
  );
}

export const Slide = Object.assign(SlideComponent, { Vertical });
