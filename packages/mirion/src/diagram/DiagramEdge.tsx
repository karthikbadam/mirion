import type { DiagramEdgeProps } from "./types";

/**
 * Marker component — renders nothing, just carries props
 * for <Diagram> to collect and convert into React Flow edges.
 */
export function DiagramEdgeMarker(_props: DiagramEdgeProps) {
  return null;
}
DiagramEdgeMarker.displayName = "Diagram.Edge";
