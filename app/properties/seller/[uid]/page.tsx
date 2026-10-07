import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, CalendarDays, HandCoins, KeyRound, Megaphone, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import ListingCard from '@/components/property/ListingCard';
import { fmtDate, storagePublicUrl } from '@/lib/format';
import { CARD_SELECT } from '@/lib/property';

const uuid = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: { params: { uid: string } }) {
  if (!uuid.test(params.uid)) return { title: 'Seller', robots: { index: false } };
  const { data } = await createPublicClient().rpc('property_seller', { uid: params.uid });
  const s = (data ?? [])[0] as any;
  if (!s) return { title: 'Seller', robots: { index: false } };
  return {
    title: `${s.full_name || 'Member'} — property listings`,
    description: `${s.full_name || 'Member'} ki ${Number(s.active_sale) + Number(s.active_rent)} live listings (sale / rent). Seedha call ya WhatsApp.`,
    alternates: { canonical: `/properties/seller/${params.uid}` },
  };
}

export default async function SellerProfile({ params, searchParams }: { params: { uid: string }; searchParams: { tab?: string } }) {
  if (!uuid.test(params.uid)) notFound();
  const supabase = createClient();
  const [{ data: sellerRows }, { data: listings }, { data: { user } }] = await Promise.all([
    supabase.rpc('property_seller', { uid: params.uid }),
    supabase.from('property_listings').select(CARD_SELECT).eq('owner_id', params.uid).in('status', ['active', 'sold', 'rented'])
      .order('status', { ascending: true }).order('created_at', { ascending: false }).limit(60),
    supabase.auth.getUser(),
  ]);
  const s = (sellerRows ?? [])[0] as any;
  if (!s) notFound();
  const all = (listings ?? []) as any[];
  const tab = searchParams.tab === 'rent' ? 'rent' : searchParams.tab === 'done' ? 'done' : searchParams.tab === 'sale' ? 'sale' : 'all';
  const shown = all.filter((l) =>
    tab === 'all' ? l.status === 'active' : tab === 'done' ? l.status !== 'active' : l.status === 'active' && l.listing_type === tab,
  );
  const live = Number(s.active_sale) + Number(s.active_rent);
  const tabs = [
    { id: 'all', label: `Sab live (${live})` },
    { id: 'sale', label: `Sale (${s.active_sale})` },
    { id: 'rent', label: `Rent (${s.active_rent})` },
    ...(Number(s.closed) > 0 ? [{ id: 'done', label: `Mukammal deals (${s.closed})` }] : []),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {s.avatar_path ? (
            <img src={storagePublicUrl(s.avatar_path)!} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-property-soft text-property"><UserRound className="h-10 w-10" aria-hidden="true" /></span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="break-words">{s.full_name || 'Member'}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-mute">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" aria-hidden="true" /> Member {fmtDate(s.member_since)} se</span>
              {Number(s.verified) > 0 && <span className="inline-flex items-center gap-1 text-paid-ink"><BadgeCheck className="h-4 w-4" aria-hidden="true" /> Society verified malik</span>}
            </div>
          </div>
          {user?.id === params.uid && <Link href="/my/listings" className="btn-outline btn-sm">Mera dashboard</Link>}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-canvas p-3"><HandCoins className="mx-auto h-5 w-5 text-property" aria-hidden="true" /><div className="mt-1 text-lg font-bold">{s.active_sale}</div><div className="text-xs text-ink-mute">Sale par</div></div>
          <div className="rounded-xl bg-canvas p-3"><KeyRound className="mx-auto h-5 w-5 text-property" aria-hidden="true" /><div className="mt-1 text-lg font-bold">{s.active_rent}</div><div className="text-xs text-ink-mute">Kiraye par</div></div>
          <div className="rounded-xl bg-canvas p-3"><BadgeCheck className="mx-auto h-5 w-5 text-paid" aria-hidden="true" /><div className="mt-1 text-lg font-bold">{s.closed}</div><div className="text-xs text-ink-mute">Deals mukammal</div></div>
        </div>
        <p className="mt-4 text-xs text-ink-mute">Number hifazat ke liye chupa hai — har listing par Call / WhatsApp button se rabta karein.</p>
      </section>

      <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {tabs.map((t) => (
            <Link key={t.id} href={t.id === 'all' ? `/properties/seller/${params.uid}` : `/properties/seller/${params.uid}?tab=${t.id}`}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold no-underline hover:no-underline ${tab === t.id ? 'border-property bg-property text-white' : 'border-line bg-white text-ink-soft hover:text-ink'}`}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-ink-mute">
          Is hisse mein abhi koi listing nahi. <Link href="/properties/wanted"><Megaphone className="inline h-4 w-4" aria-hidden="true" /> Demands dekhein</Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((l) => <ListingCard key={l.id} l={l} />)}</div>
      )}
    </div>
  );
}
