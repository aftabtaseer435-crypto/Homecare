import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import { StatusBadge } from '@/components/ui';
import WaButton from '@/components/WaButton';
import { fetchAll } from '@/lib/fetchAll';
import { displayPhone } from '@/lib/phone';
import { daysBetween, fmtDate, houseLabel, rs, todayPK } from '@/lib/format';
import { appUrl, reminderText, waSend } from '@/lib/messages';
import { natural } from '@/lib/societyData';
import { logManualMessage } from '../actions';

/**
 * Manual WhatsApp reminders: list of owners who should get a reminder,
 * each with a pre-written message. Admin taps → WhatsApp opens → Send.
 */
export default async function Reminders({ params, searchParams }: { params: { sid: string }; searchParams: { tab?: string; street?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid);
  const sid = params.sid;
  const today = todayPK();
  const tab = searchParams.tab === 'overdue' ? 'overdue' : 'upcoming';

  const { data: society } = await supabase.from('societies').select('name, reminder_offsets').eq('id', sid).single();
  const before = Math.max(3, ...((society?.reminder_offsets ?? [-3]) as number[]).filter((n) => n < 0).map((n) => -n));
  const plusDays = (n: number) => new Date(Date.parse(today) + n * 86_400_000).toISOString().slice(0, 10);

  const dues = await fetchAll<any>((from, to) => {
    let q = supabase
      .from('fund_dues')
      .select('id, house_id, amount_due, paid_amount, due_date, period, status, plan:fund_plans(name), house:houses(id, block, street, house_no)')
      .eq('society_id', sid)
      .in('status', ['unpaid', 'partial']);
    q = tab === 'upcoming' ? q.gte('due_date', today).lte('due_date', plusDays(before)) : q.lt('due_date', today);
    return q.order('id').range(from, to);
  });

  // verified owners who accept WhatsApp
  const houseIds = Array.from(new Set(dues.map((d) => d.house_id)));
  const owners = new Map<string, any[]>();
  for (let i = 0; i < houseIds.length; i += 300) {
    const { data } = await supabase
      .from('house_owners')
      .select('house_id, owner_name, owner_phone, whatsapp_opt_in')
      .in('house_id', houseIds.slice(i, i + 300))
      .eq('status', 'verified');
    for (const o of data ?? []) {
      if (!o.whatsapp_opt_in) continue;
      owners.set(o.house_id, [...(owners.get(o.house_id) ?? []), o]);
    }
  }

  // last reminder sent per due
  const lastSent = new Map<string, string>();
  const dueIds = dues.map((d) => d.id);
  for (let i = 0; i < dueIds.length; i += 300) {
    const { data } = await supabase
      .from('messages_log')
      .select('fund_due_id, created_at')
      .in('fund_due_id', dueIds.slice(i, i + 300))
      .eq('kind', 'reminder')
      .order('created_at', { ascending: false });
    for (const m of data ?? []) if (!lastSent.has(m.fund_due_id)) lastSent.set(m.fund_due_id, m.created_at);
  }

  let rows = dues
    .flatMap((d) => (owners.get(d.house_id) ?? []).map((o) => ({ d, o })))
    .sort((a, b) => natural(a.d.house.block, b.d.house.block) || natural(a.d.house.street, b.d.house.street) || natural(a.d.house.house_no, b.d.house.house_no));
  if (searchParams.street) rows = rows.filter((r) => r.d.house.street === searchParams.street);
  const noOwner = dues.filter((d) => !owners.has(d.house_id)).length;
  const pending = rows.filter((r) => !lastSent.has(r.d.id)).length;

  return (
    <div className="space-y-4">
      <div className="card text-sm">
        <b>Kaise kaam karta hai:</b> neeche har owner ke saamne <b>WhatsApp</b> button hai. Dabane se aap ke apne WhatsApp mein message
        pehle se likha hua khulega — bas <b>Send</b> dabayein. Button grey ho jayega taake pata rahe kis ko bhej diya.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="?tab=upcoming" className={`badge px-3 py-1 no-underline ${tab === 'upcoming' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Agle {before} din mein due</Link>
        <Link href="?tab=overdue" className={`badge px-3 py-1 no-underline ${tab === 'overdue' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Overdue</Link>
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="tab" value={tab} />
          <input name="street" defaultValue={searchParams.street} placeholder="Gali" className="input w-24" />
          <button className="btn-outline">Filter</button>
        </form>
      </div>

      <div className="card">
        <p className="muted mb-3">
          {rows.length} messages · {pending} abhi tak nahi bheje
          {noOwner > 0 && <> · {noOwner} ghar ka owner/number record mein nahi (<Link href={`/s/${sid}/owners`}>add karein</Link>)</>}
        </p>
        {rows.length === 0 ? (
          <p className="muted">Is waqt kisi ko reminder bhejne ki zaroorat nahi.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Ghar</th><th>Owner</th><th>Fund</th><th>Baqi</th><th>Due</th><th></th></tr></thead>
            <tbody>
              {rows.slice(0, 1000).map(({ d, o }) => {
                const balance = Number(d.amount_due) - Number(d.paid_amount);
                const offset = daysBetween(d.due_date, today);
                const text = reminderText({
                  name: o.owner_name, society: society?.name ?? '', fund: `${d.plan?.name} ${d.period}`, amount: balance,
                  house: d.house, dueDate: d.due_date, overdue: offset > 0, payLink: appUrl(`/my/houses/${d.house_id}`),
                });
                const sent = lastSent.get(d.id);
                return (
                  <tr key={`${d.id}-${o.owner_phone}`}>
                    <td>{houseLabel(d.house)}</td>
                    <td>{o.owner_name}<div className="muted">{displayPhone(o.owner_phone)}</div></td>
                    <td>{d.plan?.name} {d.period} <StatusBadge status={d.status} /></td>
                    <td className="font-semibold">{rs(balance)}</td>
                    <td>{fmtDate(d.due_date)}<div className="muted">{offset > 0 ? `${offset} din late` : offset === 0 ? 'aaj' : `${-offset} din baqi`}</div></td>
                    <td>
                      <WaButton
                        href={waSend(o.owner_phone, text)}
                        sentLabel={sent ? `Bheja ${fmtDate(sent)} · dobara` : null}
                        onSent={logManualMessage.bind(null, { sid, houseId: d.house_id, dueId: d.id, phone: o.owner_phone, kind: 'reminder', offset })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
