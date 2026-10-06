import { areaLabel, requireAgent } from '@/lib/agent';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, rs, todayPK } from '@/lib/format';
import { expenseCategories, expenseLabel, galiLabel } from '@/lib/welfare';
import { submitExpense } from '../actions';

const statusCls: Record<string, string> = {
  pending: 'bg-plate-soft text-plate-ink',
  approved: 'bg-paid-soft text-paid-ink',
  rejected: 'bg-due-soft text-due-ink',
};

export default async function AgentExpenses({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, areas } = await requireAgent(params.sid);
  const { data: mine } = await supabase
    .from('fund_expenses')
    .select('id, spent_on, amount, category, description, block, street, status, reject_reason')
    .eq('society_id', params.sid)
    .eq('submitted_by', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <div>
        <h1>Kharcha</h1>
        <p className="muted mt-1">Apne area mein fund se jo paisa laga, uski raseed ke sath yahan darj karein. Admin approve karega, phir har resident ko &quot;Fund ka hisaab&quot; mein nazar aayega.</p>
      </div>

      <form action={submitExpense} className="card grid gap-4 md:grid-cols-2">
        <input type="hidden" name="sid" value={params.sid} />
        <div>
          <label className="label" htmlFor="amount">Amount (Rs) *</label>
          <input id="amount" name="amount" type="number" min="1" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="spent_on">Tareekh</label>
          <input id="spent_on" name="spent_on" type="date" defaultValue={todayPK()} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="category">Kis cheez par</label>
          <select id="category" name="category" className="input">
            {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="area">Kahan</label>
          <select id="area" name="area" className="input">
            {areas.map((a) => <option key={`${a.block}|${a.street ?? ''}`} value={`${a.block}|${a.street ?? ''}`}>{areaLabel(a)}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="description">Tafseel *</label>
          <input id="description" name="description" className="input" required placeholder="Gali 7 ke liye 4 LED street lights" />
        </div>
        <div>
          <label className="label" htmlFor="vendor">Dukaan / mistri</label>
          <input id="vendor" name="vendor" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="receipt">Raseed ki tasveer</label>
          <input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" capture="environment" className="input" />
        </div>
        <div className="md:col-span-2"><SubmitButton>Approval ke liye bhejein</SubmitButton></div>
      </form>

      <section className="card">
        <h2 className="mb-3">Meri bheji hui entries</h2>
        {(mine ?? []).length === 0 ? (
          <p className="muted">Abhi koi entry nahi.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Tareekh</th><th>Tafseel</th><th>Kahan</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {(mine ?? []).map((e: any) => (
                <tr key={e.id}>
                  <td>{fmtDate(e.spent_on)}</td>
                  <td>{e.description}<div className="muted">{expenseLabel(e.category)}</div></td>
                  <td>{galiLabel(e.block, e.street)}</td>
                  <td className="font-bold">{rs(e.amount)}</td>
                  <td><span className={`badge ${statusCls[e.status]}`}>{e.status === 'pending' ? 'Approval baqi' : e.status === 'approved' ? 'Approved' : 'Rejected'}</span>{e.reject_reason && <div className="muted">{e.reject_reason}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
