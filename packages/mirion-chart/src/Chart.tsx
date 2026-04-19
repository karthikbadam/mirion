import { type ReactElement, useMemo } from "react";
import {
  LineChart,
  BarChart,
  GroupedBarChart,
  AreaChart,
  StackedAreaChart,
  Scatterplot,
  Histogram,
  BoxPlot,
  PieChart,
} from "semiotic/ai";
import type { Row, ScalarValue } from "./util/inferScale.js";
import { inferScale } from "./util/inferScale.js";
import { useMeasuredWidth } from "./util/useMeasuredWidth.js";
import { toPixels } from "./util/toPixels.js";
import { formatNumber } from "./util/formatNumber.js";
import { MIRION_PALETTE } from "./theme/semiotic-theme.js";
import { MirionThemeProvider } from "./theme/apply.js";
import { TableChart } from "./charts/Table.js";

export type ChartKind =
  | "line"
  | "bar"
  | "area"
  | "scatter"
  | "histogram"
  | "box"
  | "pie"
  | "table";

export interface ChartProps {
  kind: ChartKind;
  data: Row[];
  x?: string;
  y?: string;
  color?: string;
  title?: string;
  /** Fixed width in px (number) or any CSS unit (`"40rem"`). Omit for responsive width. */
  width?: number | string;
  /** Height in px (number) or any CSS unit (`"30rem"`). Default: `"30rem"`. */
  height?: number | string;
  theme?: "light" | "dark" | "auto";
  showLegend?: boolean;
  showGrid?: boolean;
  curve?:
    | "linear"
    | "monotoneX"
    | "monotoneY"
    | "step"
    | "stepAfter"
    | "stepBefore"
    | "basis"
    | "cardinal"
    | "catmullRom";
  stacked?: boolean;
  /** Override the categorical palette. Defaults to the Mirion muted palette. */
  palette?: readonly string[];
  /** Label rendered under the x-axis. */
  xLabel?: string;
  /** Label rendered to the left of the y-axis. */
  yLabel?: string;
  /**
   * Custom x-axis tick formatter. Defaults vary by scale type:
   * numeric → `formatNumber` (k/M/B), time/ordinal → raw value.
   */
  xFormat?: (v: unknown) => string;
  /**
   * Custom y-axis tick formatter.
   * Defaults to `formatNumber` (k/M/B) for numeric y axes.
   */
  yFormat?: (v: unknown) => string;
}

/** Keep accessor typing loose; Semiotic's accessor types accept `string`. */
type Acc = string;

function parseMaybeDate(v: ScalarValue): number | ScalarValue {
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return v;
}

/** Coerce a column to numeric timestamps if it looks like a time column. */
function withTimeMaterialized(data: Row[], key: string): Row[] {
  return data.map((r) => ({ ...r, [key]: parseMaybeDate(r[key] as ScalarValue) }));
}

