import { Phone, Star } from 'lucide-react';
import { IconWhatsApp } from '@/components/Icons';
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

export const metadata = { title: 'Mere orders' };

export default async function MyOrders({ searchParams }: { searchParams: { tab?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/my/orders');
  const [{ data: orders }, { data: contacts }] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, ref_no, details, status, amount, when_note, created_at, done_at, provider_name, provider:providers(id, display_name, phone, whatsapp), category:service_categories(slug, name, icon)')
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
  const doneProviders = Array.from(new Set(list.filter((o) => o.status === 'done' && o.provider).map((o) => o.provider.id)));
  const { data: reviewed } = doneProviders.length
    ? await supabase.from('reviews').select('provider_id').eq('user_id', user.id).in('provider_id', doneProviders)
    : { data: [] as any[] };
  const reviewedSet = new Set(((reviewed ?? []) as any[]).map((r) => r.provider_id));
  const needReview = list.filter((o) => o.status === 'done' && o.provider && !reviewedSet.has(o.provider.id));
  const needReviewOnce = Array.from(new Map(needReview.map((o) => [o.provider.id, o])).values());
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
          <h1 className="mt-1">Mere orders</h1>
          <p className="muted mt-1">Jo kuch mangwaya ya karwaya — sab ki history, kharch aur status.</p>
        </div>
        <Link href="/services/find" className="btn bg-service hover:bg-service-ink">+ Naya order</Link>
      </div>
      <Flash searchParams={searchParams} />
      {active.length > 0 && <AlertSetup vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} who="customer" />}

      {needReviewOnce.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-amber-500 ring-1 ring-amber-200" aria-hidden="true"><Star className="h-5 w-5" fill="currentColor" /></span>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-ink">{needReviewOnce.length} order ka review baqi hai</div>
            <div className="text-ink-soft">Aap ka review doosre ghar walon ko sahi dukaan chunne mein madad karta hai.</div>
          </div>
          <Link href={`/my/orders/${needReviewOnce[0].id}#review`} className="btn btn-sm">Review dein</Link>
        </div>
      )}

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
                <span className="inline-flex items-center gap-1.5">{c.kind === 'call' ? <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" /> : <IconWhatsApp className="h-4 w-4 text-wa" />}<b>{c.kind === 'call' ? 'Call' : 'WhatsApp'}</b> — {c.provider?.display_name ?? 'Provider'} · <span className="text-ink-mute">{ago(c.created_at)}</span></span>
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
                <ServiceThumb src={o.category ? serviceImage(o.category.slug) : null} slug={o.category?.slug} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/my/orders/${o.id}`} className="font-semibold text-ink">{o.provider?.display_name ?? o.provider_name ?? 'Provider'}</Link>
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
                    {o.status === 'done' && o.provider && (reviewedSet.has(o.provider.id)
                      ? <span className="inline-flex items-center gap-1 px-2 text-xs text-ink-mute"><Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" aria-hidden="true" /> Review diya</span>
                      : <Link href={`/my/orders/${o.id}#review`} className="btn btn-sm"><Star className="h-3.5 w-3.5" aria-hidden="true" /> Review dein</Link>)}
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
