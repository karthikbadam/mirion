import type { ChartKind, ChartBindings, Warning } from "../ir/types.js";
import { nearest } from "../util/didyoumean.js";

export const ALLOWED_CHART_KINDS: readonly ChartKind[] = [
  "line",
  "bar",
  "area",
  "scatter",
  "histogram",
  "box",
  "pie",
  "table",
  "custom",
];

export const ALLOWED_KEYS = [
  "chart",
  "x",
  "y",
  "color",
  "facet",
  "size",
  "title",
  "theme",
  "stacked",
  "orientation",
] as const;

export type AllowedKey = (typeof ALLOWED_KEYS)[number];

export interface Directive {
  raw: string;
  chart: ChartKind;
  bindings: ChartBindings;
  extras: Record<string, string>;
  unknown: Record<string, string>;
  warnings: Warning[];
}

interface Token {
  key: string | null;
  value: string;
}

/** Tokenize `key=value` pairs, supporting quoted values and a bare chart name token. */
function tokenize(info: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = info.length;
  while (i < n) {
    while (i < n && /\s/.test(info[i]!)) i++;
    if (i >= n) break;

    let keyStart = i;
    while (i < n && !/\s/.test(info[i]!) && info[i] !== "=") i++;
    const keyOrBare = info.slice(keyStart, i);

    if (info[i] === "=") {
      i++;
      let value: string;
      if (info[i] === '"' || info[i] === "'") {
        const quote = info[i];
        i++;
        const vs = i;
        while (i < n && info[i] !== quote) i++;
        value = info.slice(vs, i);
        if (info[i] === quote) i++;
      } else {
        const vs = i;
        while (i < n && !/\s/.test(info[i]!)) i++;
        value = info.slice(vs, i);
      }
      tokens.push({ key: keyOrBare, value });
    } else {
      tokens.push({ key: null, value: keyOrBare });
    }
  }
  return tokens;
}

function isChartKind(v: string): v is ChartKind {
  return (ALLOWED_CHART_KINDS as readonly string[]).includes(v);
}

export function parseDirective(info: string): Directive {
  const warnings: Warning[] = [];
  const bindings: ChartBindings = {};
  const extras: Record<string, string> = {};
  const unknown: Record<string, string> = {};
  let chart: ChartKind = "table";
  let chartSeen = false;

  const tokens = tokenize(info.trim());

  for (const tok of tokens) {
    if (tok.key === null) {
      if (isChartKind(tok.value) && !chartSeen) {
        chart = tok.value;
        chartSeen = true;
      } else {
        warnings.push({
          code: "unknown_bareword",
          message: `Unknown bareword "${tok.value}" in directive`,
          hint:
            "expected a chart kind like " +
            ALLOWED_CHART_KINDS.slice(0, 4).join(", "),
        });
      }
      continue;
    }

    const k = tok.key.toLowerCase();
    const v = tok.value;

    if (k === "chart") {
      if (isChartKind(v)) {
        chart = v;
        chartSeen = true;
      } else {
        const hint = nearest(v, ALLOWED_CHART_KINDS);
        warnings.push({
          code: "unknown_chart_kind",
          message: `Unknown chart kind "${v}"`,
          hint: hint ? `did you mean "${hint}"?` : undefined,
        });
      }
      continue;
    }

    if (k === "x" || k === "y" || k === "color" || k === "facet" || k === "size" || k === "title") {
      bindings[k] = v;
      continue;
    }

    if ((ALLOWED_KEYS as readonly string[]).includes(k)) {
      extras[k] = v;
      continue;
    }

    unknown[k] = v;
    const hint = nearest(k, ALLOWED_KEYS);
    warnings.push({
      code: "unknown_directive_key",
      message: `Unknown directive key "${k}"`,
      hint: hint ? `did you mean "${hint}"?` : undefined,
    });
  }

  return { raw: info, chart, bindings, extras, unknown, warnings };
}

/** Validate bindings required by each chart kind. Returns warnings. */
export function validateDirective(d: Directive): Warning[] {
  const w: Warning[] = [];
  const needs = (keys: (keyof ChartBindings)[]) => {
    for (const k of keys) {
      if (!d.bindings[k]) {
        w.push({
          code: "missing_binding",
          message: `Chart kind "${d.chart}" requires "${k}" binding`,
        });
      }
    }
  };

  switch (d.chart) {
    case "line":
    case "area":
    case "scatter":
    case "bar":
      needs(["x", "y"]);
      break;
    case "histogram":
      needs(["x"]);
      break;
    case "pie":
      needs(["y", "color"]);
      break;
    case "box":
      needs(["y"]);
      break;
    case "table":
    case "custom":
      break;
  }
  return w;
}
