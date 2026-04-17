import { useMemo } from "react";

export type Row = Record<string, string | number | boolean | null>;

export interface ChartProps {
  kind: "line" | "bar";
  data: Row[];
  x: string;
  y: string;
  color?: string;
  title?: string;
  width?: number;
  height?: number;
}

const PALETTE = [
  "#0f766e", // teal-700
  "#4f46e5", // indigo-600
  "#b45309", // amber-700
  "#be123c", // rose-700
  "#047857", // emerald-700
  "#7c3aed", // violet-600
];

const FG = "var(--term-fg, #e5e7eb)";
const MUTED = "color-mix(in oklab, currentColor 55%, transparent)";
const GRID = "color-mix(in oklab, currentColor 15%, transparent)";

const PAD = { top: 24, right: 32, bottom: 44, left: 56 };

interface Series {
  key: string;
  points: { xv: number | string; yv: number }[];
  color: string;
}

function toNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v);
}

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const range = max - min;
  const rough = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = norm >= 5 ? 10 * mag : norm >= 2 ? 5 * mag : norm >= 1 ? 2 * mag : mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + step / 2; t += step) ticks.push(Number(t.toFixed(6)));
  return ticks;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

export function Chart({
  kind,
  data,
  x,
  y,
  color,
  title,
  width = 720,
  height = 360,
}: ChartProps) {
  const series = useMemo<Series[]>(() => {
    if (!color) {
      return [
        {
          key: y,
          color: PALETTE[0]!,
          points: data.map((r) => ({ xv: r[x] as string | number, yv: toNumber(r[y]) })),
        },
      ];
    }
    const groups = new Map<string, Row[]>();
    for (const r of data) {
      const k = String(r[color]);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    }
    let i = 0;
    return [...groups.entries()].map(([key, rows]) => ({
      key,
      color: PALETTE[i++ % PALETTE.length]!,
      points: rows.map((r) => ({ xv: r[x] as string | number, yv: toNumber(r[y]) })),
    }));
  }, [data, x, y, color]);

  const allY = series.flatMap((s) => s.points.map((p) => p.yv));
  const yMin = Math.min(0, ...allY);
  const yMax = Math.max(...allY, 1);
  const yTicks = niceTicks(yMin, yMax);

  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const scaleY = (v: number) =>
    PAD.top + plotH - ((v - yTicks[0]!) / (yTicks[yTicks.length - 1]! - yTicks[0]!)) * plotH;

  const xValues = Array.from(new Set(data.map((r) => String(r[x]))));
  const bandW = plotW / xValues.length;
  const scaleX = (xv: string | number) => {
    const idx = xValues.indexOf(String(xv));
    return PAD.left + idx * bandW + bandW / 2;
  };

  return (
    <figure
      style={{
        margin: 0,
        color: FG,
        fontFamily: "ui-sans-serif, Inter, system-ui, sans-serif",
      }}
    >
      {title && (
        <figcaption
          style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            color: MUTED,
            marginBottom: "0.75rem",
            textAlign: "left",
            paddingLeft: PAD.left,
          }}
        >
          {title}
        </figcaption>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label={title ?? `${kind} chart`}
      >
        {/* gridlines */}
        {yTicks.map((t) => (
          <line
            key={t}
            x1={PAD.left}
            x2={width - PAD.right}
            y1={scaleY(t)}
            y2={scaleY(t)}
            stroke={GRID}
            strokeWidth={1}
          />
        ))}

        {/* y-axis labels */}
        {yTicks.map((t) => (
          <text
            key={t}
            x={PAD.left - 10}
            y={scaleY(t)}
            dy="0.32em"
            fontSize={11}
            fill={MUTED}
            textAnchor="end"
          >
            {fmt(t)}
          </text>
        ))}

        {/* x-axis labels */}
        {xValues.map((v) => (
          <text
            key={v}
            x={scaleX(v)}
            y={height - PAD.bottom + 18}
            fontSize={11}
            fill={MUTED}
            textAnchor="middle"
          >
            {v}
          </text>
        ))}

        {/* axis baseline */}
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={scaleY(yTicks[0]!)}
          y2={scaleY(yTicks[0]!)}
          stroke={MUTED}
          strokeWidth={1}
        />

        {kind === "bar" &&
          (() => {
            const groupCount = series.length;
            const pad = 0.2;
            const barW = (bandW * (1 - pad)) / groupCount;
            return series.flatMap((s, i) =>
              s.points.map((p) => {
                const cx = scaleX(p.xv);
                const xStart = cx - (bandW * (1 - pad)) / 2 + i * barW;
                const h = scaleY(yTicks[0]!) - scaleY(p.yv);
                return (
                  <rect
                    key={`${s.key}-${p.xv}`}
                    x={xStart}
                    y={scaleY(p.yv)}
                    width={barW}
                    height={h}
                    fill={s.color}
                    rx={2}
                  />
                );
              }),
            );
          })()}

        {kind === "line" &&
          series.map((s) => {
            const d = s.points
              .map((p, i) => `${i === 0 ? "M" : "L"}${scaleX(p.xv)},${scaleY(p.yv)}`)
              .join(" ");
            return (
              <g key={s.key}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={2.25} />
                {s.points.map((p) => (
                  <circle
                    key={String(p.xv)}
                    cx={scaleX(p.xv)}
                    cy={scaleY(p.yv)}
                    r={3.5}
                    fill={s.color}
                  />
                ))}
              </g>
            );
          })}
      </svg>

      {color && series.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "1.25rem",
            paddingLeft: PAD.left,
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            color: MUTED,
            flexWrap: "wrap",
          }}
        >
          {series.map((s) => (
            <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: s.color,
                  display: "inline-block",
                }}
              />
              {s.key}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
