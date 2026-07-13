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
  return (
    <div className="flex items-center justify-between text-caption text-muted-2 tabular-nums">
      <span>
        {dayLabel} • {sessionLabel}
      </span>
      <span>
        {currentIndex} / {total}
      </span>
    </div>
  );
}
