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
      <div className="flex items-center justify-between text-caption text-muted-2 tabular-nums mb-3">
        <span>
          {dayLabel} • {sessionLabel}
        </span>
        <span>
          {currentIndex} / {total}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-card overflow-hidden">
        <div
          className="h-full rounded-full bg-muted-2"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
