import Link from "next/link";

const surfaces = [
  { href: "/operator", label: "Operator", desc: "Desktop control room" },
  { href: "/remote", label: "Remote", desc: "Mobile one-hand control" },
  { href: "/green-room", label: "Green Room", desc: "Performer TV display" },
  { href: "/av", label: "AV", desc: "Technical TV display" },
];

// Display Engine surfaces stay hidden from the launcher until this is set —
// keeps the new subsystem reviewable/mergeable without changing what today's
// production launcher shows. See docs/DISPLAY_ENGINE.md.
//
// Only the 3 displays actually used for this event are linked here. Lobby
// and Volunteer Board are fully built and still reachable directly by URL
// (/displays/lobby, /displays/volunteer) — just intentionally unlinked from
// every navigation surface so they don't appear as options for an event
// that isn't running them. Revive by adding them back to this list.
const displayEngineSurfaces = [
  { href: "/displays/presenter", label: "Presenter", desc: "Confidence monitor" },
  { href: "/displays/green-room", label: "Green Room", desc: "Display Engine" },
  { href: "/displays/av", label: "AV Waiting Room", desc: "Display Engine" },
  { href: "/broadcast", label: "Broadcast Center", desc: "Send messages to displays" },
  { href: "/display-manager", label: "Display Manager", desc: "Manage connected displays" },
];

export default function Home() {
  const displayEngineEnabled = process.env.NEXT_PUBLIC_DISPLAY_ENGINE_ENABLED === "1";

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

        {displayEngineEnabled && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-caption uppercase tracking-wide text-muted-2">Display Engine (Preview)</p>
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
              {displayEngineSurfaces.map((s) => (
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
        )}
      </div>
    </main>
  );
}
