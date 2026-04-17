import type { SemioticTheme } from "semiotic/themes";

/**
 * Categorical palette — Observable Plot's default (d3.schemeTableau10).
 * Distinctive, readable on both light and dark slides, broadly familiar.
 */
export const MIRION_PALETTE = [
  "#4e79a7", // blue
  "#f28e2c", // orange
  "#e15759", // red
  "#76b7b2", // teal
  "#59a14f", // green
  "#edc948", // yellow
  "#b07aa1", // purple
  "#ff9da7", // pink
  "#9c755f", // brown
  "#bab0ab", // gray
] as const;

// Tuned for presentation slides: readable from across a room on a projector.
// Sizes in pixels (Semiotic requires numbers). Corresponds to ~1.5–2rem at 16px root.
const SHARED_TYPOGRAPHY = {
  fontFamily:
    'ui-sans-serif, Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  titleSize: 28,
  labelSize: 22,
  tickSize: 20,
  legendSize: 22,
  titleFontSize: 28,
} as const;

/** Clean-modern light theme for Mirion decks. */
export const MIRION_LIGHT: SemioticTheme = {
  mode: "light",
  colors: {
    primary: "#4e79a7",
    categorical: [...MIRION_PALETTE],
    sequential: "Blues",
    diverging: "RdBu",
    background: "transparent",
    text: "#0f172a",
    textSecondary: "#475569",
    grid: "#e2e8f0",
    border: "#cbd5e1",
    selection: "#4e79a7",
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
    primary: "#76b7b2",
    categorical: [...MIRION_PALETTE],
    sequential: "Blues",
    diverging: "RdBu",
    background: "transparent",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    grid: "#1e293b",
    border: "#334155",
    selection: "#76b7b2",
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
