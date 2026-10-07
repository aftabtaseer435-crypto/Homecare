import Link from 'next/link';
import { Bookmark, Eye, HandCoins, House, KeyRound, Megaphone, Pencil, Phone, Plus, UserRound } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import ListingCard from '@/components/property/ListingCard';
import { IconWhatsApp } from '@/components/Icons';
import { fmtDate, storagePublicUrl } from '@/lib/format';
import { CARD_SELECT, firstPhoto, pkPrice, statusLabel, typeLabel } from '@/lib/property';
import { setListingStatus, setWantStatus } from '@/app/properties/actions';

export const metadata = { title: 'Mera property dashboard', robots: { index: false } };

const tone: Record<string, string> = {
  active: 'bg-paid-soft text-paid-ink', hidden: 'bg-canvas text-ink-mute', sold: 'bg-property-soft text-property-ink', rented: 'bg-property-soft text-property-ink',
  closed: 'bg-canvas text-ink-mute',
};

export default async function PropertyDashboard({ searchParams }: { searchParams: { tab?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/my/listings');
  const tab = ['sale', 'rent', 'wants', 'saved'].includes(searchParams.tab ?? '') ? searchParams.tab! : 'sale';
  const [{ data: mine }, { data: leads }, { data: wants }, { data: saved }] = await Promise.all([
    supabase.from('property_listings').select(CARD_SELECT).eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.rpc('listing_leads', { p_owner: user.id }),
    supabase.from('property_wants').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('saved_listings').select(`created_at, listing:property_listings(${CARD_SELECT})`).eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);
  const all = (mine ?? []) as any[];
  const leadMap = new Map(((leads ?? []) as any[]).map((r) => [r.listing_id, r]));
  const sale = all.filter((l) => l.listing_type === 'sale');
  const rent = all.filter((l) => l.listing_type === 'rent');
  const savedList = ((saved ?? []) as any[]).map((s) => s.listing).filter(Boolean);
  const totalViews = all.reduce((n, l) => n + (l.views ?? 0), 0);
  const totalLeads = ((leads ?? []) as any[]).reduce((n, r) => n + Number(r.calls) + Number(r.whatsapp), 0);
  const tabs = [
    { id: 'sale', label: 'Sale listings', count: sale.length, icon: HandCoins },
    { id: 'rent', label: 'Rent listings', count: rent.length, icon: KeyRound },
    { id: 'wants', label: 'Meri demands', count: (wants ?? []).length, icon: Megaphone },
    { id: 'saved', label: 'Saved', count: savedList.length, icon: Bookmark },
  ];
  const listings = tab === 'sale' ? sale : rent;
  const here = `/my/listings?tab=${tab}`;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1>Mera property dashboard</h1>
          <p className="mt-1 text-ink-mute">Aap ki sale aur rent listings, demands aur saved ghar — sab alag alag.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/properties/seller/${user.id}`} className="btn-outline"><UserRound className="h-4 w-4" aria-hidden="true" /> Meri public profile</Link>
          <Link href="/properties/new" className="btn bg-property hover:bg-property-ink"><Plus className="h-4 w-4" aria-hidden="true" /> Nayi listing</Link>
        </div>
      </div>
      <Flash searchParams={searchParams} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Live listings', value: all.filter((l) => l.status === 'active').length, icon: House },
          { label: 'Kul views', value: totalViews, icon: Eye },
          { label: 'Calls + WhatsApp', value: totalLeads, icon: Phone },
          { label: 'Live demands', value: (wants ?? []).filter((w: any) => w.status === 'active').length, icon: Megaphone },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white p-4">
            <s.icon className="h-5 w-5 text-property" aria-hidden="true" />
            <div className="mt-2 text-2xl font-bold text-ink">{s.value}</div>
            <div className="text-xs text-ink-mute">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {tabs.map((t) => (
            <Link key={t.id} href={`/my/listings?tab=${t.id}`} aria-current={tab === t.id ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold no-underline hover:no-underline ${tab === t.id ? 'border-property bg-property text-white' : 'border-line bg-white text-ink-soft hover:text-ink'}`}>
              <t.icon className="h-4 w-4" aria-hidden="true" /> {t.label} <span className={tab === t.id ? 'text-white/80' : 'text-ink-mute'}>({t.count})</span>
            </Link>
          ))}
        </div>
      </div>

      {(tab === 'sale' || tab === 'rent') &&
        (listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
            <p className="font-semibold text-ink">{tab === 'sale' ? 'Abhi koi sale listing nahi.' : 'Abhi koi rent listing nahi.'}</p>
            <Link href={`/properties/new?type=${tab}`} className="btn mt-4 bg-property hover:bg-property-ink">
              <Plus className="h-4 w-4" aria-hidden="true" /> {tab === 'sale' ? 'Ghar bechein' : 'Ghar kiraye par dein'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => {
              const ld = leadMap.get(l.id) ?? { calls: 0, whatsapp: 0 };
              const photo = firstPhoto(l);
              const done = tab === 'sale' ? 'sold' : 'rented';
              return (
                <div key={l.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
                  <Link href={`/properties/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3 no-underline hover:no-underline">
                    {photo ? <img src={storagePublicUrl(photo)!} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" /> : <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-property-soft text-property"><House className="h-6 w-6" aria-hidden="true" /></span>}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{l.title}</span>
                      <span className="block text-sm text-ink-mute">{pkPrice(l.price)}{tab === 'rent' ? ' / mahina' : ''} · {typeLabel(l.property_type)} · {l.city}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                        <span className={`badge ${tone[l.status]}`}>{statusLabel[l.status]}</span>
                        <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{l.views}</span>
                        <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{ld.calls}</span>
                        <span className="inline-flex items-center gap-1"><IconWhatsApp className="h-3.5 w-3.5" />{ld.whatsapp}</span>
                        <span>{fmtDate(l.created_at)}</span>
                      </span>
                    </span>
                  </Link>
                  <div className="grid shrink-0 grid-cols-3 gap-2 sm:flex">
                    <Link href={`/properties/${l.id}/edit`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit</Link>
                    {[l.status === 'active' ? done : null, l.status === 'active' ? 'hidden' : 'active'].filter(Boolean).map((s) => (
                      <form key={s} action={setListingStatus}>
                        <input type="hidden" name="listing_id" value={l.id} />
                        <input type="hidden" name="status" value={s!} />
                        <input type="hidden" name="next" value={here} />
                        <SubmitButton className="btn-outline btn-sm w-full">{({ sold: 'Bik gaya', rented: 'Rent ho gaya', hidden: 'Chupayein', active: 'Dobara live' } as any)[s!]}</SubmitButton>
                      </form>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === 'wants' &&
        ((wants ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
            <p className="font-semibold text-ink">Abhi koi demand nahi.</p>
            <p className="mt-1 text-sm text-ink-mute">Ghar chahiye? Demand daalein — bechne wale / malik khud rabta karenge.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/properties/wanted/new?type=buy" className="btn bg-property hover:bg-property-ink">Khareedne ki demand</Link>
              <Link href="/properties/wanted/new?type=rent" className="btn-outline">Kiraye ki demand</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {((wants ?? []) as any[]).map((w) => (
              <div key={w.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-property">{w.want_type === 'rent' ? 'Kiraye par chahiye' : 'Khareedna hai'} · {typeLabel(w.property_type)}</div>
                  <div className="font-semibold text-ink">{w.min_budget ? `${pkPrice(w.min_budget)} – ` : ''}{pkPrice(w.max_budget)}{w.want_type === 'rent' ? ' / mahina' : ''}</div>
                  <div className="text-sm text-ink-mute">{[w.area_text, w.city].filter(Boolean).join(', ')} · {fmtDate(w.created_at)} <span className={`badge ml-1 ${tone[w.status]}`}>{w.status === 'active' ? 'Live' : 'Band'}</span></div>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                  <form action={setWantStatus}>
                    <input type="hidden" name="want_id" value={w.id} />
                    <input type="hidden" name="status" value={w.status === 'active' ? 'closed' : 'active'} />
                    <input type="hidden" name="next" value={here} />
                    <SubmitButton className="btn-outline btn-sm w-full">{w.status === 'active' ? 'Mil gaya — band karein' : 'Dobara live'}</SubmitButton>
                  </form>
                  <form action={setWantStatus}>
                    <input type="hidden" name="want_id" value={w.id} />
                    <input type="hidden" name="status" value="delete" />
                    <input type="hidden" name="next" value={here} />
                    <SubmitButton className="btn-outline btn-sm w-full border-due/40 text-due hover:bg-due-soft" confirm="Demand delete karein?">Delete</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === 'saved' &&
        (savedList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-ink-mute">
            Koi saved ghar nahi. Listing par &quot;Save karein&quot; dabayein — yahan mil jayega.
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/properties/sale" className="btn-outline btn-sm">Sale ghar dekhein</Link>
              <Link href="/properties/rent" className="btn-outline btn-sm">Rent ghar dekhein</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{savedList.map((l: any) => <ListingCard key={l.id} l={l} />)}</div>
        ))}
    </div>
  );
}
