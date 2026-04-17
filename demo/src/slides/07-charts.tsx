import { Slide, Stack, Notes, Fragment, Split } from "@kvis/mirion";
import { Chart } from "@kvis/mirion-chart";
import "@kvis/mirion-chart/style.css";

const revenueByMonth = [
  { month: "Jul", segment: "Enterprise", revenue: 620_000 },
  { month: "Jul", segment: "SMB", revenue: 310_000 },
  { month: "Jul", segment: "Consumer", revenue: 180_000 },
  { month: "Aug", segment: "Enterprise", revenue: 740_000 },
  { month: "Aug", segment: "SMB", revenue: 290_000 },
  { month: "Aug", segment: "Consumer", revenue: 195_000 },
  { month: "Sep", segment: "Enterprise", revenue: 860_000 },
  { month: "Sep", segment: "SMB", revenue: 305_000 },
  { month: "Sep", segment: "Consumer", revenue: 210_000 },
];

const topProducts = [
  { product: "Pro", total: 1_250_000 },
  { product: "Team", total: 890_000 },
  { product: "Starter", total: 420_000 },
  { product: "Edu", total: 310_000 },
  { product: "Free", total: 95_000 },
];

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
      <ProductBar />
      <DashboardSplit />
    </>
  );
}
