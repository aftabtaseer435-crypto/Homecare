import { loadNotices, mySocietyIds } from '@/lib/notices';
import NoticeCard from './NoticeCard';
import NoticeIcon from './NoticeIcon';
import { getSession } from '@/lib/auth';

/**
 * The first thing a resident sees inside their society: every active notice
 * from the chairman, with a clear count of unread ones. Renders nothing when
 * there is no active notice.
 */
export default async function NoticeBoard({ societyIds, next, title = 'Society notices' }: { societyIds?: string[]; next: string; title?: string }) {
  const { supabase, user } = await getSession();
  if (!user) return null;
  const ids = societyIds ?? (await mySocietyIds(supabase, user.id));
  const notices = await loadNotices(supabase, user.id, ids);
  if (!notices.length) return null;
  const unread = notices.filter((n) => !n.read).length;
  const multi = new Set(notices.map((n) => n.society_id)).size > 1;
  return (
    <section aria-labelledby="notices-h" className="rounded-3xl border border-brand-100 bg-brand-50/60 p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-inset ring-brand-200">
          <NoticeIcon kind="info" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="notices-h" className="text-lg">{title}</h2>
          <p className="text-sm text-ink-mute">
            {unread ? <><b className="text-brand-800">{unread} naya notice</b> — zaroor parhein</> : 'Sab notices parh liye'} · {notices.length} active
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {notices.map((n) => <NoticeCard key={n.id} n={n} next={next} showSociety={multi} />)}
      </div>
    </section>
  );
}
