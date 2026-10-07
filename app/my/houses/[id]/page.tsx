import NoticeBoard from '@/components/NoticeBoard';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader, StatusBadge } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, houseLabel, rs } from '@/lib/format';
import { submitPaymentProof } from './actions';

export default async function MyHouse({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireUser(`/my/houses/${params.id}`);

  const { data: house } = await supabase
    .from('houses')
    .select('id, block, street, house_no, society_id, society:societies(id, name)')
    .eq('id', params.id)
    .single();
  if (!house) notFound();
  const { data: owns } = await supabase.rpc('owns_house', { hid: params.id });
  if (!owns) notFound();

  const society = ((house as any).society ?? { id: (house as any).society_id, name: 'Society' }) as { id: string; name: string };
  const [{ data: dues }, { data: payments }] = await Promise.all([
    supabase
      .from('fund_dues')
      .select('id, period, amount_due, paid_amount, due_date, status, plan:fund_plans(name)')
      .eq('house_id', params.id)
      .order('due_date', { ascending: false }),
    supabase
      .from('payments')
      .select('id, amount, method, status, receipt_no, paid_at, due:fund_dues(period, plan:fund_plans(name))')
      .eq('house_id', params.id)
      .order('paid_at', { ascending: false }),
  ]);

  if (!dues) notFound();
  const open = dues.filter((d) => d.status === 'unpaid' || d.status === 'partial');

  return (
    <div className="space-y-6">
      <PageHeader title={society.name} subtitle={houseLabel(house as any)} />
      <Flash searchParams={searchParams} />
      <NoticeBoard societyIds={[society.id]} next={`/my/houses/${params.id}`} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3">Fund status</h2>
          {dues.length === 0 ? (
            <p className="muted">Abhi koi fund due nahi.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Fund</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {dues.map((d: any) => (
                  <tr key={d.id}>
                    <td>{d.plan?.name}<div className="muted">{d.period}</div></td>
                    <td>{rs(d.amount_due)}{Number(d.paid_amount) > 0 && d.status !== 'paid' && <div className="muted">jama: {rs(d.paid_amount)}</div>}</td>
                    <td>{fmtDate(d.due_date)}</td>
                    <td><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 className="mb-1">Payment jama karwayein</h2>
          <p className="muted mb-3">
            JazzCash / Easypaisa / bank transfer ke baad screenshot upload karein. Society admin verify karega aur WhatsApp par receipt aayegi.
            Cash society office ya collector ko dein.
          </p>
          {open.length === 0 ? (
            <p className="text-sm text-paid-ink">Koi baqi payment nahi. Shukriya!</p>
          ) : (
            <form action={submitPaymentProof} className="space-y-3">
              <input type="hidden" name="house_id" value={house.id} />
              <div>
                <label className="label">Kaun sa due</label>
                <select name="fund_due_id" className="input" required>
                  {open.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.plan?.name} {d.period} — baqi {rs(Number(d.amount_due) - Number(d.paid_amount))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount</label>
                  <input name="amount" type="number" min="1" className="input" required />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select name="method" className="input">
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="bank">Bank transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Transaction ID / reference</label>
                <input name="reference" className="input" />
              </div>
              <div>
                <label className="label">Screenshot</label>
                <input name="proof" type="file" accept="image/*,application/pdf" className="input" required />
              </div>
              <SubmitButton>Submit</SubmitButton>
            </form>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3">Payment history</h2>
        {(payments ?? []).length === 0 ? (
          <p className="muted">Abhi koi payment nahi.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Fund</th><th>Amount</th><th>Method</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>
              {(payments ?? []).map((p: any) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.paid_at)}</td>
                  <td>{p.due?.plan?.name} {p.due?.period}</td>
                  <td>{rs(p.amount)}</td>
                  <td className="capitalize">{p.method}</td>
                  <td>{p.status === 'verified' ? <span className="badge bg-paid-soft text-paid-ink">Verified</span> : p.status === 'pending' ? <span className="badge bg-plate-soft text-plate-ink">Pending</span> : <span className="badge bg-due-soft text-due-ink">Rejected</span>}</td>
                  <td>{p.receipt_no ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    </div>
  );
}
