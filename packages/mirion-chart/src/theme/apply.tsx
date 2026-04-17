import { useLayoutEffect, useRef, useState, type ReactNode, type ReactElement } from "react";
import type { SemioticTheme } from "semiotic/themes";
import { ThemeProvider } from "semiotic/ai";
import { MIRION_LIGHT, MIRION_DARK, MIRION_PALETTE, resolveMirionTheme } from "./semiotic-theme.js";

export interface MirionThemeProviderProps {
  mode?: "light" | "dark" | "auto";
  /** Override the categorical palette. */
  palette?: readonly string[];
  children: ReactNode;
}

/** Read a CSS variable from the live DOM. */
function readVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/**
 * Build a Semiotic theme that pulls colors + typography from the CSS tokens
 * declared in `tokens.css`. If a variable is missing we fall back to the
 * compiled MIRION_LIGHT / MIRION_DARK values.
 */
function buildThemeFromCss(
  base: SemioticTheme,
  palette: readonly string[],
  el: Element,
): SemioticTheme {
  const text = readVar(el, "--mc-fg") || base.colors.text;
  const textSecondary = readVar(el, "--mc-fg-muted") || base.colors.textSecondary;
  const grid = readVar(el, "--mc-grid") || base.colors.grid;
  const background = readVar(el, "--mc-bg") || base.colors.background;
  const fontFamily = readVar(el, "--mc-font-sans") || base.typography.fontFamily;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette[0] ?? base.colors.primary,
      categorical: [...palette],
      text,
      textSecondary,
      grid,
      background,
    },
    typography: {
      ...base.typography,
      fontFamily,
    },
  };
}

/**
 * Wrap charts in Semiotic's ThemeProvider with a theme reconstructed from
 * Mirion's CSS tokens at mount. Users override the look by overriding
 * `--mc-*` CSS variables in their own stylesheet.
 */
export function MirionThemeProvider({
  mode = "auto",
  palette,
  children,
}: MirionThemeProviderProps): ReactElement {
  const probeRef = useRef<HTMLDivElement>(null);
  const pal = palette ?? MIRION_PALETTE;
  const [theme, setTheme] = useState<SemioticTheme>(() =>
    mode === "dark" ? MIRION_DARK : MIRION_LIGHT,
  );

  useLayoutEffect(() => {
    const base = resolveMirionTheme(mode);
    if (typeof window === "undefined" || !probeRef.current) {
      setTheme({ ...base, colors: { ...base.colors, categorical: [...pal] } });
      return;
    }
    setTheme(buildThemeFromCss(base, pal, probeRef.current));
  }, [mode, pal]);

  return (
    <>
      {/* Hidden probe so CSS variable reads resolve in the component tree. */}
      <div
        ref={probeRef}
        aria-hidden
        className="mirion-chart"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      />
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </>
  );
}
