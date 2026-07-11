import type { Edge, Node } from "reactflow";
import type {
  AiWorkflowDecision,
  AiWorkflowResponse,
} from "./aiWorkflow.types";
import type { RfFlowNodeData } from "./types";

const RF_START_ID = "__rf_start__";

function humanizeId(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function collectGraphNodeIds(flow: AiWorkflowResponse["flow"]): Set<string> {
  const ids = new Set<string>();
  ids.add(flow.start_event);
  for (const c of flow.connections ?? []) {
    ids.add(c.from_id);
    ids.add(c.to_id);
  }
  for (const e of flow.end_events ?? []) {
    ids.add(e);
  }
  return ids;
}

function buildOutgoingMap(
  connections: AiWorkflowResponse["flow"]["connections"],
) {
  const map = new Map<string, { to_id: string; condition?: string | null }[]>();
  for (const c of connections ?? []) {
    const list = map.get(c.from_id) ?? [];
    list.push({ to_id: c.to_id, condition: c.condition });
    map.set(c.from_id, list);
  }
  return map;
}

/** Layers from BFS starting at `startId` (real first node, not virtual). */
function computeLayers(
  startId: string,
  allIds: Set<string>,
  outgoing: Map<string, { to_id: string }[]>,
): Map<string, number> {
  const layer = new Map<string, number>();
  const queue: string[] = [startId];
  const updates = new Map<string, number>(); // Track updates per node to prevent infinite loops in cycles
  const MAX_UPDATES = allIds.size * 2;

  layer.set(startId, 0);

  while (queue.length) {
    const id = queue.shift()!;
    const L = layer.get(id) ?? 0;

    const count = (updates.get(id) ?? 0) + 1;
    updates.set(id, count);
    if (count > MAX_UPDATES) continue; // Safety break for cycles

    for (const { to_id } of outgoing.get(id) ?? []) {
      if (!allIds.has(to_id)) continue;
      const nextL = L + 1;
      const currentL = layer.get(to_id);

      if (currentL === undefined || currentL < nextL) {
        layer.set(to_id, nextL);
        queue.push(to_id);
      }
    }
  }
  for (const id of allIds) {
    if (!layer.has(id)) layer.set(id, 0);
  }
  return layer;
}

function layoutPositions(
  allIds: Set<string>,
  layer: Map<string, number>,
  columnOrder: string[],
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const COL = 300;
  const ROW = 140;
  const byLayer = new Map<number, string[]>();
  for (const id of columnOrder) {
    if (!allIds.has(id)) continue;
    const L = layer.get(id) ?? 0;
    const col = byLayer.get(L) ?? [];
    col.push(id);
    byLayer.set(L, col);
  }
  for (const [L, ids] of byLayer) {
    ids.forEach((id, row) => {
      pos.set(id, { x: L * COL, y: row * ROW });
    });
  }
  return pos;
}

/** Topological-ish column order: BFS from start_event. */
function bfsOrder(
  startId: string,
  outgoing: Map<string, { to_id: string }[]>,
  allIds: Set<string>,
): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  const q = [startId];
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const { to_id } of outgoing.get(id) ?? []) {
      if (allIds.has(to_id) && !seen.has(to_id)) q.push(to_id);
    }
  }
  for (const id of allIds) {
    if (!seen.has(id)) order.push(id);
  }
  return order;
}

function decisionHandleId(
  decision: AiWorkflowDecision | undefined,
  conditionLabel: string | null | undefined,
) {
  if (!decision?.conditions?.length) return undefined;
  const idx = decision.conditions.findIndex((c) => c.label === conditionLabel);
  const i = idx >= 0 ? idx : 0;
  return `cond-${i}`;
}

export function mapAiWorkflowToReactFlow(response: AiWorkflowResponse): {
  nodes: Node<RfFlowNodeData>[];
  edges: Edge[];
} {
  const { entities, flow } = response;
  const tasks = entities.tasks ?? [];
  const decisions = entities.decisions ?? [];
  const actorsById = new Map((entities.actors ?? []).map((a) => [a.id, a]));

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const decisionById = new Map(decisions.map((d) => [d.id, d]));

  const graphIds = collectGraphNodeIds(flow);
  const outgoing = buildOutgoingMap(flow.connections ?? []);

  const layerMap = computeLayers(flow.start_event, graphIds, outgoing);
  const order = bfsOrder(flow.start_event, outgoing, graphIds);
  const positions = layoutPositions(graphIds, layerMap, order);

  const nodes: Node<RfFlowNodeData>[] = [];

  const startPos = positions.get(flow.start_event) ?? { x: 0, y: 0 };
  nodes.push({
    id: RF_START_ID,
    type: "rfStart",
    position: { x: startPos.x, y: startPos.y - 150 },
    data: {
      kind: "rfStart",
      title: "Start",
      subtitle: response.context?.objective ?? "Process entry",
    },
    connectable: false,
  });

  for (const id of graphIds) {
    const p = positions.get(id) ?? { x: 0, y: 0 };
    const task = taskById.get(id);
    const decision = decisionById.get(id);

    if (task) {
      const actor = actorsById.get(task.actor_id);
      const isHuman = (task.type ?? "human").toLowerCase() === "human";
      nodes.push({
        id,
        type: "rfTask",
        position: p,
        data: {
          kind: "rfTask",
          title: task.name,
          subtitle: task.description || "",
          actor: actor?.name ?? task.actor_id,
          taskType: task.type,
          variant: isHuman ? "taskHuman" : "taskSystem",
        },
        connectable: false,
      });
    } else if (decision) {
      nodes.push({
        id,
        type: "rfDecision",
        position: p,
        data: {
          kind: "rfDecision",
          title: decision.question,
          subtitle: `${decision.conditions?.length ?? 0} outcomes`,
          question: decision.question,
          variant: "decision",
          outcomeHandles: (decision.conditions ?? []).map((c, i) => ({
            id: `cond-${i}`,
            label: c.label,
          })),
        },
        connectable: false,
      });
    } else {
      const isDeclaredEnd = flow.end_events?.includes(id);
      nodes.push({
        id,
        type: isDeclaredEnd ? "rfEnd" : "rfStub",
        position: p,
        data: {
          kind: isDeclaredEnd ? "rfEnd" : "rfStub",
          title: humanizeId(id),
          subtitle: isDeclaredEnd
            ? "End of path"
            : "Referenced in flow (add to tasks/decisions for full detail)",
          variant: isDeclaredEnd ? "end" : "stub",
        },
        connectable: false,
      });
    }
  }

  const edges: Edge[] = [];

  edges.push({
    id: `e-${RF_START_ID}-${flow.start_event}`,
    source: RF_START_ID,
    target: flow.start_event,
    type: "smoothstep",
  });

  let edgeIdx = 0;
  for (const c of flow.connections ?? []) {
    const fromDecision = decisionById.get(c.from_id);
    const sourceHandle = fromDecision
      ? decisionHandleId(fromDecision, c.condition ?? undefined)
      : undefined;
    edges.push({
      id: `e-${c.from_id}-${c.to_id}-${edgeIdx++}`,
      source: c.from_id,
      target: c.to_id,
      label: c.condition ?? undefined,
      type: "smoothstep",
      sourceHandle,
      style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
      labelStyle: { fill: "var(--muted-foreground)", fontSize: 10 },
      labelBgStyle: { fill: "var(--card)", fillOpacity: 0.95 },
    });
  }

  return { nodes, edges };
}
