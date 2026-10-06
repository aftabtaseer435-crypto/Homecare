import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import { Empty, Flash, Stat } from '@/components/ui';
import { dueStatusStyle, fmtDate, rs } from '@/lib/format';
import { getDues, getHouses, getPeriods, getPlans, groupHouses } from '@/lib/societyData';

export default async function SocietyOverview({
  params,
  searchParams,
}: {
  params: { sid: string };
  searchParams: { plan?: string; period?: string; ok?: string; err?: string };
}) {
  const { supabase } = await requireSocietyStaff(params.sid);
  const base = `/s/${params.sid}`;
  const plans = await getPlans(supabase, params.sid);
  const houses = await getHouses(supabase, params.sid);

  if (houses.length === 0)
    return <Empty href={`${base}/houses`} cta="Ghar add karein">Pehla qadam: society ke blocks, galiyan aur ghar add karein.</Empty>;
  if (plans.length === 0)
    return <Empty href={`${base}/funds`} cta="Fund plan banayein">{houses.length} ghar add ho gaye. Ab development fund plan banayein (amount, due date).</Empty>;

  const plan = plans.find((p) => p.id === searchParams.plan) ?? plans.find((p) => p.active) ?? plans[0];
  const periods = await getPeriods(supabase, plan.id);
  const period = searchParams.period ?? periods[0]?.period;
  const dues = period ? await getDues(supabase, plan.id, period) : [];
  const byHouse = new Map(dues.map((d) => [d.house_id, d]));

  const paid = dues.filter((d) => d.status === 'paid').length;
  const unpaid = dues.filter((d) => d.status === 'unpaid' || d.status === 'partial').length;
  const collected = dues.reduce((s, d) => s + Number(d.paid_amount), 0);
  const target = dues.filter((d) => d.status !== 'exempt').reduce((s, d) => s + Number(d.amount_due), 0);
  const [{ count: pendingOwners }, { count: pendingPayments }] = await Promise.all([
    supabase.from('house_owners').select('id, house:houses!inner(society_id)', { count: 'exact', head: true }).eq('status', 'pending').eq('house.society_id', params.sid),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('society_id', params.sid).eq('status', 'pending'),
  ]);

  const groups = groupHouses(houses);

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Fund plan</label>
          <select name="plan" defaultValue={plan.id} className="input">
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Period</label>
          <select name="period" defaultValue={period} className="input">
            {periods.map((p) => <option key={p.period} value={p.period}>{p.period} (due {fmtDate(p.due_date)})</option>)}
          </select>
        </div>
        <button className="btn-outline">Dekhein</button>
      </form>

      {!period ? (
        <Empty href={`${base}/funds`} cta="Dues generate karein">Is plan ke dues abhi generate nahi hue.</Empty>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Paid (green)" value={paid} tone="green" />
            <Stat label="Not paid (red)" value={unpaid} tone="red" />
            <Stat label="Collection" value={rs(collected)} hint={target ? `${Math.round((collected / target) * 100)}% of target` : undefined} />
            <Stat label="Target" value={rs(target)} />
          </div>

          {(pendingOwners || pendingPayments) ? (
            <div className="flex flex-wrap gap-3 text-sm">
              {!!pendingOwners && <Link href={`${base}/owners`} className="badge bg-plate-soft px-3 py-1.5 text-plate-ink no-underline">{pendingOwners} owner approval pending</Link>}
              {!!pendingPayments && <Link href={`${base}/payments`} className="badge bg-plate-soft px-3 py-1.5 text-plate-ink no-underline">{pendingPayments} payment verify karni hain</Link>}
            </div>
          ) : null}

          <div className="card">
            <div className="mb-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-soft">
              <Legend status="paid" /> <Legend status="unpaid" /> <Legend status="partial" /> <Legend status="exempt" /> <Legend status={null} />
            </div>
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.block}>
                  {g.block && <h2 className="mb-3 font-display">Block {g.block}</h2>}
                  <div className="space-y-2">
                    {g.streets.map((s) => (
                      <div key={s.street} className="flex items-start gap-3">
                        <div className="w-16 shrink-0 pt-1.5 text-xs font-semibold text-ink-mute">Gali {s.street}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.houses.map((h) => {
                            const d = byHouse.get(h.id);
                            const st = dueStatusStyle(d?.status);
                            return (
                              <Link
                                key={h.id}
                                href={`${base}/payments?house=${h.id}&plan=${plan.id}&period=${period}`}
                                title={`Gali ${h.street} Ghar ${h.house_no}: ${st.label}${d ? ` — ${rs(d.amount_due)}` : ''}`}
                                className={`${st.plate} h-8 no-underline transition-transform hover:-translate-y-0.5 hover:no-underline`}
                              >
                                {h.house_no}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Legend({ status }: { status: string | null }) {
  const s = dueStatusStyle(status);
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded-sm ${s.cls}`} /> {s.label}
    </span>
  );
}
