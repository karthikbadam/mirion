# @kvis/mirion-chart

Clean, modern chart components for [Mirion](https://github.com/karthikbadam/mirion) presentations. Thin, opinionated wrapper over [Semiotic v3](https://semiotic.nteract.io/) with responsive sizing, rem-based typography, and a palette tuned for slides.

## Install

```bash
pnpm add @kvis/mirion-chart semiotic react react-dom
```

Import the stylesheet once in your app entry:

```ts
import "@kvis/mirion-chart/style.css";
```

## Quick start

```tsx
import { Chart } from "@kvis/mirion-chart";

<Chart
  kind="line"
  data={[
    { month: "2024-07", revenue: 620000, segment: "Enterprise" },
    { month: "2024-08", revenue: 740000, segment: "Enterprise" },
    { month: "2024-09", revenue: 860000, segment: "Enterprise" },
  ]}
  x="month"
  y="revenue"
  color="segment"
  title="Monthly revenue"
/>
```

`<Chart>` fills its parent horizontally by default; height defaults to `30rem`.

## `<Chart>` API

| Prop          | Type                                                                                             | Default    | Notes |
|---------------|--------------------------------------------------------------------------------------------------|------------|-------|
| `kind`        | `"line" \| "bar" \| "area" \| "scatter" \| "histogram" \| "box" \| "pie" \| "table"`             | —          | Required |
| `data`        | `Row[]`                                                                                          | —          | Required |
| `x`           | `string`                                                                                         | —          | Required for all kinds except `table` |
| `y`           | `string`                                                                                         | —          | Required for `line / area / bar / scatter / box / pie` |
| `color`       | `string`                                                                                         | —          | Field name for color/grouping; triggers multi-series |
| `title`       | `string`                                                                                         | —          | Rendered inside the chart frame |
| `width`       | `number \| string`                                                                               | responsive | `480`, `"32rem"`, `"100%"` — omit to fill parent |
| `height`      | `number \| string`                                                                               | `"30rem"`  | Any CSS size; rem/em resolved at render time |
| `theme`       | `"light" \| "dark" \| "auto"`                                                                    | `"auto"`   | `"auto"` follows `prefers-color-scheme` |
| `palette`     | `readonly string[]`                                                                              | Observable10 | Override the categorical palette |
| `showLegend`  | `boolean`                                                                                        | auto       | Defaults to `true` when `color` is set |
| `showGrid`    | `boolean`                                                                                        | `true`     | |
| `curve`       | `"linear" \| "monotoneX" \| "step" \| …`                                                         | `"monotoneX"` | For line/area |
| `stacked`     | `boolean`                                                                                        | `false`    | For area charts with `color` |
| `xLabel`      | `string`                                                                                         | —          | Label rendered under the x-axis |
| `yLabel`      | `string`                                                                                         | —          | Label rendered to the left of the y-axis |
| `xFormat`     | `(v) => string`                                                                                  | `formatNumber` for numeric scales | Custom x-axis tick formatter |
| `yFormat`     | `(v) => string`                                                                                  | `formatNumber`                    | Custom y-axis tick formatter |
| `margin`      | `number \| { top?: number; right?: number; bottom?: number; left?: number }`                     | auto       | Auto-grows when `xLabel` / `yLabel` are set |
| `frameProps`  | `Record<string, unknown>`                                                                        | —          | Shallow-merged onto the underlying Semiotic frame |

### Number formatting

`<Chart>` ships with a sensible `formatNumber` default for axis ticks that turns large values into `k` / `M` / `B` suffixes. Override per chart with `xFormat` / `yFormat`:

```tsx
<Chart
  kind="bar"
  data={rows}
  x="product" y="revenue"
  yLabel="Revenue ($)"
  yFormat={(v) => `$${Number(v).toLocaleString()}`}
/>
```

### Minimal axis framing

For XY charts (line / area / scatter) Mirion passes `frameProps.axes[n].baseline: false` so only tick marks and labels render — no continuous axis line. Ordinal charts (bar / histogram / box / pie) keep Semiotic's native axis look: the value axis baseline stays visible because Semiotic's ordinal frame does not expose a prop to hide it.

Override via `frameProps` if you want the XY baselines back:

```tsx
<Chart
  kind="line"
  data={rows} x="month" y="revenue"
  frameProps={{ axes: [{ orient: "left" }, { orient: "bottom" }] }}
/>
```

### Auto-margin for axis labels

When `xLabel` or `yLabel` is set, `<Chart>` widens the corresponding margin so the rotated y-axis title doesn't collide with tick labels (`"600k"` etc.). Defaults:

| Margin    | No labels | With label |
|-----------|-----------|------------|
| left      | 64px      | 96px       |
| bottom    | 48px      | 72px       |
| top       | 32px      | 32px       |
| right     | 24px      | 24px       |

Override via the `margin` prop — pass a number for uniform inset, or an object to tweak one side:

```tsx
<Chart ... yLabel="Revenue ($)" margin={{ left: 120 }} />
```

### Kinds

- **line** — trends over time; maps to Semiotic's `LineChart`.
- **bar** — categorical values. With `color`, becomes a `GroupedBarChart`.
- **area** — like line with fill. With `color` + `stacked`, becomes `StackedAreaChart`.
- **scatter** — `x` + `y` numerics; optional `color` for series.
- **histogram** — binned distribution of a single numeric column (`x`).
- **box** — distribution per category (`x` categorical, `y` numeric).
- **pie** — categorical shares (`x` label, `y` magnitude).
- **table** — pure HTML table fallback (numerics right-aligned, `k`/`M` suffixes).

## `<StreamChart>` — live data

Wraps Semiotic's `RealtimeLineChart` / `RealtimeHistogram` for streaming input. Points flow through a controlled state array; new ticks re-render in place.

```tsx
import { StreamChart, type StreamHandle } from "@kvis/mirion-chart";

function latencySource(handle: StreamHandle) {
  const id = setInterval(() => {
    handle.push({ t: Date.now(), v: 120 + Math.random() * 40 });
  }, 500);
  return () => clearInterval(id);
}

<StreamChart
  kind="line"
  timeKey="t"
  valueKey="v"
  source={latencySource}
  height="24rem"
  title="Request latency (ms)"
/>;
```

### `<StreamChart>` props

| Prop              | Type                                              | Default           | Notes |
|-------------------|---------------------------------------------------|-------------------|-------|
| `kind`            | `"line" \| "histogram"`                           | —                 | Required |
| `timeKey`         | `string`                                          | —                 | Required for `line` |
| `valueKey`        | `string`                                          | —                 | Required |
| `source`          | `(handle) => void \| (() => void)`                | —                 | Called once on mount; return a cleanup fn |
| `initialData`     | `Row[]`                                           | `[]`              | Seed points |
| `windowSize`      | `number`                                          | 120 line / 500 hist | Ring-buffer capacity |
| `width`           | `number \| string`                                | responsive        | |
| `height`          | `number \| string`                                | `"24rem"`         | |
| `timeExtent`      | `[number, number]`                                | —                 | Lock time domain |
| `valueExtent`     | `[number, number]`                                | —                 | Lock value domain |
| `tickFormatTime`  | `(v: number) => string`                           | `HH:MM:SS` (Unix ms heuristic) | |
| `tickFormatValue` | `(v: number) => string`                           | —                 | |
| `palette`         | `readonly string[]`                               | Observable10      | |

### Handle API

```ts
interface StreamHandle {
  push(point: Row): void;
  pushMany(points: Row[]): void;
  clear(): void;
}
```

The window is bounded: pushing past `windowSize` drops the oldest points.

## Responsive sizing

Semiotic's own `responsiveWidth` is unreliable inside transformed or auto-sized parents (like Mirion's auto-scaled slides). `<Chart>` and `<StreamChart>` both:

