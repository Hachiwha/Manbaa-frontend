export function jsonToBpmn(data: any): string {
  const tasks: any[] = data.entities?.tasks || [];
  const decisions: any[] = data.entities?.decisions || [];
  const connections: any[] = data.flow?.connections || [];
  const startId = data.flow?.start_event || tasks[0]?.id;
  const endEvents: string[] = data.flow?.end_events || [];

  // ─── Layout constants ───────────────────────────────────────────
  const TASK_W = 140;
  const TASK_H = 60;
  const GW_SIZE = 50;
  const EVENT_R = 18; // radius → diameter = 36
  const COL_GAP = 60;
  const ROW_H = 120;
  const ORIGIN_X = 80;
  const ORIGIN_Y = 200;

  // ─── Build ordered node list from flow connections ───────────────
  const allNodeIds = new Set<string>();
  connections.forEach((c: any) => {
    allNodeIds.add(c.from_id);
    allNodeIds.add(c.to_id);
  });

  // BFS to get order
  const orderedIds: string[] = [];
  const visited = new Set<string>();

  function bfs(startNodeId: string) {
    const queue = [startNodeId];
    visited.add(startNodeId);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      orderedIds.push(cur);
      connections
        .filter((c: any) => c.from_id === cur)
        .forEach((c: any) => {
          if (!visited.has(c.to_id)) {
            visited.add(c.to_id);
            queue.push(c.to_id);
          }
        });
    }
  }

  bfs(startId);
  // add any remaining (reject_request etc.)
  allNodeIds.forEach((id) => {
    if (!visited.has(id)) orderedIds.push(id);
  });

  // ─── Assign positions ────────────────────────────────────────────
  type Pos = { x: number; y: number; w: number; h: number };
  const positions: Record<string, Pos> = {};

  // Track depth (column) per node
  const depth: Record<string, number> = {};
  depth[startId] = 0;
  connections.forEach((c: any) => {
    if (depth[c.from_id] !== undefined && depth[c.to_id] === undefined) {
      depth[c.to_id] = depth[c.from_id] + 1;
    }
  });

  // Group by depth
  const byDepth: Record<number, string[]> = {};
  orderedIds.forEach((id) => {
    const d = depth[id] ?? orderedIds.indexOf(id);
    byDepth[d] = byDepth[d] || [];
    byDepth[d].push(id);
  });

  const isDecision = (id: string) => decisions.some((d: any) => d.id === id);
  const isEnd = (id: string) =>
    endEvents.includes(id) ||
    (!tasks.some((t: any) => t.id === id) && !isDecision(id));

  Object.entries(byDepth).forEach(([col, ids]) => {
    const colNum = parseInt(col);
    ids.forEach((id, row) => {
      const x = ORIGIN_X + colNum * (TASK_W + COL_GAP);
      const y = ORIGIN_Y + row * ROW_H;
      if (id === startId) {
        positions[id] = {
          x,
          y: y + TASK_H / 2 - EVENT_R,
          w: EVENT_R * 2,
          h: EVENT_R * 2,
        };
      } else if (isEnd(id)) {
        positions[id] = {
          x,
          y: y + TASK_H / 2 - EVENT_R,
          w: EVENT_R * 2,
          h: EVENT_R * 2,
        };
      } else if (isDecision(id)) {
        positions[id] = {
          x,
          y: y + TASK_H / 2 - GW_SIZE / 2,
          w: GW_SIZE,
          h: GW_SIZE,
        };
      } else {
        positions[id] = { x, y, w: TASK_W, h: TASK_H };
      }
    });
  });

  // ─── Helpers ─────────────────────────────────────────────────────
  const cx = (id: string) => {
    const p = positions[id];
    return p ? p.x + p.w / 2 : 0;
  };
  const cy = (id: string) => {
    const p = positions[id];
    return p ? p.y + p.h / 2 : 0;
  };

  // Collect end event IDs (need endEvent elements)
  const endEventIds = new Set<string>();
  endEvents.forEach((id) => endEventIds.add(id));
  connections.forEach((c: any) => {
    const id = c.to_id as string;
    if (
      !tasks.some((t: any) => t.id === id) &&
      !isDecision(id) &&
      id !== startId
    ) {
      endEventIds.add(id);
    }
  });

  // End event names
  const endName = (id: string) =>
    id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // ─── XML generation ──────────────────────────────────────────────
  const processXml = `
      <bpmn:startEvent id="${startId}" name="Start">
        <bpmn:outgoing>flow_from_${startId}</bpmn:outgoing>
      </bpmn:startEvent>
  
      ${tasks
        .map((t: any) => {
          const incoming = connections
            .filter((c: any) => c.to_id === t.id)
            .map(
              (_: any, i: number) =>
                `<bpmn:incoming>flow_${t.id}_in_${i}</bpmn:incoming>`,
            )
            .join("\n");
          const outgoing = connections
            .filter((c: any) => c.from_id === t.id)
            .map(
              (_: any, i: number) =>
                `<bpmn:outgoing>flow_${t.id}_out_${i}</bpmn:outgoing>`,
            )
            .join("\n");
          const tag =
            t.type === "system" ? "bpmn:serviceTask" : "bpmn:userTask";
          return `<${tag} id="${t.id}" name="${t.name}">${incoming}${outgoing}</${tag}>`;
        })
        .join("\n    ")}
  
      ${decisions
        .map((d: any) => {
          const incoming = connections
            .filter((c: any) => c.to_id === d.id)
            .map(
              (_: any, i: number) =>
                `<bpmn:incoming>flow_${d.id}_in_${i}</bpmn:incoming>`,
            )
            .join("\n");
          const outgoing = connections
            .filter((c: any) => c.from_id === d.id)
            .map(
              (_: any, i: number) =>
                `<bpmn:outgoing>flow_${d.id}_out_${i}</bpmn:outgoing>`,
            )
            .join("\n");
          return `<bpmn:exclusiveGateway id="${d.id}" name="${d.question}">${incoming}${outgoing}</bpmn:exclusiveGateway>`;
        })
        .join("\n    ")}
  
      ${Array.from(endEventIds)
        .map((id) => {
          const incoming = connections
            .filter((c: any) => c.to_id === id)
            .map(
              (_: any, i: number) =>
                `<bpmn:incoming>flow_${id}_in_${i}</bpmn:incoming>`,
            )
            .join("\n");
          return `<bpmn:endEvent id="${id}" name="${endName(id as string)}">${incoming}</bpmn:endEvent>`;
        })
        .join("\n    ")}
  
      <!-- Sequence flows -->
      <bpmn:sequenceFlow id="flow_from_${startId}"
        sourceRef="${startId}"
        targetRef="${connections.find((c: any) => c.from_id === startId)?.to_id || tasks[0]?.id}" />
  
      ${connections
        .map((c: any) => {
          // build unique id
          const fromOutIdx = connections
            .filter((x: any) => x.from_id === c.from_id)
            .indexOf(c);
          const toInIdx = connections
            .filter((x: any) => x.to_id === c.to_id)
            .indexOf(c);
          const flowId = `flow_${c.from_id}_out_${fromOutIdx}`;
          // also register incoming id
          const inId = `flow_${c.to_id}_in_${toInIdx}`;
          // they must match – use outgoing id as the canonical one
          const condXml = c.condition
            ? `<bpmn:conditionExpression>${c.condition}</bpmn:conditionExpression>`
            : "";
          return `<bpmn:sequenceFlow id="${flowId}" sourceRef="${c.from_id}" targetRef="${c.to_id}" name="${c.condition || ""}">${condXml}</bpmn:sequenceFlow>`;
        })
        .join("\n    ")}
    `;

  // ─── DI (visual layout) ──────────────────────────────────────────
  const shapes = Object.entries(positions)
    .map(([id, p]) => {
      return `<bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}"${isDecision(id) ? ' isMarkerVisible="true"' : ""}>
            <dc:Bounds x="${Math.round(p.x)}" y="${Math.round(p.y)}" width="${p.w}" height="${p.h}" />
          </bpmndi:BPMNShape>`;
    })
    .join("\n      ");

  const edges = connections
    .map((c: any) => {
      const fromOutIdx = connections
        .filter((x: any) => x.from_id === c.from_id)
        .indexOf(c);
      const flowId = `flow_${c.from_id}_out_${fromOutIdx}`;
      const x1 = Math.round(cx(c.from_id));
      const y1 = Math.round(cy(c.from_id));
      const x2 = Math.round(cx(c.to_id));
      const y2 = Math.round(cy(c.to_id));
      return `<bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${x1}" y="${y1}" />
            <di:waypoint x="${x2}" y="${y2}" />
          </bpmndi:BPMNEdge>`;
    })
    .join("\n      ");

  // start → first connection
  const firstConn = connections.find((c: any) => c.from_id === startId);
  const startEdge = firstConn
    ? `<bpmndi:BPMNEdge id="flow_from_${startId}_di" bpmnElement="flow_from_${startId}">
            <di:waypoint x="${Math.round(cx(startId))}" y="${Math.round(cy(startId))}" />
            <di:waypoint x="${Math.round(cx(firstConn.to_id))}" y="${Math.round(cy(firstConn.to_id))}" />
          </bpmndi:BPMNEdge>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
  <bpmn:definitions
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
    xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
    xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
    id="Definitions_1"
    targetNamespace="http://bpmn.io/schema/bpmn">
  
    <bpmn:process id="Process_1" isExecutable="false">
      ${processXml}
    </bpmn:process>
  
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
      <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
        ${shapes}
        ${startEdge}
        ${edges}
      </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
  
  </bpmn:definitions>`;
}
