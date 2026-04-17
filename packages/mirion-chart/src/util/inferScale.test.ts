import { describe, it, expect } from "vitest";
import { inferScale } from "./inferScale.js";

describe("inferScale", () => {
  it("classifies numeric columns as linear", () => {
    const data = [{ v: 1 }, { v: 2 }, { v: 3 }];
    expect(inferScale(data, "v")).toBe("linear");
  });

  it("classifies ISO date columns as time", () => {
    const data = [
      { d: "2024-01-01" },
      { d: "2024-02-01" },
      { d: "2024-03-01" },
    ];
    expect(inferScale(data, "d")).toBe("time");
  });

  it("classifies ISO datetime columns as time", () => {
    const data = [
      { t: "2024-01-01T10:00:00Z" },
      { t: "2024-02-01T12:00:00Z" },
    ];
    expect(inferScale(data, "t")).toBe("time");
  });

  it("classifies arbitrary strings as ordinal", () => {
    const data = [{ c: "foo" }, { c: "bar" }, { c: "baz" }];
    expect(inferScale(data, "c")).toBe("ordinal");
  });

  it("handles empty data", () => {
    expect(inferScale([], "any")).toBe("ordinal");
  });

  it("treats numeric strings as linear", () => {
    const data = [{ v: "100" }, { v: "200" }, { v: "300" }];
    expect(inferScale(data, "v")).toBe("linear");
  });

  it("ignores nulls when classifying", () => {
    const data = [{ v: 1 }, { v: null }, { v: 3 }];
    expect(inferScale(data, "v")).toBe("linear");
  });
});
