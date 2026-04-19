# Mirion Narrative-to-Deck CLI — Implementation Plan

## Context

Today Mirion (`@kvis/mirion`) is a minimal React presentation engine. Authoring a deck means writing JSX by hand. To make Mirion AI-native, we want a pipeline where:

1. A user (or LLM) writes a **narrative markdown file** describing insights from a dataset.
2. The narrative embeds **DuckDB SQL queries** in fenced code blocks, each tagged with a chart directive.
3. A new **`mirion` CLI** runs the SQL, bakes the rows into JSON, and emits both a `deck.json` (machine source of truth) and an editable `deck.tsx` (human escape hatch).
4. Charts render via a new `@kvis/mirion-chart` package that wraps Semiotic v3 with a **clean, modern theme** (neutral palette + modern typography), overriding Semiotic's bright defaults.
5. An **`mirion-mcp` MCP server** exposes the same pipeline as tools so AI agents can drive it end-to-end, with a **planner/worker prompt loop** that includes human-in-the-loop review.

Outcome: LLMs generate narrative markdown (which they're great at) instead of nested JSX (which they're bad at); humans still get a readable `.tsx` output to polish.

---

## Architecture (three packages)

| Package | Role | New? |
|---|---|---|
| `@kvis/mirion` | Runtime. Stays lean — no DuckDB, no markdown, no Semiotic. Add `fromJSON` ingest helper + dev-mode prop validator. | Existing, extended |
| `@kvis/mirion-chart` | `<Chart>` + `<QueryChart>` wrapping Semiotic v3, with clean-modern theme. Owns optional DuckDB-WASM runtime. | NEW |
| `@kvis/mirion-cli` | `mirion` + `mirion-mcp` binaries. Owns markdown parsing, DuckDB Node bake, emitters, preview server, MCP server, planner/worker prompts. | NEW |

Dep boundary rule: `@kvis/mirion` never imports DuckDB, Semiotic, or markdown libs. The chart layer is injectable into `fromJSON` via a `renderChart` callback.

---

## Sections below

- §1 Narrative format (markdown conventions)
- §2 DeckIR (the `deck.json` shape)
- §3 CLI commands (`new`, `build`, `preview`)
- §4 DuckDB integration (bake + WASM)
- §5 `deck.tsx` emitter
- §6 Runtime additions to `@kvis/mirion`
- §7 `@kvis/mirion-chart` + Semiotic theme
- §8 MCP server + planner/worker prompts
- §9 Scaffold + example deck with synthetic dataset
- §10 Unit tests
- §11 Preview server
- §12 Critical files
- §13 Verification plan
- §14 Staging

---

## §1 Narrative format

Plain markdown with four conventions. An LLM (or human) can write this in a single shot.

````markdown
---
title: "Q3 Sales Review"
theme: light
---

# Q3 Sales Review

A brief walk through the numbers.

---

## Revenue by month

```sql chart=line x=month y=revenue color=segment
SELECT strftime(order_date, '%Y-%m') AS month,
       segment,
       SUM(amount) AS revenue
FROM data
GROUP BY 1, 2
ORDER BY 1;
```

Revenue climbed 22% QoQ, driven by enterprise.

::: notes
Pause here — audience usually asks about churn.
:::

---

## Top products

```sql chart=bar x=product y=total
SELECT product, SUM(amount) AS total
FROM data
GROUP BY 1 ORDER BY total DESC LIMIT 10;
```
````

Rules:
- YAML frontmatter → `DeckIR.meta`.
- `---` (thematic break) starts a new slide.
- `# / ##` → `<Title>`.
- Fenced ` ```sql chart=… x=… y=… ` → run SQL, bake rows, render Semiotic chart.
- `::: notes ... :::` (remark-directive) → `<Notes>`.
- Plain paragraphs → `<p>` inside `<Stack>`.
- Default table alias for the registered dataset is `data` (zero-config `FROM data`).
- Escape hatches: `chart=table` (HTML table), `chart=custom` (next fence is raw JSX).

---

## §2 DeckIR (the `deck.json` shape)

File: `packages/mirion-cli/src/ir/types.ts`.

```ts
export const DECK_IR_VERSION = 1 as const;

export interface DeckIR {
  version: 1;
  meta: {
    title?: string;
    theme?: "light" | "dark" | "auto";
    width?: number;
    height?: number;
    transition?: "fade" | "slide" | "none";
    runtime?: "bake" | "duckdb";           // set by --runtime flag
    source?: { story: string; data?: string; generatedAt: string };
  };
  slides: SlideIR[];
}

