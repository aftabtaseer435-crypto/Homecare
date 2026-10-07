import { hasHours, hoursLabel, isOpenNow, opensAt, type Hours } from '@/lib/hours';

/** "Abhi khula" / "Band — 8 PM se" + the provider's day/night hours. */
export default function HoursBadge({ h, available = true, showLabel = true }: { h: Hours; available?: boolean; showLabel?: boolean }) {
  if (!hasHours(h)) return null;
  const open = available && isOpenNow(h);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {open ? (
        <span className="badge bg-paid-soft text-paid-ink"><span className="h-1.5 w-1.5 rounded-full bg-paid" aria-hidden="true" /> Abhi khula</span>
      ) : (
        <span className="badge bg-canvas text-ink-mute ring-1 ring-inset ring-line">Band{available ? ` — ${opensAt(h)}` : ''}</span>
      )}
      {showLabel && <span className="text-xs text-ink-mute">{hoursLabel(h)}</span>}
    </span>
  );
}
