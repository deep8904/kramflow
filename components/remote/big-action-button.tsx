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
        "w-full rounded-3xl text-2xl font-semibold transition-colors duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "primary" && "bg-primary text-background",
        variant === "secondary" && "bg-card text-primary border border-white/10",
        variant === "warning" && "bg-status-orange/15 text-status-orange border border-status-orange/30",
        variant === "danger" && "bg-status-red/15 text-status-red border border-status-red/30",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