export interface SlideIR {
  id: string;                              // stable hash of source span
  transition?: "fade" | "slide" | "none";
  blocks: BlockIR[];
  notes?: string;                          // concatenated ::: notes :::
}

export type BlockIR =
  | { kind: "title"; level: 1 | 2; text: string; subtitle?: string }
  | { kind: "paragraph"; text: string; inline?: InlineMd[] }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "code"; language?: string; source: string }
  | { kind: "notes"; text: string }
  | ChartBlock
  | { kind: "custom"; importName: string; props: Record<string, unknown> };

export interface ChartBlock {
  kind: "chart";
  chartType: "line"|"bar"|"area"|"scatter"|"histogram"|"box"|"pie"|"table"|"custom";
  sql: string;
  sqlHash: string;                         // sha256(sql) — cache key for WASM mode
  bindings: { x?: string; y?: string; color?: string; facet?: string; size?: string; title?: string };
  rows: Array<Record<string, string | number | boolean | null>>;   // baked
  schema?: Array<{ name: string; type: "number"|"string"|"boolean"|"date"|"null" }>;
  warnings?: string[];
}
```

Notes:
- JSON is versioned (`version: 1`) from day one.
- Every chart ships with both `sql` and `rows[]`. Baked rows always work; the `sql` enables live re-query when `runtime: "duckdb"`.
- Column schema is captured so the chart wrapper can infer scales (date vs number vs ordinal).

---

## §3 CLI commands

Package `packages/mirion-cli/` exposes two binaries via `package.json#bin`:
- `mirion` — interactive CLI.
- `mirion-mcp` — MCP stdio server (see §8).

### `mirion new <name>`
Scaffolds a new story project (see §9). No LLM calls, no data required.

### `mirion build <story.md>`
```bash
mirion build story.md --data data/sales.csv --out dist --runtime bake
```
Steps:
1. Parse markdown → `DeckIR` (without rows).
2. Open DuckDB session, register dataset (§4).
3. For each `ChartBlock`, run SQL, bake `rows` + `schema` into the IR.
4. Emit `dist/deck.json` (formatted, stable key order).
5. Emit `dist/deck.tsx` (imports rows from `./deck.json`).
6. Print warnings: unknown directive keys, missing columns, type coercions.

Flags: `--data <path>`, `--out <dir>`, `--runtime bake|duckdb` (default `bake`), `--quiet`.

### `mirion preview <story.md>`
```bash
mirion preview story.md --data data/sales.csv --port 5180
```
Programmatic Vite dev server with a virtual-module plugin (§11). Watches `story.md` and the dataset; re-bakes on change; full-reload or HMR.

### CLI entry (sketch)
File: `packages/mirion-cli/src/bin/mirion.ts`
```ts
import { cac } from "cac";
const cli = cac("mirion");
cli.command("new <name>", "Scaffold a story").action(scaffold);
cli.command("build <story>", "Bake a deck").option("--data <p>", "").option("--out <d>", "", { default: "dist" }).action(build);
cli.command("preview <story>", "Live preview").option("--data <p>", "").option("--port <n>", "", { default: 5180 }).action(preview);
cli.help(); cli.parse();
```

---

## §4 DuckDB integration

### Bake mode (default) — `src/sql/duckdb-node.ts`
Uses `@duckdb/node-api` (official promise-based bindings).
```ts
import { DuckDBInstance } from "@duckdb/node-api";
export async function openDuckSession(dataPath?: string) {
  const inst = await DuckDBInstance.create(":memory:");
  const conn = await inst.connect();
  if (dataPath) await registerDataset(conn, dataPath);
  return {
    run: async (sql: string) => serialize(await conn.runAndReadAll(sql)),
    close: async () => { await conn.close(); await inst.close(); },
  };
}
```

### Dataset registration — `src/sql/register-dataset.ts`
Detect by extension:
- `.csv` → `CREATE VIEW data AS SELECT * FROM read_csv_auto('<abs>', header=true, sample_size=-1);`
- `.parquet` → `read_parquet('<abs>')`
- `.json` / `.ndjson` → `read_json_auto('<abs>')`
- `.duckdb` → `ATTACH '<abs>' AS db; USE db;` (user supplies their own schema)
- Directory → register each file as a view named after the basename.

Default view alias `data` so zero-config queries work: `SELECT * FROM data`.

### Serialization — `src/sql/serialize.ts`
- `BIGINT`/`HUGEINT` → `number` when safe, otherwise stringify + warn.
- `TIMESTAMP`/`DATE` → ISO-8601 string.
- `DECIMAL` → `number` (documented lossy above 2^53).
- `BLOB` → omitted + warning.
- Column types captured into `ChartBlock.schema`.

