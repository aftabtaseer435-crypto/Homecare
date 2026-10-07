import Link from 'next/link';
import { ArrowRight, BadgeCheck, HandCoins, KeyRound, Megaphone, PhoneOff, Search, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ListingCard from '@/components/property/ListingCard';
import { Flash } from '@/components/ui';
import { CARD_SELECT } from '@/lib/property';

export const metadata = {
  title: 'Ghar khareedein, bechein ya kiraye par lein / dein',
  description: 'Housing societies ke ghar, plot, portion aur flat — khareedna, bechna, kiraye par lena aur dena alag alag. Society-verified owners, poori maloomat, seedha call ya WhatsApp.',
  alternates: { canonical: '/properties' },
};

const doors = [
  { href: '/properties/sale', title: 'Ghar khareedna hai', text: 'Bikne wale ghar, plot aur flat dekhein', icon: Search, tone: 'bg-property text-white' },
  { href: '/properties/new?type=sale', title: 'Ghar bechna hai', text: 'Demand, size aur kaghzat ke sath listing', icon: Tag, tone: 'bg-property-soft text-property-ink' },
  { href: '/properties/rent', title: 'Kiraye par lena hai', text: 'Ghar, portion, flat aur kamre kiraye par', icon: KeyRound, tone: 'bg-ink text-white' },
  { href: '/properties/new?type=rent', title: 'Kiraye par dena hai', text: 'Kiraya, advance aur shartein likh kar', icon: HandCoins, tone: 'bg-canvas text-ink' },
];

export default async function Properties({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const supabase = createClient();
  const base = () => supabase.from('property_listings').select(CARD_SELECT).eq('status', 'active').order('society_verified', { ascending: false }).order('created_at', { ascending: false }).limit(3);
  const [{ data: sale }, { data: rent }, { count: sales }, { count: rents }, { count: wants }] = await Promise.all([
    base().eq('listing_type', 'sale'),
    base().eq('listing_type', 'rent'),
    supabase.from('property_listings').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('listing_type', 'sale'),
    supabase.from('property_listings').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('listing_type', 'rent'),
    supabase.from('property_wants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return (
    <div>
      <Flash searchParams={searchParams} />
      <div className="mb-6">
        <h1>Ghar khareedein, bechein ya kiraye par</h1>
        <p className="mt-1 max-w-2xl text-ink-mute">Bechne aur kiraye ka nizam bilkul alag hai — aap kya karna chahte hain?</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {doors.map((d) => (
          <Link key={d.href} href={d.href} className="group flex min-w-0 items-start gap-3 rounded-2xl border border-line bg-white p-4 no-underline transition hover:border-property/60 hover:shadow-md hover:no-underline">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${d.tone}`}><d.icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-semibold text-ink">{d.title}<ArrowRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" /></span>
              <span className="mt-0.5 block text-sm text-ink-mute">{d.text}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm"><BadgeCheck className="h-5 w-5 shrink-0 text-paid" aria-hidden="true" /><span><b>Society verified</b> — malik ki tasdeeq society ne ki hai</span></div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm"><PhoneOff className="h-5 w-5 shrink-0 text-property" aria-hidden="true" /><span><b>Number chupa</b> — sirf Call / WhatsApp button</span></div>
        <Link href="/properties/wanted" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm no-underline hover:border-property/60 hover:no-underline">
          <Megaphone className="h-5 w-5 shrink-0 text-property" aria-hidden="true" /><span className="text-ink"><b>{wants ?? 0} demands</b> — khareedne / kiraye wale kya dhoond rahe hain</span>
        </Link>
      </div>

      {[
        { id: 'sale', title: 'Bikne wale ghar', list: sale, count: sales, cta: 'Saare sale ghar' },
        { id: 'rent', title: 'Kiraye ke ghar', list: rent, count: rents, cta: 'Saare rent ghar' },
      ].map((s) => (
        <section key={s.id} className="mt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2>{s.title} <span className="text-base font-normal text-ink-mute">({s.count ?? 0})</span></h2>
            <Link href={`/properties/${s.id}`} className="inline-flex items-center gap-1 text-sm font-semibold">{s.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          {(s.list ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-ink-mute">
              Abhi koi listing nahi. <Link href={`/properties/new?type=${s.id}`}>Pehli listing aap daalein</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(s.list as any[]).map((l) => <ListingCard key={l.id} l={l} />)}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
