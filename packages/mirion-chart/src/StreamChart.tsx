import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { RealtimeLineChart, RealtimeHistogram } from "semiotic/ai";
import type { Row } from "./util/inferScale.js";
import { useMeasuredWidth } from "./util/useMeasuredWidth.js";
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
  timeKey?: string;
  valueKey: string;
  initialData?: Row[];
  source?: (handle: StreamHandle) => void | (() => void);
  title?: string;
  width?: number;
  height?: number;
  windowSize?: number;
  timeExtent?: [number, number];
  valueExtent?: [number, number];
  palette?: readonly string[];
  /** Format for x-axis tick labels. Defaults to HH:MM:SS from Unix ms. */
  tickFormatTime?: (v: number) => string;
  /** Format for y-axis tick labels. */
  tickFormatValue?: (v: number) => string;
}

/** Default: wall-clock HH:MM:SS if the value looks like a Unix ms timestamp. */
function defaultTimeTickFormat(v: number): string {
  // Heuristic: values > year 2001 in ms are treated as epoch times.
  if (v > 1_000_000_000_000) {
    const d = new Date(v);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return String(v);
}

/**
 * A streaming chart wrapper around Semiotic's Realtime* frames.
 *
 * Uses controlled data: points flow in via `source`'s {@link StreamHandle},
 * which appends to a bounded React state array that's passed as Semiotic's
 * `data` prop. Simpler and more predictable than the ref-based push API —
 * re-renders are fine at typical streaming rates (≤ 20 Hz).
 *
 * Width: Realtime frames require a concrete `width` number (no
 * `responsiveWidth`), so we measure the parent via ResizeObserver when
 * `width` is not fixed.
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
  tickFormatTime,
  tickFormatValue,
}: StreamChartProps): ReactElement {
  const effectiveWindow = windowSize ?? (kind === "histogram" ? 500 : 120);
  const [rows, setRows] = useState<Row[]>(() => initialData ?? []);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  // Stable handle — reads latest rows via a ref so `source` consumers can push
  // from async callbacks without closure staleness.
  const handle = useMemo<StreamHandle>(
    () => ({
      push: (p) => {
        const next = [...rowsRef.current, p];
        setRows(next.length > effectiveWindow ? next.slice(-effectiveWindow) : next);
      },
      pushMany: (ps) => {
        const next = [...rowsRef.current, ...ps];
        setRows(next.length > effectiveWindow ? next.slice(-effectiveWindow) : next);
      },
      clear: () => setRows([]),
    }),
    [effectiveWindow],
  );

  useEffect(() => {
    if (!source) return;
    const cleanup = source(handle);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [source, handle]);

  const [measureRef, measuredWidth] = useMeasuredWidth();

  if (kind === "line" && !timeKey) {
    throw new Error('StreamChart kind="line" requires a `timeKey` prop.');
  }

  const stroke = (palette ?? MIRION_PALETTE)[0]!;
  const effectiveWidth = width ?? measuredWidth ?? 0;
  const canRender = effectiveWidth > 0;

  return (
    <div
      ref={measureRef}
      className="mirion-chart-stream"
      style={{ width: "100%", minHeight: height }}
    >
      {canRender && kind === "histogram" && (
        <RealtimeHistogram
          data={rows}
          valueAccessor={valueKey}
          width={effectiveWidth}
          height={height}
          windowSize={effectiveWindow}
          stroke={stroke}
          className="mirion-chart"
          title={title}
        />
      )}
      {canRender && kind === "line" && (
        <RealtimeLineChart
          data={rows}
          timeAccessor={timeKey!}
          valueAccessor={valueKey}
          width={effectiveWidth}
          height={height}
          windowSize={effectiveWindow}
          timeExtent={timeExtent}
          valueExtent={valueExtent}
          stroke={stroke}
          showAxes
          className="mirion-chart"
          title={title}
          tickFormatTime={tickFormatTime ?? defaultTimeTickFormat}
          tickFormatValue={tickFormatValue}
        />
      )}
    </div>
  );
}
