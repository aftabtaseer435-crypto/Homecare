import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Flash } from '@/components/ui';
import ContactButtons from '@/components/ContactButtons';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, rs, storagePublicUrl } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { deleteListing, setListingStatus, toggleSave } from '../actions';
import { submitComplaint } from '@/app/providers/[id]/actions';
import { createPublicClient } from '@/lib/supabase/public';
import { jsonLd, siteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: l } = await createPublicClient()
    .from('property_listings')
    .select('title, listing_type, city, area_text, price, bedrooms, plot_size, status, society:societies(name), listing_photos(path, sort)')
    .eq('id', params.id)
    .maybeSingle();
  if (!l) return { title: 'Listing', robots: { index: false } };
  const x = l as any;
  const kind = x.listing_type === 'rent' ? 'for rent' : 'for sale';
  const where = [x.society?.name, x.area_text, x.city].filter(Boolean).join(', ');
  const photo = [...(x.listing_photos ?? [])].sort((a: any, b: any) => a.sort - b.sort)[0];
  return {
    title: `${x.title} ${kind} — ${where}`,
    description: `${x.plot_size ? x.plot_size + ', ' : ''}${x.bedrooms ? x.bedrooms + ' bed, ' : ''}${rs(x.price)}${x.listing_type === 'rent' ? ' / mahina' : ''}. ${where}. Owner se seedha rabta.`,
    alternates: { canonical: `/properties/${params.id}` },
    robots: x.status === 'active' ? undefined : { index: false },
    openGraph: photo ? { images: [storagePublicUrl(photo.path)!] } : undefined,
  };
}

const PORTION: Record<string, string> = { full: 'Poora ghar', upper: 'Upper portion', lower: 'Lower portion', room: 'Room' };
const FURN: Record<string, string> = { furnished: 'Furnished', semi: 'Semi furnished', unfurnished: 'Unfurnished' };

