import { useEffect, useRef, type ReactElement } from "react";
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
  /** Fixed pixel width. Omit for a fluid layout that fits the parent. */
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
 * Consumers push data via the `source` callback — Semiotic's ref-based
 * push API is bridged into a minimal {@link StreamHandle}.
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
  // Semiotic's RealtimeFrameHandle is exposed via a plain ref; we treat it as
  // opaque (no imports of its type so we stay decoupled from internals).
  const chartRef = useRef<{
    push: (p: Row) => void;
    pushMany: (p: Row[]) => void;
    clear: () => void;
  } | null>(null);

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

  const stroke = (palette ?? MIRION_PALETTE)[0]!;

  const sizeProps =
    width !== undefined
      ? { width, height }
      : { responsiveWidth: true, height };

  if (kind === "histogram") {
    return (
      <RealtimeHistogram
        ref={chartRef as never}
        data={initialData ?? []}
        valueAccessor={valueKey}
        {...sizeProps}
        windowSize={windowSize ?? 500}
        stroke={stroke}
        className="mirion-chart"
        title={title}
      />
    );
  }

  if (!timeKey) {
    throw new Error('StreamChart kind="line" requires a `timeKey` prop.');
  }

  return (
    <RealtimeLineChart
      ref={chartRef as never}
      data={initialData ?? []}
      timeAccessor={timeKey}
      valueAccessor={valueKey}
      {...sizeProps}
      windowSize={windowSize ?? 120}
      timeExtent={timeExtent}
      valueExtent={valueExtent}
      stroke={stroke}
      showAxes
      className="mirion-chart"
      title={title}
    />
  );
}
