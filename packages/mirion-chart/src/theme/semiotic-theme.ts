import type { SemioticTheme } from "semiotic/themes";

/**
 * Modern, muted categorical palette — 7 hues, no neon.
 * Kept readable on both light and dark slide backgrounds.
 */
export const MIRION_PALETTE = [
  "#0f766e", // teal-700
  "#4f46e5", // indigo-600
  "#b45309", // amber-700
  "#be123c", // rose-700
  "#047857", // emerald-700
  "#7c3aed", // violet-600
  "#475569", // slate-600
] as const;

const SHARED_TYPOGRAPHY = {
  fontFamily:
    'ui-sans-serif, Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  titleSize: 16,
  labelSize: 12,
  tickSize: 11,
  legendSize: 12,
} as const;

/** Clean-modern light theme for Mirion decks. */
export const MIRION_LIGHT: SemioticTheme = {
  mode: "light",
  colors: {
    primary: "#0f766e",
    categorical: [...MIRION_PALETTE],
    sequential: "Blues",
    diverging: "RdBu",
    background: "transparent",
    text: "#0f172a",
    textSecondary: "#475569",
    grid: "#e2e8f0",
    border: "#cbd5e1",
    selection: "#0f766e",
    selectionOpacity: 0.28,
    annotation: "#475569",
  },
  typography: SHARED_TYPOGRAPHY,
  borderRadius: "4px",
};

/** Clean-modern dark theme. Same palette (hues work on dark), tuned neutrals. */
export const MIRION_DARK: SemioticTheme = {
  mode: "dark",
  colors: {
    primary: "#2dd4bf",
    categorical: [...MIRION_PALETTE],
    sequential: "Blues",
    diverging: "RdBu",
    background: "transparent",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    grid: "#1e293b",
    border: "#334155",
    selection: "#2dd4bf",
    selectionOpacity: 0.3,
    annotation: "#94a3b8",
  },
  typography: SHARED_TYPOGRAPHY,
  borderRadius: "4px",
};

export function resolveMirionTheme(mode: "light" | "dark" | "auto"): SemioticTheme {
  if (mode === "dark") return MIRION_DARK;
  if (mode === "light") return MIRION_LIGHT;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? MIRION_DARK
      : MIRION_LIGHT;
  }
  return MIRION_LIGHT;
}
