import { useMemo, type ReactElement } from "react";
import { ThemeProvider } from "semiotic/ai";
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
import { resolveMirionTheme } from "./theme/semiotic-theme.js";
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
  width?: number;
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
    width = 720,
    height = 360,
    theme: themeMode = "auto",
    showLegend,
    showGrid = true,
    curve = "monotoneX",
    stacked = false,
  } = props;

  const theme = useMemo(() => resolveMirionTheme(themeMode), [themeMode]);

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

  const baseProps = {
    data: preparedData,
    width,
    height,
    title,
    className: "mirion-chart",
  } as const;

  let element: ReactElement;

  switch (kind) {
    case "line":
      if (!y) throw new Error('Chart kind "line" requires a `y` prop.');
      element = (
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
      break;

    case "area":
      if (!y) throw new Error('Chart kind "area" requires a `y` prop.');
      if (stacked && color) {
        element = (
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
        element = (
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
      }
      break;

    case "bar":
      if (!y) throw new Error('Chart kind "bar" requires a `y` prop.');
      if (color) {
        element = (
          <GroupedBarChart
            {...baseProps}
            categoryAccessor={x as Acc}
            valueAccessor={y as Acc}
            groupBy={color as Acc}
            showLegend={showLegend ?? true}
          />
        );
      } else {
        element = (
          <BarChart
            {...baseProps}
            categoryAccessor={x as Acc}
            valueAccessor={y as Acc}
            showLegend={showLegend ?? false}
          />
        );
      }
      break;

    case "scatter":
      if (!y) throw new Error('Chart kind "scatter" requires a `y` prop.');
      element = (
        <Scatterplot
          {...baseProps}
          xAccessor={x as Acc}
          yAccessor={y as Acc}
          colorBy={color as Acc | undefined}
          showGrid={showGrid}
          showLegend={showLegend ?? Boolean(color)}
        />
      );
      break;

    case "histogram":
      element = (
        <Histogram
          {...baseProps}
          valueAccessor={x as Acc}
          colorBy={color as Acc | undefined}
          showLegend={showLegend ?? Boolean(color)}
        />
      );
      break;

    case "box":
      if (!y) throw new Error('Chart kind "box" requires a `y` prop.');
      element = (
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
      element = (
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

  return <ThemeProvider theme={theme}>{element}</ThemeProvider>;
}
