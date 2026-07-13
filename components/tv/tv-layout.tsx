import { cn } from "@/lib/utils";

export function TvLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <div className={cn("tv-safe-area flex-1 flex flex-col justify-between min-h-0", className)}>
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
  return <section className={className}>{children}</section>;
}

export function TvStack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-16">{children}</div>;
}
