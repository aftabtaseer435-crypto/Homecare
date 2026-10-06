import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import { Flash, Section } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, rs, todayPK } from '@/lib/format';
import { natural } from '@/lib/societyData';
import { signPaths } from '@/lib/signed';
import { expenseCategories, expenseLabel, galiLabel } from '@/lib/welfare';
import { addExpense, reviewExpense } from '../actions';

export default async function Ledger({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const sid = params.sid;
  const [{ data: pairs }, { data: pending }, { data: recent }] = await Promise.all([
    supabase.rpc('house_streets', { p_society: sid }),
    supabase.from('fund_expenses').select('*, issue:welfare_issues(id, ref_no)').eq('society_id', sid).eq('status', 'pending').order('created_at'),
    supabase.from('fund_expenses').select('*, issue:welfare_issues(id, ref_no)').eq('society_id', sid).neq('status', 'pending').order('spent_on', { ascending: false }).limit(100),
  ]);
  const signed = await signPaths([...((pending ?? []) as any[]), ...((recent ?? []) as any[])].map((e) => e.receipt_path));
  const blocks = Array.from(new Set(((pairs ?? []) as any[]).map((p) => p.block))).sort(natural);

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Kharcha (fund ka hisaab)</h1>
          <p className="muted mt-1">Jo bhi paisa fund se lage, raseed ke sath yahan darj karein. Har verified resident ko yeh hisaab nazar aata hai.</p>
        </div>
        <Link href={`/hisaab/${sid}`} className="btn-outline">Residents wala hisaab dekhein</Link>
      </div>

      {(pending ?? []).length > 0 && (
        <Section title={`Agents ki entries — approval baqi (${pending!.length})`}>
          <ul className="space-y-3">
            {((pending ?? []) as any[]).map((e) => (
              <li key={e.id} className="rounded-xl border border-plate bg-plate-soft/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{rs(e.amount)} — {e.description}</div>
                    <div className="text-sm text-ink-soft">
                      {expenseLabel(e.category)} · {galiLabel(e.block, e.street)} · {fmtDate(e.spent_on)}{e.vendor ? ` · ${e.vendor}` : ''}
                      {e.issue && <> · <Link href={`/welfare/issues/${e.issue.id}`}>{e.issue.ref_no}</Link></>}
                    </div>
                    {e.receipt_path && signed.get(e.receipt_path) ? <a href={signed.get(e.receipt_path)} target="_blank" rel="noopener" className="text-sm font-bold">Raseed / tasveer</a> : <span className="text-sm text-due-ink">Raseed nahi lagi</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={reviewExpense}>
                      <input type="hidden" name="sid" value={sid} /><input type="hidden" name="expense_id" value={e.id} /><input type="hidden" name="decision" value="approve" />
                      <SubmitButton className="btn btn-sm bg-paid hover:bg-paid-ink">Approve</SubmitButton>
                    </form>
                    <form action={reviewExpense} className="flex gap-2">
                      <input type="hidden" name="sid" value={sid} /><input type="hidden" name="expense_id" value={e.id} /><input type="hidden" name="decision" value="reject" />
                      <input name="reason" className="input py-1.5 text-sm" placeholder="Wajah" aria-label="Reject ki wajah" />
                      <SubmitButton className="btn-outline btn-sm">Reject</SubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Naya kharcha darj karein">
        <form action={addExpense} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="sid" value={sid} />
          <div><label className="label" htmlFor="amount">Amount (Rs) *</label><input id="amount" name="amount" type="number" min="1" className="input" required /></div>
          <div><label className="label" htmlFor="spent_on">Tareekh</label><input id="spent_on" name="spent_on" type="date" defaultValue={todayPK()} className="input" /></div>
          <div>
            <label className="label" htmlFor="category">Kis cheez par</label>
            <select id="category" name="category" className="input">{expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </div>
          <div className="md:col-span-2"><label className="label" htmlFor="description">Tafseel *</label><input id="description" name="description" className="input" required placeholder="October: 2 guards ki tankhwah" /></div>
          <div>
            <label className="label" htmlFor="area">Kahan</label>
            <select id="area" name="area" className="input">
              <option value="|">Poori society</option>
              {blocks.map((b) => (
                <optgroup key={b} label={b ? `Block ${b}` : 'Galiyan'}>
                  {b && <option value={`${b}|`}>Block {b}</option>}
                  {((pairs ?? []) as any[]).filter((p) => p.block === b).map((p) => p.street).sort(natural).map((s: string) => <option key={s} value={`${b}|${s}`}>{b ? `${b} — ` : ''}Gali {s}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div><label className="label" htmlFor="vendor">Dukaan / mistri</label><input id="vendor" name="vendor" className="input" /></div>
          <div className="md:col-span-2"><label className="label" htmlFor="receipt">Raseed (tasveer ya PDF)</label><input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" className="input" /></div>
          <div className="md:col-span-3"><SubmitButton>Hisaab mein shamil karein</SubmitButton></div>
        </form>
      </Section>

      <Section title="Darj shuda kharcha">
        <table className="table">
          <thead><tr><th>Tareekh</th><th>Tafseel</th><th>Kahan</th><th>Amount</th><th>Raseed</th><th>Status</th></tr></thead>
          <tbody>
            {((recent ?? []) as any[]).map((e) => (
              <tr key={e.id}>
                <td>{fmtDate(e.spent_on)}</td>
                <td>{e.description}<div className="muted">{expenseLabel(e.category)}{e.issue ? ` · ${e.issue.ref_no}` : ''}</div></td>
                <td>{galiLabel(e.block, e.street)}</td>
                <td className="font-bold">{rs(e.amount)}</td>
                <td>{e.receipt_path && signed.get(e.receipt_path) ? <a href={signed.get(e.receipt_path)} target="_blank" rel="noopener">Dekhein</a> : <span className="text-due-ink">Nahi</span>}</td>
                <td>{e.status === 'approved' ? <span className="badge bg-paid-soft text-paid-ink">Approved</span> : <span className="badge bg-due-soft text-due-ink">Rejected</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
