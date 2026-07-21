import Link from "next/link";
import {
  MonitorPlay,
  Smartphone,
  Monitor,
  Tv2,
  LayoutGrid,
  Presentation,
} from "lucide-react";

const OPERATOR_SURFACES = [
  {
    href: "/operator",
    label: "Operator",
    desc: "Main control room dashboard",
    icon: LayoutGrid,
    role: "Primary",
  },
  {
    href: "/remote",
    label: "Remote",
    desc: "One-hand mobile control",
    icon: Smartphone,
    role: "Mobile",
  },
] as const;

const DISPLAY_SURFACES = [
  {
    href: "/av",
    label: "AV",
    desc: "Technical operator display",
    icon: MonitorPlay,
  },
  {
    href: "/green-room",
    label: "Green Room",
    desc: "Performer holding area",
    icon: Tv2,
  },
  {
    href: "/general",
    label: "General",
    desc: "Public / lobby screen",
    icon: Monitor,
  },
  {
    href: "/presenter",
    label: "Presenter",
    desc: "Confidence monitor",
    icon: Presentation,
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-status-green live-pulse" aria-hidden="true" />
          <span className="text-caption uppercase tracking-[0.14em] text-tertiary font-medium">
            Live Event OS
          </span>
        </div>
        <p className="text-caption text-tertiary tabular">v0.1</p>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
        <h1
          className="text-[4rem] sm:text-[5.5rem] font-semibold tracking-[-0.03em] leading-none text-primary text-balance"
          style={{ letterSpacing: "-0.03em" }}
        >
          KramFlow
        </h1>
        <p className="mt-5 text-body text-secondary max-w-sm text-balance leading-relaxed">
          Coordinate every aspect of your live production from one system.
        </p>
      </section>

      {/* Surfaces */}
      <section className="flex-1 px-6 sm:px-8 pb-20 max-w-4xl mx-auto w-full">
        {/* Operator group */}
        <div className="mb-3">
          <p className="text-caption uppercase tracking-[0.12em] text-tertiary font-medium mb-4">
            Control
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OPERATOR_SURFACES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group relative flex items-center gap-5 rounded-[var(--radius-card)] bg-surface-1 border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-surface-2 transition-all duration-200 px-6 py-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-[var(--color-border)] group-hover:border-[var(--color-border-strong)] transition-colors">
                    <Icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="text-[15px] font-semibold text-primary">{s.label}</p>
                      {"role" in s && (
                        <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-surface-3 text-tertiary">
                          {s.role}
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-tertiary mt-0.5">{s.desc}</p>
                  </div>
                  <span className="ml-auto text-tertiary opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Display group */}
        <div className="mt-10">
          <p className="text-caption uppercase tracking-[0.12em] text-tertiary font-medium mb-4">
            Displays
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DISPLAY_SURFACES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center text-center gap-3 rounded-[var(--radius-card)] bg-surface-1 border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-surface-2 transition-all duration-200 px-4 py-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-[var(--color-border)] group-hover:border-[var(--color-border-strong)] transition-colors">
                    <Icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-primary">{s.label}</p>
                    <p className="text-[11px] text-tertiary mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-[var(--color-border)] flex items-center justify-between">
        <p className="text-caption text-tertiary">KramFlow</p>
        <p className="text-caption text-tertiary">Live Event Operating System</p>
      </footer>
    </main>
  );
}
