import Link from "next/link";

// Exactly 6 canonical screens — no flag-gating, no duplicate AV/Green Room.
// "General" here is /general (formerly /displays/lobby) — confirmed as the
// closest existing match for the generic, no-department-specific public
// display. See docs/DISPLAY_ENGINE.md for the consolidation history.
const surfaces = [
  { href: "/operator", label: "Operator", desc: "Desktop control room" },
  { href: "/remote", label: "Remote", desc: "Mobile one-hand control" },
  { href: "/av", label: "AV", desc: "Technical TV display" },
  { href: "/green-room", label: "Green Room", desc: "Performer TV display" },
  { href: "/general", label: "General", desc: "Public / lobby display" },
  { href: "/presenter", label: "Presenter", desc: "Confidence monitor" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-12 py-16">
        <h1 className="text-title text-primary">KramFlow</h1>
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
          {surfaces.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-card bg-card hover:bg-card-hover transition-colors px-8 py-6 w-48 text-center"
            >
              <p className="text-subtitle text-primary">{s.label}</p>
              <p className="text-caption text-muted mt-1">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