### WASM mode (`--runtime duckdb`)
- CLI does not ship WASM. It sets `DeckIR.meta.runtime = "duckdb"` and the emitter switches `<Chart>` to `<QueryChart>`.
- `<QueryChart>` (in `mirion-chart`) dynamically imports `@duckdb/duckdb-wasm` (optional peer), shares one AsyncDuckDB across the deck via React context, and falls back to baked `rows` when WASM is unavailable.
- Identical `sqlHash` → skip re-query, use baked rows (free cache).

---

## §5 `deck.tsx` emitter

File: `packages/mirion-cli/src/emit/tsx.ts`. Tiny indent-and-wrap formatter (`emit/format.ts`), no prettier dep.

Generated shape:
```tsx
import { Deck, Slide, Title, List, Code, Stack, Notes } from "@kvis/mirion";
import { Chart } from "@kvis/mirion-chart";
import data from "./deck.json" with { type: "json" };

export default function GeneratedDeck() {
  return (
    <Deck background="#fff" color="#111" transition="fade">
      <Slide>
        <Title>Revenue by month</Title>
        <Stack gap="1.5rem">
          <Chart
            kind="line"
            data={data.slides[0].blocks[1].rows}
            x="month" y="revenue" color="segment"
          />
          <p>Revenue climbed 22% QoQ, driven by enterprise.</p>
        </Stack>
        <Notes>{"Pause here — audience usually asks about churn."}</Notes>
      </Slide>
      {/* … */}
    </Deck>
  );
}
```

Key choices:
- **Rows are imported from `deck.json`**, not inlined. Keeps `deck.tsx` human-readable.
- **Emit `<Chart>` (our wrapper)**, not raw Semiotic. Stable surface, theme applied automatically. `chart=custom` escape hatch via `CustomBlock`.
- Each slide: first `TitleBlock` becomes `<Title>`; remaining blocks wrap in `<Stack gap="1.5rem">`.
- Inline markdown (bold, italics, inline code, links) emitted as JSX via a small normalized inline-ast helper.

---

## §6 Runtime additions to `@kvis/mirion`

### 6.1 `fromJSON` helper
File: `packages/mirion/src/ingest/fromJSON.ts`.

```ts
import type { ReactNode } from "react";
export interface FromJSONOptions {
  renderChart?: (block: ChartBlockLike) => ReactNode;   // injected; mirion stays Semiotic-free
  renderCustom?: (block: CustomBlockLike) => ReactNode;
}
export function fromJSON(ir: unknown, opts?: FromJSONOptions): ReactNode;
```

Injection pattern means mirion has zero knowledge of charts or DuckDB; the caller (generated `deck.tsx` or a custom runner) passes `renderChart={(b) => <Chart {...b} />}`.

Export as a subpath + main barrel alias:
```jsonc
// packages/mirion/package.json
"exports": {
  ".": { "import": "./dist/mirion.js", ... },
  "./style.css": "./dist/mirion.css",
  "./ingest": { "import": "./dist/ingest/fromJSON.js", "types": "./dist/ingest/fromJSON.d.ts" }
}
```
Vite lib build updated to multi-entry.

### 6.2 Dev-mode prop validator
File: `packages/mirion/src/core/validate.ts`.
```ts
export function warnUnknownProps(component: "Deck"|"Slide"|"Fragment", props: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  // Compare keys against the known set; emit "did you mean …?" using Levenshtein.
}
```
Called at the top of `Deck.tsx`, `Slide.tsx`, `Fragment.tsx`. Zero runtime cost in production (Vite dead-code-eliminates the guarded block).

Bumps `@kvis/mirion` to `0.3.0`.

---

## §7 `@kvis/mirion-chart` + Semiotic theme

### 7.1 Package layout
```
packages/mirion-chart/
├── package.json            # peer: react, react-dom, semiotic ^3
├── vite.config.ts          # lib mode, externalize react + semiotic
├── tsconfig.json
└── src/
    ├── index.ts            # exports Chart, QueryChart, applyTheme
    ├── Chart.tsx           # kind -> Semiotic HOC dispatcher
    ├── QueryChart.tsx      # optional DuckDB-WASM wrapper
    ├── charts/             # Line, Bar, Area, Scatter, Histogram, Box, Pie, Table
    ├── duckdb-wasm/        # context + lazy loader
    ├── theme/
    │   ├── tokens.css      # CSS variables (palette, typography, spacing)
    │   ├── light.ts        # token values for light mode
    │   ├── dark.ts         # token values for dark mode
    │   └── apply.tsx       # reads CSS vars -> Semiotic style props
    └── util/
        ├── rowsToSeries.ts
        └── inferScale.ts
```

