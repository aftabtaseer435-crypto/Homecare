import { category, issueStatus } from '@/lib/welfare';
import { welfareIcon } from '@/lib/icons';
import { Check } from 'lucide-react';

export function IssueStatusBadge({ status }: { status: string }) {
  const s = issueStatus(status);
  return <span className={`badge ${s.soft}`}>{s.short === 'Done' && <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />}{s.label}</span>;
}

/** Five-step tracker: Report → Seen → Working → Resolved → Confirmed */
export function IssueSteps({ status }: { status: string }) {
  const s = issueStatus(status);
  const steps = ['Report', 'Agent ne dekha', 'Kaam jari', 'Hal hua', 'Confirm'];
  const reopened = status === 'reopened';
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={`Status: ${s.label}`}>
      {steps.map((label, i) => {
        const done = !reopened && i <= s.step;
        const green = done && s.step >= 3;
        return (
          <li key={label} className="min-w-0">
            <div className={`h-2 rounded-full ${done ? (green ? 'bg-paid' : i === 0 ? 'bg-due' : 'bg-plate') : 'bg-line'}`} />
            <div className={`mt-1.5 truncate text-[11px] font-bold ${done ? 'text-ink' : 'text-ink-mute'}`}>{label}</div>
          </li>
        );
      })}
    </ol>
  );
}

export function CategoryChip({ id }: { id: string }) {
  const c = category(id);
  const I = welfareIcon(id);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
      <I className="h-4 w-4 text-ink-mute" strokeWidth={2} aria-hidden="true" />
      {c.label}
      {c.scope === 'private' && <span className="badge bg-canvas text-ink-soft">Private</span>}
    </span>
  );
}
