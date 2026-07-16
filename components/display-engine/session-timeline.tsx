import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Shared read-only running-order list for displays that show a full
 * schedule rather than just the current item (Lobby, Volunteer, AV live
 * timeline). New component — the existing TV routes render running order
 * differently and are left untouched.
 */
export function SessionTimeline({
  session,
  currentOrder,
  limit,
}: {
  session: Session;
  currentOrder: number | null;
  limit?: number;
}) {
  const items = limit ? session.items.slice(0, limit) : session.items;

  return (
    <div className="flex flex-col divide-y divide-white/5">
      {items.map((item) => {
        const isLive = currentOrder !== null && item.order === currentOrder;
        const isNext = currentOrder !== null && item.order === currentOrder + 1;
        const isPast = currentOrder !== null && item.order < currentOrder;
        const detail = item.presenter;

        return (
          <div key={item.id} className={cn("flex items-center gap-6 py-4", isPast && !isLive && "opacity-40")}>
            <span
              className={cn(
                "text-caption tabular-nums w-20 shrink-0",
                isLive ? "text-status-green" : "text-muted-2"
              )}
            >
              {item.scheduledStart ?? "--:--"}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-body truncate", isLive ? "text-primary font-semibold" : "text-muted")}>
                {item.title}
              </p>
              {detail && <p className="text-caption text-muted-2 truncate mt-0.5">{detail}</p>}
            </div>
            {isLive && (
              <span className="text-caption font-semibold uppercase tracking-wide text-status-green shrink-0">
                Live
              </span>
            )}
            {isNext && (
              <span className="text-caption font-semibold uppercase tracking-wide text-status-orange shrink-0">
                Next
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
