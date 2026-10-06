import Link from 'next/link';
import { dueStatusStyle } from '@/lib/format';

/** Shows ?ok= / ?err= messages set by server actions after redirect. */
export function Flash({ searchParams }: { searchParams?: { ok?: string; err?: string } }) {
  if (searchParams?.err)
    return <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{searchParams.err}</div>;
  if (searchParams?.ok)
    return <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{searchParams.ok}</div>;
  return null;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = dueStatusStyle(status);
  return <span className={`badge ${s.soft}`}>{s.label}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'green' | 'red' | 'gray' }) {
  const color = tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="text-sm text-amber-500" title={`${value} / 5`}>
      {'★'.repeat(full)}
      <span className="text-gray-300">{'★'.repeat(5 - full)}</span>
      {count !== undefined && <span className="ml-1 text-gray-500">({count})</span>}
    </span>
  );
}

export function Empty({ children, href, cta }: { children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="card text-center text-sm text-gray-500">
      <p>{children}</p>
      {href && cta && <Link href={href} className="btn mt-3">{cta}</Link>}
    </div>
  );
}