### 7.2 `<Chart>` API (single narrow surface)
```ts
export interface ChartProps {
  kind: "line"|"bar"|"area"|"scatter"|"histogram"|"box"|"pie"|"table";
  data: Array<Record<string, string|number|boolean|null>>;
  x?: string; y?: string; color?: string; facet?: string; size?: string;
  title?: string;
  theme?: "light"|"dark"|"auto";
  width?: number; height?: number;
  legend?: boolean;
}
```

Internal: one `switch (kind)` → imports the relevant Semiotic HOC from `semiotic/ai` and maps accessor strings to Semiotic's API (`xAccessor`, `yAccessor`, `lineType`, etc).

### 7.3 Overriding Semiotic's colors — theme

Semiotic ships bright/saturated defaults. We **aggressively override** via three layers:

**Layer 1 — CSS design tokens (`src/theme/tokens.css`).** Users override with one CSS block.
```css
:root {
  --mc-font-sans: ui-sans-serif, Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mc-fg: #0f172a;                 /* slate-900 */
  --mc-bg: transparent;
  --mc-muted: #64748b;              /* slate-500 */
  --mc-grid: color-mix(in oklab, currentColor 8%, transparent);
  --mc-axis: color-mix(in oklab, currentColor 35%, transparent);

  /* Modern, muted categorical palette — 7 hues, no neon */
  --mc-palette-0: #0f766e;          /* teal-700  */
  --mc-palette-1: #4f46e5;          /* indigo-600 */
  --mc-palette-2: #b45309;          /* amber-700 */
  --mc-palette-3: #be123c;          /* rose-700  */
  --mc-palette-4: #047857;          /* emerald-700 */
  --mc-palette-5: #7c3aed;          /* violet-600 */
  --mc-palette-6: #475569;          /* slate-600 */

  --mc-stroke: 1.5px;
  --mc-pad-plot: 48px;
  --mc-pad-axis: 32px;
  --mc-radius: 4px;
}
@media (prefers-color-scheme: dark) {
  :root { --mc-fg: #e2e8f0; --mc-muted: #94a3b8; /* palette keeps same hues, works on dark */ }
}
```

**Layer 2 — Semiotic style functions (`src/theme/apply.tsx`).** At mount, read the CSS vars via `getComputedStyle` and produce the Semiotic prop shapes: `style`/`lineStyle`/`axes[n].tickLineStyle`/`axes[n].label` with resolved values. No hardcoded colors anywhere in the component code — all come from tokens.

**Layer 3 — No user opt-out by default.** `<Chart>` always applies the theme. Power users can override per-prop (`<Chart legend={false} />`) or pass a different token set via `data-theme="brand"` on a wrapping element.

Design intent: **clean, editorial, neutral**. Thin axes, no heavy gridlines, generous whitespace, one accent hue per series, modern sans typography, subtle rounded corners on bars.

### 7.4 `<QueryChart>`
Same props as `<Chart>` plus `runtime?: "bake"|"duckdb"`, `sql?: string`, `sqlHash?: string`, `fallback: data[]`. When `runtime === "duckdb"`, lazy-loads `@duckdb/duckdb-wasm`, reuses a shared `AsyncDuckDB` from `DuckContext`, runs `sql`, swaps `data`. Otherwise renders `<Chart>` with `fallback` immediately.

---

## §8 MCP server + planner/worker prompts

### 8.1 Where prompts live
Prompts are checked-in, versioned markdown/txt files so they diff cleanly in PRs. They live under the CLI package:

```
packages/mirion-cli/src/prompts/
├── planner.md              # system prompt for the planning stage
├── worker.md               # system prompt for the slide-drafting stage
├── suggest-chart.md        # system prompt for `render_chart` chart-kind suggestions
├── tool-descriptions.ts    # MCP tool descriptions (re-read at server startup)
└── narrative-scaffold.md   # the story.md template used by `mirion new`
```

Prompts are bundled into the CLI at build time (read as strings via Node `fs.readFileSync` relative to `dist/`). Users can override any prompt by setting `MIRION_PROMPTS_DIR=/path/to/overrides`.

### 8.2 Planner/worker loop (human-in-the-loop)
The deck generation is iterative; each step is a separate MCP tool call so the host (Claude / Cursor / etc.) surfaces the intermediate output to a human who can edit before moving on.

