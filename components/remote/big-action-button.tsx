import { cn } from "@/lib/utils";

export function BigActionButton({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "warning" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-3xl text-2xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "primary" && "bg-primary text-background hover:bg-white/90",
        variant === "secondary" &&
          "bg-surface-1 text-primary border border-[var(--color-border)] hover:bg-surface-2 hover:border-[var(--color-border-strong)]",
        variant === "warning" &&
          "bg-status-orange/10 text-status-orange border border-status-orange/20 hover:bg-status-orange/18",
        variant === "danger" &&
          "bg-status-red/10 text-status-red border border-status-red/20 hover:bg-status-red/18",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
