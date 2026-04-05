import type { CSSProperties, ReactNode } from "react";

export interface DiagramProps {
  children: ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
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
  /** Assign to a group by its id */
  group?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: DiagramColorPreset;
  subtitle?: string;
  className?: string;
  style?: CSSProperties;
}

export interface DiagramGroupProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
