import type { NodeProps } from "@xyflow/react";
import type { DiagramGroupProps } from "./types";

/**
 * Marker component — renders nothing, just carries props
 * for <Diagram> to collect and convert into React Flow group nodes.
 */
export function DiagramGroupMarker(_props: DiagramGroupProps) {
  return null;
}
DiagramGroupMarker.displayName = "Diagram.Group";

/** Data passed to the custom React Flow group renderer. */
export interface DiagramGroupData {
  label?: string;
  groupWidth: number;
  groupHeight: number;
  groupClassName?: string;
  groupStyle?: React.CSSProperties;
}

/** Custom React Flow node type that renders a dashed-border group. */
export function DiagramGroupRenderer({
  data,
}: NodeProps & { data: DiagramGroupData }) {
  return (
    <div
      className={`mirion-diagram-group ${data.groupClassName ?? ""}`}
      style={{
        width: data.groupWidth,
        height: data.groupHeight,
        ...data.groupStyle,
      }}
    >
      {data.label && (
        <div className="mirion-diagram-group-label">{data.label}</div>
      )}
    </div>
  );
}
