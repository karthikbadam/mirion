import { describe, it, expect } from "vitest";
import { toPixels } from "./toPixels.js";

describe("toPixels", () => {
  it("passes numbers through unchanged", () => {
    expect(toPixels(480)).toBe(480);
    expect(toPixels(0)).toBe(0);
  });

  it("parses px strings", () => {
    expect(toPixels("320px")).toBe(320);
    expect(toPixels("100")).toBe(100);
  });

  it("resolves rem against document root font size (16px in jsdom by default)", () => {
    // jsdom root font-size defaults to 16px.
    expect(toPixels("1rem")).toBe(16);
    expect(toPixels("1.5rem")).toBe(24);
    expect(toPixels("30rem")).toBe(480);
  });

  it("resolves em the same as rem for simplicity (root-based)", () => {
    expect(toPixels("2em")).toBe(32);
  });

  it("returns fallback for undefined or malformed input", () => {
    expect(toPixels(undefined, 200)).toBe(200);
    expect(toPixels("not a size", 123)).toBe(123);
  });

  it("handles fractional values", () => {
    expect(toPixels("0.5rem")).toBe(8);
  });
});
