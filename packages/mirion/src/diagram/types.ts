import type { CSSProperties, ReactNode, ComponentProps } from "react";
import type { ReactFlow } from "@xyflow/react";

/** Props accepted by the underlying React Flow component. */
export type ReactFlowPassthrough = Omit<
  ComponentProps<typeof ReactFlow>,
  "nodes" | "edges" | "nodeTypes"
>;

export interface DiagramProps {
  children: ReactNode;
  /** Container width. Defaults to "100%" — React Flow's fitView scales content. */
  width?: number | string;
  /** Container height. Defaults to 400. */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  /** Pass-through props forwarded to the underlying React Flow instance.
   *  Overrides Mirion's static defaults (e.g. enable drag, zoom, etc.). */
  flowProps?: ReactFlowPassthrough;
}

export type DiagramColorPreset =
  | "red"
  | "green"
  | "blue"
  | "purple"
  | "olive"
  | "teal"
  | "gray";

export interface DiagramNodeProps {
  id: string;
  children: ReactNode;
  /** Assign to a group by its id (alternative to nesting inside Diagram.Group) */
  group?: string;
  /** Horizontal position. Auto-computed if omitted. */
  x?: number;
  /** Vertical position. Auto-computed if omitted. */
  y?: number;
  width?: number;
  height?: number;
  color?: DiagramColorPreset;
  subtitle?: string;
  className?: string;
  style?: CSSProperties;
}

export interface DiagramGroupProps {
  id: string;
  /** Nodes nested inside this group. */
  children?: ReactNode;
  /** Horizontal position. Auto-computed if omitted. */
  x?: number;
  /** Vertical position. Auto-computed if omitted. */
  y?: number;
  /** Group width. Auto-computed from children if omitted. */
  width?: number;
  /** Group height. Auto-computed from children if omitted. */
  height?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export interface DiagramEdgeProps {
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
}
