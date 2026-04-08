import { useRef, useEffect } from "react";
import { useSlide } from "../core/context";
import type { FragmentProps } from "../core/types";

// Per-slide fragment auto-order counters, keyed by "h.v" or "h".
// Reset each Deck render (same as slide counters).
const fragmentCounters = new Map<string, number>();

export function resetFragmentCounters() {
  fragmentCounters.clear();
}

function claimFragmentOrder(slideKey: string): number {
  const current = (fragmentCounters.get(slideKey) ?? 0) + 1;
  fragmentCounters.set(slideKey, current);
  return current;
}

/**
 * Step-through animation within a slide.
 * `order` is optional — omit it and fragments auto-increment by render order.
 *
 * <Fragment animation="fade-up"><p>First</p></Fragment>
 * <Fragment animation="fade-up"><p>Second</p></Fragment>
 * <Fragment order={5}><p>Explicit order 5</p></Fragment>
 */
export function Fragment({
  children,
  order: explicitOrder,
  animation = "fade-in",
  className = "",
  style,
}: FragmentProps) {
  const slide = useSlide();

  // Auto-assign order if not provided, stable via ref
  const orderRef = useRef<number | null>(null);
  if (orderRef.current === null) {
    const slideKey = `${slide.h}.${slide.v}`;
    orderRef.current = explicitOrder ?? claimFragmentOrder(slideKey);
  }
  const order = explicitOrder ?? orderRef.current;

  // Self-register with the parent Slide so it knows the correct fragment count,
  // even when this Fragment is nested inside a function component.
  useEffect(() => {
    slide.registerFragment(order);
    return () => {
      slide.unregisterFragment(order);
    };
  }, [order, slide.registerFragment, slide.unregisterFragment]);

  const visible = slide.isActive && slide.fragmentIndex >= order;

  return (
    <div
      className={`mirion-fragment ${className}`}
      data-animation={animation}
      data-visible={visible}
      aria-hidden={!visible}
      style={style}
    >
      {children}
    </div>
  );
}
