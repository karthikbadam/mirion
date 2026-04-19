# @kvis/mirion-cli

CLI for turning narrative markdown + datasets into [Mirion](https://github.com/karthikbadam/mirion) slide decks.

> **Status:** Phase 1 — skeleton and building blocks only. The `build`, `preview`, `new`, and `mirion-mcp` commands print an explicit "not implemented" message and exit with code 2. See [docs/plan-mirion-cli.md](../../docs/plan-mirion-cli.md) for the full staged plan.

## What's shipped today

- `@kvis/mirion-cli` package with bin stubs for `mirion` and `mirion-mcp`.
- `DeckIR` TypeScript type — the on-disk `deck.json` schema (version 1) that downstream phases fill.
- `parseDirective` + `validateDirective` — parser for inline chart directives like ` ```sql chart=line x=month y=revenue ``` `. Case-insensitive keys, typo suggestions via Levenshtein (`did you mean "color"?`).
- `nearest` / `topK` / `distance` utilities in `src/util/didyoumean.ts`.

## Install

```bash
pnpm add -D @kvis/mirion-cli
```

## Commands (Phase 1 stubs)

```
mirion new <name>           # Scaffold a story project           [Phase 8]
mirion build <story>        # Bake narrative + dataset -> deck   [Phase 2–5]
mirion preview <story>      # Live preview via Vite              [Phase 7]
mirion-mcp                  # MCP stdio server                   [Phase 9]
```

All commands exit 2 until their phase lands.

## Programmatic API (stable)

```ts
import {
  DECK_IR_VERSION,
  type DeckIR,
  ALLOWED_CHART_KINDS,
  parseDirective,
  validateDirective,
} from "@kvis/mirion-cli";

// IR types from the `/ir` subpath
import type { SlideIR, BlockIR, ChartBlock } from "@kvis/mirion-cli/ir";

const d = parseDirective('chart=line x=month y=revenue color="segment"');
// { chart: "line", bindings: { x: "month", y: "revenue", color: "segment" }, warnings: [] }
```

### Directive grammar

```
directive := token (whitespace token)*
token     := key "=" value | bareChartKind
value     := bareword | '"..."' | "'...'"
```

- First bare token may be a chart kind (`line`, `bar`, `area`, `scatter`, `histogram`, `box`, `pie`, `table`, `custom`).
- Allowed keys: `chart`, `x`, `y`, `color`, `facet`, `size`, `title`, `theme`, `stacked`, `orientation`.
- Keys are case-insensitive (`CHART=bar` and `chart=bar` are equivalent).
- Unknown keys → collected into `directive.unknown`, with a `"did you mean …?"` warning.

### `DeckIR` shape

See `src/ir/types.ts`. Top-level:

```ts
interface DeckIR {
  version: 1;
  meta: DeckMeta;
  slides: SlideIR[];
}
```

Blocks: `title | paragraph | list | code | chart | notes | custom`. Chart blocks carry the original SQL, a hash for caching, the bound accessors, and the baked rows.

## Roadmap

Implementation staged across 10 phases. Phase 1 (skeleton) shipped; Phase 4 (chart rendering via `@kvis/mirion-chart`) shipped alongside. Remaining phases deliver markdown parsing, DuckDB bake, emitters, preview server, MCP + planner/worker prompts.

Full plan: [`docs/plan-mirion-cli.md`](../../docs/plan-mirion-cli.md).

## License

MIT
