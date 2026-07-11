import { useState, useRef, useEffect, useCallback } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import { jsonToBpmn } from "../lib/jsonToBpmn";
import jsPDF from "jspdf";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/test")({
  component: RouteComponent,
});

// ─── Inline SVG icons ──────────────────────────────────────────────────────
const Icons = {
  Play: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Download: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Image: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  File: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  ZoomIn: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  ZoomOut: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  Fit: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  ),
  Trash: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  ),
  Check: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Flow: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h3a3 3 0 013 3v3" />
      <polyline points="15 12 18 15 15 18" />
    </svg>
  ),
};

const SAMPLE_JSON = `{
  "entities": {
    "tasks": [
      { "id": "submit_request", "name": "Submit Request", "actor_id": "employee", "type": "human" },
      { "id": "review_request", "name": "Review Request", "actor_id": "manager", "type": "human" },
      { "id": "approve_budget", "name": "Approve Budget", "actor_id": "finance", "type": "human" },
      { "id": "process_order", "name": "Process Order", "actor_id": "finance", "type": "system" }
    ],
    "decisions": [
      {
        "id": "manager_approval", "question": "Manager Approved?",
        "conditions": [
          { "label": "Approved", "target_id": "approve_budget" },
          { "label": "Rejected", "target_id": "reject_request" }
        ]
      },
      {
        "id": "budget_available", "question": "Budget Available?",
        "conditions": [
          { "label": "Yes", "target_id": "process_order" },
          { "label": "No", "target_id": "reject_request" }
        ]
      }
    ]
  },
  "flow": {
    "start_event": "submit_request",
    "end_events": ["process_order", "reject_request"],
    "connections": [
      { "from_id": "submit_request", "to_id": "review_request" },
      { "from_id": "review_request", "to_id": "manager_approval" },
      { "from_id": "manager_approval", "to_id": "approve_budget", "condition": "Approved" },
      { "from_id": "manager_approval", "to_id": "reject_request", "condition": "Rejected" },
      { "from_id": "approve_budget", "to_id": "budget_available" },
      { "from_id": "budget_available", "to_id": "process_order", "condition": "Yes" },
      { "from_id": "budget_available", "to_id": "reject_request", "condition": "No" }
    ]
  }
}`;

