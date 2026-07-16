export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-caption uppercase tracking-[0.12em] text-muted-2 font-medium ${className ?? ""}`}>
      {children}
    </p>
  );
}
