/**
 * Format a numeric value with k/M/B suffixes for chart axes and tooltips.
 * Preserves sign, trims trailing zeroes.
 *
 *   formatNumber(1_250_000) -> "1.25M"
 *   formatNumber(890_000)   -> "890k"
 *   formatNumber(42)        -> "42"
 *   formatNumber(0.0123)    -> "0.012"
 */
export function formatNumber(v: unknown): string {
  if (v === null || v === undefined) return "";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);

  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (abs >= 1_000_000_000) return sign + trim((abs / 1_000_000_000).toFixed(2)) + "B";
  if (abs >= 1_000_000) return sign + trim((abs / 1_000_000).toFixed(2)) + "M";
  if (abs >= 1_000) return sign + trim((abs / 1_000).toFixed(2)) + "k";
  if (abs >= 1) return sign + trim(abs.toFixed(2));
  if (abs === 0) return "0";
  return sign + trim(abs.toFixed(3));
}

function trim(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "");
}
