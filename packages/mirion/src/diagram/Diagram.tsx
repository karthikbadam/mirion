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
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  style: { strokeWidth: 1.5 },
  pathOptions: { offset: 20, borderRadius: 12 },
};

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const LAYOUT = {
  NODE_W: 160,
  NODE_H: 50,
  NODE_H_SUB: 68,
  NODE_GAP: 20,
  PAD_X: 20,
  PAD_TOP: 44,
  PAD_BOTTOM: 20,
  GROUP_GAP: 60,
};

/* ------------------------------------------------------------------ */
/*  Auto-routing                                                       */
/* ------------------------------------------------------------------ */

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
    return dx > 0 ? ["right", "target-left"] : ["left", "target-right"];
  }
  return dy > 0 ? ["bottom", "target-top"] : ["top", "target-bottom"];
}

/* ------------------------------------------------------------------ */
/*  Collect JSX children into flat arrays                              */
/* ------------------------------------------------------------------ */

interface Collected {
  groups: DiagramGroupProps[];
  nodeEntries: DiagramNodeProps[];
  edges: DiagramEdgeProps[];
}

function collectChildren(children: React.ReactNode): Collected {
  const groups: DiagramGroupProps[] = [];
  const nodeEntries: DiagramNodeProps[] = [];
  const edges: DiagramEdgeProps[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as { displayName?: string };

    if (type.displayName === "Diagram.Group") {
      const gProps = child.props as DiagramGroupProps;
      groups.push(gProps);

      // Extract nested Diagram.Node children
      if (gProps.children) {
        React.Children.forEach(gProps.children, (nested) => {
          if (!React.isValidElement(nested)) return;
          const nType = nested.type as { displayName?: string };
          if (nType.displayName === "Diagram.Node") {
            nodeEntries.push({
              ...(nested.props as DiagramNodeProps),
              group: gProps.id,
            });
          }
        });
      }
    } else if (type.displayName === "Diagram.Node") {
      nodeEntries.push(child.props as DiagramNodeProps);
    } else if (type.displayName === "Diagram.Edge") {
      edges.push(child.props as DiagramEdgeProps);
    }
  });

  return { groups, nodeEntries, edges };
}

/* ------------------------------------------------------------------ */
/*  Auto-layout: fill in missing positional values                     */
/* ------------------------------------------------------------------ */

interface LayoutGroup extends DiagramGroupProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutNode extends DiagramNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

function autoLayout(
  rawGroups: DiagramGroupProps[],
  rawNodes: DiagramNodeProps[],
): { groups: LayoutGroup[]; nodeEntries: LayoutNode[] } {
  // Clone to avoid mutating React props
  const nodes: LayoutNode[] = rawNodes.map((n) => ({
    ...n,
    x: n.x ?? -1,
    y: n.y ?? -1,
    width: n.width ?? LAYOUT.NODE_W,
    height: n.height ?? (n.subtitle ? LAYOUT.NODE_H_SUB : LAYOUT.NODE_H),
  }));

  const groups: LayoutGroup[] = rawGroups.map((g) => ({
    ...g,
    x: g.x ?? -1,
    y: g.y ?? -1,
    width: g.width ?? -1,
    height: g.height ?? -1,
  }));

  // Step 1: Layout nodes within each group (vertical stack)
  for (const group of groups) {
    const groupNodes = nodes.filter((n) => n.group === group.id);
    let cursorY = LAYOUT.PAD_TOP;
    let maxW = 0;

    for (const node of groupNodes) {
      if (node.x < 0) node.x = LAYOUT.PAD_X;
      if (node.y < 0) {
        node.y = cursorY;
        cursorY += node.height + LAYOUT.NODE_GAP;
      } else {
        // Respect explicit y, advance cursor past it
        cursorY = node.y + node.height + LAYOUT.NODE_GAP;
      }
      maxW = Math.max(maxW, node.x + node.width);
    }

    // Compute group dimensions from children
    const contentBottom =
      groupNodes.length > 0
        ? Math.max(...groupNodes.map((n) => n.y + n.height)) + LAYOUT.PAD_BOTTOM
        : LAYOUT.PAD_TOP + LAYOUT.PAD_BOTTOM;
    const contentRight =
      groupNodes.length > 0 ? maxW + LAYOUT.PAD_X : LAYOUT.PAD_X * 2 + LAYOUT.NODE_W;

    if (group.width < 0) group.width = contentRight;
    if (group.height < 0) group.height = contentBottom;
  }

  // Step 2: Layout groups left-to-right
  let cursorX = 0;
  for (const group of groups) {
    if (group.x < 0) {
      group.x = cursorX;
      group.y = group.y < 0 ? 0 : group.y;
      cursorX += group.width + LAYOUT.GROUP_GAP;
    } else {
      if (group.y < 0) group.y = 0;
      cursorX = group.x + group.width + LAYOUT.GROUP_GAP;
    }
  }

  // Step 3: Handle ungrouped nodes
  let ungroupedX = cursorX;
  for (const node of nodes) {
    if (node.group) continue;
    if (node.x < 0) {
      node.x = ungroupedX;
      ungroupedX += node.width + LAYOUT.NODE_GAP;
    }
    if (node.y < 0) node.y = 0;
  }

  return { groups, nodeEntries: nodes };
}

