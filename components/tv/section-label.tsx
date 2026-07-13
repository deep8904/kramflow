export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption uppercase tracking-[0.12em] text-muted-2 font-medium">
      {children}
    </p>
  );
}