export default async function ListingPage({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const supabase = createClient();
  const { data: l } = await supabase
    .from('property_listings')
    .select('*, society:societies(name), listing_photos(id, path, sort)')
    .eq('id', params.id)
    .single();
  if (!l) notFound();
  const listing = l as any;

  await supabase.rpc('bump_listing_view', { p_listing: params.id });
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.owner_id;
  const saved = user
    ? ((await supabase.from('saved_listings').select('listing_id', { count: 'exact', head: true }).eq('listing_id', params.id).eq('user_id', user.id)).count ?? 0) > 0
    : false;
  const leads = isOwner
    ? (await supabase.from('contact_events').select('id', { count: 'exact', head: true }).eq('listing_id', params.id)).count ?? 0
    : 0;
  const photos = [...(listing.listing_photos ?? [])].sort((a: any, b: any) => a.sort - b.sort);

  const facts = [
    ['Plot', listing.plot_size],
    ['Bedrooms', listing.bedrooms],
    ['Bathrooms', listing.bathrooms],
    ['Portion', PORTION[listing.portion]],
    ['Furnished', FURN[listing.furnished]],
    ['Advance', listing.advance ? rs(listing.advance) : null],
    ['Available', listing.available_from ? fmtDate(listing.available_from) : null],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    url: `${siteUrl()}/properties/${listing.id}`,
    price: Number(listing.price),
    priceCurrency: 'PKR',
    businessFunction: listing.listing_type === 'rent' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell',
    availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    itemOffered: {
      '@type': 'Accommodation',
      name: listing.title,
      numberOfBedrooms: listing.bedrooms ?? undefined,
      numberOfBathroomsTotal: listing.bathrooms ?? undefined,
      address: { '@type': 'PostalAddress', addressLocality: listing.city, streetAddress: listing.area_text ?? undefined, addressCountry: 'PK' },
      image: photos.map((p: any) => storagePublicUrl(p.path)),
    },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <Flash searchParams={searchParams} />
      {listing.status !== 'active' && <div className="rounded-lg bg-plate-soft p-3 text-sm text-plate-ink">Status: {listing.status}</div>}

      {photos.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-3">
          <img src={storagePublicUrl(photos[0].path)!} alt={`${listing.title} — photo 1`} className="h-72 w-full rounded-xl object-cover md:col-span-2 md:h-96" />
          <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
            {photos.slice(1, 4).map((p: any, i: number) => <img key={p.id} src={storagePublicUrl(p.path)!} alt={`${listing.title} — photo ${i + 2}`} loading="lazy" className="h-24 w-full rounded-xl object-cover md:h-[7.6rem]" />)}
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl bg-canvas text-6xl">🏠</div>
      )}
      {photos.length > 4 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.slice(4).map((p: any, i: number) => <img key={p.id} src={storagePublicUrl(p.path)!} alt={`${listing.title} — photo ${i + 5}`} loading="lazy" className="h-24 w-32 shrink-0 rounded-lg object-cover" />)}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${listing.listing_type === 'rent' ? 'bg-brand-50 text-brand-700' : 'bg-plate-soft text-plate-ink'}`}>{listing.listing_type === 'rent' ? 'Rent' : 'Sale'}</span>
              {listing.society_verified && <span className="badge bg-paid-soft text-paid-ink">✓ Society verified owner</span>}
            </div>
            <h1 className="mt-2">{listing.title}</h1>
            <p className="muted">{[listing.society?.name, listing.area_text, listing.city].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="text-3xl font-bold text-brand-700">{rs(listing.price)}{listing.listing_type === 'rent' && <span className="text-base font-normal text-ink-mute"> / mahina</span>}</div>
          <div className="card grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(([k, v]) => <div key={k as string}><div className="muted">{k}</div><div className="font-semibold">{v as any}</div></div>)}
          </div>
          {listing.description && <div className="card whitespace-pre-line text-sm">{listing.description}</div>}
        </div>

        <div className="space-y-4">
          <div className="card space-y-3">
            <h2>Owner se rabta</h2>
            <div className="text-sm">{displayPhone(listing.contact_phone)}</div>
            <ContactButtons phone={listing.contact_phone} listingId={listing.id} message={`Assalam o Alaikum, aap ki listing "${listing.title}" dekhi. Kya yeh abhi available hai?`} />
            {!isOwner && (
              <form action={toggleSave}>
                <input type="hidden" name="listing_id" value={listing.id} />
                <input type="hidden" name="saved" value={saved.toString()} />
                <SubmitButton className="btn-outline btn-sm">{saved ? '★ Saved' : '☆ Save karein'}</SubmitButton>
              </form>
            )}
            <div className="muted">{listing.views} views · {fmtDate(listing.created_at)}</div>
          </div>

          {isOwner && (
            <div className="card space-y-2">
              <h2>Meri listing</h2>
              <p className="muted">{leads} log rabta kar chuke hain</p>
              <div className="flex flex-wrap gap-2">
                {(listing.listing_type === 'rent' ? ['rented'] : ['sold']).concat(listing.status === 'active' ? ['hidden'] : ['active']).map((s) => (
                  <form key={s} action={setListingStatus}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <input type="hidden" name="status" value={s} />
                    <SubmitButton className="btn-outline btn-sm">{{ rented: 'Rent ho gaya', sold: 'Bik gaya', hidden: 'Chupa dein', active: 'Dobara live' }[s]}</SubmitButton>
                  </form>
                ))}
                <form action={deleteListing}>
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <SubmitButton className="btn-danger btn-sm" confirm="Listing delete karein?">Delete</SubmitButton>
                </form>
              </div>
            </div>
          )}

          {user && !isOwner && (
            <details className="card">
              <summary className="cursor-pointer text-sm text-ink-soft">Fake / ghalat listing report karein</summary>
              <form action={submitComplaint} className="mt-3 space-y-2">
                <input type="hidden" name="listing_id" value={listing.id} />
                <textarea name="reason" rows={3} className="input" required />
                <SubmitButton className="btn-danger btn-sm">Report</SubmitButton>
              </form>
            </details>
          )}
          <Link href="/properties" className="text-sm">← Saari listings</Link>
        </div>
      </div>
    </div>
  );
}