1. Mount a wrapper `<div>` at `width: 100%`.
2. Observe its width via a shared `useMeasuredWidth` hook (`ResizeObserver`).
3. Pass the concrete pixel width to the underlying Semiotic frame.

Explicit `width` / `height` skips the measurement.

## Sizes are `rem`-first

Both `width` and `height` accept either a number (pixels) or any CSS string (`"30rem"`, `"480px"`, `"2em"`). Strings are resolved at render time against the live root font-size via `getComputedStyle(document.documentElement)`. Typography sizes are defined in rem in [`src/theme/semiotic-theme.ts`](./src/theme/semiotic-theme.ts) and resolved to pixels before being handed to Semiotic.

Defaults:

| Token              | Rem      | ≈ px @ 16 |
|--------------------|----------|-----------|
| `--mc-title-size`  | `1.75`   | 28        |
| `--mc-label-size`  | `1.375`  | 22        |
| `--mc-tick-size`   | `1.25`   | 20        |
| `--mc-legend-size` | `1.375`  | 22        |

Override in your own CSS:

```css
:root {
  --mc-tick-size: 1rem;
  --mc-palette-0: #0f172a;
}
```

## Theme

### Palette — Observable Plot's `schemeObservable10`

```
#4269d0  indigo
#efb118  gold
#ff725c  coral
#6cc5b0  teal
#3ca951  green
#ff8ab7  pink
#a463f2  purple
#97bbf5  sky
#9c6b4e  brown
#9498a0  gray
```

