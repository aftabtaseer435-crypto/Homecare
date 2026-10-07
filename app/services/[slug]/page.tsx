import ProviderCard from '@/components/ProviderCard';
import ServiceThumb from '@/components/ServiceThumb';
import { hasNight, isOpenNow } from '@/lib/hours';
import { DELIVERY_GROUP, serviceImage } from '@/lib/serviceImages';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Empty } from '@/components/ui';
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
    .select('id, display_name, phone, whatsapp, photo_path, city, area_note, experience_years, rate_note, rating_avg, rating_count, available, status, day_start, day_end, night_start, night_end, provider_categories!inner(category_id), provider_societies(society_id)')
    .in('status', ['verified', 'pending'])
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
  // open right now first, then verified before new
  list.sort((a, b) =>
    Number(b.available && isOpenNow(b)) - Number(a.available && isOpenNow(a)) ||
    Number(b.status === 'verified') - Number(a.status === 'verified'));
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

      <form className="mb-5 grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap [&_select]:w-full [&_input]:w-full">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProviderCard key={p.id} p={p} cat={cat} isDelivery={isDelivery} mySociety={!!societyId && p.provider_societies.some((s: any) => s.society_id === societyId)} />
          ))}
        </div>
      )}
    </div>
  );
}
