export function ProgressFooter({
  dayLabel,
  sessionLabel,
  currentIndex,
  total,
}: {
  dayLabel: string;
  sessionLabel: string;
  currentIndex: number;
  total: number;
}) {
  const fraction = total > 0 ? Math.min(1, currentIndex / total) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-tertiary tabular mb-2.5">
        <span>
          {dayLabel} · {sessionLabel}
        </span>
        <span>
          {currentIndex} / {total}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary/40 transition-all duration-500"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
