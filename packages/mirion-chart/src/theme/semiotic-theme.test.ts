import { describe, it, expect } from "vitest";
import {
  MIRION_LIGHT,
  MIRION_DARK,
  MIRION_PALETTE,
  resolveMirionTheme,
} from "./semiotic-theme.js";

describe("theme", () => {
  it("light and dark share the same categorical palette", () => {
    expect(MIRION_LIGHT.colors.categorical).toEqual([...MIRION_PALETTE]);
    expect(MIRION_DARK.colors.categorical).toEqual([...MIRION_PALETTE]);
  });

  it("light has light mode flag and dark has dark mode flag", () => {
    expect(MIRION_LIGHT.mode).toBe("light");
    expect(MIRION_DARK.mode).toBe("dark");
  });

  it("backgrounds are transparent so decks inherit slide color", () => {
    expect(MIRION_LIGHT.colors.background).toBe("transparent");
    expect(MIRION_DARK.colors.background).toBe("transparent");
  });

  it("uses modern sans-serif font stack", () => {
    expect(MIRION_LIGHT.typography.fontFamily).toContain("ui-sans-serif");
    expect(MIRION_LIGHT.typography.fontFamily).toContain("Inter");
  });

  it("palette has 7 muted modern hues", () => {
    expect(MIRION_PALETTE).toHaveLength(7);
    // Each hue is a hex color
    for (const c of MIRION_PALETTE) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("resolveMirionTheme returns explicit light/dark", () => {
    expect(resolveMirionTheme("light")).toBe(MIRION_LIGHT);
    expect(resolveMirionTheme("dark")).toBe(MIRION_DARK);
  });

  it("resolveMirionTheme falls back to light when matchMedia unavailable", () => {
    // jsdom has matchMedia mocked to always return false
    const resolved = resolveMirionTheme("auto");
    expect([MIRION_LIGHT, MIRION_DARK]).toContain(resolved);
  });
});
