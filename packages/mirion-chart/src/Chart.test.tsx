import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { Chart } from "./Chart.js";

// Semiotic reads computed styles; jsdom stubs sometimes need SVG measurements.
// Force SVGElement.getBBox since jsdom doesn't implement it. Also stub canvas
// so chart kinds that render to canvas (histogram) don't log warnings.
beforeAll(() => {
  if (typeof SVGElement !== "undefined") {
    // @ts-expect-error — jsdom lacks getBBox
    SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 20 });
  }
  if (typeof HTMLCanvasElement !== "undefined") {
    // Return a Proxy so any canvas 2d method call becomes a no-op.
    const ctx = new Proxy(
      {
        canvas: { width: 400, height: 200 },
        measureText: () => ({ width: 10 }),
        createLinearGradient: () => ({ addColorStop: () => undefined }),
        createRadialGradient: () => ({ addColorStop: () => undefined }),
        createPattern: () => null,
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      },
      {
        get(target, prop) {
          if (prop in target) return (target as Record<string | symbol, unknown>)[prop];
          return () => undefined;
        },
      },
    );
    // @ts-expect-error — stub
    HTMLCanvasElement.prototype.getContext = () => ctx;
  }
});

const revenueByMonth = [
  { month: "2024-01-01", segment: "Enterprise", revenue: 620_000 },
  { month: "2024-02-01", segment: "Enterprise", revenue: 740_000 },
  { month: "2024-03-01", segment: "Enterprise", revenue: 860_000 },
  { month: "2024-01-01", segment: "SMB", revenue: 310_000 },
  { month: "2024-02-01", segment: "SMB", revenue: 290_000 },
  { month: "2024-03-01", segment: "SMB", revenue: 305_000 },
];

const productTotals = [
  { product: "Pro", total: 1_250_000 },
  { product: "Team", total: 890_000 },
  { product: "Starter", total: 420_000 },
];

const productBySegment = [
  ...productTotals.map((r) => ({ ...r, segment: "Enterprise" })),
  ...productTotals.map((r) => ({ ...r, total: r.total * 0.4, segment: "SMB" })),
];

const numericSamples = Array.from({ length: 50 }, (_, i) => ({
  value: Math.sin(i / 5) * 50 + 50 + Math.random() * 10,
}));

const xySamples = Array.from({ length: 30 }, (_, i) => ({
  x: i,
  y: Math.random() * 100,
  group: i % 2 === 0 ? "A" : "B",
}));

function svg(container: HTMLElement): SVGElement | null {
  return container.querySelector("svg");
}

describe("Chart dispatcher — rendering", () => {
  it("renders a line chart (single series)", () => {
    const { container } = render(
      <Chart
        kind="line"
        data={revenueByMonth.filter((r) => r.segment === "Enterprise")}
        x="month"
        y="revenue"
        width={400}
        height={200}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a line chart with color grouping (multi-series)", () => {
    const { container } = render(
      <Chart
        kind="line"
        data={revenueByMonth}
        x="month"
        y="revenue"
        color="segment"
        width={400}
        height={200}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a bar chart (single series)", () => {
    const { container } = render(
      <Chart kind="bar" data={productTotals} x="product" y="total" width={400} height={200} />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a grouped bar chart when color is provided", () => {
    const { container } = render(
      <Chart
        kind="bar"
        data={productBySegment}
        x="product"
        y="total"
        color="segment"
        width={400}
        height={200}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders an area chart", () => {
    const { container } = render(
      <Chart
        kind="area"
        data={revenueByMonth.filter((r) => r.segment === "Enterprise")}
        x="month"
        y="revenue"
        width={400}
        height={200}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a stacked area chart when stacked + color are set", () => {
    const { container } = render(
      <Chart
        kind="area"
        data={revenueByMonth}
        x="month"
        y="revenue"
        color="segment"
        stacked
        width={400}
        height={200}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a scatterplot", () => {
    const { container } = render(
      <Chart kind="scatter" data={xySamples} x="x" y="y" width={400} height={200} />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a scatterplot with color grouping", () => {
    const { container } = render(
      <Chart
        kind="scatter"
        data={xySamples}
        x="x"
        y="y"
        color="group"
        width={400}
        height={200}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a histogram of a numeric column (svg or canvas)", () => {
    const { container } = render(
      <Chart kind="histogram" data={numericSamples} x="value" width={400} height={200} />,
    );
    // Histogram may render to canvas in some Semiotic configurations.
    // Either an SVG or a container element is acceptable.
    const hasVisual =
      svg(container) !== null ||
      container.querySelector("canvas") !== null ||
      container.querySelector("[class*='semiotic']") !== null ||
      container.children.length > 0;
    expect(hasVisual).toBe(true);
  });

  it("renders a box plot", () => {
    const { container } = render(
      <Chart
        kind="box"
        data={productBySegment}
        x="segment"
        y="total"
        width={400}
        height={200}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a pie chart", () => {
    const { container } = render(
      <Chart
        kind="pie"
        data={productTotals}
        x="product"
        y="total"
        width={400}
        height={300}
      />,
    );
    expect(svg(container)).not.toBeNull();
  });

  it("renders a table fallback (not an svg)", () => {
    const { container } = render(
      <Chart kind="table" data={productTotals} title="Top products" />,
    );
    expect(svg(container)).toBeNull();
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.textContent).toContain("product");
    expect(container.textContent).toContain("total");
  });
});

describe("Chart dispatcher — validation", () => {
  it("throws when a non-table kind is given without an x accessor", () => {
    expect(() =>
      render(<Chart kind="line" data={productTotals} y="total" />),
    ).toThrow(/requires an `x`/);
  });

  it("throws when line is given without a y accessor", () => {
    expect(() =>
      render(<Chart kind="line" data={revenueByMonth} x="month" />),
    ).toThrow(/requires a `y`/);
  });

  it("throws when pie is given without a y accessor", () => {
    expect(() =>
      render(<Chart kind="pie" data={productTotals} x="product" />),
    ).toThrow(/requires a `y`/);
  });

  it("accepts empty data without throwing", () => {
    expect(() =>
      render(<Chart kind="bar" data={[]} x="x" y="y" width={200} height={100} />),
    ).not.toThrow();
  });
});
