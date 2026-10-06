import { requireSocietyStaff } from '@/lib/auth';
import { Flash, StatusBadge } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { createAdminClient } from '@/lib/supabase/admin';
import { fmtDate, houseLabel, rs } from '@/lib/format';
import { logManualMessage, recordPayment, reviewPayment } from '../actions';
import WaButton from '@/components/WaButton';
import { receiptText, waSend } from '@/lib/messages';

export default async function Payments({
  params,
  searchParams,
}: {
  params: { sid: string };
  searchParams: { house?: string; block?: string; street?: string; house_no?: string; receipt?: string; ok?: string; err?: string };
}) {
  const { supabase } = await requireSocietyStaff(params.sid);
  const sid = params.sid;

  // find a house either by id or by block/gali/ghar
  let house: any = null;
  if (searchParams.house) {
    const { data } = await supabase.from('houses').select('id, block, street, house_no').eq('id', searchParams.house).eq('society_id', sid).maybeSingle();
    house = data;
  } else if (searchParams.street && searchParams.house_no) {
    const { data } = await supabase
      .from('houses')
      .select('id, block, street, house_no')
      .eq('society_id', sid)
      .eq('block', searchParams.block ?? '')
      .eq('street', searchParams.street)
      .eq('house_no', searchParams.house_no)
      .maybeSingle();
    house = data;
  }

  const [houseDues, owner, pending, recent] = await Promise.all([
    house
      ? supabase.from('fund_dues').select('id, period, amount_due, paid_amount, due_date, status, plan:fund_plans(name)').eq('house_id', house.id).order('due_date', { ascending: false }).then((r) => r.data ?? [])
      : Promise.resolve([] as any[]),
    house
      ? supabase.from('house_owners').select('owner_name, owner_phone').eq('house_id', house.id).eq('status', 'verified').maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
    supabase
      .from('payments')
      .select('id, amount, method, reference, proof_path, paid_at, house:houses(block, street, house_no), due:fund_dues(period, amount_due, plan:fund_plans(name))')
      .eq('society_id', sid)
      .eq('status', 'pending')
      .order('paid_at')
      .then((r) => r.data ?? []),
    supabase
      .from('payments')
      .select('id, amount, method, status, receipt_no, paid_at, house:houses(block, street, house_no), due:fund_dues(period, plan:fund_plans(name))')
      .eq('society_id', sid)
      .neq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50)
      .then((r) => r.data ?? []),
  ]);

  // signed links for payment screenshots (private bucket)
  const admin = createAdminClient();
  const proofUrls = new Map<string, string>();
  for (const p of pending as any[]) {
    if (!p.proof_path) continue;
    const { data } = await admin.storage.from('private-docs').createSignedUrl(p.proof_path, 3600);
    if (data?.signedUrl) proofUrls.set(p.id, data.signedUrl);
  }

  // just-saved payment offer the WhatsApp receipt from the admin's own WhatsApp
  let receipt: { text: string; owners: { owner_name: string; owner_phone: string }[]; houseId: string; dueId: string; receiptNo: string } | null = null;
  if (searchParams.receipt) {
    const { data: p } = await supabase
      .from('payments')
      .select('id, amount, receipt_no, house_id, fund_due_id, house:houses(block, street, house_no), due:fund_dues(period, plan:fund_plans(name))')
      .eq('id', searchParams.receipt)
      .eq('society_id', sid)
      .eq('status', 'verified')
      .maybeSingle();
    if (p) {
      const pay = p as any;
      const [{ data: soc }, { data: os }] = await Promise.all([
        supabase.from('societies').select('name').eq('id', sid).single(),
        supabase.from('house_owners').select('owner_name, owner_phone').eq('house_id', pay.house_id).eq('status', 'verified').eq('whatsapp_opt_in', true),
      ]);
      receipt = {
        owners: os ?? [], houseId: pay.house_id, dueId: pay.fund_due_id, receiptNo: pay.receipt_no,
        text: receiptText({ name: (os ?? [])[0]?.owner_name ?? '', society: soc?.name ?? '', amount: pay.amount, house: pay.house, fund: `${pay.due.plan.name} ${pay.due.period}`, receiptNo: pay.receipt_no }),
      };
    }
  }

  const openDues = houseDues.filter((d: any) => d.status === 'unpaid' || d.status === 'partial');

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />

      {receipt && (
        <div className="card flex flex-wrap items-center gap-3 border-paid/30 bg-paid-soft">
          <div className="flex-1 text-sm">Receipt <b>{receipt.receiptNo}</b> — owner ko WhatsApp par bhejein:</div>
          {receipt.owners.length === 0 ? (
            <span className="muted">Is ghar ka owner number record mein nahi.</span>
          ) : (
            receipt.owners.map((o) => (
              <WaButton
                key={o.owner_phone}
                label={`Receipt bhejein — ${o.owner_name}`}
                href={waSend(o.owner_phone, receipt!.text.replace(/^Shukriya [^!]*!/, `Shukriya ${o.owner_name}!`))}
                onSent={logManualMessage.bind(null, { sid, houseId: receipt!.houseId, dueId: receipt!.dueId, phone: o.owner_phone, kind: 'receipt' })}
              />
            ))
          )}
        </div>
      )}

      {/* Record payment */}
      <section className="card space-y-4">
        <h2>Payment entry (cash / bank)</h2>
        <form className="flex flex-wrap items-end gap-2">
          <div><label className="label">Block</label><input name="block" defaultValue={house?.block ?? searchParams.block} className="input w-24" /></div>
          <div><label className="label">Gali</label><input name="street" defaultValue={house?.street ?? searchParams.street} className="input w-24" required /></div>
          <div><label className="label">Ghar</label><input name="house_no" defaultValue={house?.house_no ?? searchParams.house_no} className="input w-24" required /></div>
          <button className="btn-outline">Dhoondein</button>
        </form>

        {(searchParams.street || searchParams.house) && !house && <p className="text-sm text-due">Ghar nahi mila.</p>}

        {house && (
          <div className="rounded-lg border border-line p-4">
            <div className="mb-3 font-semibold">
              {houseLabel(house)} {owner && <span className="font-normal text-ink-mute">· {owner.owner_name}</span>}
            </div>
            <table className="table mb-4">
              <thead><tr><th>Fund</th><th>Amount</th><th>Jama</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {houseDues.map((d: any) => (
                  <tr key={d.id}>
                    <td>{d.plan?.name} {d.period}</td><td>{rs(d.amount_due)}</td><td>{rs(d.paid_amount)}</td><td>{fmtDate(d.due_date)}</td><td><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {openDues.length === 0 ? (
              <p className="text-sm text-paid-ink">Sab dues clear hain.</p>
            ) : (
              <form action={recordPayment} className="grid gap-3 md:grid-cols-5">
                <input type="hidden" name="sid" value={sid} />
                <div className="md:col-span-2">
                  <label className="label">Due</label>
                  <select name="fund_due_id" className="input">
                    {openDues.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.plan?.name} {d.period} — baqi {rs(Number(d.amount_due) - Number(d.paid_amount))}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount</label>
                  <input name="amount" type="number" min="1" defaultValue={Number(openDues[0].amount_due) - Number(openDues[0].paid_amount)} className="input" required />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select name="method" className="input">
                    <option value="cash">Cash</option><option value="bank">Bank</option><option value="jazzcash">JazzCash</option><option value="easypaisa">Easypaisa</option>
                  </select>
                </div>
                <div><label className="label">Reference</label><input name="reference" className="input" /></div>
                <div className="md:col-span-5"><SubmitButton>Save + WhatsApp receipt</SubmitButton></div>
              </form>
            )}
          </div>
        )}
      </section>

      {/* Pending proofs */}
      <section className="card">
        <h2 className="mb-3">Residents ki bheji hui payments — verify karein ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="muted">Koi pending payment nahi.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Ghar</th><th>Fund</th><th>Amount</th><th>Method / Ref</th><th>Proof</th><th></th></tr></thead>
            <tbody>
              {(pending as any[]).map((p) => (
                <tr key={p.id}>
                  <td>{houseLabel(p.house)}<div className="muted">{fmtDate(p.paid_at)}</div></td>
                  <td>{p.due?.plan?.name} {p.due?.period}</td>
                  <td>{rs(p.amount)}</td>
                  <td className="capitalize">{p.method}<div className="muted">{p.reference}</div></td>
                  <td>{proofUrls.get(p.id) ? <a href={proofUrls.get(p.id)} target="_blank">Screenshot dekhein</a> : '—'}</td>
                  <td className="flex gap-2">
                    <form action={reviewPayment}>
                      <input type="hidden" name="sid" value={sid} /><input type="hidden" name="payment_id" value={p.id} /><input type="hidden" name="status" value="verified" />
                      <SubmitButton className="btn btn-sm">Verify</SubmitButton>
                    </form>
                    <form action={reviewPayment}>
                      <input type="hidden" name="sid" value={sid} /><input type="hidden" name="payment_id" value={p.id} /><input type="hidden" name="status" value="rejected" />
                      <SubmitButton className="btn-outline btn-sm">Reject</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Recent */}
      <section className="card">
        <h2 className="mb-3">Recent payments</h2>
        <table className="table">
          <thead><tr><th>Date</th><th>Ghar</th><th>Fund</th><th>Amount</th><th>Method</th><th>Status</th><th>Receipt</th></tr></thead>
          <tbody>
            {(recent as any[]).map((p) => (
              <tr key={p.id}>
                <td>{fmtDate(p.paid_at)}</td>
                <td>{houseLabel(p.house)}</td>
                <td>{p.due?.plan?.name} {p.due?.period}</td>
                <td>{rs(p.amount)}</td>
                <td className="capitalize">{p.method}</td>
                <td>{p.status}</td>
                <td>{p.receipt_no ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
