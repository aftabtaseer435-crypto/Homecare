import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Empty } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { cleanTitle, kindOf } from '@/lib/notifKinds';
import { ago } from '@/lib/format';
import { markAllRead, openNotification } from './actions';

export const metadata = { title: 'Notifications', robots: { index: false } };

export default async function Notifications({ searchParams }: { searchParams: { f?: string } }) {
  const { supabase, user } = await requireUser('/notifications');
  let q = supabase.from('notifications').select('id, kind, title, body, url, read_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200);
  if (searchParams.f === 'unread') q = q.is('read_at', null);
  const { data } = await q;
  const list = (data ?? []) as any[];
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Notifications</h1>
          <p className="muted mt-1">Orders, reviews, society notices, welfare masle aur payments — sab ek jagah.</p>
        </div>
        {unread > 0 && (
          <form action={markAllRead}><SubmitButton className="btn-outline btn-sm">Sab parh liye ✓</SubmitButton></form>
        )}
      </div>
      <nav className="flex gap-2" aria-label="Filter">
        {[['', 'Sab'], ['unread', 'Na parhi hui']].map(([f, l]) => (
          <Link key={f} href={f ? `?f=${f}` : '?'} className={`rounded-full px-4 py-2 text-sm font-semibold no-underline hover:no-underline ${(searchParams.f ?? '') === f ? 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200' : 'bg-white text-ink-mute ring-1 ring-inset ring-line'}`}>{l}</Link>
        ))}
      </nav>
      {list.length === 0 ? (
        <Empty>{searchParams.f === 'unread' ? 'Sab parh li hain. ✓' : 'Abhi koi notification nahi.'}</Empty>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {list.map((n) => {
            const k = kindOf(n.kind);
            return (
              <li key={n.id}>
                <form action={openNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="url" value={n.url ?? '/notifications'} />
                  <button className={`flex w-full gap-3 px-4 py-3.5 text-left hover:bg-canvas ${n.read_at ? '' : 'bg-brand-50/50'}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.cls}`} aria-hidden="true">{k.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read_at ? 'text-ink-soft' : 'font-semibold text-ink'}`}>{cleanTitle(n.title)}</span>
                      {n.body && <span className="mt-0.5 block text-sm text-ink-mute">{n.body}</span>}
                      <span className="mt-1 block text-xs text-ink-mute">{k.label} · {ago(n.created_at)}</span>
                    </span>
                    {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="naya" />}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
