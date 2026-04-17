export const DECK_IR_VERSION = 1 as const;

export type TransitionType = "fade" | "slide" | "none";
export type ThemeMode = "light" | "dark" | "auto";
export type RuntimeMode = "bake" | "duckdb";

export type ChartKind =
  | "line"
  | "bar"
  | "area"
  | "scatter"
  | "histogram"
  | "box"
  | "pie"
  | "table"
  | "custom";

export type ScalarValue = string | number | boolean | null;
export type Row = Record<string, ScalarValue>;

export interface DeckMeta {
  title?: string;
  theme?: ThemeMode;
  width?: number;
  height?: number;
  transition?: TransitionType;
  runtime?: RuntimeMode;
  source?: {
    story: string;
    data?: string;
    generatedAt: string;
  };
}

export interface InlineMd {
  kind: "text" | "emphasis" | "strong" | "inlineCode" | "link";
  value?: string;
  url?: string;
  children?: InlineMd[];
}

export interface TitleBlock {
  kind: "title";
  level: 1 | 2;
  text: string;
  subtitle?: string;
}

export interface ParagraphBlock {
  kind: "paragraph";
  text: string;
  inline?: InlineMd[];
}

export interface ListBlock {
  kind: "list";
  ordered: boolean;
  items: string[];
}

export interface CodeBlock {
  kind: "code";
  language?: string;
  source: string;
}

export interface NotesBlock {
  kind: "notes";
  text: string;
}

export interface ChartBindings {
  x?: string;
  y?: string;
  color?: string;
  facet?: string;
  size?: string;
  title?: string;
}

export interface ColumnSchema {
  name: string;
  type: "number" | "string" | "boolean" | "date" | "null";
}

export interface ChartBlock {
  kind: "chart";
  chartType: ChartKind;
  sql: string;
  sqlHash: string;
  bindings: ChartBindings;
  rows: Row[];
  schema?: ColumnSchema[];
  warnings?: string[];
}

export interface CustomBlock {
  kind: "custom";
  importName: string;
  props: Record<string, unknown>;
}

export type BlockIR =
  | TitleBlock
  | ParagraphBlock
  | ListBlock
  | CodeBlock
  | NotesBlock
  | ChartBlock
  | CustomBlock;

export interface SlideIR {
  id: string;
  transition?: TransitionType;
  blocks: BlockIR[];
  notes?: string;
}

export interface DeckIR {
  version: typeof DECK_IR_VERSION;
  meta: DeckMeta;
  slides: SlideIR[];
}

export interface Warning {
  code: string;
  message: string;
  line?: number;
  column?: number;
  hint?: string;
}