/* ------------------------------------------------------------------ */
/*  Build React Flow data                                              */
/* ------------------------------------------------------------------ */

function buildFlowData(
  groups: LayoutGroup[],
  nodeEntries: LayoutNode[],
  edgeEntries: DiagramEdgeProps[],
) {
  const nodes: Node[] = [];

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

  const nodePositions = new Map<
    string,
    { x: number; y: number; w: number; h: number }
  >();

  for (const n of nodeEntries) {
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
      style: { width: n.width },
    };

    if (n.group) {
      nodeData.parentId = n.group;
      nodeData.extent = "parent";
    }

    nodes.push(nodeData);

    let absX = n.x;
    let absY = n.y;
    if (n.group) {
      const parentGroup = groups.find((g) => g.id === n.group);
      if (parentGroup) {
        absX += parentGroup.x;
        absY += parentGroup.y;
      }
    }
    nodePositions.set(n.id, { x: absX, y: absY, w: n.width, h: n.height });
  }

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
      labelStyle: { transform: "translateY(-10px)" },
      animated: e.animated,
      style: e.style,
      className: e.className,
    };
  });

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function DiagramInner({
  children,
  width,
  height,
  className = "",
  style,
  flowProps,
}: DiagramProps) {
  const collected = useMemo(() => collectChildren(children), [children]);

  const { groups, nodeEntries } = useMemo(
    () => autoLayout(collected.groups, collected.nodeEntries),
    [collected.groups, collected.nodeEntries],
  );

  const { nodes, edges } = useMemo(
    () => buildFlowData(groups, nodeEntries, collected.edges),
    [groups, nodeEntries, collected.edges],
  );

  return (
    <div
      className={`mirion-diagram ${className}`}
      style={{ width: width ?? "100%", height: height ?? 400, ...style }}
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
        {...flowProps}
      />
    </div>
  );
}

/**
 * Declarative diagram component for Mirion presentations.
 *
 * Nodes auto-layout when positional props are omitted:
 * ```tsx
 * <Diagram>
 *   <Diagram.Group id="g1" label="Group">
 *     <Diagram.Node id="a" color="blue">Node A</Diagram.Node>
 *     <Diagram.Node id="b" color="green" subtitle="details">Node B</Diagram.Node>
 *   </Diagram.Group>
 *   <Diagram.Group id="g2" label="Other">
 *     <Diagram.Node id="c" color="purple">Node C</Diagram.Node>
 *   </Diagram.Group>
 *   <Diagram.Edge from="a" to="c" label="connects" />
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