```
  ┌──────────┐ plan_deck   ┌──────────┐ draft_slide  ┌───────────┐ build_deck
  │ dataset  │────────────▶│ planner  │─────────────▶│  worker   │────────────▶ deck.json
  │ + intent │             │  prompt  │  (per slide) │  prompt   │             + deck.tsx
  └──────────┘             └──────────┘              └───────────┘
                              │ outline                │ slide md
                              ▼                        ▼
                       human reviews               human reviews
                       (add/remove/reorder)         (edit SQL, prose)
```

### 8.3 Planner prompt (`prompts/planner.md`) — sketch
Responsibilities:
- Input: dataset schema (column names + types + 5-row sample), optional user intent ("quarterly review for execs"), deck length hint.
- Output: strict JSON `{ outline: [{ title, goal, sqlSketch?, chartKindGuess? }, …] }` — 4–8 slides.
- Rules: favor temporal trend slides first, comparative slides next, outlier/callout slides last; never invent columns; if data is sparse, say so.

### 8.4 Worker prompt (`prompts/worker.md`) — sketch
Responsibilities:
- Input: one outline item, full dataset schema, optional prior slides (for narrative continuity).
- Output: a markdown slide fragment in the Mirion narrative format (§1) — heading, `sql chart=…` block, short narrative paragraph, optional `::: notes :::`.
- Rules: SQL must be valid DuckDB; bindings must reference columns the SQL produces; chart kind chosen by rules (date+number→line, cat+number→bar, num+num→scatter, one num→histogram); narrative paragraph ≤ 2 sentences.

### 8.5 MCP tools (`packages/mirion-cli/src/mcp/`)
Binary: `mirion-mcp` (stdio transport via `@modelcontextprotocol/sdk`).

| Tool | Input | Output |
|---|---|---|
| `plan_deck` | `{ dataPath, intent?, length? }` | `{ outline: OutlineItem[], schema }` — calls planner prompt |
| `draft_slide` | `{ outlineItem, dataPath, priorSlides? }` | `{ markdown }` — calls worker prompt |
| `build_deck` | `{ storyPath, dataPath?, out, runtime? }` | `{ jsonPath, tsxPath, warnings, slideCount, chartCount }` |
| `preview_deck` | `{ storyPath, dataPath?, port? }` | `{ url, stopToken }` |
| `add_slide` | `{ deckPath, markdown }` | `{ slideIndex, newStoryPath }` |
| `render_chart` | `{ sql, dataPath, directive? }` | `{ rows, schema, suggestedDirective, reason }` |

LLM calls (`plan_deck`, `draft_slide`) use the host's model via MCP sampling — the MCP server does **not** embed an API key. The prompts + schemas are sent; the host runs the model. This matches MCP's design and avoids a BYO-key requirement.

Shared code path: each MCP tool delegates to the same programmatic API the CLI uses (`build(opts)`, `preview(opts)`, etc.), so there's a single implementation to test.

---

## §9 Scaffold + example deck (synthetic dataset)

Two locations; same template:

### 9.1 `mirion new` template
Shipped inside the CLI at `packages/mirion-cli/templates/story/`.

```
templates/story/
├── story.md.tmpl
├── data/sales.csv          # synthetic, ~60 rows
├── package.json.tmpl       # {{name}} substitution
├── vite.config.ts.tmpl
├── index.html.tmpl
├── src/main.tsx.tmpl       # mounts <GeneratedDeck /> from dist/deck.tsx
└── README.md.tmpl
```

Scaffold algorithm (`src/commands/new.ts`): read each `.tmpl`, substitute `{{name}}`, strip `.tmpl`, copy non-templated files verbatim. 10-line `replaceAll`, no template-engine dep.

### 9.2 Example deck in the monorepo
`examples/sales-review/` at the repo root (NOT inside `packages/`):

```
examples/sales-review/
├── story.md                # hand-written, 4–5 slides, covers every chart kind
├── data/sales.csv          # 60 rows: order_date, segment, product, region, amount
├── dist/
│   ├── deck.json           # checked-in "golden" output (for snapshot tests)
│   └── deck.tsx            # checked-in
├── package.json
├── vite.config.ts
└── README.md
```

This doubles as:
- A dogfoodable example (`cd examples/sales-review && pnpm dev`).
- An integration-test fixture (§10).
- The canonical demo of the clean-modern Semiotic theme.

Synthetic `sales.csv` columns: `order_date` (3 months of daily entries), `segment` (enterprise / smb / consumer), `product` (8 products), `region` (4 regions), `amount` (realistic distribution). Generated deterministically once and checked in.

Root `pnpm-workspace.yaml` adds `examples/*` so the example resolves `@kvis/*` via workspace links.

---

