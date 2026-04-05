import React, { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  DiagramNodeMarker,
  DiagramNodeRenderer,
  type DiagramNodeData,
} from "./DiagramNode";
import {
  DiagramGroupMarker,
  DiagramGroupRenderer,
  type DiagramGroupData,
} from "./DiagramGroup";
import { DiagramEdgeMarker } from "./DiagramEdge";
import type {
  DiagramProps,
  DiagramNodeProps,
  DiagramGroupProps,
  DiagramEdgeProps,
} from "./types";

import "./diagram.css";

const nodeTypes = {
  diagramNode: DiagramNodeRenderer,
  diagramGroup: DiagramGroupRenderer,
};

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#888" },
  style: { stroke: "#888", strokeWidth: 1.5 },
};

/**
 * Determine which handle sides to use based on relative node positions.
 * Returns [sourceHandle, targetHandle].
 */
function autoRoute(
  src: { x: number; y: number; w: number; h: number },
  tgt: { x: number; y: number; w: number; h: number },
): [string, string] {
  const srcCx = src.x + src.w / 2;
  const srcCy = src.y + src.h / 2;
  const tgtCx = tgt.x + tgt.w / 2;
  const tgtCy = tgt.y + tgt.h / 2;

  const dx = tgtCx - srcCx;
  const dy = tgtCy - srcCy;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant
    return dx > 0 ? ["right", "target-left"] : ["left", "target-right"];
  }
  // Vertical dominant
  return dy > 0 ? ["bottom", "target-top"] : ["top", "target-bottom"];
}

function collectChildren(children: React.ReactNode) {
  const groups: DiagramGroupProps[] = [];
  const nodeEntries: DiagramNodeProps[] = [];
  const edges: DiagramEdgeProps[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const type = child.type as { displayName?: string };

    if (type.displayName === "Diagram.Group") {
      groups.push(child.props as DiagramGroupProps);
    } else if (type.displayName === "Diagram.Node") {
      nodeEntries.push(child.props as DiagramNodeProps);
    } else if (type.displayName === "Diagram.Edge") {
      edges.push(child.props as DiagramEdgeProps);
    }
  });

  return { groups, nodeEntries, edges };
}

function buildFlowData(
  groups: DiagramGroupProps[],
  nodeEntries: DiagramNodeProps[],
  edgeEntries: DiagramEdgeProps[],
) {
  const nodes: Node[] = [];

  // Add group nodes first
  for (const g of groups) {
    nodes.push({
      id: g.id,
      type: "diagramGroup",
      position: { x: g.x, y: g.y },
      data: {
        label: g.label,
        groupWidth: g.width,
        groupHeight: g.height,
        groupClassName: g.className,
        groupStyle: g.style,
      } satisfies DiagramGroupData,
      draggable: false,
      selectable: false,
      style: { width: g.width, height: g.height },
    });
  }

  // Build a map of node positions for auto-routing
  const nodePositions = new Map<
    string,
    { x: number; y: number; w: number; h: number }
  >();

  // Add regular nodes
  for (const n of nodeEntries) {
    const w = n.width ?? 160;
    const h = n.height ?? 60;

    const nodeData: Node = {
      id: n.id,
      type: "diagramNode",
      position: { x: n.x, y: n.y },
      data: {
        label: typeof n.children === "string" ? n.children : String(n.children),
        subtitle: n.subtitle,
        color: n.color,
        nodeClassName: n.className,
        nodeStyle: n.style,
      } satisfies DiagramNodeData,
      draggable: false,
      selectable: false,
      style: { width: w },
    };

    if (n.group) {
      nodeData.parentId = n.group;
      nodeData.extent = "parent";
    }

    nodes.push(nodeData);

    // Store absolute position for auto-routing
    let absX = n.x;
    let absY = n.y;
    if (n.group) {
      const parentGroup = groups.find((g) => g.id === n.group);
      if (parentGroup) {
        absX += parentGroup.x;
        absY += parentGroup.y;
      }
    }
    nodePositions.set(n.id, { x: absX, y: absY, w, h });
  }

  // Build edges with auto-routing
  const edges: Edge[] = edgeEntries.map((e, i) => {
    const src = nodePositions.get(e.from);
    const tgt = nodePositions.get(e.to);

    let sourceHandle: string | undefined;
    let targetHandle: string | undefined;

    if (src && tgt) {
      [sourceHandle, targetHandle] = autoRoute(src, tgt);
    }

    return {
      id: `edge-${e.from}-${e.to}-${i}`,
      source: e.from,
      target: e.to,
      sourceHandle,
      targetHandle,
      label: e.label,
      animated: e.animated,
      style: e.style,
      className: e.className,
    };
  });

  return { nodes, edges };
}

function DiagramInner({
  children,
  width = 960,
  height = 540,
  className = "",
  style,
}: DiagramProps) {
  const { groups, nodeEntries, edges: edgeEntries } = useMemo(
    () => collectChildren(children),
    [children],
  );

  const { nodes, edges } = useMemo(
    () => buildFlowData(groups, nodeEntries, edgeEntries),
    [groups, nodeEntries, edgeEntries],
  );

  return (
    <div
      className={`mirion-diagram ${className}`}
      style={{ width, height, ...style }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        fitView
      />
    </div>
  );
}

/**
 * Declarative diagram component for Mirion presentations.
 *
 * Usage:
 * ```tsx
 * <Diagram width={960} height={540}>
 *   <Diagram.Group id="g1" x={0} y={0} width={200} height={300} label="Group" />
 *   <Diagram.Node id="a" group="g1" x={20} y={40} color="blue">Node A</Diagram.Node>
 *   <Diagram.Node id="b" x={300} y={100} color="green">Node B</Diagram.Node>
 *   <Diagram.Edge from="a" to="b" label="connects" />
 * </Diagram>
 * ```
 */
export function Diagram(props: DiagramProps) {
  return (
    <ReactFlowProvider>
      <DiagramInner {...props} />
    </ReactFlowProvider>
  );
}

Diagram.Node = DiagramNodeMarker;
Diagram.Group = DiagramGroupMarker;
Diagram.Edge = DiagramEdgeMarker;
