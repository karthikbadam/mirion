import { useEffect, useState, useCallback } from "react";

export function useAutoScale(
  containerRef: React.RefObject<HTMLElement | null>,
  width: number,
  height: number
) {
  const [scale, setScale] = useState(1);

  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const scaleX = parent.clientWidth / width;
    const scaleY = parent.clientHeight / height;
    setScale(Math.min(scaleX, scaleY));
  }, [containerRef, width, height]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    recalculate();

    const ro = new ResizeObserver(recalculate);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [containerRef, recalculate]);

  return scale;
}
