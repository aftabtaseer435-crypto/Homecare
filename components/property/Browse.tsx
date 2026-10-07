import Link from 'next/link';
import { Megaphone, Plus, SlidersHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ListingCard from './ListingCard';
import { Flash } from '@/components/ui';
import { CARD_SELECT, furnishing, parseMoney, portions, possessionTypes, tenantPrefs, typesFor, type Deal } from '@/lib/property';

export type BrowseSP = {
  city?: string; society?: string; ptype?: string; min?: string; max?: string; beds?: string;
  possession?: string; inst?: string; portion?: string; tenant?: string; furnished?: string; sort?: string; ok?: string; err?: string;
};

const clean = (v?: string) => (v ?? '').replace(/[%,()]/g, '').trim();

/** Browse list for one deal — sale and rent have their own filters. */
export default async function Browse({ deal, sp }: { deal: Deal; sp: BrowseSP }) {
  const sale = deal === 'sale';
  const supabase = createClient();
  const { data: societies } = await supabase.from('societies').select('id, name').eq('status', 'active').order('name');

  let q = supabase.from('property_listings').select(CARD_SELECT).eq('status', 'active').eq('listing_type', deal).limit(60);
  if (clean(sp.city)) q = q.ilike('city', `%${clean(sp.city)}%`);
  if (sp.society) q = q.eq('society_id', sp.society);
  if (sp.ptype) q = q.eq('property_type', sp.ptype);
  const min = parseMoney(sp.min);
  const max = parseMoney(sp.max);
  if (min) q = q.gte('price', min);
  if (max) q = q.lte('price', max);
  if (Number(sp.beds) > 0) q = q.gte('bedrooms', Number(sp.beds));
  if (sale) {
    if (sp.possession) q = q.eq('possession', sp.possession);
    if (sp.inst === '1') q = q.eq('installments', true);
  } else {
    if (sp.portion) q = q.eq('portion', sp.portion);
    if (['family', 'bachelor', 'female'].includes(sp.tenant ?? '')) q = q.or(`tenant_pref.is.null,tenant_pref.in.(${sp.tenant},any)`);
    if (sp.furnished) q = q.eq('furnished', sp.furnished);
  }
  if (sp.sort === 'low') q = q.order('price', { ascending: true });
  else if (sp.sort === 'high') q = q.order('price', { ascending: false });
  else q = q.order('society_verified', { ascending: false }).order('created_at', { ascending: false });
  const { data: listings } = await q;
  const list = (listings ?? []) as any[];
  const filtered = Object.entries(sp).some(([k, v]) => v && !['ok', 'err', 'sort'].includes(k));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1>{sale ? 'Ghar / plot khareedein' : 'Kiraye par ghar lein'}</h1>
          <p className="mt-1 text-ink-mute">
            {sale ? 'Bechne walon ki listings — demand, size, kaghzat aur qabza sab ek nazar mein.' : 'Malik ki listings — kiraya, advance, portion aur shartein sab ek nazar mein.'}
          </p>
        </div>
        <Link href={`/properties/new?type=${deal}`} className="btn bg-property hover:bg-property-ink">
          <Plus className="h-4 w-4" aria-hidden="true" /> {sale ? 'Apna ghar bechein' : 'Apna ghar kiraye par dein'}
        </Link>
      </div>
      <Flash searchParams={sp} />

      <form className="mb-6 rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filters</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <input name="city" defaultValue={sp.city} placeholder="City" className="input min-w-0" aria-label="City" />
          <select name="society" defaultValue={sp.society ?? ''} className="input min-w-0" aria-label="Society">
            <option value="">Saari societies</option>
            {(societies ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="ptype" defaultValue={sp.ptype ?? ''} className="input min-w-0" aria-label="Qisam">
            <option value="">Har qisam</option>
            {typesFor(deal).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input name="min" defaultValue={sp.min} placeholder={sale ? 'Kam az kam (50 lakh)' : 'Kam az kam (20k)'} className="input min-w-0" aria-label="Kam az kam qeemat" />
          <input name="max" defaultValue={sp.max} placeholder={sale ? 'Zyada se zyada (1.5 crore)' : 'Zyada se zyada (60k)'} className="input min-w-0" aria-label="Zyada se zyada qeemat" />
          <select name="beds" defaultValue={sp.beds ?? ''} className="input min-w-0" aria-label="Bedrooms">
            <option value="">Bedrooms</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ bed</option>)}
          </select>
          {sale ? (
            <>
              <select name="possession" defaultValue={sp.possession ?? ''} className="input min-w-0" aria-label="Qabza">
                <option value="">Qabza — koi bhi</option>
                {possessionTypes.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <select name="inst" defaultValue={sp.inst ?? ''} className="input min-w-0" aria-label="Qistein">
                <option value="">Cash / qistein</option><option value="1">Sirf qiston wale</option>
              </select>
            </>
          ) : (
            <>
              <select name="portion" defaultValue={sp.portion ?? ''} className="input min-w-0" aria-label="Portion">
                <option value="">Har portion</option>
                {portions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <select name="tenant" defaultValue={sp.tenant ?? ''} className="input min-w-0" aria-label="Main kaun hoon">
                <option value="">Main hoon…</option>
                <option value="family">Family</option><option value="bachelor">Bachelor</option><option value="female">Khawateen</option>
              </select>
              <select name="furnished" defaultValue={sp.furnished ?? ''} className="input min-w-0" aria-label="Furnished">
                <option value="">Furnished / nahi</option>
                {furnishing.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </>
          )}
          <select name="sort" defaultValue={sp.sort ?? ''} className="input min-w-0" aria-label="Tarteeb">
            <option value="">Naye pehle</option><option value="low">Sasta pehle</option><option value="high">Mehnga pehle</option>
          </select>
          <div className="col-span-2 flex gap-2 md:col-span-1">
            <button className="btn flex-1 bg-property hover:bg-property-ink">Search</button>
            {filtered && <Link href={`/properties/${deal}`} className="btn-outline">Saaf</Link>}
          </div>
        </div>
      </form>

      <div className="mb-3 text-sm text-ink-mute">{list.length} {list.length === 1 ? 'listing' : 'listings'}{list.length === 60 ? '+' : ''}</div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold text-ink">Is filter par abhi koi listing nahi.</p>
          <p className="mt-1 text-sm text-ink-mute">Apni demand daal dein — {sale ? 'bechne wale' : 'malik'} khud aap se rabta karenge.</p>
          <Link href={`/properties/wanted/new?type=${sale ? 'buy' : 'rent'}`} className="btn mt-4 bg-property hover:bg-property-ink">
            <Megaphone className="h-4 w-4" aria-hidden="true" /> Demand post karein
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-property-soft p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-property-ink">{sale ? 'Jo chahiye woh nahi mila?' : 'Pasand ka ghar nahi mila?'}</div>
          <p className="text-sm text-ink-soft">Budget aur area likh kar demand daalein — {sale ? 'bechne wale' : 'ghar ke malik'} aap ko call / WhatsApp karenge.</p>
        </div>
        <Link href={`/properties/wanted/new?type=${sale ? 'buy' : 'rent'}`} className="btn-outline shrink-0 bg-white">
          <Megaphone className="h-4 w-4" aria-hidden="true" /> Demand post karein
        </Link>
      </div>
    </div>
  );
}
