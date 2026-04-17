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
import { MIRION_PALETTE } from "./theme/semiotic-theme.js";
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
  /** Fixed pixel width. Omit to fit the parent container (responsive). */
  width?: number;
  /** Pixel height. Default: 320 (desktop) / 240 (narrow viewports via CSS clamp). */
  height?: number;
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
    height = 320,
    showLegend,
    showGrid = true,
    curve = "monotoneX",
    stacked = false,
    palette,
  } = props;

  const colorScheme = useMemo(
    () => (palette ? [...palette] : [...MIRION_PALETTE]),
    [palette],
  );

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

  // Default to responsive width (fits parent) when width is not pinned.
  // Explicit width wins; otherwise responsiveWidth makes the chart fluid.
  const sizeProps =
    width !== undefined
      ? { width, height }
      : { responsiveWidth: true, height };

  const baseProps = {
    data: preparedData,
    ...sizeProps,
    title,
    className: "mirion-chart",
    colorScheme,
  } as const;

  switch (kind) {
    case "line":
      if (!y) throw new Error('Chart kind "line" requires a `y` prop.');
      return (
        <LineChart
          {...baseProps}
          xAccessor={x as Acc}
          yAccessor={y as Acc}
          xScaleType={xScaleType}
          lineBy={color as Acc | undefined}
          colorBy={color as Acc | undefined}
          showGrid={showGrid}
          showLegend={showLegend ?? Boolean(color)}
          curve={curve}
        />
      );

    case "area":
      if (!y) throw new Error('Chart kind "area" requires a `y` prop.');
      if (stacked && color) {
        return (
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
      }
      return (
        <AreaChart
          {...baseProps}
          xAccessor={x as Acc}
          yAccessor={y as Acc}
          xScaleType={xScaleType}
          areaBy={color as Acc | undefined}
          colorBy={color as Acc | undefined}
          showGrid={showGrid}
          showLegend={showLegend ?? Boolean(color)}
        />
      );

    case "bar":
      if (!y) throw new Error('Chart kind "bar" requires a `y` prop.');
      if (color) {
        return (
          <GroupedBarChart
            {...baseProps}
            categoryAccessor={x as Acc}
            valueAccessor={y as Acc}
            groupBy={color as Acc}
            showLegend={showLegend ?? true}
          />
        );
      }
      return (
        <BarChart
          {...baseProps}
          categoryAccessor={x as Acc}
          valueAccessor={y as Acc}
          showLegend={showLegend ?? false}
        />
      );

    case "scatter":
      if (!y) throw new Error('Chart kind "scatter" requires a `y` prop.');
      return (
        <Scatterplot
          {...baseProps}
          xAccessor={x as Acc}
          yAccessor={y as Acc}
          colorBy={color as Acc | undefined}
          showGrid={showGrid}
          showLegend={showLegend ?? Boolean(color)}
        />
      );

    case "histogram":
      return (
        <Histogram
          {...baseProps}
          valueAccessor={x as Acc}
          colorBy={color as Acc | undefined}
          showLegend={showLegend ?? Boolean(color)}
        />
      );

    case "box":
      if (!y) throw new Error('Chart kind "box" requires a `y` prop.');
      return (
        <BoxPlot
          {...baseProps}
          categoryAccessor={x as Acc}
          valueAccessor={y as Acc}
          colorBy={color as Acc | undefined}
        />
      );

    case "pie":
      if (!y) throw new Error('Chart kind "pie" requires a `y` prop.');
      return (
        <PieChart
          {...baseProps}
          valueAccessor={y as Acc}
          categoryAccessor={(color ?? x) as Acc}
          colorBy={(color ?? x) as Acc}
        />
      );

    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown chart kind: ${String(_exhaustive)}`);
    }
  }
}
