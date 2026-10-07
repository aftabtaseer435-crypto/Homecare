import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Empty, Flash, Stat } from '@/components/ui';
import OrderActions from '@/components/OrderActions';
import AlertSetup from '@/components/AlertSetup';
import ServiceThumb from '@/components/ServiceThumb';
import { fmtDate, rs } from '@/lib/format';
import { ago } from '@/lib/format';
import { orderStatus } from '@/lib/orders';
import { serviceImage } from '@/lib/serviceImages';

export const metadata = { title: 'Meri orders' };

export default async function MyOrders({ searchParams }: { searchParams: { tab?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/my/orders');
  const [{ data: orders }, { data: contacts }] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, ref_no, details, status, amount, when_note, created_at, done_at, provider:providers(id, display_name, phone, whatsapp), category:service_categories(slug, name, icon)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('contact_events')
      .select('id, kind, created_at, provider:providers(id, display_name)')
      .eq('user_id', user.id)
      .not('provider_id', 'is', null)
      .in('kind', ['call', 'whatsapp'])
      .order('created_at', { ascending: false })
      .limit(30),
  ]);
  const list = (orders ?? []) as any[];
  const monthStart = new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 7);
  const thisMonth = list.filter((o) => new Date(Date.parse(o.created_at) + 5 * 3600_000).toISOString().slice(0, 7) === monthStart);
  const spent = thisMonth.filter((o) => o.status === 'done').reduce((s, o) => s + Number(o.amount ?? 0), 0);
  const active = list.filter((o) => o.status === 'new' || o.status === 'accepted');
  const tab = searchParams.tab ?? (active.length ? 'active' : 'history');
  const shown = tab === 'active' ? active : tab === 'contacts' ? [] : list.filter((o) => o.status === 'done' || o.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Kharidar dashboard</p>
          <h1 className="mt-1">Meri orders</h1>
          <p className="muted mt-1">Jo kuch mangwaya ya karwaya — sab ki history, kharch aur status.</p>
        </div>
        <Link href="/services/find" className="btn bg-service hover:bg-service-ink">+ Naya order</Link>
      </div>
      <Flash searchParams={searchParams} />
      {active.length > 0 && <AlertSetup vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} who="customer" />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Is mahine orders" value={thisMonth.length} />
        <Stat label="Is mahine mukammal" value={thisMonth.filter((o) => o.status === 'done').length} tone="green" />
        <Stat label="Is mahine kharch" value={rs(spent)} hint="Jo raqam aap ne darj ki" />
        <Stat label="Abhi jari" value={active.length} tone={active.length ? 'red' : 'gray'} />
      </div>

      <nav className="flex gap-2 overflow-x-auto" aria-label="Orders">
        {[['active', `Jari (${active.length})`], ['history', 'History'], ['contacts', 'Call / WhatsApp record']].map(([id, label]) => (
          <Link key={id} href={`?tab=${id}`} aria-current={tab === id ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold no-underline hover:no-underline ${tab === id ? 'bg-service-soft text-service-ink ring-1 ring-inset ring-service/30' : 'bg-white text-ink-mute ring-1 ring-inset ring-line hover:text-ink'}`}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === 'contacts' ? (
        (contacts ?? []).length === 0 ? (
          <Empty>Abhi kisi provider ko call ya WhatsApp nahi kiya.</Empty>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {((contacts ?? []) as any[]).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span><b>{c.kind === 'call' ? '📞 Call' : 'WhatsApp'}</b> — {c.provider?.display_name ?? 'Provider'} · <span className="text-ink-mute">{ago(c.created_at)}</span></span>
                {c.provider && <Link href={`/providers/${c.provider.id}/order`} className="btn-outline btn-sm">Order bhejein</Link>}
              </li>
            ))}
          </ul>
        )
      ) : shown.length === 0 ? (
        <Empty href="/services/find" cta="Kuch mangwayein">{tab === 'active' ? 'Koi jari order nahi.' : 'Abhi koi purani order nahi.'}</Empty>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => (
            <li key={o.id} className="card">
              <div className="flex flex-wrap items-start gap-4">
                <ServiceThumb src={o.category ? serviceImage(o.category.slug) : null} icon={o.category?.icon ?? '🛍️'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/my/orders/${o.id}`} className="font-semibold text-ink">{o.provider?.display_name ?? 'Provider'}</Link>
                    <span className={`badge ${orderStatus[o.status].cls}`}>{orderStatus[o.status].label}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{o.details}</p>
                  <div className="mt-1 text-xs text-ink-mute">
                    {o.ref_no} · {fmtDate(o.created_at)}{o.category ? ` · ${o.category.name}` : ''}{o.amount != null ? ` · ${rs(o.amount)}` : ''}
                  </div>
                </div>
                {o.status === 'done' || o.status === 'cancelled' ? (
                  <div className="flex gap-2">
                    {o.provider && <Link href={`/providers/${o.provider.id}/order${o.category ? `?cat=${o.category.slug}` : ''}`} className="btn-outline btn-sm">Dobara order</Link>}
                    {o.status === 'done' && o.provider && <Link href={`/providers/${o.provider.id}#reviews`} className="btn-ghost btn-sm">Review</Link>}
                  </div>
                ) : (
                  <Link href={`/my/orders/${o.id}`} className="btn-outline btn-sm">Dekhein</Link>
                )}
              </div>
              {(o.status === 'new' || o.status === 'accepted') && (
                <div className="mt-4 border-t border-line pt-4"><OrderActions o={o} side="customer" next="/my/orders" /></div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