## §10 Unit tests (Vitest)

Each package gets its own `vitest.config.ts`. Add vitest as a root devDependency. Root script: `pnpm test` runs all packages in parallel.

### 10.1 `@kvis/mirion` tests (`packages/mirion/src/**/*.test.ts`)
- `core/validate.test.ts` — `warnUnknownProps` suggests nearest known key; silent in production.
- `ingest/fromJSON.test.ts` — renders a minimal IR; `renderChart` callback receives expected block; snapshot of resulting React tree.
- `components/Fragment.test.ts` — auto-increment order, explicit `order` override.
- `components/Deck.test.ts` — registration, navigation dispatch (existing behavior coverage we add now).

### 10.2 `@kvis/mirion-chart` tests (`packages/mirion-chart/src/**/*.test.ts`)
- `Chart.test.tsx` — each `kind` renders (jsdom + Semiotic snapshot). Asserts CSS tokens applied (queries computed color of first series, matches `--mc-palette-0`).
- `theme/apply.test.ts` — `applyTheme()` reads CSS vars and produces expected Semiotic style object.
- `duckdb-wasm/loader.test.ts` — lazy-load path does not import `@duckdb/duckdb-wasm` unless `runtime: "duckdb"` (mocked dynamic import).
- `util/inferScale.test.ts` — dates→time, numbers→linear, strings→ordinal.

### 10.3 `@kvis/mirion-cli` tests (`packages/mirion-cli/src/**/*.test.ts`)
- `parse/directives.test.ts` — grammar: kv parsing, quoted values, bareword chart, unknown key with "did you mean" suggestion.
- `parse/markdown.test.ts` — slide splits, frontmatter, `::: notes :::`, sql fence detection, unknown container directive warnings.
- `parse/validate.test.ts` — zod schema catches invalid chart kinds; cross-check bindings vs result schema emits warnings.
- `sql/register-dataset.test.ts` — each extension maps to correct view SQL (pure function).
- `sql/duckdb-node.test.ts` — against a tiny in-test CSV: register → run → serialize → expected rows. Runs DuckDB Node for real (marked `integration`).
- `sql/serialize.test.ts` — BIGINT boundary, TIMESTAMP → ISO, DECIMAL, BLOB omission.
- `emit/json.test.ts` — stable key order, version field present.
- `emit/tsx.test.ts` — snapshot against a fixed IR fixture; output compiles under `ts-node --transpile-only` or `tsc --noEmit` in the test.
- `commands/build.test.ts` — end-to-end against `examples/sales-review`: produced `deck.json` matches checked-in golden, `deck.tsx` matches golden.
- `commands/new.test.ts` — scaffold to a temp dir, asserts file list + `{{name}}` substitution.
- `mcp/server.test.ts` — boot server with stub transport, call each tool, assert input validation + output shape.
- `util/didyoumean.test.ts` — Levenshtein distance + nearest-match picker.

### 10.4 Test runner policy
- Fast unit tests: pure functions, jsdom component tests. No DuckDB.
- Integration tests: spin up DuckDB Node, run against `examples/sales-review`. Tagged so they can be skipped on constrained CI.
- No E2E browser tests in v1 (manual verification per §13 suffices).

---

## §11 Preview server

Approach: **Vite programmatic API + virtual-module plugin** (no temp directory).

File: `packages/mirion-cli/src/preview/server.ts`
```ts
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { mirionNarrativePlugin } from "./virtual-entry";

export async function preview(opts: PreviewOptions) {
  const server = await createServer({
    root: opts.cwd ?? process.cwd(),
    plugins: [react(), mirionNarrativePlugin(opts)],
    server: { port: opts.port ?? 5180, host: opts.host, open: opts.open ?? true },
    appType: "spa",
  });
  await server.listen();
  return { url: server.resolvedUrls!.local[0], close: () => server.close() };
}
```

Virtual modules (in `preview/virtual-entry.ts`):
- `virtual:mirion/deck.json` — stringified IR (re-emitted on each update).
- `virtual:mirion/deck.tsx` — emitted TSX importing the above.
- `virtual:mirion/entry.tsx` — React root (`createRoot(document.getElementById("root")!).render(<GeneratedDeck />)`).
- `transformIndexHtml` injects a default `index.html` with `<div id="root">` and a script tag to `virtual:mirion/entry.tsx`.

Watch strategy:
- `fs.watch` on `storyPath` and `dataPath`.
- On markdown change → re-parse, re-bake only `ChartBlock`s whose `sqlHash` changed, update IR, invalidate the three virtual modules.
- On data change → invalidate all chart rows (simpler than dependency tracking).
- V1 does `server.ws.send({ type: "full-reload" })`. A follow-up can emit a custom `mirion:data-updated` event and swap `data` props in-place.

