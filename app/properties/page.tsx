import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Empty, PageHeader } from '@/components/ui';
import { rs, storagePublicUrl } from '@/lib/format';

export const metadata = { title: 'Ghar rent ya sale — society verified listings' };

type SP = { type?: string; city?: string; society?: string; min?: string; max?: string; beds?: string; portion?: string };

export default async function Properties({ searchParams }: { searchParams: SP }) {
  const supabase = createClient();
  const { data: societies } = await supabase.from('societies').select('id, name').eq('status', 'active').order('name');

  let q = supabase
    .from('property_listings')
    .select('id, listing_type, title, city, area_text, plot_size, bedrooms, bathrooms, portion, price, society_verified, created_at, society:societies(name), listing_photos(path, sort)')
    .eq('status', 'active')
    .order('society_verified', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60);
  if (searchParams.type === 'rent' || searchParams.type === 'sale') q = q.eq('listing_type', searchParams.type);
  if (searchParams.city) q = q.ilike('city', `%${searchParams.city.replace(/[%,]/g, '')}%`);
  if (searchParams.society) q = q.eq('society_id', searchParams.society);
  if (searchParams.min) q = q.gte('price', Number(searchParams.min));
  if (searchParams.max) q = q.lte('price', Number(searchParams.max));
  if (searchParams.beds) q = q.gte('bedrooms', Number(searchParams.beds));
  if (searchParams.portion) q = q.eq('portion', searchParams.portion);
  const { data: listings } = await q;

  return (
    <div>
      <PageHeader title="Ghar rent / sale" subtitle="Society-verified listings pehle. Owner se seedha baat." action={<Link href="/properties/new" className="btn">+ Apna ghar list karein</Link>} />

      <form className="card mb-6 grid gap-3 md:grid-cols-7">
        <select name="type" defaultValue={searchParams.type ?? ''} className="input">
          <option value="">Rent + Sale</option><option value="rent">Rent</option><option value="sale">Sale</option>
        </select>
        <input name="city" defaultValue={searchParams.city} placeholder="City" className="input" />
        <select name="society" defaultValue={searchParams.society ?? ''} className="input">
          <option value="">Saari societies</option>
          {(societies ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input name="min" type="number" defaultValue={searchParams.min} placeholder="Min Rs" className="input" />
        <input name="max" type="number" defaultValue={searchParams.max} placeholder="Max Rs" className="input" />
        <select name="beds" defaultValue={searchParams.beds ?? ''} className="input">
          <option value="">Bedrooms</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
        <button className="btn">Search</button>
      </form>

      {(listings ?? []).length === 0 ? (
        <Empty href="/properties/new" cta="Pehli listing daalein">Koi listing nahi mili.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {((listings ?? []) as any[]).map((l) => {
            const photo = [...(l.listing_photos ?? [])].sort((a: any, b: any) => a.sort - b.sort)[0];
            return (
              <Link key={l.id} href={`/properties/${l.id}`} className="card overflow-hidden p-0 no-underline hover:border-brand-500">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {photo ? <img src={storagePublicUrl(photo.path)!} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">🏠</div>}
                  <span className={`badge absolute left-2 top-2 ${l.listing_type === 'rent' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>{l.listing_type === 'rent' ? 'Rent' : 'Sale'}</span>
                  {l.society_verified && <span className="badge absolute right-2 top-2 bg-green-600 text-white">✓ Society verified</span>}
                </div>
                <div className="space-y-1 p-4">
                  <div className="text-lg font-bold text-gray-900">{rs(l.price)}{l.listing_type === 'rent' && <span className="text-sm font-normal text-gray-500"> / mahina</span>}</div>
                  <div className="font-semibold text-gray-800">{l.title}</div>
                  <div className="muted">{[l.society?.name, l.area_text, l.city].filter(Boolean).join(' · ')}</div>
                  <div className="text-sm text-gray-600">{[l.plot_size, l.bedrooms && `${l.bedrooms} bed`, l.bathrooms && `${l.bathrooms} bath`, l.portion && l.portion !== 'full' && `${l.portion} portion`].filter(Boolean).join(' · ')}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
