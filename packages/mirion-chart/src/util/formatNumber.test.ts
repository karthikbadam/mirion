import { describe, it, expect } from "vitest";
import { formatNumber } from "./formatNumber.js";

describe("formatNumber", () => {
  it("formats millions with M suffix", () => {
    expect(formatNumber(1_250_000)).toBe("1.25M");
    expect(formatNumber(2_000_000)).toBe("2M");
  });

  it("formats thousands with k suffix", () => {
    expect(formatNumber(890_000)).toBe("890k");
    expect(formatNumber(1_200)).toBe("1.2k");
  });

  it("formats billions with B suffix", () => {
    expect(formatNumber(3_500_000_000)).toBe("3.5B");
  });

  it("leaves small numbers alone", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(0)).toBe("0");
  });

  it("preserves sign for negatives", () => {
    expect(formatNumber(-1_200_000)).toBe("-1.2M");
  });

  it("handles string input", () => {
    expect(formatNumber("1500000")).toBe("1.5M");
  });

  it("returns empty for null/undefined", () => {
    expect(formatNumber(null)).toBe("");
    expect(formatNumber(undefined)).toBe("");
  });

  it("trims trailing zeroes", () => {
    expect(formatNumber(1_000_000)).toBe("1M");
    expect(formatNumber(1_100_000)).toBe("1.1M");
  });
});
