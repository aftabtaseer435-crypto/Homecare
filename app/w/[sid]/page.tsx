import NoticeBoard from '@/components/NoticeBoard';
import Link from 'next/link';
import { inAreas, requireAgent } from '@/lib/agent';
import { fetchAll } from '@/lib/fetchAll';
import { Empty, Flash, Stat } from '@/components/ui';
import { CategoryChip, IssueStatusBadge } from '@/components/IssueBadge';
import { fmtDate, houseLabel } from '@/lib/format';
import { hoursLeft, openStatuses } from '@/lib/welfare';

export default async function AgentIssues({ params, searchParams }: { params: { sid: string }; searchParams: { tab?: string; ok?: string; err?: string } }) {
  const { supabase, user, areas } = await requireAgent(params.sid);
  const tab = searchParams.tab ?? 'open';

  const [issues, { data: stats }] = await Promise.all([
    fetchAll<any>((from, to) =>
      supabase
        .from('welfare_issues')
        .select('id, ref_no, category, title, status, due_at, created_at, scope, block, street, house:houses(block, street, house_no), supporters:welfare_issue_supporters(count)')
        .eq('society_id', params.sid)
        .order('created_at', { ascending: false })
        .range(from, to),
    ),
    supabase.rpc('welfare_agent_stats', { sid: params.sid }),
  ]);
  const all = issues.filter((i) => inAreas(areas, i.block, i.street));
  const now = Date.now();
  const open = all.filter((i) => openStatuses.includes(i.status));
  const overdue = open.filter((i) => i.due_at && Date.parse(i.due_at) < now);
  const waiting = all.filter((i) => i.status === 'resolved');
  const list = tab === 'overdue' ? overdue : tab === 'done' ? all.filter((i) => !openStatuses.includes(i.status)) : tab === 'all' ? all : open;
  // most urgent first: overdue, then by due time
  if (tab === 'open' || tab === 'overdue') list.sort((a, b) => Date.parse(a.due_at ?? a.created_at) - Date.parse(b.due_at ?? b.created_at));
  // one row per area — combine all of this agent's areas
  const rows = ((stats ?? []) as any[]).filter((s) => s.user_id === user.id);
  const resolved = rows.reduce((a, r) => a + Number(r.resolved ?? 0), 0);
  const wAvg = (k: string) => {
    const w = rows.filter((r) => r[k] != null && Number(r.resolved) > 0);
    const n = w.reduce((a, r) => a + Number(r.resolved), 0);
    return n ? Math.round((w.reduce((a, r) => a + Number(r[k]) * Number(r.resolved), 0) / n) * 10) / 10 : null;
  };
  const mine = rows.length ? { resolved, avg_hours: wAvg('avg_hours'), avg_rating: wAvg('avg_rating') } : null;

  const tabs = [
    ['open', `Khule (${open.length})`],
    ['overdue', `Late (${overdue.length})`],
    ['done', 'Hal shuda'],
    ['all', 'Sab'],
  ];

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <NoticeBoard societyIds={[params.sid]} next={`/w/${params.sid}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Khule masle" value={open.length} tone={open.length ? 'red' : 'green'} />
        <Stat label="Waqt se late" value={overdue.length} tone={overdue.length ? 'red' : 'green'} />
        <Stat label="Confirm ka intezar" value={waiting.length} hint="Resident ko WhatsApp karein" />
        <Stat label="Meri rating" value={mine?.avg_rating ? `${mine.avg_rating}★` : '—'} hint={mine ? `${mine.resolved} hal · avg ${mine.avg_hours ?? '—'} ghante` : undefined} />
      </div>

      <nav className="flex gap-2 overflow-x-auto" aria-label="Filter">
        {tabs.map(([id, label]) => (
          <Link key={id} href={`?tab=${id}`} aria-current={tab === id ? 'page' : undefined} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold no-underline hover:no-underline ${tab === id ? 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200' : 'bg-white text-ink-mute ring-1 ring-inset ring-line hover:text-ink'}`}>{label}</Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <Empty title={tab === 'open' ? 'Shabash — koi khula masla nahi' : undefined}>Is list mein kuch nahi.</Empty>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {list.map((i) => {
            const left = openStatuses.includes(i.status) ? hoursLeft(i.due_at) : null;
            return (
              <li key={i.id}>
                <Link href={`/welfare/issues/${i.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 no-underline hover:bg-canvas hover:no-underline">
                  <span className="plate h-7 px-2 text-[11px]">{i.ref_no}</span>
                  <div className="min-w-[12rem] flex-1">
                    <CategoryChip id={i.category} />
                    <div className="text-xs text-ink-mute">
                      {houseLabel(i.house)} · {fmtDate(i.created_at)}
                      {i.supporters?.[0]?.count ? ` · ${i.supporters[0].count + 1} ghar` : ''}
                    </div>
                  </div>
                  {left !== null && <span className={`text-xs font-bold ${left < 0 ? 'text-due-ink' : 'text-ink-soft'}`}>{left < 0 ? `${Math.abs(left)}h late` : `${left}h baqi`}</span>}
                  <IssueStatusBadge status={i.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
