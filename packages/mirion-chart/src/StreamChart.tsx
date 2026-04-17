import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { RealtimeLineChart, RealtimeHistogram } from "semiotic/ai";
import type { Row } from "./util/inferScale.js";
import { MIRION_PALETTE } from "./theme/semiotic-theme.js";

export type StreamKind = "line" | "histogram";

/** Minimal imperative surface the `source` callback receives. */
export interface StreamHandle {
  push(point: Row): void;
  pushMany(points: Row[]): void;
  clear(): void;
}

export interface StreamChartProps {
  kind: StreamKind;
  /** Time column (line charts). Ignored for histogram. */
  timeKey?: string;
  /** Numeric value column. Required. */
  valueKey: string;
  /** Optional initial data. */
  initialData?: Row[];
  /** Called once the handle is ready. Return a cleanup fn to stop pushing. */
  source?: (handle: StreamHandle) => void | (() => void);
  title?: string;
  /** Fixed pixel width. Omit to fit the parent container via ResizeObserver. */
  width?: number;
  /** Pixel height. Default 240. */
  height?: number;
  /** Ring-buffer size. Default 120 for line, 500 for histogram. */
  windowSize?: number;
  /** Fixed time domain for the line axis, if known. */
  timeExtent?: [number, number];
  /** Fixed value domain. */
  valueExtent?: [number, number];
  /** Override the palette. */
  palette?: readonly string[];
}

/**
 * A streaming chart wrapper around Semiotic's Realtime* frames.
 *
 * Realtime frames accept `width`/`height` as plain numbers and do NOT support
 * `responsiveWidth`. So when no fixed `width` is provided, we measure the
 * parent via ResizeObserver and pass a concrete width in. The spacer div
 * renders first at the target height to avoid layout jumps.
 */
export function StreamChart({
  kind,
  timeKey,
  valueKey,
  initialData,
  source,
  title,
  width,
  height = 240,
  windowSize,
  timeExtent,
  valueExtent,
  palette,
}: StreamChartProps): ReactElement {
  const chartRef = useRef<{
    push: (p: Row) => void;
    pushMany: (p: Row[]) => void;
    clear: () => void;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  // Observe the parent container width. Skipped when an explicit width is passed.
  useLayoutEffect(() => {
    if (width !== undefined) return;
    if (typeof window === "undefined" || typeof ResizeObserver === "undefined") return;
    const el = containerRef.current;
    if (!el) return;

    const initial = Math.floor(el.getBoundingClientRect().width);
    if (initial > 0) setMeasuredWidth(initial);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setMeasuredWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  // Wire the source → ref handle. Runs after first mount (and resubscribes when
  // source changes); cleanup stops the producer on unmount.
  useEffect(() => {
    if (!source) return;
    const handle: StreamHandle = {
      push: (p) => chartRef.current?.push(p),
      pushMany: (p) => chartRef.current?.pushMany(p),
      clear: () => chartRef.current?.clear(),
    };
    const cleanup = source(handle);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [source]);

  if (kind === "line" && !timeKey) {
    throw new Error('StreamChart kind="line" requires a `timeKey` prop.');
  }

  const stroke = (palette ?? MIRION_PALETTE)[0]!;
  const effectiveWidth = width ?? measuredWidth ?? 0;
  const canRender = effectiveWidth > 0;

  return (
    <div
      ref={containerRef}
      className="mirion-chart-stream"
      style={{ width: "100%", minHeight: height }}
    >
      {canRender && kind === "histogram" && (
        <RealtimeHistogram
          ref={chartRef as never}
          data={initialData ?? []}
          valueAccessor={valueKey}
          width={effectiveWidth}
          height={height}
          windowSize={windowSize ?? 500}
          stroke={stroke}
          className="mirion-chart"
          title={title}
        />
      )}
      {canRender && kind === "line" && (
        <RealtimeLineChart
          ref={chartRef as never}
          data={initialData ?? []}
          timeAccessor={timeKey!}
          valueAccessor={valueKey}
          width={effectiveWidth}
          height={height}
          windowSize={windowSize ?? 120}
          timeExtent={timeExtent}
          valueExtent={valueExtent}
          stroke={stroke}
          showAxes
          className="mirion-chart"
          title={title}
        />
      )}
    </div>
  );
}
