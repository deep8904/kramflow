import { cn } from "@/lib/utils";

export function QuickActionButton({
  icon: Icon,
  label,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-4 cursor-pointer transition-colors",
        active ? "bg-card text-primary" : "bg-card/50 text-muted"
      )}
      {...props}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      <span className="text-caption font-medium">{label}</span>
    </button>
  );
}
