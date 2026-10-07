import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Flash } from '@/components/ui';
import OrderActions from '@/components/OrderActions';
import AutoWhatsApp from '@/components/AutoWhatsApp';
import ContactButtons from '@/components/ContactButtons';
import { fmtPK, rs } from '@/lib/format';
import { orderStatus, orderWhatsAppText } from '@/lib/orders';

export const metadata = { title: 'Order' };

export default async function OrderDetail({ params, searchParams }: { params: { id: string }; searchParams: { sent?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser(`/my/orders/${params.id}`);
  const { data } = await supabase
    .from('service_orders')
    .select('*, provider:providers(id, display_name, phone, whatsapp, user_id), category:service_categories(slug, name, icon)')
    .eq('id', params.id)
    .maybeSingle();
  if (!data) notFound();
  const o = data as any;
  if (o.customer_id !== user.id) notFound();
  const waText = orderWhatsAppText({ ...o, category: o.category?.name });
  const waHref = `https://wa.me/${o.provider?.whatsapp || o.provider?.phone}?text=${encodeURIComponent(waText)}`;
  const steps = [
    ['Order gaya', o.created_at],
    ['Provider ne qubool kiya', o.accepted_at],
    ['Mukammal', o.done_at],
  ] as const;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/my/orders" className="text-sm font-medium">← Meri orders</Link>
      <Flash searchParams={searchParams} />
      {searchParams.sent && o.status === 'new' && <AutoWhatsApp href={waHref} onceKey={`order-wa-${o.id}`} />}

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow">{o.ref_no}{o.category ? ` · ${o.category.name}` : ''}</p>
            <h1 className="mt-1 text-xl">{o.provider?.display_name}</h1>
          </div>
          <span className={`badge ${orderStatus[o.status].cls}`}>{orderStatus[o.status].label}</span>
        </div>
        <p className="whitespace-pre-line rounded-xl bg-canvas p-4 text-sm text-ink">{o.details}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {o.when_note && <div><dt className="text-ink-mute">Kab</dt><dd>{o.when_note}</dd></div>}
          {o.address && <div><dt className="text-ink-mute">Pata</dt><dd>{o.address}</dd></div>}
          {o.amount != null && <div><dt className="text-ink-mute">Bill</dt><dd className="font-semibold">{rs(o.amount)}</dd></div>}
          {o.cancel_reason && <div><dt className="text-ink-mute">Cancel ki wajah</dt><dd>{o.cancel_reason}</dd></div>}
        </dl>

        {o.status !== 'cancelled' && (
          <ol className="grid grid-cols-3 gap-2 text-center text-xs">
            {steps.map(([label, at]) => (
              <li key={label} className={`rounded-lg p-2 ${at ? 'bg-paid-soft text-paid-ink' : 'bg-canvas text-ink-mute'}`}>
                <div className="font-semibold">{label}</div>
                <div>{at ? fmtPK(at) : '—'}</div>
              </li>
            ))}
          </ol>
        )}

        {o.status === 'new' && (
          <a href={waHref} target="_blank" rel="noopener" className="btn w-full bg-wa hover:bg-wa-hover">Order WhatsApp par bhejein</a>
        )}
        {o.provider && <ContactButtons phone={o.provider.phone} whatsapp={o.provider.whatsapp} providerId={o.provider.id} compact />}
        <div className="border-t border-line pt-4"><OrderActions o={o} side="customer" next={`/my/orders/${o.id}`} /></div>
        {o.status === 'done' && o.provider && (
          <Link href={`/providers/${o.provider.id}#reviews`} className="btn-outline w-full">Review dein ★</Link>
        )}
      </div>
    </div>
  );
}
