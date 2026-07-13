export function RequirementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-body text-muted">{label}</span>
      <span className="text-body text-primary font-medium">{value}</span>
    </div>
  );
}