---

## §12 Critical files

### Existing files to modify
- `/home/user/mirion/pnpm-workspace.yaml` — add `examples/*` to workspace globs.
- `/home/user/mirion/package.json` — add `test`, `build:all` scripts; add vitest devDep.
- `/home/user/mirion/packages/mirion/package.json` — bump to `0.3.0`; add `./ingest` subpath export.
- `/home/user/mirion/packages/mirion/src/index.ts` — re-export `fromJSON`.
- `/home/user/mirion/packages/mirion/src/components/Deck.tsx` — wire `warnUnknownProps`.
- `/home/user/mirion/packages/mirion/src/components/Slide.tsx` — wire `warnUnknownProps`.
- `/home/user/mirion/packages/mirion/src/components/Fragment.tsx` — wire `warnUnknownProps`.
- `/home/user/mirion/packages/mirion/vite.config.ts` — multi-entry build for the `ingest` subpath.

### New files — `@kvis/mirion` additions
- `/home/user/mirion/packages/mirion/src/ingest/fromJSON.ts`
- `/home/user/mirion/packages/mirion/src/core/validate.ts`

### New files — `@kvis/mirion-chart`
- `/home/user/mirion/packages/mirion-chart/package.json`
- `/home/user/mirion/packages/mirion-chart/vite.config.ts`
- `/home/user/mirion/packages/mirion-chart/tsconfig.json`
- `/home/user/mirion/packages/mirion-chart/src/index.ts`
- `/home/user/mirion/packages/mirion-chart/src/Chart.tsx`
- `/home/user/mirion/packages/mirion-chart/src/QueryChart.tsx`
- `/home/user/mirion/packages/mirion-chart/src/charts/{Line,Bar,Area,Scatter,Histogram,Box,Pie,Table}.tsx`
- `/home/user/mirion/packages/mirion-chart/src/theme/{tokens.css,light.ts,dark.ts,apply.tsx}`
- `/home/user/mirion/packages/mirion-chart/src/duckdb-wasm/{context.tsx,loader.ts}`
- `/home/user/mirion/packages/mirion-chart/src/util/{rowsToSeries.ts,inferScale.ts}`

### New files — `@kvis/mirion-cli`
- `/home/user/mirion/packages/mirion-cli/package.json`
- `/home/user/mirion/packages/mirion-cli/tsconfig.json`
- `/home/user/mirion/packages/mirion-cli/src/bin/{mirion.ts,mirion-mcp.ts}`
- `/home/user/mirion/packages/mirion-cli/src/index.ts`
- `/home/user/mirion/packages/mirion-cli/src/ir/{types.ts,index.ts}`
- `/home/user/mirion/packages/mirion-cli/src/commands/{new.ts,build.ts,preview.ts}`
- `/home/user/mirion/packages/mirion-cli/src/parse/{markdown.ts,directives.ts,validate.ts}`
- `/home/user/mirion/packages/mirion-cli/src/sql/{duckdb-node.ts,register-dataset.ts,serialize.ts}`
- `/home/user/mirion/packages/mirion-cli/src/emit/{json.ts,tsx.ts,format.ts}`
- `/home/user/mirion/packages/mirion-cli/src/preview/{server.ts,virtual-entry.ts}`
- `/home/user/mirion/packages/mirion-cli/src/mcp/{server.ts,tools/*.ts}`
- `/home/user/mirion/packages/mirion-cli/src/prompts/{planner.md,worker.md,suggest-chart.md,tool-descriptions.ts,narrative-scaffold.md}`
- `/home/user/mirion/packages/mirion-cli/src/util/{paths.ts,didyoumean.ts}`
- `/home/user/mirion/packages/mirion-cli/templates/story/*`

### New files — example deck
- `/home/user/mirion/examples/sales-review/story.md`
- `/home/user/mirion/examples/sales-review/data/sales.csv`
- `/home/user/mirion/examples/sales-review/dist/{deck.json,deck.tsx}` — checked-in golden
- `/home/user/mirion/examples/sales-review/{package.json,vite.config.ts,index.html,src/main.tsx,README.md}`

---

## §13 Verification plan

