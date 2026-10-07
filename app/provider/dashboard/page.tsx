import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Empty, Flash, Stat, Stars } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import OrderActions from '@/components/OrderActions';
import HoursBadge from '@/components/HoursBadge';
import AlertSetup from '@/components/AlertSetup';
import ProviderForm from '../ProviderForm';
import { deleteProviderProfile, setAvailability, updateProvider } from '../actions';
import { ago, fmtDate, rs } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { monthName, orderStatus } from '@/lib/orders';

export const metadata = { title: 'Provider dashboard' };

const statusText: Record<string, string> = {
  pending: 'Review mein — aap list mein "Naya" badge ke sath nazar aa rahe hain. Admin / chairman check kar ke verify karega.',
  verified: 'Verified — customers aap ko dekh aur order bhej sakte hain',
  suspended: 'Suspended — admin se rabta karein',
  rejected: 'Rejected — admin se rabta karein',
};

export default async function ProviderDashboard({ searchParams }: { searchParams: { tab?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/provider/dashboard');
  const { data: prov } = await supabase
    .from('providers')
    .select('*, provider_categories(category_id), provider_societies(society_id)')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!prov) redirect('/provider/register');

  const tab = searchParams.tab ?? 'orders';
  const [{ data: orders }, { data: months }, { data: reviews }, cats, socs] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, ref_no, details, address, when_note, customer_name, customer_phone, status, amount, created_at, accepted_at, done_at, customer_confirmed, cancelled_by, category:service_categories(name, icon)')
      .eq('provider_id', prov.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.rpc('provider_monthly_stats', { pid: prov.id, months: 6 }),
    supabase.from('reviews').select('id, stars, comment, created_at').eq('provider_id', prov.id).order('created_at', { ascending: false }).limit(10),
    tab === 'profile' ? supabase.from('service_categories').select('id, name, grp, icon').eq('active', true).order('sort').then((r) => r.data ?? []) : Promise.resolve([]),
    tab === 'profile' ? supabase.from('societies').select('id, name, city').eq('status', 'active').order('name').then((r) => r.data ?? []) : Promise.resolve([]),
  ]);
  const list = (orders ?? []) as any[];
  const fresh = list.filter((o) => o.status === 'new');
  const working = list.filter((o) => o.status === 'accepted');
  const past = list.filter((o) => o.status === 'done' || o.status === 'cancelled');
  const m = ((months ?? []) as any[])[0] ?? { calls: 0, whatsapp: 0, orders: 0, done: 0, earnings: 0 };

  const tabs = [
    ['orders', `Orders${fresh.length ? ` (${fresh.length} naye)` : ''}`],
    ['history', 'History aur hisaab'],
    ['profile', 'Profile aur auqaat'],
  ];

  const OrderCard = ({ o }: { o: any }) => (
    <li className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{o.customer_name ?? 'Customer'}</span>
            <span className={`badge ${orderStatus[o.status].cls}`}>{orderStatus[o.status].label}</span>
          </div>
          <div className="mt-0.5 text-xs text-ink-mute">{o.ref_no} · {ago(o.created_at)}{o.category ? ` · ${o.category.icon ?? ''} ${o.category.name}` : ''}</div>
        </div>
        {o.customer_phone && (
          <div className="flex gap-2">
            <a href={`tel:+${o.customer_phone}`} className="btn-outline btn-sm">📞 {displayPhone(o.customer_phone)}</a>
            <a href={`https://wa.me/${o.customer_phone}?text=${encodeURIComponent(`Assalam o Alaikum ${o.customer_name ?? ''}, aap ka order ${o.ref_no} mil gaya.`)}`} target="_blank" rel="noopener" className="btn-wa btn-sm">WhatsApp</a>
          </div>
        )}
      </div>
      <p className="mt-3 whitespace-pre-line rounded-xl bg-canvas p-3 text-sm">{o.details}</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
        {o.when_note && <span>🕒 {o.when_note}</span>}
        {o.address && <span>📍 {o.address}</span>}
      </div>
      <div className="mt-4 border-t border-line pt-4"><OrderActions o={o} side="provider" next="/provider/dashboard" /></div>
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Provider / dukaan dashboard</p>
          <h1 className="mt-1">{prov.display_name}</h1>
          <p className="muted mt-1">{statusText[prov.status]}</p>
          <div className="mt-2"><HoursBadge h={prov} available={prov.available} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={setAvailability}>
            <input type="hidden" name="available" value={(!prov.available).toString()} />
            <SubmitButton className={prov.available ? 'btn-outline' : 'btn'}>{prov.available ? 'Abhi busy hoon' : 'Wapas available'}</SubmitButton>
          </form>
          <Link href={`/providers/${prov.id}`} className="btn-ghost">Public profile ↗</Link>
        </div>
      </div>
      <Flash searchParams={searchParams} />
      <AlertSetup vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Is mahine calls" value={m.calls} />
        <Stat label="Is mahine WhatsApp" value={m.whatsapp} />
        <Stat label="Is mahine orders" value={m.orders} hint={`${m.done} mukammal`} />
        <Stat label="Is mahine kamai" value={rs(m.earnings)} tone="green" hint="Mukammal orders ke bill" />
        <Stat label="Rating" value={<Stars value={Number(prov.rating_avg)} count={prov.rating_count} />} />
      </div>

      <nav className="flex gap-2 overflow-x-auto" aria-label="Dashboard">
        {tabs.map(([id, label]) => (
          <Link key={id} href={`?tab=${id}`} aria-current={tab === id ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold no-underline hover:no-underline ${tab === id ? 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200' : 'bg-white text-ink-mute ring-1 ring-inset ring-line hover:text-ink'}`}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === 'orders' && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3">Naye orders ({fresh.length})</h2>
            {fresh.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-ink-mute">
                Abhi koi naya order nahi. {prov.status !== 'verified' ? 'Verification ke baad customers order bhej sakenge.' : 'Apni profile ka link customers ko WhatsApp karein taake woh yahan se order bhejein.'}
              </p>
            ) : <ul className="space-y-3">{fresh.map((o) => <OrderCard key={o.id} o={o} />)}</ul>}
          </section>
          {working.length > 0 && (
            <section>
              <h2 className="mb-3">Qubool kiye — jari ({working.length})</h2>
              <ul className="space-y-3">{working.map((o) => <OrderCard key={o.id} o={o} />)}</ul>
            </section>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-8">
          <section className="card overflow-hidden p-0 md:p-0">
            <h2 className="p-5 pb-3">Mahina-war hisaab</h2>
            <table className="table">
              <thead><tr><th>Mahina</th><th>Calls</th><th>WhatsApp</th><th>Profile views</th><th>Orders</th><th>Mukammal</th><th>Cancel</th><th>Kamai</th></tr></thead>
              <tbody>
                {((months ?? []) as any[]).map((r) => (
                  <tr key={r.month}>
                    <td className="font-semibold">{monthName(r.month)}</td>
                    <td>{r.calls}</td><td>{r.whatsapp}</td><td>{r.views}</td><td>{r.orders}</td>
                    <td className="text-paid-ink">{r.done}</td><td>{r.cancelled}</td><td className="font-semibold">{rs(r.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-3">Purane orders ({past.length})</h2>
            {past.length === 0 ? <Empty>Abhi koi mukammal ya cancel order nahi.</Empty> : (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                {past.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm">
                    <span className="font-semibold">{o.customer_name ?? 'Customer'}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-mute">{o.details}</span>
                    <span className="text-xs text-ink-mute">{o.ref_no} · {fmtDate(o.created_at)}</span>
                    {o.amount != null && <span className="font-semibold">{rs(o.amount)}</span>}
                    <span className={`badge ${orderStatus[o.status].cls}`}>{o.status === 'cancelled' ? `Cancel (${o.cancelled_by === 'customer' ? 'customer' : 'aap'})` : o.customer_confirmed ? 'Mukammal · customer ne confirm kiya' : 'Mukammal'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(reviews ?? []).length > 0 && (
            <section className="card">
              <h2 className="mb-3">Reviews</h2>
              <ul className="space-y-3 text-sm">
                {(reviews ?? []).map((r) => <li key={r.id}><Stars value={r.stars} /> <span className="text-ink-mute">· {fmtDate(r.created_at)}</span><div>{r.comment}</div></li>)}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-service/20 bg-service-soft p-4 text-sm text-service-ink">
            <span className="text-xl" aria-hidden="true">✏️</span>
            <div>
              <div className="font-semibold">Har cheez edit kar sakte hain — naam, number, photo, kaam, societies, auqaat, rates.</div>
              <div className="mt-0.5">Save karte hi profile admin / chairman ke paas review ke liye jayegi. Tab tak list mein &quot;Naya&quot; badge lagega, orders aate rahenge. Sirf &quot;Abhi busy hoon&quot; button se review nahi hota.</div>
            </div>
          </div>
          <ProviderForm action={updateProvider} categories={cats as any[]} societies={socs as any[]} initial={prov} isEdit />

          <section className="rounded-2xl border border-due/30 bg-white p-5">
            <h2 className="text-base text-due-ink">Profile delete karein</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Aap ki provider / dukaan profile, photo aur CNIC hamesha ke liye hat jayenge aur list mein nazar nahi aayenge. Jari orders cancel ho jayenge. Customers ki purani orders ki history unke paas rahegi. Aap ka login account aur kharidari ki history mojood rahegi.
            </p>
            <form action={deleteProviderProfile} className="mt-4 flex flex-wrap items-end gap-2">
              <div>
                <label className="label" htmlFor="confirm">Tasdeeq ke liye DELETE likhein</label>
                <input id="confirm" name="confirm" className="input w-44" autoComplete="off" required />
              </div>
              <SubmitButton className="btn-danger" confirm="Kya aap waqai apni provider profile hamesha ke liye delete karna chahte hain?">Profile delete karein</SubmitButton>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
