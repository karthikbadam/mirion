import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * Observe a container's width via ResizeObserver and return a live measurement.
 * SSR-safe (returns null until client-mount).
 *
 * Returns a tuple `[ref, width]`. Attach the ref to a DOM node; `width` reflects
 * the node's current `contentRect.width`, or `null` before first measurement.
 */
export function useMeasuredWidth(): [RefObject<HTMLDivElement | null>, number | null] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || typeof ResizeObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const initial = Math.floor(el.getBoundingClientRect().width);
    if (initial > 0) setWidth(initial);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}
