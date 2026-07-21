import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg bg-surface-1 border border-[var(--color-border)] px-3 text-[13px] text-primary placeholder:text-tertiary outline-none",
        "focus:border-[var(--color-border-strong)] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "transition-colors",
        className
      )}
      {...props}
    />
  );
}
