import { describe, it, expect } from "vitest";
import { parseDirective, validateDirective } from "./directives.js";

describe("parseDirective", () => {
  it("parses chart kind and simple bindings", () => {
    const d = parseDirective("chart=line x=month y=revenue");
    expect(d.chart).toBe("line");
    expect(d.bindings).toEqual({ x: "month", y: "revenue" });
    expect(d.warnings).toHaveLength(0);
  });

  it("accepts a bare chart name", () => {
    const d = parseDirective("bar x=product y=total");
    expect(d.chart).toBe("bar");
    expect(d.bindings.x).toBe("product");
  });

  it("defaults to table when no chart token is present", () => {
    const d = parseDirective("x=month y=revenue");
    expect(d.chart).toBe("table");
  });

  it("parses quoted values with spaces", () => {
    const d = parseDirective('chart=line x=month title="Q3 Revenue"');
    expect(d.bindings.title).toBe("Q3 Revenue");
  });

  it("supports color and facet bindings", () => {
    const d = parseDirective("chart=line x=month y=rev color=segment facet=region");
    expect(d.bindings.color).toBe("segment");
    expect(d.bindings.facet).toBe("region");
  });

  it("collects unknown keys and suggests the nearest allowed key", () => {
    const d = parseDirective("chart=line x=month y=rev colr=segment");
    expect(d.unknown).toEqual({ colr: "segment" });
    expect(d.warnings).toHaveLength(1);
    expect(d.warnings[0]?.code).toBe("unknown_directive_key");
    expect(d.warnings[0]?.hint).toContain('"color"');
  });

  it("warns and suggests when an unknown chart kind is given", () => {
    const d = parseDirective("chart=lne x=month y=rev");
    expect(d.warnings.some((w) => w.code === "unknown_chart_kind")).toBe(true);
    const w = d.warnings.find((w) => w.code === "unknown_chart_kind");
    expect(w?.hint).toContain('"line"');
  });

  it("ignores extra whitespace between tokens", () => {
    const d = parseDirective("  chart=bar   x=product  y=total  ");
    expect(d.chart).toBe("bar");
    expect(d.bindings).toEqual({ x: "product", y: "total" });
  });

  it("normalizes keys to lowercase (LLM-friendly)", () => {
    const d = parseDirective("CHART=bar X=product Y=total Color=segment");
    expect(d.chart).toBe("bar");
    expect(d.bindings).toEqual({ x: "product", y: "total", color: "segment" });
    expect(d.warnings).toHaveLength(0);
  });

  it("supports tab-separated tokens", () => {
    const d = parseDirective("chart=line\tx=month\ty=rev");
    expect(d.chart).toBe("line");
    expect(d.bindings).toEqual({ x: "month", y: "rev" });
  });

  it("returns default table chart on empty input", () => {
    const d = parseDirective("");
    expect(d.chart).toBe("table");
    expect(d.warnings).toHaveLength(0);
  });

  it("accepts single-quoted values", () => {
    const d = parseDirective("chart=line title='Q3 Revenue'");
    expect(d.bindings.title).toBe("Q3 Revenue");
  });
});

describe("validateDirective", () => {
  it("requires x and y for line charts", () => {
    const d = parseDirective("chart=line");
    const ws = validateDirective(d);
    expect(ws.map((w) => w.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"x"'),
        expect.stringContaining('"y"'),
      ]),
    );
  });

  it("passes when bindings are present", () => {
    const d = parseDirective("chart=line x=month y=rev");
    expect(validateDirective(d)).toHaveLength(0);
  });

  it("requires x for histograms", () => {
    const d = parseDirective("chart=histogram");
    const ws = validateDirective(d);
    expect(ws).toHaveLength(1);
    expect(ws[0]?.message).toContain('"x"');
  });

  it("requires y and color for pie charts", () => {
    const d = parseDirective("chart=pie");
    const ws = validateDirective(d);
    expect(ws).toHaveLength(2);
  });

  it("does not require bindings for table or custom", () => {
    expect(validateDirective(parseDirective("chart=table"))).toHaveLength(0);
    expect(validateDirective(parseDirective("chart=custom"))).toHaveLength(0);
  });
});
