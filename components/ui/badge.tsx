import { cn } from "@/lib/utils";

type Tone = "green" | "blue" | "orange" | "red" | "muted";

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold uppercase tracking-wide",
        tone === "green" && "bg-status-green/15 text-status-green",
        tone === "blue" && "bg-status-blue/15 text-status-blue",
        tone === "orange" && "bg-status-orange/15 text-status-orange",
        tone === "red" && "bg-status-red/15 text-status-red",
        tone === "muted" && "bg-white/5 text-muted-2",
        className
      )}
    >
      {children}
    </span>
  );
}
