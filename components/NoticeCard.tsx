import Avatar from './Avatar';
import NoticeIcon from './NoticeIcon';
import SubmitButton from './SubmitButton';
import WaButton from './WaButton';
import { ago, dayWord, fmtDay, fmtPK } from '@/lib/format';
import { noticeKindLabel, type NoticeView } from '@/lib/notices';
import { noticeText, waSend } from '@/lib/messages';
import { deleteNotice, markNoticeRead, resolveNotice } from '@/app/notices/actions';

/**
 * One notice: who sent it (photo, name, Chairman), what, for which day.
 * Residents get "Parh liya"; the chairman gets "Masla hal ho gaya".
 */
export default function NoticeCard({ n, next, manage = false, showSociety = false }: { n: NoticeView; next: string; manage?: boolean; showSociety?: boolean }) {
  const isNew = !n.read && !manage;
  const ended = !!n.resolved_at || (n.expires_at ? Date.parse(n.expires_at) < Date.now() : false);
  return (
    <article className={`relative rounded-2xl border bg-white p-5 transition-shadow ${isNew ? 'border-brand-200 shadow-soft' : 'border-line'} ${ended ? 'opacity-70' : ''}`}>
      {isNew && <span className="absolute right-4 top-4 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">Naya</span>}
      <header className="flex items-center gap-3 pr-14">
        <Avatar name={n.author.name} src={n.author.avatar} />
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{n.author.name}</div>
          <div className="truncate text-xs text-ink-mute">
            {n.author.chairman ? 'Chairman' : 'Society admin'}{showSociety && n.society_name ? ` · ${n.society_name}` : ''} · {ago(n.created_at)}
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-inset ring-line">
          <NoticeIcon kind={n.kind} className="h-3.5 w-3.5" /> {noticeKindLabel(n.kind)}
        </span>
        {n.event_date && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-plate-soft px-2.5 py-1 text-xs font-medium text-plate-ink">
            <NoticeIcon kind="event" className="h-3.5 w-3.5" /> {dayWord(n.event_date)}{dayWord(n.event_date) !== fmtDay(n.event_date) ? ` · ${fmtDay(n.event_date)}` : ''}
          </span>
        )}
        {n.resolved_at && <span className="badge bg-paid-soft text-paid-ink">Hal ho gaya</span>}
        {!n.resolved_at && ended && <span className="badge bg-canvas text-ink-mute">Waqt khatam</span>}
      </div>

      <h3 className="mt-3 text-[17px] leading-snug">{n.title}</h3>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{n.body}</p>

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {manage ? (
          <>
            {!ended && (
              <form action={resolveNotice}>
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="next" value={next} />
                <SubmitButton className="btn btn-sm">Masla hal ho gaya</SubmitButton>
              </form>
            )}
            <WaButton label="WhatsApp group mein share" href={waSend(null, noticeText({ society: n.society_name, title: n.title, body: n.body, date: n.event_date ? fmtDay(n.event_date) : null, from: `${n.author.name}${n.author.chairman ? ', Chairman' : ''}` }))} />
            <form action={deleteNotice} className="ml-auto">
              <input type="hidden" name="id" value={n.id} />
              <input type="hidden" name="next" value={next} />
              <SubmitButton className="text-xs font-medium text-due-ink" confirm="Ye notice delete karein?">Delete</SubmitButton>
            </form>
          </>
        ) : (
          <>
            <span className="text-xs text-ink-mute">
              {n.expires_at && !ended ? `Khud hat jayega: ${fmtPK(n.expires_at)}` : ''}
            </span>
            {isNew && (
              <form action={markNoticeRead} className="ml-auto">
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="next" value={next} />
                <SubmitButton className="btn-outline btn-sm">Parh liya ✓</SubmitButton>
              </form>
            )}
          </>
        )}
      </footer>
    </article>
  );
}