End-to-end manual test:
```bash
# Clean build from root
pnpm install
pnpm --filter @kvis/mirion build
pnpm --filter @kvis/mirion-chart build
pnpm --filter @kvis/mirion-cli build

# Unit + integration tests
pnpm test

# Example deck
cd examples/sales-review
pnpm dev
# -> http://localhost:5173 shows the deck; charts render with clean-modern theme.

# CLI end-to-end on the example (bypassing dev link)
node ../../packages/mirion-cli/dist/bin/mirion.js build story.md --data data/sales.csv --out dist-test
diff dist/deck.json dist-test/deck.json   # should be empty (golden match)

# Scaffold a fresh project outside the monorepo
cd /tmp && node /home/user/mirion/packages/mirion-cli/dist/bin/mirion.js new q3-review
cd q3-review && pnpm install && pnpm build && pnpm preview

# MCP smoke test
node /home/user/mirion/packages/mirion-cli/dist/bin/mirion-mcp.js
# Send: {"jsonrpc":"2.0","id":1,"method":"tools/list"} -> six tools listed
# Send: tools/call build_deck with example paths -> jsonPath/tsxPath returned

# --runtime duckdb mode
cd examples/sales-review
mirion build story.md --data data/sales.csv --runtime duckdb --out dist-wasm
# Open dist-wasm in Vite, verify WASM loads and re-queries on data change.
```

Acceptance criteria:
1. `pnpm test` passes. Golden snapshots match.
2. `examples/sales-review` renders visually identical decks via `pnpm dev` and via a fresh `mirion build`.
3. Directive typos (`colr=segment`) produce a console warning with a suggestion.
4. Editing `deck.tsx` directly (swap `kind="line"` to `kind="bar"`) updates the live preview.
5. MCP server responds to `tools/list` with all six tools and `tools/call build_deck` produces artifacts.

---

## §14 Staging (order of work)

Risk-carrying integrations go early so we hit walls on day 2, not day 7.

**Phase 1 — Skeleton (day 1)**
- CLI package skeleton, `cac` stubs for `new|build|preview`.
- `ir/types.ts` (DeckIR).
- `util/didyoumean.ts` + `parse/directives.ts` (pure, unit-testable).

**Phase 2 — Markdown → IR (day 1–2)**
- `parse/markdown.ts` + `parse/validate.ts`.
- `emit/json.ts` for text-only slides.
- `mirion build story.md --out dist` works without data.

**Phase 3 — DuckDB bake (day 2–3, risk-carrying)**
- `sql/duckdb-node.ts`, `register-dataset.ts`, `serialize.ts`.
- Post-process IR to fill `ChartBlock.rows`.
- Verify on `examples/sales-review/data/sales.csv`.

**Phase 4 — mirion-chart (day 3–4, risk-carrying for Semiotic v3 API)**
- Package skeleton, `Chart.tsx` dispatcher, `Line.tsx` + `Bar.tsx` first.
- `theme/tokens.css` + `theme/apply.tsx`. Verify palette override works.
- Remaining chart kinds.

**Phase 5 — TSX emitter (day 4)**
- `emit/tsx.ts` + `emit/format.ts`.
- Wire into `build` command. Example `dist/deck.tsx` compiles.

**Phase 6 — Mirion runtime additions (day 4–5)**
- `ingest/fromJSON.ts` + subpath export + vite multi-entry.
- `core/validate.ts` + wire into Deck/Slide/Fragment.
- Bump to `0.3.0`.

**Phase 7 — Preview + WASM (day 5–6)**
- `preview/server.ts` + `virtual-entry.ts`. Full-reload on change.
- `mirion-chart/duckdb-wasm/*` + flesh out `QueryChart`.
- Verify `--runtime duckdb` end-to-end.

**Phase 8 — Scaffold + example (day 6)**
- `commands/new.ts` + templates.
- Build `examples/sales-review` with golden outputs.

**Phase 9 — MCP + prompts (day 6–7)**
- `prompts/planner.md`, `prompts/worker.md`, `prompts/suggest-chart.md`.
- `mcp/server.ts` + six tools. Sampling-based LLM calls.
- End-to-end verification per §13.

**Phase 10 — Tests (rolling)**
- Add unit tests alongside each new module (TDD where cheap; retrofit where faster).
- Integration test for `examples/sales-review` added in Phase 8.

### Risk hotspots
- **DuckDB Node on Node 20+**: `@duckdb/node-api` is native. Mitigation: dynamic import so data-less `build` still works if bindings fail.
- **Semiotic v3 `semiotic/ai` surface**: pin to a known-good version; wrap each chart kind in its own file so API shifts only ripple locally.
- **MCP SDK version churn**: pin exact version; MCP tool handlers delegate to plain async functions shared with the CLI.
- **Import assertion `with { type: "json" }`**: requires Node 22.x or `moduleResolution: "bundler"`. Scaffolded tsconfig sets `bundler`.







