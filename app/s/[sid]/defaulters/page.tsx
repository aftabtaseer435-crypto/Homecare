import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import { StatusBadge } from '@/components/ui';
import { displayPhone } from '@/lib/phone';
import { fmtDate, houseLabel, rs } from '@/lib/format';
import { getDefaulters } from '@/lib/defaulters';

export default async function Defaulters({ params, searchParams }: { params: { sid: string }; searchParams: { all?: string; street?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid);
  const onlyOverdue = searchParams.all !== '1';
  let list = await getDefaulters(supabase, params.sid, onlyOverdue);
  if (searchParams.street) list = list.filter((r) => r.house.street === searchParams.street);
  const total = list.reduce((s, r) => s + r.balance, 0);

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>{onlyOverdue ? 'Overdue (due date guzar chuki)' : 'Saare baqi dues'} — {list.length}</h2>
          <p className="muted">Total baqi: {rs(total)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2">
            {!onlyOverdue && <input type="hidden" name="all" value="1" />}
            <input name="street" defaultValue={searchParams.street} placeholder="Gali" className="input w-24" />
            <button className="btn-outline">Filter</button>
          </form>
          <Link href={onlyOverdue ? '?all=1' : '?'} className="btn-outline">{onlyOverdue ? 'Upcoming bhi dikhayein' : 'Sirf overdue'}</Link>
          <a href={`/s/${params.sid}/defaulters/export${onlyOverdue ? '' : '?all=1'}`} className="btn">CSV / Excel download</a>
        </div>
      </div>
      <table className="table">
        <thead><tr><th>Ghar</th><th>Owner</th><th>Mobile</th><th>Fund</th><th>Due date</th><th>Baqi</th><th>Status</th></tr></thead>
        <tbody>
          {list.slice(0, 1000).map((r) => (
            <tr key={r.id}>
              <td><Link href={`/s/${params.sid}/payments?house=${r.house.id}`}>{houseLabel(r.house)}</Link></td>
              <td>{r.owner?.owner_name ?? <span className="text-ink-mute">—</span>}</td>
              <td>{displayPhone(r.owner?.owner_phone)}</td>
              <td>{r.plan?.name} {r.period}</td>
              <td>{fmtDate(r.due_date)}</td>
              <td className="font-semibold">{rs(r.balance)}</td>
              <td><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
