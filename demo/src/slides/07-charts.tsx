import { Slide, Stack, Notes, Fragment, Split } from "@kvis/mirion";
import { Chart } from "@kvis/mirion-chart";
import "@kvis/mirion-chart/style.css";

// ---------- Shared synthetic data ----------

const revenueByMonth = [
  { month: "2024-07-01", segment: "Enterprise", revenue: 620_000 },
  { month: "2024-07-01", segment: "SMB", revenue: 310_000 },
  { month: "2024-07-01", segment: "Consumer", revenue: 180_000 },
  { month: "2024-08-01", segment: "Enterprise", revenue: 740_000 },
  { month: "2024-08-01", segment: "SMB", revenue: 290_000 },
  { month: "2024-08-01", segment: "Consumer", revenue: 195_000 },
  { month: "2024-09-01", segment: "Enterprise", revenue: 860_000 },
  { month: "2024-09-01", segment: "SMB", revenue: 305_000 },
  { month: "2024-09-01", segment: "Consumer", revenue: 210_000 },
];

const topProducts = [
  { product: "Pro", total: 1_250_000 },
  { product: "Team", total: 890_000 },
  { product: "Starter", total: 420_000 },
  { product: "Edu", total: 310_000 },
  { product: "Free", total: 95_000 },
];

const productBySegment = [
  { product: "Pro", segment: "Enterprise", total: 820_000 },
  { product: "Pro", segment: "SMB", total: 310_000 },
  { product: "Pro", segment: "Consumer", total: 120_000 },
  { product: "Team", segment: "Enterprise", total: 540_000 },
  { product: "Team", segment: "SMB", total: 260_000 },
  { product: "Team", segment: "Consumer", total: 90_000 },
  { product: "Starter", segment: "Enterprise", total: 180_000 },
  { product: "Starter", segment: "SMB", total: 140_000 },
  { product: "Starter", segment: "Consumer", total: 100_000 },
];

const priceVsUsage = Array.from({ length: 60 }, (_, i) => {
  const tier = i % 3 === 0 ? "Enterprise" : i % 3 === 1 ? "SMB" : "Consumer";
  const basePrice = tier === "Enterprise" ? 900 : tier === "SMB" ? 300 : 80;
  return {
    price: basePrice + Math.random() * basePrice * 0.6,
    usage: (basePrice / 20) * (0.6 + Math.random() * 1.2),
    tier,
  };
});

const responseTimes = Array.from({ length: 200 }, () => ({
  latency: Math.max(10, 120 + (Math.random() - 0.5) * 200),
}));

const dealSizeByRegion = [
  ...Array.from({ length: 40 }, () => ({ region: "NA", deal: 80_000 + Math.random() * 200_000 })),
  ...Array.from({ length: 40 }, () => ({ region: "EU", deal: 60_000 + Math.random() * 160_000 })),
  ...Array.from({ length: 40 }, () => ({ region: "APAC", deal: 40_000 + Math.random() * 240_000 })),
  ...Array.from({ length: 40 }, () => ({ region: "LATAM", deal: 30_000 + Math.random() * 120_000 })),
];

// ---------- Slides ----------

export function ChartsIntro() {
  return (
    <Slide>
      <Stack gap="1rem" justify="center" align="flex-start">
        <p className="demo-label">05</p>
        <h2 className="demo-heading">Data-driven slides</h2>
        <p className="demo-text-lg" style={{ maxWidth: "55ch" }}>
          Mirion stays out of your way — any chart library works inside a slide.
          These examples render with <code>@kvis/mirion-chart</code>, a thin
          Semiotic wrapper with a clean, modern theme.
        </p>
      </Stack>
      <Notes>
        Set up the data-insights narrative here. Mention DuckDB + narrative markdown pipeline.
      </Notes>
    </Slide>
  );
}

export function RevenueLine() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">Revenue climbed 22% in Q3</h2>
        <Chart
          kind="line"
          data={revenueByMonth}
          x="month"
          y="revenue"
          color="segment"
          title="Monthly revenue by segment"
          width={960}
          height={420}
        />
        <Fragment animation="fade-up">
          <p className="demo-text" style={{ maxWidth: "70ch" }}>
            Enterprise drove most of the growth; SMB held flat; consumer ticked up modestly.
          </p>
        </Fragment>
      </Stack>
      <Notes>Talk about enterprise contract renewals landing in August.</Notes>
    </Slide>
  );
}

