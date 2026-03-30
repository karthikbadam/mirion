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
 * Count Fragment components in children tree.
 * Looks for elements with `data-mirion-fragment` convention (via className check)
 * or elements that have `animation` + `order` props (Fragment signature).
 * Returns total count or max explicit order, whichever is greater.
 */
function countFragments(children: ReactNode): number {
  let count = 0;
  let maxOrder = 0;

  function walk(node: ReactNode) {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      const props = child.props as Record<string, unknown>;
      // Detect Fragment by its characteristic props (animation is Fragment-specific)
      const isFragment = "animation" in props || typeof props.order === "number";
      if (isFragment) {
        count++;
        if (typeof props.order === "number") {
          maxOrder = Math.max(maxOrder, props.order as number);
        }
      }
      if (props.children) {
        walk(props.children as ReactNode);
      }
    });
  }

  walk(children);
  return Math.max(count, maxOrder);
}

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
  const fragmentCount = countFragments(children);
  const transition = vertTrans ?? deck.transition;

  // Register on mount
  useEffect(() => {
    deck.dispatch({
      type: "REGISTER_SLIDE",
      entry: { id, h, v, fragmentCount, notes: "", transition },
    });
    return () => {
      deck.dispatch({ type: "UNREGISTER_SLIDE", id });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update fragment count when children change
  useEffect(() => {
    deck.dispatch({ type: "SET_FRAGMENT_COUNT", id, count: fragmentCount });
  }, [fragmentCount, deck.dispatch, id]);

  let slideState: "active" | "past" | "future";
  if (isActive) {
    slideState = "active";
  } else if (h < deck.state.h || (h === deck.state.h && v < deck.state.v)) {
    slideState = "past";
  } else {
    slideState = "future";
  }

  const ctxValue = useMemo(
    () => ({ id, h, v, isActive, fragmentIndex }),
    [id, h, v, isActive, fragmentIndex]
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

  if (isVertical) {
    // Parent container for vertical slides — provides SlideContext with h for children
    const parentCtx = useMemo(() => ({ id: `${h}`, h, v: -1, isActive: false, fragmentIndex: 0 }), [h]);
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
  const fragmentCount = countFragments(children);

  // Register on mount
  useEffect(() => {
    deck.dispatch({
      type: "REGISTER_SLIDE",
      entry: { id, h, v, fragmentCount, notes: "", transition: resolvedTransition },
    });
    return () => {
      deck.dispatch({ type: "UNREGISTER_SLIDE", id });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update fragment count
  useEffect(() => {
    deck.dispatch({ type: "SET_FRAGMENT_COUNT", id, count: fragmentCount });
  }, [fragmentCount, deck.dispatch, id]);

  let slideState: "active" | "past" | "future";
  if (isActive) {
    slideState = "active";
  } else if (h < deck.state.h) {
    slideState = "past";
  } else {
    slideState = "future";
  }

  const ctxValue = useMemo(
    () => ({ id, h, v, isActive, fragmentIndex }),
    [id, h, v, isActive, fragmentIndex]
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
