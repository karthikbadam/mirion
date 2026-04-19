import type { SemioticTheme } from "semiotic/themes";

/**
 * Categorical palette — Observable Plot's schemeObservable10.
 * Distinctive, readable on both light and dark slides.
 */
export const MIRION_PALETTE = [
  "#4269d0", // indigo
  "#efb118", // gold
  "#ff725c", // coral
  "#6cc5b0", // teal
  "#3ca951", // green
  "#ff8ab7", // pink
  "#a463f2", // purple
  "#97bbf5", // sky
  "#9c6b4e", // brown
  "#9498a0", // gray
] as const;

/**
 * Typography sizes expressed in rem — the source of truth.
 * At render time, {@link MirionThemeProvider} resolves these to pixels via
 * `toPixels()` (which reads the live root font-size) and hands Semiotic the
 * numeric values its theme requires.
 */
export const MIRION_TYPOGRAPHY_REM = {
  fontFamily:
    'ui-sans-serif, Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  titleSize: "1.75rem",
  labelSize: "1.375rem",
  tickSize: "1.25rem",
  legendSize: "1.375rem",
} as const;

const REM_PX = 16;
const px = (rem: string) => Math.round(parseFloat(rem) * REM_PX);

// Baseline SemioticTheme typography — resolved against a 16px root for
// SSR/early-mount before the CSS probe runs. `MirionThemeProvider` overwrites
// these with live-resolved values on client mount.
const BASELINE_TYPOGRAPHY = {
  fontFamily: MIRION_TYPOGRAPHY_REM.fontFamily,
  titleSize: px(MIRION_TYPOGRAPHY_REM.titleSize),
  labelSize: px(MIRION_TYPOGRAPHY_REM.labelSize),
  tickSize: px(MIRION_TYPOGRAPHY_REM.tickSize),
  legendSize: px(MIRION_TYPOGRAPHY_REM.legendSize),
  titleFontSize: px(MIRION_TYPOGRAPHY_REM.titleSize),
} as const;

/** Clean-modern light theme for Mirion decks. */
export const MIRION_LIGHT: SemioticTheme = {
  mode: "light",
  colors: {
    primary: "#4269d0",
    categorical: [...MIRION_PALETTE],
    sequential: "Blues",
    diverging: "RdBu",
    background: "transparent",
    text: "#0f172a",
    textSecondary: "#475569",
    grid: "#e2e8f0",
    border: "#cbd5e1",
    selection: "#4269d0",
    selectionOpacity: 0.28,
    annotation: "#475569",
  },
  typography: BASELINE_TYPOGRAPHY,
  borderRadius: "4px",
};

/** Clean-modern dark theme. Same palette (hues work on dark), tuned neutrals. */
export const MIRION_DARK: SemioticTheme = {
  mode: "dark",
  colors: {
    primary: "#6cc5b0",
    categorical: [...MIRION_PALETTE],
    sequential: "Blues",
    diverging: "RdBu",
    background: "transparent",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    grid: "#1e293b",
    border: "#334155",
    selection: "#6cc5b0",
    selectionOpacity: 0.3,
    annotation: "#94a3b8",
  },
  typography: BASELINE_TYPOGRAPHY,
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
