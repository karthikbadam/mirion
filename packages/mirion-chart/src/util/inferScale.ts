export type ScaleKind = "linear" | "time" | "ordinal";

export type ScalarValue = string | number | boolean | null;
export type Row = Record<string, ScalarValue>;

const ISO_DATE = /^\d{4}-\d{2}(?:-\d{2})?(?:T.*)?$/;

/** Infer a coarse scale kind for a column, using a small sample. */
export function inferScale(data: Row[], key: string): ScaleKind {
  if (data.length === 0) return "ordinal";
  const sample = data.slice(0, Math.min(50, data.length));
  let numeric = 0;
  let date = 0;
  let total = 0;

  for (const r of sample) {
    const v = r[key];
    if (v === null || v === undefined) continue;
    total++;
    if (typeof v === "number" && !Number.isNaN(v)) {
      numeric++;
      continue;
    }
    if (typeof v === "string") {
      if (ISO_DATE.test(v) || !Number.isNaN(Date.parse(v))) {
        if (ISO_DATE.test(v) || /^[A-Z][a-z]{2} \d+/i.test(v)) {
          date++;
          continue;
        }
      }
      if (!Number.isNaN(Number(v)) && v.trim() !== "") {
        numeric++;
      }
    }
  }

  if (total === 0) return "ordinal";
  if (date / total > 0.8) return "time";
  if (numeric / total > 0.8) return "linear";
  return "ordinal";
}
