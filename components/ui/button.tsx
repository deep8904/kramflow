import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button({ variant = "secondary", size = "md", className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",

        // Sizes
        size === "sm" && "h-7 px-2.5 text-[12px] rounded-lg gap-1.5",
        size === "md" && "h-9 px-3.5 text-[13px] rounded-lg",
        size === "lg" && "h-12 px-5 text-[14px] rounded-xl",
        size === "xl" && "h-16 px-8 text-[16px] rounded-2xl",

        // Variants
        variant === "primary" &&
          "bg-primary text-background hover:bg-white/90 active:bg-white/80",
        variant === "secondary" &&
          "bg-surface-1 text-primary border border-[var(--color-border)] hover:bg-surface-2 hover:border-[var(--color-border-strong)] active:bg-surface-3",
        variant === "ghost" &&
          "text-secondary hover:text-primary hover:bg-surface-1 active:bg-surface-2",
        variant === "danger" &&
          "bg-status-red/10 text-status-red border border-status-red/20 hover:bg-status-red/20 active:bg-status-red/25",

        className
      )}
      {...props}
    />
  );
});
