import { cn } from "@/lib/utils";

export function QuickActionButton({
  icon: Icon,
  label,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-4 cursor-pointer transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active
          ? "bg-surface-1 border border-[var(--color-border-strong)] text-primary"
          : "bg-surface-1 border border-[var(--color-border)] text-tertiary hover:text-secondary hover:border-[var(--color-border-strong)]"
      )}
      {...props}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
