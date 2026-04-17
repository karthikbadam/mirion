/** Parse a CSS size value (number of px, or a string like "24rem" / "320px") into pixels. */
export function toPixels(value: number | string | undefined, fallback = 0): number {
  if (value === undefined) return fallback;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  const match = trimmed.match(/^([\d.]+)\s*(rem|em|px)?$/i);
  if (!match) return fallback;
  const n = parseFloat(match[1]!);
  const unit = (match[2] ?? "px").toLowerCase();
  if (unit === "px") return n;
  const root =
    typeof window !== "undefined" && typeof document !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;
  return n * root;
}