export function Chart(props: ChartProps): ReactElement {
  const {
    kind,
    data,
    x,
    y,
    color,
    title,
    width,
    height = "30rem",
    theme: themeMode = "auto",
    showLegend,
    showGrid = true,
    curve = "monotoneX",
    stacked = false,
    palette,
    xLabel,
    yLabel,
    xFormat,
    yFormat,
  } = props;

  const pal = useMemo(() => (palette ? [...palette] : [...MIRION_PALETTE]), [palette]);
  const primary = pal[0]!;
  const [measureRef, measuredWidth] = useMeasuredWidth();
  const resolvedHeight = toPixels(height, 480);
  const resolvedWidth = width !== undefined ? toPixels(width, 0) : undefined;

  const xScaleType = useMemo<"linear" | "time" | undefined>(() => {
    if (!x) return undefined;
    const k = inferScale(data, x);
    if (k === "time") return "time";
    if (k === "linear") return "linear";
    return undefined;
  }, [data, x]);

  const preparedData = useMemo(
    () => (xScaleType === "time" && x ? withTimeMaterialized(data, x) : data),
    [data, x, xScaleType],
  );

  if (kind === "table") {
    return <TableChart data={data} title={title} />;
  }

  if (!x) {
    throw new Error(`Chart kind "${kind}" requires an \`x\` prop.`);
  }

  // Measure parent width and pass it explicitly. Semiotic's responsiveWidth
  // is unreliable inside transformed / auto-sized parents (e.g. Mirion slides),
  // so we drive the width via ResizeObserver.
  const effectiveWidth = resolvedWidth ?? measuredWidth ?? 0;
  const canRender = effectiveWidth > 0;

  // For single-series charts (no colorBy), force the palette's primary hue so
  // Semiotic doesn't fall back to its default theme primary.
  const monoColor = color ? undefined : primary;

  // Default y-axis ticks to k/M/B formatting; x ticks only when the scale is numeric.
  const yFormatFn = yFormat ?? formatNumber;
  const xFormatFn =
    xFormat ?? (xScaleType === "linear" ? formatNumber : undefined);

  const baseProps = {
    data: preparedData,
    width: effectiveWidth,
    height: resolvedHeight,
    title,
    className: "mirion-chart",
    colorScheme: pal,
    xLabel,
    yLabel,
    xFormat: xFormatFn,
    yFormat: yFormatFn,
  } as const;

  let chart: ReactElement | null = null;

  switch (kind) {
    case "line":
      if (!y) throw new Error('Chart kind "line" requires a `y` prop.');
      chart = (
        <LineChart
          {...baseProps}
          xAccessor={x as Acc}
          yAccessor={y as Acc}
          xScaleType={xScaleType}
          lineBy={color as Acc | undefined}
          colorBy={color as Acc | undefined}
          color={monoColor}
          showGrid={showGrid}
          showLegend={showLegend ?? Boolean(color)}
          curve={curve}
        />
      );
      break;

    case "area":
      if (!y) throw new Error('Chart kind "area" requires a `y` prop.');
      if (stacked && color) {
        chart = (
          <StackedAreaChart
            {...baseProps}
            xAccessor={x as Acc}
            yAccessor={y as Acc}
            areaBy={color as Acc}
            xScaleType={xScaleType}
            showGrid={showGrid}
            showLegend={showLegend ?? true}
          />
        );
      } else {
        chart = (
          <AreaChart
            {...baseProps}
            xAccessor={x as Acc}
            yAccessor={y as Acc}
            xScaleType={xScaleType}
            areaBy={color as Acc | undefined}
            colorBy={color as Acc | undefined}
            color={monoColor}
            showGrid={showGrid}
            showLegend={showLegend ?? Boolean(color)}
          />
        );
      }
      break;

    case "bar":
      if (!y) throw new Error('Chart kind "bar" requires a `y` prop.');
      if (color) {
        chart = (
          <GroupedBarChart
            {...baseProps}
            categoryAccessor={x as Acc}
            valueAccessor={y as Acc}
            groupBy={color as Acc}
            showLegend={showLegend ?? true}
          />
        );
      } else {
        chart = (
          <BarChart
            {...baseProps}
            categoryAccessor={x as Acc}
            valueAccessor={y as Acc}
            color={monoColor}
            showLegend={showLegend ?? false}
          />
        );
      }
      break;

    case "scatter":
      if (!y) throw new Error('Chart kind "scatter" requires a `y` prop.');
      chart = (
        <Scatterplot
          {...baseProps}
          xAccessor={x as Acc}
          yAccessor={y as Acc}
          colorBy={color as Acc | undefined}
          color={monoColor}
          showGrid={showGrid}
          showLegend={showLegend ?? Boolean(color)}
        />
      );
      break;

    case "histogram":
      chart = (
        <Histogram
          {...baseProps}
          valueAccessor={x as Acc}
          colorBy={color as Acc | undefined}
          color={monoColor}
          showLegend={showLegend ?? Boolean(color)}
        />
      );
      break;

    case "box":
      if (!y) throw new Error('Chart kind "box" requires a `y` prop.');
      chart = (
        <BoxPlot
          {...baseProps}
          categoryAccessor={x as Acc}
          valueAccessor={y as Acc}
          colorBy={color as Acc | undefined}
        />
      );
      break;

    case "pie":
      if (!y) throw new Error('Chart kind "pie" requires a `y` prop.');
      chart = (
        <PieChart
          {...baseProps}
          valueAccessor={y as Acc}
          categoryAccessor={(color ?? x) as Acc}
          colorBy={(color ?? x) as Acc}
        />
      );
      break;

    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown chart kind: ${String(_exhaustive)}`);
    }
  }

  return (
    <div
      ref={measureRef}
      className="mirion-chart-wrap"
      style={{ width: "100%", minHeight: resolvedHeight }}
    >
      {canRender && (
        <MirionThemeProvider mode={themeMode} palette={pal}>
          {chart}
        </MirionThemeProvider>
      )}
    </div>
  );
}
