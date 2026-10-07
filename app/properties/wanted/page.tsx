import Link from 'next/link';
import { BedDouble, CalendarDays, MapPin, Maximize2, Megaphone, Plus, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ContactButtons from '@/components/ContactButtons';
import { Flash } from '@/components/ui';
import { ago, fmtDate, storagePublicUrl } from '@/lib/format';
import { pkPrice, typeLabel } from '@/lib/property';

export const metadata = {
  title: 'Ghar ki demands — khareedne aur kiraye wale kya dhoond rahe hain',
  description: 'Log kis area mein, kis budget mein ghar khareedna ya kiraye par lena chahte hain. Bechne wale aur malik seedha call ya WhatsApp karein.',
  alternates: { canonical: '/properties/wanted' },
};

const budget = (min: any, max: any, rent: boolean) => {
  const suffix = rent ? ' / mahina' : '';
  if (min && max) return `${pkPrice(min)} – ${pkPrice(max).replace('Rs ', '')}${suffix}`;
  return `${pkPrice(max ?? min)} tak${suffix}`;
};

export default async function Wanted({ searchParams }: { searchParams: { type?: string; city?: string; ok?: string; err?: string } }) {
  const type = searchParams.type === 'rent' ? 'rent' : 'buy';
  const city = (searchParams.city ?? '').replace(/[%,()]/g, '').trim();
  const supabase = createClient();
  let q = supabase.from('property_wants').select('*, society:societies(name)').eq('status', 'active').eq('want_type', type).order('created_at', { ascending: false }).limit(60);
  if (city) q = q.ilike('city', `%${city}%`);
  const [{ data: wants }, { data: { user } }] = await Promise.all([q, supabase.auth.getUser()]);
  const list = (wants ?? []) as any[];
  const { data: names } = list.length
    ? await supabase.rpc('public_names', { ids: Array.from(new Set(list.map((w) => w.user_id))) })
    : { data: [] as any[] };
  const who = new Map(((names ?? []) as any[]).map((n) => [n.id, n]));
  const rent = type === 'rent';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1>Demands</h1>
          <p className="mt-1 text-ink-mute">{rent ? 'Yeh log kiraye par ghar dhoond rahe hain — malik seedha rabta karein.' : 'Yeh log ghar / plot khareedna chahte hain — bechne wale seedha rabta karein.'}</p>
        </div>
        <Link href={`/properties/wanted/new?type=${type}`} className="btn"><Plus className="h-4 w-4" aria-hidden="true" /> Apni demand daalein</Link>
      </div>
      <Flash searchParams={searchParams} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-max gap-1 rounded-xl border border-line bg-white p-1">
          {[{ id: 'buy', label: 'Khareedne wale' }, { id: 'rent', label: 'Kiraye wale' }].map((t) => (
            <Link key={t.id} href={`/properties/wanted?type=${t.id}${city ? `&city=${encodeURIComponent(city)}` : ''}`}
              className={`rounded-lg px-4 py-2 text-sm font-semibold no-underline hover:no-underline ${type === t.id ? 'bg-property text-white' : 'text-ink-soft hover:bg-canvas'}`}>{t.label}</Link>
          ))}
        </div>
        <form className="flex items-end gap-2">
          <input type="hidden" name="type" value={type} />
          <div className="min-w-0 flex-1 sm:flex-none"><label htmlFor="w-city" className="mb-1 block text-xs font-semibold text-ink-soft">City</label><input id="w-city" name="city" defaultValue={city} placeholder="Multan" className="input sm:w-48" /></div>
          <button className="btn-outline">Search</button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-property" aria-hidden="true" />
          <p className="mt-2 font-semibold text-ink">Abhi koi {rent ? 'kiraye ki' : 'khareedne ki'} demand nahi.</p>
          <p className="mt-1 text-sm text-ink-mute">Pehli demand aap daalein — {rent ? 'malik' : 'bechne wale'} aap se rabta karenge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((w) => {
            const p = who.get(w.user_id);
            const mine = user?.id === w.user_id;
            return (
              <article key={w.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-property">{rent ? 'Kiraye par chahiye' : 'Khareedna hai'} · {typeLabel(w.property_type)}</div>
                    <div className="mt-1 text-xl font-bold text-ink">{budget(w.min_budget, w.max_budget, rent)}</div>
                  </div>
                  <span className="shrink-0 text-xs text-ink-mute">{ago(w.created_at)}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden="true" />{[w.society?.name, w.area_text, w.city].filter(Boolean).join(', ')}</span>
                  {w.size_text && <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />{w.size_text}</span>}
                  {w.bedrooms ? <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" aria-hidden="true" />{w.bedrooms}+ bed</span> : null}
                  {w.needed_by && <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" aria-hidden="true" />{fmtDate(w.needed_by)} tak</span>}
                </div>
                {w.details && <p className="line-clamp-3 whitespace-pre-line break-words text-sm text-ink-soft">{w.details}</p>}
                <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
                  {p?.avatar_path ? <img src={storagePublicUrl(p.avatar_path)!} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink-mute"><UserRound className="h-4 w-4" aria-hidden="true" /></span>}
                  <span className="min-w-0 truncate text-sm font-semibold text-ink">{p?.full_name || 'Member'}</span>
                </div>
                {mine ? (
                  <Link href="/my/listings?tab=wants" className="btn-outline btn-sm">Yeh aap ki demand hai — dashboard mein manage karein</Link>
                ) : (
                  <ContactButtons phone={w.contact_phone} wantId={w.id} compact
                    message={`Assalam o Alaikum, Housing Welfare par aap ki demand dekhi (${typeLabel(w.property_type)}, ${w.city}). Mere paas aap ke liye ${rent ? 'kiraye ka' : 'bechne ka'} ghar hai.`} />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
