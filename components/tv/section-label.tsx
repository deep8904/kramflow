export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium ${className ?? ""}`}
    >
      {children}
    </p>
  );
}
