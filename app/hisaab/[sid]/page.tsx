import NoticeBoard from '@/components/NoticeBoard';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Stat } from '@/components/ui';
import { fetchAll } from '@/lib/fetchAll';
import { fmtDate, rs } from '@/lib/format';
import { signPaths } from '@/lib/signed';
import { expenseLabel, galiLabel } from '@/lib/welfare';

const monthName = (m: string) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

export default async function Hisaab({ params, searchParams }: { params: { sid: string }; searchParams: { gali?: string } }) {
  const { supabase } = await requireUser(`/hisaab/${params.sid}`);
  const sid = params.sid;
  const [{ data: resident }, { data: staff }, { data: agent }] = await Promise.all([
    supabase.rpc('is_society_resident', { sid }),
    supabase.rpc('is_society_staff', { sid }),
    supabase.rpc('is_society_agent', { sid }),
  ]);
  if (!resident && !staff && !agent) redirect('/welfare');

  const [{ data: society }, { data: monthly }, expenses, { data: stats }] = await Promise.all([
    supabase.from('societies').select('name, city').eq('id', sid).single(),
    supabase.rpc('society_fund_monthly', { sid }),
    fetchAll<any>((from, to) =>
      supabase.from('fund_expenses').select('id, spent_on, amount, category, description, vendor, block, street, receipt_path, issue:welfare_issues(ref_no)').eq('society_id', sid).eq('status', 'approved').order('spent_on', { ascending: false }).range(from, to),
    ),
    supabase.rpc('welfare_agent_stats', { sid }),
  ]);

  const rows = (monthly ?? []) as { month: string; collected: number; spent: number }[];
  const collected = rows.reduce((s, r) => s + Number(r.collected), 0);
  const spent = rows.reduce((s, r) => s + Number(r.spent), 0);
  const thisMonth = new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 7);
  const cur = rows.find((r) => r.month === thisMonth);

  const byCat = new Map<string, number>();
  for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));
  const cats = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);

  const galis = Array.from(new Set(expenses.filter((e) => e.street).map((e) => `${e.block ?? ''}|${e.street}`)));
  const filtered = searchParams.gali ? expenses.filter((e) => `${e.block ?? ''}|${e.street}` === searchParams.gali) : expenses;
  const signed = await signPaths(filtered.slice(0, 200).map((e) => e.receipt_path));

  return (
    <div className="space-y-8">
      <NoticeBoard societyIds={[params.sid]} next={`/hisaab/${params.sid}`} />
      <div>
        <Link href="/welfare" className="text-sm font-bold">Welfare</Link>
        <h1 className="mt-2 text-3xl font-bold">Fund ka hisaab — {society?.name}</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">Fund kahan aur kitna laga — raseed ke sath.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Kul jama hua" value={rs(collected)} tone="green" />
        <Stat label="Kul kharch hua" value={rs(spent)} />
        <Stat label="Baqi (society ke paas)" value={rs(collected - spent)} tone={collected - spent < 0 ? 'red' : undefined} />
        <Stat label="Is mahine" value={rs(Number(cur?.spent ?? 0))} hint={`Jama: ${rs(Number(cur?.collected ?? 0))}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3">Paisa kis cheez par laga</h2>
          {cats.length === 0 ? <p className="muted">Abhi koi kharcha darj nahi.</p> : (
            <table className="table">
              <thead><tr><th>Cheez</th><th className="text-right">Amount</th><th className="text-right">Hissa</th></tr></thead>
              <tbody>
                {cats.map(([c, a]) => (
                  <tr key={c}><td>{expenseLabel(c)}</td><td className="text-right font-bold">{rs(a)}</td><td className="text-right">{spent ? Math.round((a / spent) * 100) : 0}%</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="card">
          <h2 className="mb-3">Mahana jama aur kharch</h2>
          {rows.length === 0 ? <p className="muted">Abhi koi record nahi.</p> : (
            <table className="table">
              <thead><tr><th>Mahina</th><th className="text-right">Jama</th><th className="text-right">Kharch</th><th className="text-right">Farq</th></tr></thead>
              <tbody>
                {rows.slice(0, 12).map((r) => (
                  <tr key={r.month}>
                    <td>{monthName(r.month)}</td>
                    <td className="text-right">{rs(r.collected)}</td>
                    <td className="text-right">{rs(r.spent)}</td>
                    <td className={`text-right font-bold ${Number(r.collected) - Number(r.spent) < 0 ? 'text-due-ink' : 'text-paid-ink'}`}>{rs(Number(r.collected) - Number(r.spent))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2>Har kharche ki tafseel ({filtered.length})</h2>
          {galis.length > 0 && (
            <form className="flex items-end gap-2">
              <div><label htmlFor="h-gali" className="mb-1 block text-xs font-semibold text-ink-soft">Gali</label>
              <select id="h-gali" name="gali" defaultValue={searchParams.gali ?? ''} className="input py-2">
                <option value="">Sab jagah</option>
                {galis.map((g) => { const [b, s] = g.split('|'); return <option key={g} value={g}>{galiLabel(b, s)}</option>; })}
              </select></div>
              <button className="btn-outline">Dekhein</button>
            </form>
          )}
        </div>
        {filtered.length === 0 ? <p className="muted">Kuch nahi.</p> : (
          <table className="table">
            <thead><tr><th>Tareekh</th><th>Kya</th><th>Kahan</th><th className="text-right">Amount</th><th>Raseed</th></tr></thead>
            <tbody>
              {filtered.slice(0, 200).map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap">{fmtDate(e.spent_on)}</td>
                  <td>{e.description}<div className="muted">{expenseLabel(e.category)}{e.vendor ? ` · ${e.vendor}` : ''}{e.issue ? ` · masla ${e.issue.ref_no}` : ''}</div></td>
                  <td>{galiLabel(e.block, e.street)}</td>
                  <td className="text-right font-bold">{rs(e.amount)}</td>
                  <td>{e.receipt_path && signed.get(e.receipt_path) ? <a href={signed.get(e.receipt_path)} target="_blank" rel="noopener">Dekhein</a> : <span className="text-ink-mute">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="mb-1">Welfare agents ki karkardagi</h2>
        <p className="muted mb-3">Har gali ka zimmedar — kitne masle aaye, kitne hal hue, kitne waqt mein, aur residents ki rating.</p>
        {(stats ?? []).length === 0 ? <p className="muted">Abhi koi agent muqarrar nahi.</p> : (
          <table className="table">
            <thead><tr><th>Agent</th><th>Area</th><th>Hal</th><th>Khule</th><th>Late</th><th>Avg waqt</th><th>Rating</th></tr></thead>
            <tbody>
              {((stats ?? []) as any[]).map((s) => (
                <tr key={s.agent_id}>
                  <td className="font-bold">{s.name}</td>
                  <td>{s.area}</td>
                  <td className="text-paid-ink font-bold">{s.resolved}</td>
                  <td>{s.open}</td>
                  <td className={s.overdue ? 'font-bold text-due-ink' : ''}>{s.overdue}</td>
                  <td>{s.avg_hours != null ? `${s.avg_hours} ghante` : '—'}</td>
                  <td>{s.avg_rating ? `${s.avg_rating}★` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
