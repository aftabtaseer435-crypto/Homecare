import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';
import { fmtDate, houseLabel } from '@/lib/format';
import { fetchAll } from '@/lib/fetchAll';
import { addOwner, removeOwner, setOwnerStatus } from '../actions';

export default async function Owners({
  params,
  searchParams,
}: {
  params: { sid: string };
  searchParams: { q?: string; ok?: string; err?: string };
}) {
  const { supabase, role } = await requireSocietyStaff(params.sid);
  const owners = await fetchAll<any>((from, to) =>
    supabase
      .from('house_owners')
      .select('id, owner_name, owner_phone, status, relation, user_id, created_at, house:houses!inner(id, society_id, block, street, house_no)')
      .eq('house.society_id', params.sid)
      .order('created_at', { ascending: false })
      .range(from, to),
  );
  const pending = owners.filter((o) => o.status === 'pending');
  const q = (searchParams.q ?? '').toLowerCase().trim();
  const verified = owners
    .filter((o) => o.status === 'verified')
    .filter((o) => !q || o.owner_name.toLowerCase().includes(q) || o.owner_phone.includes(q) || `${o.house.street}-${o.house.house_no}`.includes(q));

  // houses with more than one claim conflict
  const claimCount = new Map<string, number>();
  for (const o of owners) if (o.status !== 'rejected' && o.relation === 'owner') claimCount.set(o.house.id, (claimCount.get(o.house.id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />

      <section className="card">
        <h2 className="mb-3">Approval ke liye ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="muted">Koi pending request nahi.</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {o.owner_name}
                    {o.relation === 'tenant' ? <span className="badge ml-2 bg-service-soft text-service-ink">Kirayedar</span> : <span className="badge ml-2 bg-brand-50 text-brand-800">Malik</span>}
                  </div>
                  <div className="text-sm text-ink-mute">{houseLabel(o.house)} · {displayPhone(o.owner_phone)} · {fmtDate(o.created_at)}</div>
                  {o.relation === 'owner' && (claimCount.get(o.house.id) ?? 0) > 1 && <div className="mt-1 text-xs font-semibold text-due-ink">Is ghar ke aur claims bhi hain — tasdeeq kar ke approve karein</div>}
                </div>
                <div className="flex gap-2">
                  <form action={setOwnerStatus}>
                    <input type="hidden" name="sid" value={params.sid} />
                    <input type="hidden" name="owner_id" value={o.id} />
                    <input type="hidden" name="status" value="verified" />
                    <SubmitButton className="btn btn-sm">Approve</SubmitButton>
                  </form>
                  <form action={setOwnerStatus}>
                    <input type="hidden" name="sid" value={params.sid} />
                    <input type="hidden" name="owner_id" value={o.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <SubmitButton className="btn-outline btn-sm">Reject</SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={addOwner} className="card grid gap-3 md:grid-cols-6">
        <h2 className="md:col-span-6">Owner khud add karein</h2>
        <p className="muted md:col-span-6">Jo owner app use nahi karta uska record bhi bana sakte hain — WhatsApp reminders isi number par jayenge.</p>
        <input type="hidden" name="sid" value={params.sid} />
        <div><label className="label">Block</label><input name="block" className="input" /></div>
        <div><label className="label">Gali *</label><input name="street" className="input" required /></div>
        <div><label className="label">Ghar *</label><input name="house_no" className="input" required /></div>
        <div><label className="label">Owner naam *</label><input name="owner_name" className="input" required /></div>
        <div><label className="label">Mobile *</label><input name="owner_phone" className="input" required placeholder="0300..." /></div>
        <div className="flex items-end"><SubmitButton>Add</SubmitButton></div>
        <label className="flex items-center gap-2 text-sm md:col-span-6">
          <input type="checkbox" name="whatsapp_opt_in" defaultChecked /> Owner ne WhatsApp reminders ki ijazat di hai
        </label>
      </form>

      <section className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2>Verified residents ({verified.length})</h2>
          <form className="flex items-end gap-2">
            <div><label htmlFor="o-q" className="mb-1 block text-xs font-semibold text-ink-soft">Naam, number ya gali-ghar</label><input id="o-q" name="q" defaultValue={searchParams.q} className="input" placeholder="1-12" /></div>
            <button className="btn-outline">Search</button>
          </form>
        </div>
        <table className="table">
          <thead><tr><th>Owner</th><th>Mobile</th><th>Ghar</th><th>App account</th><th></th></tr></thead>
          <tbody>
            {verified.slice(0, 300).map((o) => (
              <tr key={o.id}>
                <td>{o.owner_name}{o.relation === 'tenant' ? <span className="badge ml-2 bg-service-soft text-service-ink">Kirayedar</span> : <span className="badge ml-2 bg-brand-50 text-brand-800">Malik</span>}</td>
                <td>{displayPhone(o.owner_phone)}</td>
                <td>{houseLabel(o.house)}</td>
                <td>{o.user_id ? <span className="badge bg-paid-soft text-paid-ink">Linked</span> : <span className="badge bg-canvas text-ink-soft">Not yet</span>}</td>
                <td>
                  {role === 'admin' && (
                    <form action={removeOwner}>
                      <input type="hidden" name="sid" value={params.sid} />
                      <input type="hidden" name="owner_id" value={o.id} />
                      <SubmitButton className="text-xs text-due" confirm="Owner remove karein?">Remove</SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {verified.length > 300 && <p className="muted mt-2">Pehle 300 dikhaye gaye — search use karein.</p>}
      </section>
    </div>
  );
}
