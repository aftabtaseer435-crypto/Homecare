import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, rs, todayPK } from '@/lib/format';
import { getPlans } from '@/lib/societyData';
import { createPlan, generateDuesNow, saveReminderOffsets, togglePlan } from '../actions';

const FREQ: Record<string, string> = { monthly: 'Har mahine', quarterly: 'Har 3 mahine', yearly: 'Saal mein ek dafa', one_time: 'Sirf ek dafa' };

export default async function Funds({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const plans = await getPlans(supabase, params.sid);
  const { data: society } = await supabase.from('societies').select('reminder_offsets').eq('id', params.sid).single();

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />

      <section className="card">
        <h2 className="mb-3">Fund plans</h2>
        {plans.length === 0 ? (
          <p className="muted">Abhi koi plan nahi. Neeche banayein.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Naam</th><th>Amount / ghar</th><th>Frequency</th><th>Due date</th><th>Start</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td>{rs(p.amount)}</td>
                  <td>{FREQ[p.frequency]}</td>
                  <td>{p.due_day} tareekh</td>
                  <td>{fmtDate(p.start_date)}</td>
                  <td>{p.active ? <span className="badge bg-paid-soft text-paid">Active</span> : <span className="badge bg-canvas text-ink-soft">Band</span>}</td>
                  <td className="flex flex-wrap gap-2">
                    <form action={generateDuesNow} className="flex gap-1">
                      <input type="hidden" name="sid" value={params.sid} />
                      <input type="hidden" name="plan_id" value={p.id} />
                      <input type="date" name="ref_date" defaultValue={todayPK()} className="input w-36 py-1" />
                      <SubmitButton className="btn-outline btn-sm">Dues banayein</SubmitButton>
                    </form>
                    <form action={togglePlan}>
                      <input type="hidden" name="sid" value={params.sid} />
                      <input type="hidden" name="plan_id" value={p.id} />
                      <input type="hidden" name="active" value={(!p.active).toString()} />
                      <SubmitButton className="btn-outline btn-sm">{p.active ? 'Band karein' : 'Chalu karein'}</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted mt-3">Naye period ke dues roz subah automatic bante hain. &quot;Dues banayein&quot; se kisi bhi tareekh ka period khud bhi bana sakte hain (purane mahine ke liye bhi).</p>
      </section>

      <form action={createPlan} className="card grid gap-3 md:grid-cols-3">
        <h2 className="md:col-span-3">Naya fund plan</h2>
        <input type="hidden" name="sid" value={params.sid} />
        <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="Development Fund 2026" /></div>
        <div><label className="label">Amount per ghar (Rs) *</label><input name="amount" type="number" min="0" className="input" required /></div>
        <div>
          <label className="label">Frequency *</label>
          <select name="frequency" className="input">
            {Object.entries(FREQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="label">Har period mein due tareekh (1-28) *</label><input name="due_day" type="number" min="1" max="28" defaultValue={10} className="input" required /></div>
        <div><label className="label">Start date</label><input name="start_date" type="date" defaultValue={todayPK()} className="input" /></div>
        <div><label className="label">Late fee (optional)</label><input name="late_fee" type="number" min="0" className="input" /></div>
        <div className="md:col-span-3"><SubmitButton>Plan banayein</SubmitButton></div>
      </form>

      <form action={saveReminderOffsets} className="card space-y-3">
        <h2>WhatsApp reminder schedule</h2>
        <p className="muted">
          Due date ke hisaab se din. <b>-3</b> = 3 din pehle, <b>0</b> = due wale din, <b>3</b> = 3 din baad (overdue). Comma se alag karein.
          Payment hote hi reminders khud band ho jate hain.
        </p>
        <input type="hidden" name="sid" value={params.sid} />
        <input name="offsets" className="input max-w-xs" defaultValue={(society?.reminder_offsets ?? [-3, 0, 3, 7]).join(', ')} />
        <SubmitButton>Save</SubmitButton>
      </form>
    </div>
  );
}
