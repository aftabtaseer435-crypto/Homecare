import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import Avatar from '@/components/Avatar';
import HoursBadge from '@/components/HoursBadge';
import { houseLabel, storagePublicUrl } from '@/lib/format';
import { placeholderFor, whenOptions } from '@/lib/orders';
import { createOrder } from '@/app/orders/actions';

export const metadata = { title: 'Order bhejein', robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { cat?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser(`/providers/${params.id}/order${searchParams.cat ? `?cat=${searchParams.cat}` : ''}`);
  const [{ data: p }, { data: homes }] = await Promise.all([
    supabase
      .from('providers')
      .select('id, user_id, display_name, photo_path, city, area_note, rate_note, status, available, day_start, day_end, night_start, night_end, provider_categories(category:service_categories(id, slug, name, icon))')
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('house_owners').select('house:houses(block, street, house_no, society:societies(name, city))').eq('user_id', user.id).eq('status', 'verified'),
  ]);
  if (!p || !['verified', 'pending'].includes(p.status)) notFound();
  const prov = p as any;
  const cats = (prov.provider_categories ?? []).map((c: any) => c.category).filter(Boolean);
  const selected = cats.find((c: any) => c.slug === searchParams.cat) ?? cats[0];
  const addresses = ((homes ?? []) as any[]).filter((h) => h.house).map((h) => `${h.house.society?.name ?? ''}, ${houseLabel(h.house)}`);
  const own = prov.user_id === user.id;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href={`/providers/${prov.id}`} className="text-sm font-medium">← {prov.display_name}</Link>
      <div className="card flex items-center gap-4">
        <Avatar name={prov.display_name} src={storagePublicUrl(prov.photo_path)} size={56} />
        <div className="min-w-0">
          <h1 className="text-xl">{prov.display_name}</h1>
          <div className="mt-1"><HoursBadge h={prov} available={prov.available} /></div>
          {prov.rate_note && <div className="mt-1 text-sm text-ink-mute">{prov.rate_note}</div>}
        </div>
      </div>
      <Flash searchParams={searchParams} />
      {own ? (
        <p className="card text-sm text-ink-mute">Ye aap ki apni profile hai — apne aap ko order nahi bhej sakte.</p>
      ) : (
        <form action={createOrder} className="card space-y-4">
          <input type="hidden" name="provider_id" value={prov.id} />
          <h2>Order / kaam ki request</h2>
          {cats.length > 1 ? (
            <div>
              <label className="label" htmlFor="category_id">Kis cheez ka</label>
              <select id="category_id" name="category_id" className="input" defaultValue={selected?.id}>
                {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : selected ? <input type="hidden" name="category_id" value={selected.id} /> : null}
          <div>
            <label className="label" htmlFor="details">Kya chahiye? *</label>
            <textarea id="details" name="details" rows={4} required maxLength={1500} className="input" placeholder={placeholderFor(selected?.slug)} />
          </div>
          <div>
            <label className="label" htmlFor="when_note">Kab chahiye</label>
            <select id="when_note" name="when_note" className="input">
              {whenOptions.map((w) => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="address">Pata</label>
            <input id="address" name="address" className="input" list="my-addresses" defaultValue={addresses[0] ?? ''} placeholder="Society, gali, ghar number" maxLength={300} />
            <datalist id="my-addresses">{addresses.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <p className="hint">Order aap ki history aur provider ke dashboard mein aa jayega. Agle page par ek click se WhatsApp par bhi chala jayega.</p>
          <SubmitButton className="btn w-full bg-service hover:bg-service-ink">Order bhejein</SubmitButton>
        </form>
      )}
    </div>
  );
}
