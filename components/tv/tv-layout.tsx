import { cn } from "@/lib/utils";

export function TvLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div
        className={cn(
          "tv-safe-area flex-1 flex flex-col justify-between max-w-[1400px] w-full mx-auto",
          className
        )}
      >
        {children}
      </div>
    </main>
  );
}

export function TvSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("py-6", className)}>{children}</section>;
}

export function TvStack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-12">{children}</div>;
}
