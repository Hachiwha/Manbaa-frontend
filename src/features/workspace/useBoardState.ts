import { useCallback, useEffect, useRef, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "reactflow";
import type {
  FlowEdge,
  FlowNode,
  SketchNodeData,
  SketchNodeKind,
} from "./types";

let localIdSeq = 0;
function newLocalId(prefix: string) {
  localIdSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${localIdSeq}`;
}

const SKETCH_DEFAULTS: Record<SketchNodeKind, Partial<SketchNodeData>> = {
  "sticky-note": {},
  text: {},
  heading: { content: "" },
  shape: { shapeVariant: "rectangle" },
  frame: { title: "Frame" },
  "source-card": {},
  "citation-card": {},
  "chat-response": { role: "ai" },
  "concept-card": {},
  "asset-card": { assetType: "logo" },
};

/**
 * Owns the board's live nodes/edges. Seeded from server-derived data (AI
 * workflow diagram, polled every few seconds) but merges rather than
 * overwrites on resync, so dragged positions and user-placed sketch nodes
 * (which the server has never heard of) survive the next poll tick.
 */
export function useBoardState(
  serverNodes: FlowNode[],
  serverEdges: FlowEdge[],
) {
  const [nodes, setNodes] = useState<FlowNode[]>(serverNodes);
  const [edges, setEdges] = useState<FlowEdge[]>(serverEdges);
  const knownServerNodeIds = useRef<Set<string>>(
    new Set(serverNodes.map((n) => n.id)),
  );
  const knownServerEdgeIds = useRef<Set<string>>(
    new Set(serverEdges.map((e) => e.id)),
  );
  const movedPositions = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  useEffect(() => {
    setNodes((prev) => {
      const localOnly = prev.filter(
        (n) => !knownServerNodeIds.current.has(n.id),
      );
      const refreshed = serverNodes.map((n) => {
        const moved = movedPositions.current.get(n.id);
        return moved ? { ...n, position: moved } : n;
      });
      knownServerNodeIds.current = new Set(serverNodes.map((n) => n.id));
      return [...refreshed, ...localOnly];
    });
    setEdges((prev) => {
      const localOnly = prev.filter(
        (e) => !knownServerEdgeIds.current.has(e.id),
      );
      knownServerEdgeIds.current = new Set(serverEdges.map((e) => e.id));
      return [...serverEdges, ...localOnly];
    });
    // Re-sync only when the server payload identity changes, not on every render.
  }, [serverNodes, serverEdges]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const c of changes) {
      if (c.type === "position" && c.position) {
        movedPositions.current.set(c.id, c.position);
      }
    }
    setNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((prev) =>
      addEdge(
        { ...connection, id: newLocalId("edge"), type: "smoothstep" },
        prev,
      ),
    );
  }, []);

  const addNode = useCallback(
    (
      kind: SketchNodeKind,
      position: { x: number; y: number },
      overrides?: Partial<SketchNodeData>,
    ) => {
      const id = newLocalId(kind.replace(/-/g, "_"));
      const node: FlowNode = {
        id,
        type: kind,
        position,
        data: { kind, ...SKETCH_DEFAULTS[kind], ...overrides },
      };
      setNodes((prev) => [...prev, node]);
      return id;
    },
    [],
  );

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  }, []);

  const duplicateNode = useCallback((id: string) => {
    setNodes((prev) => {
      const source = prev.find((n) => n.id === id);
      if (!source) return prev;
      const clone: FlowNode = {
        ...source,
        id: newLocalId("dup"),
        position: { x: source.position.x + 32, y: source.position.y + 32 },
        selected: false,
        data: { ...source.data },
      };
      return [...prev, clone];
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [node] = next.splice(idx, 1);
      next.push(node);
      return next;
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [node] = next.splice(idx, 1);
      next.unshift(node);
      return next;
    });
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    duplicateNode,
    bringToFront,
    sendToBack,
  };
}
