import Link from "next/link";

const surfaces = [
  { href: "/operator", label: "Operator", desc: "Control the program" },
  { href: "/green-room", label: "Green Room", desc: "Performer display" },
  { href: "/av", label: "AV", desc: "Technical display" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-12">
        <h1 className="text-title text-primary">StageFlow</h1>
        <div className="flex gap-4">
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
