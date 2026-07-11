import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Loader2,
} from "lucide-react";

interface BrandDocumentProps {
  brandName?: string;
  tagline?: string;
  onClose?: () => void;
}

export function BrandDocument({ brandName = "Brand Name", tagline = "Brand tagline", onClose }: BrandDocumentProps) {
  const [generating, setGenerating] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
  };

  const colors = [
    { name: "Primary", hex: "#0066CC" },
    { name: "Secondary", hex: "#6C5CE7" },
    { name: "Accent", hex: "#00B894" },
    { name: "Dark", hex: "#1D1D1F" },
    { name: "Light", hex: "#F5F5F7" },
    { name: "White", hex: "#FFFFFF" },
  ];

  const personality = ["Innovative", "Trustworthy", "Modern", "Minimalist", "Professional", "Approachable"];

  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-body-strong text-ink">Brand Document</h2>
        {onClose && (
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-ink-muted-48 transition-colors active:scale-95 hover:bg-surface-2 hover:text-ink">
            <span className="text-lg leading-none">&times;</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Cover */}
        <section className="bg-surface-tile-1 px-8 py-16 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-[34px] font-bold text-primary-foreground">
            M
          </div>
          <h1 className="mt-6 text-[56px] font-semibold leading-none tracking-tight text-body-on-dark">
            {brandName}
          </h1>
          <p className="mt-3 text-tagline text-body-on-dark/80">{tagline}</p>
        </section>

        {/* Brand Story */}
        <section className="bg-canvas px-8 py-16">
          <p className="text-fine-print font-semibold uppercase tracking-wider text-primary">Brand Story</p>
          <h2 className="mt-2 text-display-lg text-ink">The Story</h2>
          <p className="mt-4 max-w-2xl text-body leading-relaxed text-ink-muted-80">
            Manbaa empowers brands to discover their visual identity through AI-powered
            exploration. By analyzing source materials and brand values, we generate
            cohesive identity systems that resonate with your audience.
          </p>
        </section>

        {/* Color Palette */}
        <section className="bg-canvas-parchment px-8 py-16">
          <h2 className="text-display-lg text-ink">Color Palette</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {colors.map((c) => (
              <div key={c.hex} className="text-center">
                <div
                  className="mx-auto h-20 w-20 rounded-sm"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="mt-2 text-caption-strong text-ink">{c.name}</p>
                <button
                  type="button"
                  onClick={() => copyHex(c.hex)}
                  className="inline-flex items-center gap-1 text-fine-print text-ink-muted-48 transition-colors hover:text-primary"
                >
                  {copiedHex === c.hex ? (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      {c.hex} <Copy className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="bg-canvas px-8 py-16">
          <h2 className="text-display-lg text-ink">Typography</h2>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-[40px] font-semibold leading-tight tracking-tight" style={{ fontFamily: '"SF Pro Display", system-ui, sans-serif' }}>
                SF Pro Display
              </p>
              <p className="mt-1 text-caption text-ink-muted-48">Weight 600 · 40px · -0.374px letter-spacing</p>
            </div>
            <div>
              <p className="text-body" style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif' }}>
                SF Pro Text — The quick brown fox jumps over the lazy dog. 17px regular weight.
              </p>
              <p className="mt-1 text-caption text-ink-muted-48">Weight 400 · 17px · 1.47 line-height</p>
            </div>
          </div>
        </section>

        {/* Brand Voice */}
        <section className="bg-canvas-parchment px-8 py-16">
          <h2 className="text-display-lg text-ink">Brand Voice</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {personality.map((word) => (
              <span
                key={word}
                className="rounded-pill border border-primary/30 bg-primary/5 px-5 py-2.5 text-body text-primary"
              >
                {word}
              </span>
            ))}
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="bg-canvas px-8 py-16">
          <h2 className="text-display-lg text-ink">Usage Guidelines</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-caption-strong text-ink">Do use the logo on white backgrounds</p>
                <p className="mt-1 text-caption text-ink-muted-48">Maintain clear space equal to the height of the "M" mark.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-caption-strong text-ink">Don't stretch or distort the logo</p>
                <p className="mt-1 text-caption text-ink-muted-48">Always maintain aspect ratio. Use provided assets only.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Export bar */}
      <div className="sticky bottom-0 border-t border-hairline bg-canvas px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-primary py-2.5 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Brand Document
              </span>
            )}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-button-utility text-body-on-dark transition-all active:scale-95 hover:bg-ink/90"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}
