import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import { Flash, Section, Stat } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { CategoryChip, IssueStatusBadge } from '@/components/IssueBadge';
import { fmtDate, houseLabel } from '@/lib/format';
import { natural } from '@/lib/societyData';
import { hoursLeft, openStatuses } from '@/lib/welfare';
import { addAgent, removeAgent } from '../actions';

export default async function WelfareAdmin({ params, searchParams }: { params: { sid: string }; searchParams: { tab?: string; ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const sid = params.sid;
  const tab = searchParams.tab ?? 'open';

  const [{ data: pairs }, { data: agentRows }, { data: stats }, { data: issues }] = await Promise.all([
    supabase.rpc('house_streets', { p_society: sid }),
    supabase.from('welfare_agents').select('id, user_id, block, street, active').eq('society_id', sid).eq('active', true),
    supabase.rpc('welfare_agent_stats', { sid }),
    supabase
      .from('welfare_issues')
      .select('id, ref_no, category, status, due_at, created_at, assigned_to, house:houses(block, street, house_no)')
      .eq('society_id', sid)
      .order('created_at', { ascending: false })
      .limit(500),
  ]);
  const statMap = new Map(((stats ?? []) as any[]).map((s) => [s.user_id, s]));
  const blocks = Array.from(new Set(((pairs ?? []) as any[]).map((p) => p.block))).sort(natural);
  const galisOf = (b: string) => ((pairs ?? []) as any[]).filter((p) => p.block === b).map((p) => p.street).sort(natural);

  const all = (issues ?? []) as any[];
  const open = all.filter((i) => openStatuses.includes(i.status));
  const overdue = open.filter((i) => i.due_at && Date.parse(i.due_at) < Date.now());
  const unassigned = open.filter((i) => !i.assigned_to);
  const list = tab === 'overdue' ? overdue : tab === 'unassigned' ? unassigned : tab === 'all' ? all : open;

  // Which galis have nobody responsible?
  const covered = (b: string, s: string) => ((agentRows ?? []) as any[]).some((a) => a.block === b && (!a.street || a.street === s));
  const uncovered = ((pairs ?? []) as any[]).filter((p) => !covered(p.block, p.street));

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <div>
        <h1>Welfare</h1>
        <p className="muted mt-1">Har gali ka ek zimmedar. Residents ke masle seedha usay jate hain, aap sab kuch yahan dekhte hain.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Khule masle" value={open.length} tone={open.length ? 'red' : 'green'} />
        <Stat label="Waqt se late" value={overdue.length} tone={overdue.length ? 'red' : 'green'} />
        <Stat label="Agent ke baghair" value={unassigned.length} tone={unassigned.length ? 'red' : 'green'} hint="Ye aap ko khud dekhne honge" />
        <Stat label="Galiyan bina agent" value={uncovered.length} tone={uncovered.length ? 'red' : 'green'} />
      </div>

      <Section title="Welfare agents">
        <form action={addAgent} className="mb-5 grid gap-3 rounded-xl bg-canvas p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="sid" value={sid} />
          <div>
            <label className="label" htmlFor="phone">Agent ka mobile</label>
            <input id="phone" name="phone" className="input" required placeholder="0300 1234567" />
          </div>
          <div>
            <label className="label" htmlFor="area">Zimmedari</label>
            <select id="area" name="area" className="input" required>
              {blocks.map((b) => (
                <optgroup key={b} label={b ? `Block ${b}` : 'Society'}>
                  <option value={`${b}|`}>{b ? `Block ${b} — poora block` : 'Poori society'}</option>
                  {galisOf(b).map((s: string) => <option key={s} value={`${b}|${s}`}>{b ? `${b} — ` : ''}Gali {s}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <SubmitButton>Muqarrar karein</SubmitButton>
          <p className="hint sm:col-span-3">Agent pehle apne number se app par login kare. Ek agent ko kai galiyan di ja sakti hain (dobara add karein).</p>
        </form>

        {(agentRows ?? []).length === 0 ? (
          <p className="muted">Abhi koi agent nahi.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Agent</th><th>Area</th><th>Khule</th><th>Late</th><th>Hal</th><th>Avg waqt</th><th>Rating</th><th>Check (30 din)</th><th></th></tr></thead>
            <tbody>
              {((agentRows ?? []) as any[]).map((a) => {
                const s = statMap.get(a.user_id);
                return (
                  <tr key={a.id}>
                    <td className="font-bold">{s?.name ?? '—'}</td>
                    <td>{a.block ? `Block ${a.block}, ` : ''}{a.street ? `Gali ${a.street}` : 'poora block'}</td>
                    <td>{s?.open ?? 0}</td>
                    <td className={s?.overdue ? 'font-bold text-due-ink' : ''}>{s?.overdue ?? 0}</td>
                    <td>{s?.resolved ?? 0}</td>
                    <td>{s?.avg_hours != null ? `${s.avg_hours} h` : '—'}</td>
                    <td>{s?.avg_rating ? `${s.avg_rating}★` : '—'}</td>
                    <td>{s?.visits_30d ?? 0}</td>
                    <td>
                      <form action={removeAgent}>
                        <input type="hidden" name="sid" value={sid} />
                        <input type="hidden" name="agent_row" value={a.id} />
                        <SubmitButton className="text-xs font-bold text-due-ink" confirm="Is area se agent hatayein?">Hatayein</SubmitButton>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {uncovered.length > 0 && (
          <p className="mt-4 text-sm text-due-ink">
            Bina agent galiyan: {uncovered.slice(0, 30).map((p: any) => `${p.block ? p.block + '-' : ''}${p.street}`).join(', ')}{uncovered.length > 30 ? '…' : ''}
          </p>
        )}
      </Section>

      <section>
        <nav className="mb-3 flex gap-2 overflow-x-auto" aria-label="Filter">
          {[['open', `Khule (${open.length})`], ['overdue', `Late (${overdue.length})`], ['unassigned', `Bina agent (${unassigned.length})`], ['all', 'Sab']].map(([id, label]) => (
            <Link key={id} href={`?tab=${id}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold no-underline hover:no-underline ${tab === id ? 'bg-ink text-white' : 'bg-white text-ink-soft'}`}>{label}</Link>
          ))}
        </nav>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {list.length === 0 && <li className="p-4 text-sm text-ink-mute">Kuch nahi.</li>}
          {list.map((i) => {
            const left = openStatuses.includes(i.status) ? hoursLeft(i.due_at) : null;
            return (
              <li key={i.id}>
                <Link href={`/welfare/issues/${i.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 no-underline hover:bg-canvas hover:no-underline">
                  <span className="plate h-7 px-2 text-[11px]">{i.ref_no}</span>
                  <div className="min-w-[12rem] flex-1">
                    <CategoryChip id={i.category} />
                    <div className="text-xs text-ink-mute">{houseLabel(i.house)} · {fmtDate(i.created_at)}{!i.assigned_to ? ' · bina agent' : ` · ${statMap.get(i.assigned_to)?.name ?? 'agent'}`}</div>
                  </div>
                  {left !== null && <span className={`text-xs font-bold ${left < 0 ? 'text-due-ink' : 'text-ink-soft'}`}>{left < 0 ? `${Math.abs(left)}h late` : `${left}h baqi`}</span>}
                  <IssueStatusBadge status={i.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
