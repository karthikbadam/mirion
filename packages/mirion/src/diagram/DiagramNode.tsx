import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { colorPresets } from "./colors";
import type { DiagramColorPreset, DiagramNodeProps } from "./types";

/**
 * Marker component — renders nothing, just carries props
 * for <Diagram> to collect and convert into React Flow nodes.
 */
export function DiagramNodeMarker(_props: DiagramNodeProps) {
  return null;
}
DiagramNodeMarker.displayName = "Diagram.Node";

/** Data passed to the custom React Flow node renderer. */
export interface DiagramNodeData {
  label: string;
  subtitle?: string;
  color?: DiagramColorPreset;
  nodeClassName?: string;
  nodeStyle?: React.CSSProperties;
}

/** Custom React Flow node type that renders a styled box. */
export function DiagramNodeRenderer({
  data,
}: NodeProps & { data: DiagramNodeData }) {
  const scheme = data.color ? colorPresets[data.color] : colorPresets.gray;

  return (
    <div
      className={`mirion-diagram-node ${data.nodeClassName ?? ""}`}
      style={{
        background: scheme.fill,
        borderColor: scheme.border,
        color: scheme.text,
        ...data.nodeStyle,
      }}
    >
      <div className="mirion-diagram-node-title">{data.label}</div>
      {data.subtitle && (
        <div className="mirion-diagram-node-subtitle">{data.subtitle}</div>
      )}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="mirion-diagram-handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="mirion-diagram-handle"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="mirion-diagram-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="mirion-diagram-handle"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="mirion-diagram-handle"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="mirion-diagram-handle"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="mirion-diagram-handle"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="mirion-diagram-handle"
      />
    </div>
  );
}
