import 'server-only';
import { fetchAll } from '@/lib/fetchAll';
import { todayPK } from '@/lib/format';
import { natural } from '@/lib/societyData';

export async function getDefaulters(supabase: any, sid: string, onlyOverdue: boolean) {
  const rows = await fetchAll<any>((from, to) => {
    let q = supabase
      .from('fund_dues')
      .select('id, period, amount_due, paid_amount, due_date, status, house:houses(id, block, street, house_no), plan:fund_plans(name)')
      .eq('society_id', sid)
      .in('status', ['unpaid', 'partial']);
    if (onlyOverdue) q = q.lt('due_date', todayPK());
    return q.order('id').range(from, to);
  });
  const houseIds = Array.from(new Set(rows.map((r) => r.house.id)));
  const owners = new Map<string, any>();
  for (let i = 0; i < houseIds.length; i += 300) {
    const { data } = await supabase.from('house_owners').select('house_id, owner_name, owner_phone').in('house_id', houseIds.slice(i, i + 300)).eq('status', 'verified');
    for (const o of data ?? []) owners.set(o.house_id, o);
  }
  return rows
    .map((r) => ({ ...r, owner: owners.get(r.house.id) ?? null, balance: Number(r.amount_due) - Number(r.paid_amount) }))
    .sort((a, b) => natural(a.house.block, b.house.block) || natural(a.house.street, b.house.street) || natural(a.house.house_no, b.house.house_no));
}

