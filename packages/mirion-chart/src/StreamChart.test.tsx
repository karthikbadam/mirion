import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, act } from "@testing-library/react";
import { StreamChart } from "./StreamChart.js";

beforeAll(() => {
  if (typeof SVGElement !== "undefined") {
    // @ts-expect-error — jsdom lacks getBBox
    SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 20 });
  }
  if (typeof HTMLCanvasElement !== "undefined") {
    const ctx = new Proxy(
      {
        canvas: { width: 400, height: 200 },
        measureText: () => ({ width: 10 }),
        createLinearGradient: () => ({ addColorStop: () => undefined }),
        createRadialGradient: () => ({ addColorStop: () => undefined }),
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

describe("StreamChart", () => {
  it("renders a realtime line chart container", () => {
    const { container } = render(
      <StreamChart
        kind="line"
        timeKey="t"
        valueKey="v"
        initialData={[{ t: 0, v: 1 }, { t: 1, v: 2 }]}
        height={200}
      />,
    );
    // Realtime charts render to canvas or svg; either should be present.
    const hasVisual =
      container.querySelector("svg") !== null ||
      container.querySelector("canvas") !== null;
    expect(hasVisual).toBe(true);
  });

  it("throws when line kind is given without timeKey", () => {
    expect(() =>
      render(<StreamChart kind="line" valueKey="v" />),
    ).toThrow(/requires a `timeKey`/);
  });

  it("invokes source on mount and calls cleanup on unmount", () => {
    const cleanup = vi.fn();
    const source = vi.fn(() => cleanup);
    const { unmount } = render(
      <StreamChart kind="line" timeKey="t" valueKey="v" source={source} />,
    );
    expect(source).toHaveBeenCalledTimes(1);
    expect(source.mock.calls[0]?.[0]).toHaveProperty("push");
    expect(source.mock.calls[0]?.[0]).toHaveProperty("pushMany");
    expect(source.mock.calls[0]?.[0]).toHaveProperty("clear");
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("source handle noops safely before chart ref is attached", () => {
    let handleRef: { push: (p: { t: number; v: number }) => void } | null = null;
    const source = (h: { push: (p: { t: number; v: number }) => void }) => {
      handleRef = h;
    };
    render(<StreamChart kind="line" timeKey="t" valueKey="v" source={source} />);
    expect(handleRef).not.toBeNull();
    // push call must not throw even if Semiotic ref isn't wired
    expect(() => {
      act(() => handleRef?.push({ t: Date.now(), v: 1 }));
    }).not.toThrow();
  });
});
