import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
        size === "md" && "h-10 px-4 text-[15px]",
        size === "sm" && "h-8 px-3 text-sm",
        variant === "primary" && "bg-primary text-background hover:bg-white/90",
        variant === "secondary" &&
          "bg-card text-primary hover:bg-card-hover border border-white/10",
        variant === "ghost" && "text-muted hover:text-primary hover:bg-card",
        variant === "danger" && "bg-status-red/15 text-status-red hover:bg-status-red/25",
        className
      )}
      {...props}
    />
  );
}
