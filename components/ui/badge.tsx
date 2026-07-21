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
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        tone === "green" &&
          "bg-status-green/10 text-status-green border border-status-green/20",
        tone === "blue" &&
          "bg-status-blue/10 text-status-blue border border-status-blue/20",
        tone === "orange" &&
          "bg-status-orange/10 text-status-orange border border-status-orange/20",
        tone === "red" &&
          "bg-status-red/10 text-status-red border border-status-red/20",
        tone === "muted" &&
          "bg-surface-2 text-tertiary border border-[var(--color-border)]",
        className
      )}
    >
      {children}
    </span>
  );
}
