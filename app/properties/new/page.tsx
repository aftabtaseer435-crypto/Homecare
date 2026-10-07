import Link from 'next/link';
import { HandCoins, Tag } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import ListingForm from '@/components/property/ListingForm';
import { createListing } from '../actions';

export const metadata = { title: 'Ghar bechein ya kiraye par dein', robots: { index: false } };

export default async function NewListing({ searchParams }: { searchParams: { type?: string; ok?: string; err?: string } }) {
  const deal = searchParams.type === 'sale' || searchParams.type === 'rent' ? searchParams.type : null;
  const { supabase, user, profile } = await requireUser(`/properties/new${deal ? `?type=${deal}` : ''}`);

  if (!deal) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Listing daalein" subtitle="Pehle batayein — bechna hai ya kiraye par dena hai?" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { t: 'sale', title: 'Ghar / plot bechna hai', text: 'Demand, size, malkiyat, qabza, kaghzat aur qiston ki maloomat', icon: Tag },
            { t: 'rent', title: 'Kiraye par dena hai', text: 'Mahana kiraya, advance, portion, kis ko dena hai aur kab se khali', icon: HandCoins },
          ].map((o) => (
            <Link key={o.t} href={`/properties/new?type=${o.t}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6 no-underline transition hover:border-property/60 hover:shadow-md hover:no-underline">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-property-soft text-property"><o.icon className="h-6 w-6" aria-hidden="true" /></span>
              <span className="text-lg font-semibold text-ink">{o.title}</span>
              <span className="text-sm text-ink-mute">{o.text}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const { data: homes } = await supabase
    .from('house_owners')
    .select('house:houses(id, block, street, house_no, society:societies(name, city))')
    .eq('user_id', user.id)
    .eq('status', 'verified')
    .eq('relation', 'owner');

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={deal === 'sale' ? 'Ghar / plot bechein' : 'Ghar kiraye par dein'}
        subtitle={deal === 'sale' ? 'Jitni poori maloomat, utne sanjeeda khareedar. Registered ghar chunein to "Society verified" badge lagega.' : 'Kiraya, advance aur shartein saaf likhein — sahi kirayedar jaldi milega.'}
        back={[deal === 'sale' ? '← Sale listings' : '← Rent listings', deal === 'sale' ? '/properties/sale' : '/properties/rent']}
      />
      <Flash searchParams={searchParams} />
      <p className="mb-4 text-sm text-ink-mute">
        Ghalat option? <Link href={`/properties/new?type=${deal === 'sale' ? 'rent' : 'sale'}`}>{deal === 'sale' ? 'Kiraye par dena hai' : 'Bechna hai'}</Link>
      </p>
      <ListingForm deal={deal} action={createListing} homes={(homes ?? []) as any} phone={profile.phone} submitLabel={deal === 'sale' ? 'Sale listing publish karein' : 'Rent listing publish karein'} />
    </div>
  );
}