export function RevenueStackedArea() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">…and the stack makes the mix clear</h2>
        <Chart
          kind="area"
          stacked
          data={revenueByMonth}
          x="month"
          y="revenue"
          color="segment"
          title="Stacked revenue mix by month"
          width={960}
          height={420}
        />
      </Stack>
      <Notes>Stacked area reveals segment mix evolution over time.</Notes>
    </Slide>
  );
}

export function ProductBar() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">Top products by quarterly total</h2>
        <Chart
          kind="bar"
          data={topProducts}
          x="product"
          y="total"
          title="Q3 revenue by product"
          width={960}
          height={420}
        />
        <Fragment animation="fade-up">
          <p className="demo-text" style={{ maxWidth: "70ch" }}>
            Pro and Team together account for more than 70% of quarterly revenue.
          </p>
        </Fragment>
      </Stack>
    </Slide>
  );
}

export function ProductGroupedBar() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">…broken out by segment</h2>
        <Chart
          kind="bar"
          data={productBySegment}
          x="product"
          y="total"
          color="segment"
          title="Product revenue by segment"
          width={960}
          height={420}
        />
      </Stack>
    </Slide>
  );
}

export function PriceUsageScatter() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">Price vs usage, by tier</h2>
        <Chart
          kind="scatter"
          data={priceVsUsage}
          x="price"
          y="usage"
          color="tier"
          title="Scatter of price vs monthly usage"
          width={960}
          height={420}
        />
      </Stack>
      <Notes>Note the cluster structure — each tier lands in its own band.</Notes>
    </Slide>
  );
}

export function LatencyHistogram() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">P95 latency distribution</h2>
        <Chart
          kind="histogram"
          data={responseTimes}
          x="latency"
          title="Request latency (ms)"
          width={960}
          height={420}
        />
      </Stack>
    </Slide>
  );
}

export function DealSizeBox() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">Deal sizes by region</h2>
        <Chart
          kind="box"
          data={dealSizeByRegion}
          x="region"
          y="deal"
          title="Distribution of deal size across regions ($)"
          width={960}
          height={420}
        />
      </Stack>
    </Slide>
  );
}

export function MixPie() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">Revenue mix by product</h2>
        <Chart
          kind="pie"
          data={topProducts}
          x="product"
          y="total"
          title="Q3 revenue share"
          width={720}
          height={420}
        />
      </Stack>
    </Slide>
  );
}

export function TableFallback() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">When data resists chart-ification…</h2>
        <p className="demo-text" style={{ maxWidth: "60ch" }}>
          Some queries return rows that don't map to a chart. Mirion-chart falls
          back to a clean, typographic table — numerics right-aligned, large values
          formatted with k/M suffixes.
        </p>
        <Chart
          kind="table"
          data={topProducts}
          title="Top products — raw rows"
        />
      </Stack>
    </Slide>
  );
}

export function DashboardSplit() {
  return (
    <Slide>
      <Split ratio="1fr 1fr" gap="2rem">
        <Stack gap="1rem">
          <h3 className="demo-heading" style={{ fontSize: "1.6rem" }}>
            Revenue trend
          </h3>
          <Chart
            kind="line"
            data={revenueByMonth}
            x="month"
            y="revenue"
            color="segment"
            width={520}
            height={300}
          />
        </Stack>
        <Stack gap="1rem">
          <h3 className="demo-heading" style={{ fontSize: "1.6rem" }}>
            Top products
          </h3>
          <Chart
            kind="bar"
            data={topProducts}
            x="product"
            y="total"
            width={520}
            height={300}
          />
        </Stack>
      </Split>
      <Notes>
        This two-column layout is how data-review decks typically end —
        trend on the left, breakdown on the right.
      </Notes>
    </Slide>
  );
}

export default function ChartSlides() {
  return (
    <>
      <ChartsIntro />
      <RevenueLine />
      <RevenueStackedArea />
      <ProductBar />
      <ProductGroupedBar />
      <PriceUsageScatter />
      <LatencyHistogram />
      <DealSizeBox />
      <MixPie />
      <TableFallback />
      <DashboardSplit />
    </>
  );
}
