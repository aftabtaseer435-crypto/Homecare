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

/** A filter field with its name always shown above it. */
const F = ({ label, children }: { label: string; children: React.ReactElement<{ id: string }> }) => (
  <div className="min-w-0">
    <label htmlFor={children.props.id} className="mb-1 block text-xs font-semibold text-ink-soft">{label}</label>
    {children}
  </div>
);

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
        </div>
        <Link href={`/properties/new?type=${deal}`} className="btn">
          <Plus className="h-4 w-4" aria-hidden="true" /> {sale ? 'Apna ghar bechein' : 'Apna ghar kiraye par dein'}
        </Link>
      </div>
      <Flash searchParams={sp} />

      <form className="mb-6 rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filters</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <F label="City"><input id="f-city" name="city" defaultValue={sp.city} placeholder="Multan" className="input" /></F>
          <F label="Society">
            <select id="f-society" name="society" defaultValue={sp.society ?? ''} className="input">
              <option value="">Saari societies</option>
              {(societies ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </F>
          <F label="Qisam">
            <select id="f-ptype" name="ptype" defaultValue={sp.ptype ?? ''} className="input">
              <option value="">Har qisam</option>
              {typesFor(deal).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </F>
          <F label={sale ? 'Kam az kam qeemat' : 'Kam az kam kiraya'}><input id="f-min" name="min" defaultValue={sp.min} placeholder={sale ? '50 lakh' : '20000'} className="input" /></F>
          <F label={sale ? 'Zyada se zyada qeemat' : 'Zyada se zyada kiraya'}><input id="f-max" name="max" defaultValue={sp.max} placeholder={sale ? '1.5 crore' : '60000'} className="input" /></F>
          <F label="Bedrooms">
            <select id="f-beds" name="beds" defaultValue={sp.beds ?? ''} className="input">
              <option value="">Koi bhi</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ bed</option>)}
            </select>
          </F>
          {sale ? (
            <>
              <F label="Qabza">
                <select id="f-possession" name="possession" defaultValue={sp.possession ?? ''} className="input">
                  <option value="">Koi bhi</option>
                  {possessionTypes.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </F>
              <F label="Payment">
                <select id="f-inst" name="inst" defaultValue={sp.inst ?? ''} className="input">
                  <option value="">Cash ya qistein</option><option value="1">Sirf qiston wale</option>
                </select>
              </F>
            </>
          ) : (
            <>
              <F label="Portion">
                <select id="f-portion" name="portion" defaultValue={sp.portion ?? ''} className="input">
                  <option value="">Har portion</option>
                  {portions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </F>
              <F label="Kirayedar">
                <select id="f-tenant" name="tenant" defaultValue={sp.tenant ?? ''} className="input">
                  <option value="">Koi bhi</option>
                  <option value="family">Family</option><option value="bachelor">Bachelor</option><option value="female">Khawateen</option>
                </select>
              </F>
              <F label="Furnished">
                <select id="f-furnished" name="furnished" defaultValue={sp.furnished ?? ''} className="input">
                  <option value="">Koi bhi</option>
                  {furnishing.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </F>
            </>
          )}
          <F label="Tarteeb">
            <select id="f-sort" name="sort" defaultValue={sp.sort ?? ''} className="input">
              <option value="">Naye pehle</option><option value="low">Sasta pehle</option><option value="high">Mehnga pehle</option>
            </select>
          </F>
          <div className="col-span-2 flex items-end gap-2 md:col-span-1">
            <button className="btn flex-1">Search</button>
            {filtered && <Link href={`/properties/${deal}`} className="btn-outline">Saaf</Link>}
          </div>
        </div>
      </form>

      <div className="mb-3 text-sm text-ink-mute">{list.length} {list.length === 1 ? 'listing' : 'listings'}{list.length === 60 ? '+' : ''}</div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold text-ink">Is filter par abhi koi listing nahi.</p>
          <p className="mt-1 text-sm text-ink-mute">Apni demand daal dein — {sale ? 'bechne wale' : 'malik'} khud aap se rabta karenge.</p>
          <Link href={`/properties/wanted/new?type=${sale ? 'buy' : 'rent'}`} className="btn mt-4">
            <Megaphone className="h-4 w-4" aria-hidden="true" /> Demand post karein
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      )}

    </div>
  );
}
