import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TableChart } from "./Table.js";

describe("TableChart", () => {
  const data = [
    { product: "Pro", total: 1_250_000 },
    { product: "Team", total: 890_000 },
  ];

  it("renders headers for each column", () => {
    const html = renderToStaticMarkup(<TableChart data={data} />);
    expect(html).toContain(">product</th>");
    expect(html).toContain(">total</th>");
  });

  it("formats large numbers with k/M suffixes", () => {
    const html = renderToStaticMarkup(<TableChart data={data} />);
    expect(html).toContain("1.25M");
    expect(html).toContain("890k");
  });

  it("renders optional title", () => {
    const html = renderToStaticMarkup(<TableChart data={data} title="Top products" />);
    expect(html).toContain("<figcaption>Top products</figcaption>");
  });

  it("marks numeric cells with .num class for right-alignment", () => {
    const html = renderToStaticMarkup(<TableChart data={data} />);
    expect(html).toContain('class="num"');
  });

  it("caps rows at maxRows", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ i, v: i * 10 }));
    const html = renderToStaticMarkup(<TableChart data={many} maxRows={5} />);
    const rows = html.match(/<tr>/g) ?? [];
    // 1 header row + 5 body rows
    expect(rows).toHaveLength(6);
  });

  it("honors explicit columns prop", () => {
    const html = renderToStaticMarkup(
      <TableChart data={data} columns={["total"]} />,
    );
    expect(html).not.toContain(">product</th>");
    expect(html).toContain(">total</th>");
  });
});
