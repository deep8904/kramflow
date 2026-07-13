import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg bg-background border border-white/10 px-3.5 text-[15px] text-primary placeholder:text-muted-2 outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors",
        className
      )}
      {...props}
    />
  );
}
