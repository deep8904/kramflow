import Link from "next/link";
import {
  MonitorPlay,
  Smartphone,
  Monitor,
  Tv2,
  LayoutGrid,
  Presentation,
  Radio,
  Wifi,
  ArrowUpRight,
  Activity,
  Layers,
  Clock,
} from "lucide-react";

const OPERATOR_SURFACES = [
  {
    href: "/operator",
    label: "Operator",
    desc: "Main control room dashboard",
    icon: LayoutGrid,
    role: "Primary",
    meta: "Full control",
  },
  {
    href: "/remote",
    label: "Remote",
    desc: "One-hand mobile control",
    icon: Smartphone,
    role: "Mobile",
    meta: "Handheld",
  },
] as const;

const DISPLAY_SURFACES = [
  {
    href: "/av",
    label: "AV",
    desc: "Technical operator display",
    icon: MonitorPlay,
    color: "text-[#818CF8]",
    bg: "bg-[#818CF8]/10",
  },
  {
    href: "/green-room",
    label: "Green Room",
    desc: "Performer holding area",
    icon: Tv2,
    color: "text-[#F472B6]",
    bg: "bg-[#F472B6]/10",
  },
  {
    href: "/general",
    label: "General",
    desc: "Public / lobby screen",
    icon: Monitor,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    href: "/presenter",
    label: "Presenter",
    desc: "Confidence monitor",
    icon: Presentation,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
] as const;

const STATS = [
  { label: "Displays", value: "4", icon: Layers, sub: "connected" },
  { label: "Uptime", value: "99.9%", icon: Activity, sub: "this session" },
  { label: "Latency", value: "<12ms", icon: Clock, sub: "avg. sync" },
  { label: "Sync", value: "Live", icon: Wifi, sub: "real-time" },
] as const;

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "#0E0E10", color: "#FFFFFF" }}
    >
      {/* Ambient glow layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 h-[480px] w-[780px] rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse at center, #818CF8 0%, #F472B6 50%, transparent 75%)",
            filter: "blur(72px)",
          }}
        />
      </div>

      {/* Top bar */}
      <header
        className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-4"
        style={{ borderBottom: "1px solid #27272A" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-pulse"
            aria-hidden="true"
          />
          <span
            className="text-[11px] uppercase tracking-[0.18em] font-mono"
            style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
          >
            Live Event OS
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/broadcast"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ color: "#A1A1AA" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Radio className="h-3.5 w-3.5" strokeWidth={1.5} />
            Broadcast
          </Link>
          <Link
            href="/display-manager"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ color: "#A1A1AA" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />
            Displays
          </Link>
        </nav>

        <span
          className="font-mono text-[11px] tabular"
          style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
        >
          v0.1
        </span>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 pt-14 pb-20">
        {/* Wordmark */}
        <div className="text-center mb-14">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em] mb-5"
            style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
          >
            KramFlow
          </p>
          <h1
            className="text-[3.25rem] sm:text-[4.5rem] font-semibold tracking-tight leading-none text-balance"
            style={{
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Live Event
            <br />
            Operating System
          </h1>
          <p
            className="mt-5 text-[15px] leading-relaxed max-w-xs mx-auto text-balance"
            style={{ color: "#71717A" }}
          >
            Coordinate every display, operator, and moment of your production from one system.
          </p>
        </div>

        {/* Stats bar */}
        <div
          className="w-full max-w-2xl rounded-2xl mb-8 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#27272A]"
          style={{
            background: "#18181C",
            border: "1px solid #27272A",
            overflow: "hidden",
          }}
        >
          {STATS.map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="flex flex-col items-start px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "#818CF8" }} />
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
                >
                  {label}
                </span>
              </div>
              <p className="text-[1.5rem] font-semibold leading-none tracking-tight" style={{ color: "#FFFFFF" }}>
                {value}
              </p>
              <p
                className="font-mono text-[10px] mt-1"
                style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
              >
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* Control surfaces */}
        <div className="w-full max-w-2xl">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
            >
              Control
            </span>
            <span className="flex-1 h-px" style={{ background: "#27272A" }} />
          </div>

          {/* Operator surfaces */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {OPERATOR_SURFACES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group relative flex items-start gap-4 rounded-2xl p-5 transition-all duration-200"
                  style={{
                    background: "#18181C",
                    border: "1px solid #27272A",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.border = "1px solid rgba(129,140,248,0.35)";
                    (e.currentTarget as HTMLElement).style.background = "#1f1f25";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.border = "1px solid #27272A";
                    (e.currentTarget as HTMLElement).style.background = "#18181C";
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} style={{ color: "#818CF8" }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[15px] font-semibold" style={{ color: "#FFFFFF" }}>
                        {s.label}
                      </p>
                      <span
                        className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(129,140,248,0.1)",
                          color: "#818CF8",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        {s.role}
                      </span>
                    </div>
                    <p className="text-[13px] leading-snug" style={{ color: "#71717A" }}>
                      {s.desc}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    strokeWidth={1.5}
                    style={{ color: "#818CF8" }}
                  />
                </Link>
              );
            })}
          </div>

          {/* Display surfaces */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
            >
              Displays
            </span>
            <span className="flex-1 h-px" style={{ background: "#27272A" }} />
            <span
              className="font-mono text-[10px]"
              style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
            >
              Opens in new tab
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DISPLAY_SURFACES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center text-center gap-3 rounded-2xl p-5 transition-all duration-200"
                  style={{
                    background: "#18181C",
                    border: "1px solid #27272A",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.border = "1px solid #3F3F46";
                    (e.currentTarget as HTMLElement).style.background = "#1f1f25";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.border = "1px solid #27272A";
                    (e.currentTarget as HTMLElement).style.background = "#18181C";
                  }}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${s.color}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold leading-none mb-1" style={{ color: "#FFFFFF" }}>
                      {s.label}
                    </p>
                    <p className="text-[11px] leading-snug" style={{ color: "#52525B" }}>
                      {s.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 sm:px-8 py-4 flex items-center justify-between"
        style={{ borderTop: "1px solid #27272A" }}
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-pulse" aria-hidden="true" />
          <span
            className="font-mono text-[11px]"
            style={{ color: "#52525B", fontFamily: "var(--font-mono, monospace)" }}
          >
            All systems operational
          </span>
        </div>
        <span
          className="font-mono text-[11px]"
          style={{ color: "#3F3F46", fontFamily: "var(--font-mono, monospace)" }}
        >
          KramFlow · Live Event OS
        </span>
      </footer>
    </main>
  );
}
