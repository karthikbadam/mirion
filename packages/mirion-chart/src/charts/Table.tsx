import type { Row } from "../util/inferScale.js";
import { formatNumber } from "../util/formatNumber.js";

export interface TableChartProps {
  data: Row[];
  title?: string;
  columns?: string[];
  maxRows?: number;
}

function isNumeric(v: unknown): boolean {
  return typeof v === "number" && !Number.isNaN(v);
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (isNumeric(v)) return formatNumber(v);
  return String(v);
}

export function TableChart({ data, title, columns, maxRows = 20 }: TableChartProps) {
  const cols = columns ?? (data[0] ? Object.keys(data[0]) : []);
  const rows = data.slice(0, maxRows);

  return (
    <figure className="mirion-chart" style={{ margin: 0 }}>
      {title && <figcaption>{title}</figcaption>}
      <table className="mirion-chart-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => {
                const v = r[c];
                return (
                  <td key={c} className={isNumeric(v) ? "num" : undefined}>
                    {formatCell(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