Override per chart with `<Chart palette={…} />`, or globally via CSS custom properties `--mc-palette-0` … `--mc-palette-9`.

### Design tokens

Full list in [`src/theme/tokens.css`](./src/theme/tokens.css):

- `--mc-font-sans` / `--mc-font-mono`
- `--mc-fg` / `--mc-fg-muted`
- `--mc-bg`
- `--mc-grid` / `--mc-axis`
- `--mc-title-size` / `--mc-label-size` / `--mc-tick-size` / `--mc-legend-size`
- `--mc-stroke`, `--mc-radius`

Dark-mode overrides are applied via `@media (prefers-color-scheme: dark)`.

### `MirionThemeProvider`

Every chart automatically wraps itself in `<MirionThemeProvider>`, which reads the live CSS tokens at mount and constructs a Semiotic theme object. No manual wiring required.

### Why a CSS-selector-based theming layer?

Semiotic's theme object defines `typography.tickSize`, `labelSize`, etc., but internally the axis renderer **hardcodes** `fontSize={11}` on SVG `<text>` elements (verified against `semiotic-ai.module.min.js@3.3.1`). Setting these fields in a custom theme has no visible effect on axis ticks.

`@kvis/mirion-chart` works around this with a single blanket CSS rule in [`src/theme/tokens.css`](./src/theme/tokens.css):

```css
.mirion-chart svg text {
  font-family: var(--mc-font-sans);
  font-size: var(--mc-tick-size);
  fill: var(--mc-fg-muted);
}
```

CSS `font-size` on a `<text>` element overrides the SVG `font-size` attribute, so this wins without `!important` and applies to ticks, axis labels, and any data labels — anything Semiotic renders as SVG text. HTML chrome (legend, title, tooltip) stays untouched and is controlled separately through Semiotic's own `--semiotic-*` custom properties that we remap onto ours.

## Table fallback

```tsx
<Chart kind="table" data={rows} title="Top products" />
```

- Headers derived from `Object.keys(rows[0])` (or pass `columns={["a","b"]}`).
- `maxRows` caps row count (default 20).
- Numerics auto right-aligned, formatted with `k` / `M` suffixes.

## Exports

```ts
import {
  Chart, ChartProps, ChartKind,
  StreamChart, StreamChartProps, StreamKind, StreamHandle,
  TableChart, TableChartProps,
  MIRION_LIGHT, MIRION_DARK, MIRION_PALETTE,
  MIRION_TYPOGRAPHY_REM, resolveMirionTheme,
  inferScale, formatNumber, Row, ScalarValue, ScaleKind,
} from "@kvis/mirion-chart";
```

## Peer dependencies

- `react` ^18 || ^19
- `react-dom` ^18 || ^19
- `semiotic` ^3.3.1

## License

MIT
