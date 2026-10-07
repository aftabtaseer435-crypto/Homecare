import ServiceThumb from '@/components/ServiceThumb';
import HoursBadge from '@/components/HoursBadge';
import { hasNight, hoursLabel, isOpenNow } from '@/lib/hours';
import { DELIVERY_GROUP, serviceImage } from '@/lib/serviceImages';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Empty, Stars } from '@/components/ui';
import ContactButtons from '@/components/ContactButtons';
import { storagePublicUrl } from '@/lib/format';
import { createPublicClient } from '@/lib/supabase/public';
import { jsonLd, siteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: cat } = await createPublicClient().from('service_categories').select('name, name_ur').eq('slug', params.slug).maybeSingle();
  if (!cat) return { title: 'Service nahi mili' };
  return {
    title: `${cat.name} near you — verified ${cat.name.toLowerCase()} with ratings`,
    description: `Apni society aur area ke CNIC-verified ${cat.name}${cat.name_ur ? ` (${cat.name_ur})` : ''}. Rating, tajurba aur rates dekhein, seedha call ya WhatsApp karein.`,
    alternates: { canonical: `/services/${params.slug}` },
  };
}

export default async function CategoryProviders({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { society?: string; city?: string; time?: string };
}) {
  const supabase = createClient();
  const { data: cat } = await supabase.from('service_categories').select('id, slug, name, name_ur, icon, grp').eq('slug', params.slug).single();
  if (!cat) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  // default society filter = the user's own society
  let mySocieties: { id: string; name: string }[] = [];
  if (user) {
    const { data } = await supabase.from('house_owners').select('house:houses(society:societies(id, name))').eq('user_id', user.id).eq('status', 'verified');
    const seen = new Map<string, string>();
    for (const r of (data ?? []) as any[]) if (r.house?.society) seen.set(r.house.society.id, r.house.society.name);
    mySocieties = Array.from(seen, ([id, name]) => ({ id, name }));
  }
  const societyId = searchParams.society ?? '';
  const city = (searchParams.city ?? '').trim();

  let q = supabase
    .from('providers')
    .select('id, display_name, phone, whatsapp, photo_path, city, area_note, experience_years, rate_note, rating_avg, rating_count, available, day_start, day_end, night_start, night_end, provider_categories!inner(category_id), provider_societies(society_id)')
    .eq('status', 'verified')
    .eq('provider_categories.category_id', cat.id)
    .order('available', { ascending: false })
    .order('rating_avg', { ascending: false })
    .order('rating_count', { ascending: false })
    .limit(100);
  if (city) q = q.ilike('city', `%${city.replace(/[%,]/g, '')}%`);
  const { data: providers } = await q;

  let list = (providers ?? []) as any[];
  const time = searchParams.time ?? '';
  if (time === 'night') list = list.filter((p) => hasNight(p));
  if (time === 'open') list = list.filter((p) => p.available && isOpenNow(p));
  // open right now first
  list.sort((a, b) => Number(b.available && isOpenNow(b)) - Number(a.available && isOpenNow(a)));
  const isDelivery = cat.grp === DELIVERY_GROUP;
  if (societyId) {
    // providers serving this society first, then the rest of the city
    list = [
      ...list.filter((p) => p.provider_societies.some((s: any) => s.society_id === societyId)),
      ...list.filter((p) => !p.provider_societies.some((s: any) => s.society_id === societyId)),
    ];
  }

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${cat.name} providers`,
    itemListElement: list.slice(0, 20).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl()}/providers/${p.id}`, name: p.display_name })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <ServiceThumb src={serviceImage(cat.slug, 160)} icon={cat.icon} className="h-16 w-16" text="text-3xl" />
        <div className="min-w-0 flex-1">
          <h1>{cat.name}</h1>
          {cat.name_ur && <p className="text-ink-mute"><span dir="rtl">{cat.name_ur}</span></p>}
        </div>
        <Link href="/services" className="btn-outline">← Saari services</Link>
      </div>

      <form className="mb-5 flex flex-wrap items-end gap-2">
        {mySocieties.length > 0 && (
          <div>
            <label className="label">Meri society</label>
            <select name="society" defaultValue={societyId} className="input">
              <option value="">Sab</option>
              {mySocieties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Waqt</label>
          <select name="time" defaultValue={time} className="input">
            <option value="">Koi bhi waqt</option>
            <option value="open">Abhi khule hue</option>
            <option value="night">Raat ko service</option>
          </select>
        </div>
        <div>
          <label className="label">City</label>
          <input name="city" defaultValue={city} className="input" placeholder="Multan" />
        </div>
        <button className="btn-outline">Filter</button>
      </form>

      {list.length === 0 ? (
        <Empty href="/provider/register" cta="Provider register karein">Is category mein abhi koi verified provider nahi.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className="card flex gap-4">
              <Link href={`/providers/${p.id}`} className="shrink-0">
                {p.photo_path ? (
                  <img src={storagePublicUrl(p.photo_path)!} alt={p.display_name} loading="lazy" className="h-20 w-20 rounded-xl object-cover" />
                ) : (
                  <ServiceThumb src={serviceImage(cat.slug, 160)} icon={cat.icon} className="h-20 w-20" text="text-3xl" />
                )}
              </Link>
              <div className="min-w-0 flex-1 space-y-1">
                <Link href={`/providers/${p.id}`} className="text-base font-semibold text-ink">{p.display_name}</Link>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge bg-paid-soft text-paid-ink">✓ Verified</span>
                  {societyId && p.provider_societies.some((s: any) => s.society_id === societyId) && <span className="badge bg-brand-50 text-brand-700">Aap ki society</span>}
                  {!p.available && <span className="badge bg-canvas text-ink-soft">Abhi busy</span>}
                  <HoursBadge h={p} available={p.available} showLabel={false} />
                  <Stars value={Number(p.rating_avg)} count={p.rating_count} />
                </div>
                <div className="muted">{p.city}{p.area_note ? ` · ${p.area_note}` : ''}{p.experience_years ? ` · ${p.experience_years} saal tajurba` : ''}</div>
                {hoursLabel(p) && <div className="text-xs text-ink-mute">🕒 {hoursLabel(p)}</div>}
                {p.rate_note && <div className="text-sm">{p.rate_note}</div>}
                <div className="pt-2">
                  <ContactButtons phone={p.phone} whatsapp={p.whatsapp} providerId={p.id} compact message={isDelivery ? `Assalam o Alaikum, Housing Welfare se aap ka number mila. Mujhe ghar par ${cat.name} mangwana hai: ` : `Assalam o Alaikum, mujhe ${cat.name} ka kaam karwana hai.`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
