import Link from 'next/link';
import { dueStatusStyle } from '@/lib/format';

/** Shows ?ok= / ?err= messages set by server actions after redirect. */
export function Flash({ searchParams }: { searchParams?: { ok?: string; err?: string } }) {
  if (searchParams?.err)
    return (
      <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-due/30 bg-due-soft px-4 py-3 text-sm text-due">
        <span className="mt-0.5 font-bold">!</span>
        <span>{searchParams.err}</span>
      </div>
    );
  if (searchParams?.ok)
    return (
      <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-paid/30 bg-paid-soft px-4 py-3 text-sm text-paid">
        <span className="mt-0.5 font-bold">✓</span>
        <span>{searchParams.ok}</span>
      </div>
    );
  return null;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = dueStatusStyle(status);
  return <span className={`badge ${s.soft}`}>{s.label}</span>;
}

export function PageHeader({ title, subtitle, action, back }: { title: string; subtitle?: string; action?: React.ReactNode; back?: [string, string] }) {
  return (
    <div className="mb-6">
      {back && <Link href={back[1]} className="mb-2 inline-block text-sm font-semibold">{back[0]}</Link>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1>{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-ink-mute">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Stat({ label, value, tone, hint }: { label: string; value: React.ReactNode; tone?: 'green' | 'red' | 'gray'; hint?: string }) {
  const color = tone === 'green' ? 'text-paid' : tone === 'red' ? 'text-due' : 'text-ink';
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-sm font-semibold text-ink-mute">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-mute">{hint}</div>}
    </div>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center text-sm text-amber-500" title={`${value} / 5`}>
      {'★'.repeat(full)}
      <span className="text-line">{'★'.repeat(5 - full)}</span>
      {count !== undefined && <span className="ml-1 text-xs text-ink-mute">({count})</span>}
    </span>
  );
}

export function Empty({ children, href, cta, title }: { children: React.ReactNode; href?: string; cta?: string; title?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 px-6 py-10 text-center">
      {title && <h2 className="mb-1">{title}</h2>}
      <p className="mx-auto max-w-md text-ink-mute">{children}</p>
      {href && cta && <Link href={href} className="btn mt-5">{cta}</Link>}
    </div>
  );
}

export function Section({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
