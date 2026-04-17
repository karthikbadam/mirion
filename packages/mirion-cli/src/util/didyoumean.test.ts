import { describe, it, expect } from "vitest";
import { distance, nearest, topK } from "./didyoumean.js";

describe("distance", () => {
  it("returns 0 for identical strings", () => {
    expect(distance("color", "color")).toBe(0);
  });

  it("handles empty strings", () => {
    expect(distance("", "abc")).toBe(3);
    expect(distance("abc", "")).toBe(3);
  });

  it("counts single substitutions", () => {
    expect(distance("color", "colon")).toBe(1);
  });

  it("counts single deletions", () => {
    expect(distance("colour", "color")).toBe(1);
  });

  it("counts transpositions as two edits", () => {
    expect(distance("colro", "color")).toBe(2);
  });
});

describe("nearest", () => {
  const keys = ["chart", "x", "y", "color", "facet", "size", "title"];

  it("finds obvious typos", () => {
    expect(nearest("colr", keys)).toBe("color");
    expect(nearest("fact", keys)).toBe("facet");
  });

  it("returns undefined when nothing is close enough", () => {
    expect(nearest("banana", keys)).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(nearest("COLOR", keys)).toBe("color");
  });

  it("returns undefined for empty candidate list", () => {
    expect(nearest("anything", [])).toBeUndefined();
  });
});

describe("topK", () => {
  it("returns the k closest candidates in order", () => {
    const candidates = ["color", "colour", "facet", "year"];
    expect(topK("colr", candidates, 2)).toEqual(["color", "colour"]);
  });
});
