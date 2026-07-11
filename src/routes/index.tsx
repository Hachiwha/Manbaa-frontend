import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Palette, LayoutGrid } from "lucide-react";
import { requireGuest } from "@/lib/auth/guards";

export const Route = createFileRoute("/")({
  beforeLoad: requireGuest,
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto mt-4 flex w-full max-w-6xl items-center justify-between rounded-pill border border-hairline bg-canvas px-6 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            M
          </div>
          <span className="text-body-strong text-ink">Manbaa</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-body text-ink transition-colors hover:text-primary"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-body text-ink transition-colors hover:text-primary"
          >
            How it works
          </a>
          <a
            href="#about"
            className="text-body text-ink transition-colors hover:text-primary"
          >
            About
          </a>
        </nav>

        <Link
          to="/login"
          className="text-body-strong text-ink transition-colors active:scale-95 hover:text-primary"
        >
          Sign in
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-32">
          <div>
            <h1 className="text-hero-display text-ink">
              Design the visual identity for your brand
            </h1>
            <p className="mt-5 text-lead-airy text-ink-muted-48">
              Transform inspiration, sources, and sketches into a complete
              visual identity — powered by AI.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-pill bg-primary px-6 py-3 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div
            className="relative hidden aspect-square items-center justify-center rounded-2xl border border-hairline bg-surface-pearl md:flex"
            aria-hidden
          >
            <Sparkles className="h-24 w-24 text-primary/25" strokeWidth={1} />
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Sparkles}
              title="AI-generated brand DNA"
              description="Point Manbaa at a brand and generate a logo, typography, and color system in minutes."
            />
            <FeatureCard
              icon={LayoutGrid}
              title="A live sketch board"
              description="Sources, chat, and a workspace board — refine the identity in real time with your team."
            />
            <FeatureCard
              icon={Palette}
              title="A library of every brand"
              description="Every generated identity, versioned and searchable, in one place."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline px-6 py-8 text-center text-caption text-ink-muted-48">
        © {new Date().getFullYear()} Manbaa
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-6">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-body-strong text-ink">{title}</h3>
      <p className="mt-1.5 text-body text-ink-muted-48">{description}</p>
    </div>
  );
}
