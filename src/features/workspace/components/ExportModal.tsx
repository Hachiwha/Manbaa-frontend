import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileDown,
  Image,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ExportFormat = "pdf" | "svg" | "png" | "jpg";
type ExportScope = "full" | "selected" | "single";
type ExportQuality = "standard" | "high" | "ultra";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORMATS: Array<{ id: ExportFormat; icon: typeof FileText; label: string; desc: string }> = [
  { id: "pdf", icon: FileText, label: "PDF", desc: "Brand guidelines, print" },
  { id: "svg", icon: FileDown, label: "SVG", desc: "Logos, scalable" },
  { id: "png", icon: Image, label: "PNG", desc: "Web, social" },
  { id: "jpg", icon: Image, label: "JPG", desc: "Email, compressed" },
];

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [scope, setScope] = useState<ExportScope>("full");
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [step, setStep] = useState<"select" | "progress" | "done">("select");

  const handleExport = async () => {
    setStep("progress");
    await new Promise((r) => setTimeout(r, 2000));
    setStep("done");
    setTimeout(() => {
      setStep("select");
      onOpenChange(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-canvas"
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h2 className="text-[21px] font-semibold tracking-tight text-ink">Export</h2>
              <button
                type="button"
                onClick={() => { onOpenChange(false); setStep("select"); }}
                className="grid h-8 w-8 place-items-center rounded-md text-ink-muted-48 transition-colors active:scale-95 hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {step === "select" && (
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-caption-strong text-ink mb-2">Scope</p>
                  <div className="flex gap-2">
                    {(["full", "selected", "single"] as ExportScope[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScope(s)}
                        className={cn(
                          "flex-1 rounded-md px-3 py-2 text-caption font-medium transition-all active:scale-95",
                          scope === s
                            ? "bg-primary text-primary-foreground"
                            : "border border-hairline text-ink-muted-48 hover:border-primary/50 hover:text-ink",
                        )}
                      >
                        {s === "full" ? "Full Document" : s === "selected" ? "Selected" : "Single"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-caption-strong text-ink mb-2">Format</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map((f) => {
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFormat(f.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-md border p-3 text-left transition-all active:scale-95",
                            format === f.id
                              ? "border-primary bg-primary/5"
                              : "border-hairline hover:border-primary/50",
                          )}
                        >
                          <Icon className={cn("h-5 w-5", format === f.id ? "text-primary" : "text-ink-muted-48")} />
                          <div>
                            <p className="text-caption-strong text-ink">{f.label}</p>
                            <p className="text-fine-print text-ink-muted-48">{f.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(format === "png" || format === "jpg") && (
                  <div>
                    <p className="text-caption-strong text-ink mb-2">Quality</p>
                    <div className="flex gap-2">
                      {(["standard", "high", "ultra"] as ExportQuality[]).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuality(q)}
                          className={cn(
                            "flex-1 rounded-md px-3 py-2 text-caption font-medium transition-all active:scale-95",
                            quality === q
                              ? "bg-primary text-primary-foreground"
                              : "border border-hairline text-ink-muted-48 hover:border-primary/50 hover:text-ink",
                          )}
                        >
                          {q.charAt(0).toUpperCase() + q.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-md border border-hairline bg-surface-pearl px-4 py-2.5 text-caption-strong text-ink-muted-80 transition-all active:scale-95 hover:bg-surface-pearl/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="rounded-pill bg-primary px-5 py-2.5 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
                  >
                    Export as {format.toUpperCase()}
                  </button>
                </div>
              </div>
            )}

            {step === "progress" && (
              <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-body-strong text-ink">Preparing your {format.toUpperCase()}...</p>
                <div className="h-2 w-full overflow-hidden rounded-pill bg-divider-soft">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center gap-3 px-8 py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-success" />
                <p className="text-body-strong text-ink">Exported!</p>
                <p className="text-caption text-ink-muted-48">Your {format.toUpperCase()} is ready to download.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
