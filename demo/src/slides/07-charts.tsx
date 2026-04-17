import { Slide, Stack, Notes, Fragment, Split } from "@kvis/mirion";
import { Chart, StreamChart, type StreamHandle } from "@kvis/mirion-chart";
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

// A small simulated live source for the streaming slide. Walks a sine-with-noise
// signal; `source` returns the cleanup fn so React unmounts it cleanly.
function liveLatencySource(handle: StreamHandle) {
  let t = Date.now();
  let i = 0;
  const id = setInterval(() => {
    t += 500;
    i += 1;
    const v = 140 + Math.sin(i / 7) * 30 + (Math.random() - 0.5) * 25;
    handle.push({ t, v });
  }, 500);
  return () => clearInterval(id);
}

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
          Semiotic wrapper with a clean, modern theme. Charts fit the parent
          container and scale down on narrow screens.
        </p>
      </Stack>
      <Notes>Mention the DuckDB + narrative markdown pipeline that produces these decks.</Notes>
    </Slide>
  );
}

export function RevenueLine() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">Revenue climbed 22% in Q3</h2>
        <div style={{ width: "100%", maxWidth: "900px" }}>
          <Chart
            kind="line"
            data={revenueByMonth}
            x="month"
            y="revenue"
            color="segment"
            title="Monthly revenue by segment"
            height={320}
          />
        </div>
        <Fragment animation="fade-up">
          <p className="demo-text" style={{ maxWidth: "70ch" }}>
            Enterprise drove most of the growth; SMB held flat; consumer ticked up.
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
        <div style={{ width: "100%", maxWidth: "900px" }}>
          <Chart
            kind="bar"
            data={topProducts}
            x="product"
            y="total"
            title="Q3 revenue by product"
            height={320}
          />
        </div>
        <Fragment animation="fade-up">
          <p className="demo-text" style={{ maxWidth: "70ch" }}>
            Pro and Team together account for more than 70% of quarterly revenue.
          </p>
        </Fragment>
      </Stack>
    </Slide>
  );
}

export function LiveLatency() {
  return (
    <Slide>
      <Stack gap="1.25rem" justify="center">
        <h2 className="demo-heading">Live data streams into slides</h2>
        <div style={{ width: "100%", maxWidth: "900px" }}>
          <StreamChart
            kind="line"
            timeKey="t"
            valueKey="v"
            source={liveLatencySource}
            title="Latency (ms), 500ms tick"
            height={280}
          />
        </div>
        <Fragment animation="fade-up">
          <p className="demo-text" style={{ maxWidth: "70ch" }}>
            Semiotic's Realtime frames ship with a ref-based push API — new points
            append in place, no re-render churn.
          </p>
        </Fragment>
      </Stack>
      <Notes>
        This is powered by RealtimeLineChart under the hood. Perfect for live
        dashboards, ops reviews, or demos.
      </Notes>
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
            height={260}
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
            height={260}
          />
        </Stack>
      </Split>
      <Notes>Two fluid charts side-by-side — they shrink when the split narrows.</Notes>
    </Slide>
  );
}

export default function ChartSlides() {
  return (
    <>
      <ChartsIntro />
      <RevenueLine />
      <ProductBar />
      <LiveLatency />
      <DashboardSplit />
    </>
  );
}