function RouteComponent() {
  const [jsonInput, setJsonInput] = useState("");
  const [xml, setXml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [tab, setTab] = useState<"json" | "xml">("json");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const viewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    viewerRef.current = new BpmnViewer({ container: containerRef.current });
    return () => viewerRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (!xml || !viewerRef.current) return;
    setError(null);
    viewerRef.current
      .importXML(xml)
      .then(() => viewerRef.current.get("canvas").zoom("fit-viewport"))
      .catch((err: any) => setError(err.message));
  }, [xml]);

  const zoom = useCallback((dir: "in" | "out" | "fit") => {
    if (!viewerRef.current) return;
    const c = viewerRef.current.get("canvas");
    if (dir === "fit") return c.zoom("fit-viewport");
    c.zoom(c.zoom() * (dir === "in" ? 1.25 : 0.8));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleGenerate = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonInput || SAMPLE_JSON);
        setXml(jsonToBpmn(parsed));
        const t = parsed.entities?.tasks || [];
        const d = parsed.entities?.decisions || [];
        const c = parsed.flow?.connections || [];
        const e = parsed.flow?.end_events || [];
        setMeta({
          tasks: t.length,
          gateways: d.length,
          flows: c.length,
          ends: e.length,
        });
        showToast("Diagram generated");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 80);
  };

  const download = (blob: Blob, name: string) => {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: name,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadXML = () => {
    download(new Blob([xml], { type: "application/xml" }), "diagram.bpmn");
    showToast(".bpmn saved");
  };

  const handleExportSVG = async () => {
    const { svg } = await viewerRef.current.saveSVG();
    download(new Blob([svg], { type: "image/svg+xml" }), "diagram.svg");
    showToast(".svg saved");
  };

  const handleExportPDF = async () => {
    const { svg } = await viewerRef.current.saveSVG();
    const svgEl = new DOMParser().parseFromString(
      svg,
      "image/svg+xml",
    ).documentElement;
    let w = parseFloat(svgEl.getAttribute("width") || "0");
    let h = parseFloat(svgEl.getAttribute("height") || "0");
    if (!w) {
      const vb = (svgEl.getAttribute("viewBox") || "0 0 1200 600").split(
        /[\s,]+/,
      );
      w = +vb[2] || 1200;
      h = +vb[3] || 600;
    }
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    await new Promise<void>((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const sc = 2;
        const cv = document.createElement("canvas");
        cv.width = w * sc;
        cv.height = h * sc;
        const ctx = cv.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.scale(sc, sc);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const doc = new jsPDF({
          orientation: w > h ? "landscape" : "portrait",
          unit: "px",
          format: [w, h],
        });
        doc.addImage(cv.toDataURL("image/png"), "PNG", 0, 0, w, h);
        doc.save("diagram.pdf");
        res();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        rej();
      };
      img.src = url;
    });
    showToast(".pdf saved");
  };

  const handleClear = () => {
    setJsonInput("");
    setXml("");
    setError(null);
    setMeta(null);
    try {
      viewerRef.current?.clear();
    } catch {}
  };

  // ─── Pill button ─────────────────────────────────────────────────────────
  const PillBtn = ({
    onClick,
    disabled,
    children,
    color = "#6366f1",
    outline = false,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        border: `1.5px solid ${outline ? color + "66" : "transparent"}`,
        background: outline ? "transparent" : color,
        color: outline ? color : "#fff",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.15s",
        letterSpacing: "0.02em",
      }}
      onMouseOver={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.opacity = "0.82";
      }}
      onMouseOut={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
    >
      {children}
    </button>
  );

  // ─── Zoom icon btn ───────────────────────────────────────────────────────
  const ZoomBtn = ({ onClick, title, children }: any) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "#fff",
        border: "1px solid #e2e8f0",
        color: "#64748b",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 4px #00000010",
        transition: "all 0.15s",
      }}
      onMouseOver={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = "#6366f1";
        el.style.borderColor = "#a5b4fc";
      }}
      onMouseOut={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = "#64748b";
        el.style.borderColor = "#e2e8f0";
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0d1117",
        overflow: "hidden",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          height: 52,
          flexShrink: 0,
          background: "#0d1117",
          borderBottom: "1px solid #1e2533",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "linear-gradient(135deg,#6366f1,#a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 13,
            color: "#fff",
          }}
        >
          B
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#c7d2fe",
            letterSpacing: "0.08em",
          }}
        >
          BPMN<span style={{ color: "#6366f1" }}>·</span>Studio
        </span>

        <div style={{ flex: 1 }} />

        {/* Toast */}
        {toast && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#0f2818",
              border: "1px solid #166534",
              borderRadius: 6,
              padding: "4px 11px",
              fontSize: 11.5,
              color: "#86efac",
            }}
          >
            <Icons.Check /> {toast}
          </div>
        )}

        {/* Export buttons */}
        {xml && (
          <div style={{ display: "flex", gap: 6 }}>
            <PillBtn onClick={handleDownloadXML} outline color="#10b981">
              <Icons.Download /> BPMN
            </PillBtn>
            <PillBtn onClick={handleExportSVG} outline color="#8b5cf6">
              <Icons.Image /> SVG
            </PillBtn>
            <PillBtn onClick={handleExportPDF} outline color="#ef4444">
              <Icons.File /> PDF
            </PillBtn>
          </div>
        )}
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ══ LEFT PANEL ══ */}
        <aside
          style={{
            width: 370,
            flexShrink: 0,
            background: "#0f141c",
            borderRight: "1px solid #1e2533",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #1e2533",
              flexShrink: 0,
            }}
          >
            {(["json", "xml"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  background: "transparent",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: tab === t ? "#a5b4fc" : "#475569",
                  cursor: "pointer",
                  borderBottom: `2px solid ${tab === t ? "#6366f1" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                {t === "json" ? "⟨ JSON Input" : "⟩ XML Output"}
              </button>
            ))}
          </div>

          {/* Tab actions bar */}
          {tab === "json" && (
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "8px 10px",
                borderBottom: "1px solid #1a2030",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => {
                  setJsonInput(SAMPLE_JSON);
                  setError(null);
                }}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  background: "#1a2535",
                  border: "1px solid #2d3d55",
                  color: "#7dd3fc",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                Load sample
              </button>
              <button
                onClick={handleClear}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  background: "transparent",
                  border: "1px solid #1e2533",
                  color: "#475569",
                  borderRadius: 5,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icons.Trash /> Clear
              </button>
            </div>
          )}

          {/* Editor */}
          {tab === "json" ? (
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck={false}
              placeholder={`// Paste workflow JSON\n// or click "Load sample"\n\n{\n  "entities": {\n    "tasks": [...],\n    "decisions": [...]\n  },\n  "flow": {\n    "start_event": "...",\n    "connections": [...]\n  }\n}`}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                resize: "none",
                background: "#090d13",
                color: "#93c5fd",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                lineHeight: 1.75,
                padding: "14px 14px",
              }}
            />
          ) : (
            <pre
              style={{
                flex: 1,
                overflow: "auto",
                margin: 0,
                padding: "14px",
                background: "#090d13",
                color: "#6ee7b7",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {xml || "// Generated XML will appear here after generation"}
            </pre>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                flexShrink: 0,
                padding: "10px 14px",
                background: "#160a0a",
                borderTop: "1px solid #7f1d1d",
                color: "#fca5a5",
                fontSize: 12,
                lineHeight: 1.55,
                display: "flex",
                gap: 8,
              }}
            >
              <span style={{ color: "#ef4444" }}>✕</span>
              <span>{error}</span>
            </div>
          )}

          {/* Stats */}
          {meta && (
            <div
              style={{
                flexShrink: 0,
                padding: "10px 14px",
                background: "#0a1020",
                borderTop: "1px solid #1e2533",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#334155",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                Diagram Summary
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "5px 0",
                }}
              >
                {[
                  ["Tasks", meta.tasks, "#38bdf8"],
                  ["Gateways", meta.gateways, "#f59e0b"],
                  ["Flows", meta.flows, "#a78bfa"],
                  ["End Events", meta.ends, "#34d399"],
                ].map(([label, val, color]) => (
                  <div
                    key={label as string}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: color as string,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "#475569" }}>{label}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: color as string,
                        fontWeight: 700,
                        paddingRight: 8,
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate CTA */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              flexShrink: 0,
              margin: "12px",
              padding: "11px 0",
              background: loading
                ? "#1e2533"
                : "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
              border: "none",
              borderRadius: 9,
              color: loading ? "#475569" : "#fff",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: 12.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: loading ? "none" : "0 4px 20px #6366f133",
              transition: "all 0.2s",
            }}
          >
            <Icons.Play />
            {loading ? "Generating…" : "Generate BPMN"}
          </button>
        </aside>

        {/* ══ RIGHT PANEL: VIEWER ══ */}
        <main
          style={{
            flex: 1,
            position: "relative",
            background: "#f1f5f9",
            overflow: "hidden",
          }}
        >
          {/* Zoom controls */}
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <ZoomBtn onClick={() => zoom("in")} title="Zoom in">
              <Icons.ZoomIn />
            </ZoomBtn>
            <ZoomBtn onClick={() => zoom("out")} title="Zoom out">
              <Icons.ZoomOut />
            </ZoomBtn>
            <ZoomBtn onClick={() => zoom("fit")} title="Fit viewport">
              <Icons.Fit />
            </ZoomBtn>
          </div>

          {/* Empty state */}
          {!xml && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 32px #6366f122",
                }}
              >
                <Icons.Flow />
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#475569",
                    letterSpacing: "0.02em",
                  }}
                >
                  No diagram yet
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12.5,
                    color: "#94a3b8",
                    lineHeight: 1.6,
                  }}
                >
                  Paste your JSON and click <br />
                  <strong style={{ color: "#6366f1" }}>Generate BPMN</strong> to
                  render the diagram
                </p>
              </div>
            </div>
          )}

          {/* bpmn-js canvas — always mounted */}
          <div
            ref={containerRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />

          {/* Controls hint */}
          {xml && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(15,20,30,0.78)",
                backdropFilter: "blur(8px)",
                borderRadius: 20,
                padding: "5px 16px",
                fontSize: 11,
                color: "#64748b",
                letterSpacing: "0.04em",
                display: "flex",
                gap: 14,
                alignItems: "center",
                border: "1px solid #1e2533",
              }}
            >
              <span>Scroll = zoom</span>
              <span style={{ color: "#1e2533" }}>|</span>
              <span>Drag = pan</span>
              <span style={{ color: "#1e2533" }}>|</span>
              <span>Ctrl+scroll = fine zoom</span>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea, pre { scrollbar-width: thin; scrollbar-color: #1e2533 transparent; }
        textarea::-webkit-scrollbar, pre::-webkit-scrollbar { width: 5px; }
        textarea::-webkit-scrollbar-thumb, pre::-webkit-scrollbar-thumb { background: #1e2533; border-radius: 3px; }
        .bjs-powered-by { display: none !important; }
        .djs-container { width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  );
}
