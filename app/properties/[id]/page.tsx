import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeCheck, Bath, BedDouble, Bookmark, BookmarkCheck, CalendarDays, Car, ChevronRight, Eye, Flag, House, Layers, MapPin, Maximize2,
  Pencil, Phone, Trash2, UserRound, UtensilsCrossed,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import { Flash } from '@/components/ui';
import ContactButtons from '@/components/ContactButtons';
import SubmitButton from '@/components/SubmitButton';
import ListingCard from '@/components/property/ListingCard';
import { IconWhatsApp } from '@/components/Icons';
import { fmtDate, storagePublicUrl } from '@/lib/format';
import {
  CARD_SELECT, furnishLabel, ownershipLabel, pkPrice, portionLabel, possessionLabel, sizeLabel, statusLabel, tenantLabel, typeLabel,
} from '@/lib/property';
import { jsonLd, siteUrl } from '@/lib/seo';
import { deleteListing, setListingStatus, toggleSave } from '../actions';
import { submitComplaint } from '@/app/providers/[id]/actions';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: l } = await createPublicClient()
    .from('property_listings')
    .select('title, listing_type, property_type, city, area_text, price, bedrooms, plot_size, status, society:societies(name), listing_photos(path, sort)')
    .eq('id', params.id)
    .maybeSingle();
  if (!l) return { title: 'Listing', robots: { index: false } };
  const x = l as any;
  const kind = x.listing_type === 'rent' ? 'for rent' : 'for sale';
  const where = [x.society?.name, x.area_text, x.city].filter(Boolean).join(', ');
  const photo = [...(x.listing_photos ?? [])].sort((a: any, b: any) => a.sort - b.sort)[0];
  return {
    title: `${x.title} ${kind} — ${where}`,
    description: `${typeLabel(x.property_type)} ${kind}. ${x.plot_size ? x.plot_size + ', ' : ''}${x.bedrooms ? x.bedrooms + ' bed, ' : ''}${pkPrice(x.price)}${x.listing_type === 'rent' ? ' / mahina' : ' demand'}. ${where}. Seedha call ya WhatsApp.`,
    alternates: { canonical: `/properties/${params.id}` },
    robots: x.status === 'active' ? undefined : { index: false },
    openGraph: photo ? { images: [storagePublicUrl(photo.path)!] } : undefined,
  };
}

const yes = (b: boolean | null | undefined) => (b === true ? 'Haan' : b === false ? 'Nahi' : null);

export default async function ListingPage({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const supabase = createClient();
  const { data: l } = await supabase
    .from('property_listings')
    .select('*, society:societies(name), listing_photos(id, path, sort)')
    .eq('id', params.id)
    .maybeSingle();
  if (!l) notFound();
  const listing = l as any;
  const rent = listing.listing_type === 'rent';
  const deal = rent ? 'rent' : 'sale';

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.owner_id;
  if (!isOwner) await supabase.rpc('bump_listing_view', { p_listing: params.id });

  const [savedRes, leadsRes, sellerRes, similarRes] = await Promise.all([
    user && !isOwner
      ? supabase.from('saved_listings').select('listing_id', { count: 'exact', head: true }).eq('listing_id', params.id).eq('user_id', user.id)
      : Promise.resolve({ count: 0 }),
    isOwner ? supabase.rpc('listing_leads', { p_owner: user!.id }) : Promise.resolve({ data: [] }),
    supabase.rpc('property_seller', { uid: listing.owner_id }),
    supabase.from('property_listings').select(CARD_SELECT).eq('status', 'active').eq('listing_type', deal).ilike('city', listing.city).neq('id', listing.id)
      .order('society_verified', { ascending: false }).order('created_at', { ascending: false }).limit(3),
  ]);
  const saved = ((savedRes as any).count ?? 0) > 0;
  const lead = ((leadsRes as any).data ?? []).find((r: any) => r.listing_id === listing.id) ?? { calls: 0, whatsapp: 0 };
  const seller = ((sellerRes as any).data ?? [])[0] as any;
  const similar = ((similarRes as any).data ?? []) as any[];
  const photos = [...(listing.listing_photos ?? [])].sort((a: any, b: any) => a.sort - b.sort);
  const size = sizeLabel(listing.area_value, listing.area_unit, listing.plot_size);
  const where = [listing.society?.name, listing.area_text, listing.city].filter(Boolean).join(' · ');

  const quick = [
    size && { icon: Maximize2, label: 'Size', value: size },
    listing.bedrooms != null && { icon: BedDouble, label: 'Bedrooms', value: listing.bedrooms },
    listing.bathrooms != null && { icon: Bath, label: 'Bathrooms', value: listing.bathrooms },
    listing.kitchens != null && { icon: UtensilsCrossed, label: 'Kitchens', value: listing.kitchens },
    listing.floors != null && { icon: Layers, label: 'Manzilen', value: listing.floors },
    listing.parking != null && { icon: Car, label: 'Parking', value: listing.parking },
  ].filter(Boolean) as { icon: any; label: string; value: any }[];

  const details: [string, any][] = (
    [
      ['Qisam', typeLabel(listing.property_type)],
      ['Covered area', listing.covered_sqft ? `${Number(listing.covered_sqft).toLocaleString('en-US')} sq. ft` : null],
      ['Furnished', furnishLabel(listing.furnished)],
      ['Rukh (facing)', listing.facing],
      ['Banane ka saal', listing.year_built],
      ['Corner', listing.corner ? 'Haan' : null],
      ['Park facing', listing.park_facing ? 'Haan' : null],
      ['Main road', listing.main_road ? 'Haan' : null],
    ] as [string, any][]
  ).filter(([, v]) => v !== null && v !== undefined && v !== '');

  const terms: [string, any][] = (
    rent
      ? [
          ['Mahana kiraya', pkPrice(listing.price)],
          ['Security deposit', listing.advance ? pkPrice(listing.advance) : null],
          ['Advance kiraya', listing.advance_months ? `${listing.advance_months} mahine` : null],
          ['Kam az kam muddat', listing.min_lease_months ? `${listing.min_lease_months} mahine` : null],
          ['Portion', portionLabel(listing.portion)],
          ['Kis ko', tenantLabel(listing.tenant_pref)],
          ['Kab se khali', listing.available_from ? fmtDate(listing.available_from) : 'Foran'],
          ['Maintenance', listing.maintenance ? `${pkPrice(listing.maintenance)} / mahina` : null],
          ['Bills kiraye mein', listing.bills_included ? 'Shamil hain' : 'Alag'],
        ]
      : [
          ['Demand', pkPrice(listing.price)],
          ['Negotiable', listing.negotiable ? 'Haan, baat ho sakti hai' : 'Fixed demand'],
          ['Malkiyat', ownershipLabel(listing.ownership)],
          ['Qabza', possessionLabel(listing.possession)],
          ['Kaghzat clear', yes(listing.documents_clear)],
          ['Qistein', listing.installments ? listing.installment_note || 'Haan' : null],
        ]
  ).filter(([, v]) => v !== null && v !== undefined && v !== '') as [string, any][];

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    url: `${siteUrl()}/properties/${listing.id}`,
    price: Number(listing.price),
    priceCurrency: 'PKR',
    businessFunction: rent ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell',
    availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    itemOffered: {
      '@type': listing.property_type === 'plot' ? 'Place' : 'Accommodation',
      name: listing.title,
      numberOfBedrooms: listing.bedrooms ?? undefined,
      numberOfBathroomsTotal: listing.bathrooms ?? undefined,
      address: { '@type': 'PostalAddress', addressLocality: listing.city, streetAddress: listing.area_text ?? undefined, addressCountry: 'PK' },
      image: photos.map((p: any) => storagePublicUrl(p.path)),
    },
  };

  const Facts = ({ rows }: { rows: [string, any][] }) => (
    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
          <dt className="text-ink-mute">{k}</dt>
          <dd className="text-right font-semibold text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <nav className="mb-3 flex items-center gap-1 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href="/properties">Property</Link><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/properties/${deal}`}>{rent ? 'Kiraye ke ghar' : 'Bikne wale ghar'}</Link>
      </nav>
      <Flash searchParams={searchParams} />
      {listing.status !== 'active' && (
        <div className="mb-4 rounded-xl bg-plate-soft p-3 text-sm font-semibold text-plate-ink">Yeh listing: {statusLabel[listing.status] ?? listing.status}</div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <img src={storagePublicUrl(photos[0].path)!} alt={`${listing.title} — photo 1`} className="h-64 w-full rounded-2xl object-cover sm:h-80 md:col-span-2 md:h-96" />
          {photos.length > 1 && (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
              {photos.slice(1, 4).map((p: any, i: number) => <img key={p.id} src={storagePublicUrl(p.path)!} alt={`${listing.title} — photo ${i + 2}`} loading="lazy" className="h-24 w-full rounded-xl object-cover md:h-[7.6rem]" />)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-2xl bg-property-soft text-property"><House className="h-14 w-14" strokeWidth={1.5} aria-hidden="true" /></div>
      )}
      {photos.length > 4 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.slice(4).map((p: any, i: number) => <img key={p.id} src={storagePublicUrl(p.path)!} alt={`${listing.title} — photo ${i + 5}`} loading="lazy" className="h-24 w-32 shrink-0 rounded-lg object-cover" />)}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${rent ? 'bg-ink text-white' : 'bg-property text-white'}`}>{rent ? 'Kiraye par' : 'Bikao'} · {typeLabel(listing.property_type)}</span>
              {listing.society_verified && <span className="badge bg-paid-soft text-paid-ink"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Society verified malik</span>}
              {!rent && listing.installments && <span className="badge bg-plate-soft text-plate-ink">Qiston par</span>}
            </div>
            <h1 className="mt-2 break-words">{listing.title}</h1>
            <p className="mt-1 flex items-start gap-1 text-ink-mute"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{where}</p>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold text-property-ink">{pkPrice(listing.price)}</span>
            <span className="text-ink-mute">{rent ? '/ mahina' : listing.negotiable ? 'demand · negotiable' : 'demand · fixed'}</span>
            {rent && listing.advance ? <span className="text-sm text-ink-soft">+ {pkPrice(listing.advance)} security</span> : null}
          </div>

          {quick.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {quick.map((q) => (
                <div key={q.label} className="rounded-xl border border-line bg-white p-3 text-center">
                  <q.icon className="mx-auto h-5 w-5 text-property" aria-hidden="true" />
                  <div className="mt-1 text-sm font-bold text-ink">{q.value}</div>
                  <div className="text-[11px] text-ink-mute">{q.label}</div>
                </div>
              ))}
            </div>
          )}

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-base">{rent ? 'Kiraye ki shartein' : 'Sale ki tafseel'}</h2>
            <div className="mt-2"><Facts rows={terms} /></div>
          </section>

          {details.length > 0 && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-base">Property ki tafseel</h2>
              <div className="mt-2"><Facts rows={details} /></div>
            </section>
          )}

          {(listing.utilities?.length > 0 || listing.features?.length > 0) && (
            <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
              {listing.utilities?.length > 0 && (
                <div>
                  <h2 className="text-base">Sahuliyat</h2>
                  <div className="mt-2 flex flex-wrap gap-2">{listing.utilities.map((u: string) => <span key={u} className="rounded-full bg-paid-soft px-3 py-1 text-sm text-paid-ink">{u}</span>)}</div>
                </div>
              )}
              {listing.features?.length > 0 && (
                <div>
                  <h2 className="text-base">Khoobiyan</h2>
                  <div className="mt-2 flex flex-wrap gap-2">{listing.features.map((u: string) => <span key={u} className="rounded-full bg-property-soft px-3 py-1 text-sm text-property-ink">{u}</span>)}</div>
                </div>
              )}
            </section>
          )}

          {listing.description && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-base">Malik ki zubani</h2>
              <p className="mt-2 whitespace-pre-line break-words text-sm text-ink-soft">{listing.description}</p>
            </section>
          )}

          {(listing.address_line || listing.map_url) && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-base">Location</h2>
              {listing.address_line && <p className="mt-2 text-sm text-ink-soft">{listing.address_line}</p>}
              {listing.map_url && (
                <a href={listing.map_url} target="_blank" rel="noopener nofollow" className="btn-outline btn-sm mt-3"><MapPin className="h-4 w-4" aria-hidden="true" /> Google map par dekhein</a>
              )}
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-3 rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-3">
              {seller?.avatar_path ? (
                <img src={storagePublicUrl(seller.avatar_path)!} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-property-soft text-property"><UserRound className="h-6 w-6" aria-hidden="true" /></span>
              )}
              <div className="min-w-0">
                <div className="text-xs text-ink-mute">{rent ? 'Ghar ka malik' : 'Bechne wala'}</div>
                <div className="truncate font-semibold text-ink">{seller?.full_name || 'Member'}</div>
                {seller && <div className="text-xs text-ink-mute">Member {fmtDate(seller.member_since)} se</div>}
              </div>
            </div>
            {seller && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                <span>{Number(seller.active_sale) + Number(seller.active_rent)} live listings</span>
                {Number(seller.closed) > 0 && <span>{seller.closed} deals mukammal</span>}
                {Number(seller.verified) > 0 && <span className="inline-flex items-center gap-0.5 text-paid-ink"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Society verified</span>}
              </div>
            )}
            {listing.status === 'active' && !isOwner && (
              <ContactButtons phone={listing.contact_phone} listingId={listing.id} message={`Assalam o Alaikum, Housing Welfare par aap ki listing "${listing.title}" (${pkPrice(listing.price)}${rent ? ' / mahina' : ''}) dekhi. Kya yeh abhi available hai?`} />
            )}
            {listing.status !== 'active' && !isOwner && <p className="rounded-lg bg-canvas p-3 text-sm text-ink-soft">Yeh listing ab available nahi.</p>}
            <Link href={`/properties/seller/${listing.owner_id}`} className="btn-outline btn-sm w-full">
              {rent ? 'Malik' : 'Seller'} ki profile aur listings
            </Link>
            {!isOwner && (
              <form action={toggleSave}>
                <input type="hidden" name="listing_id" value={listing.id} />
                <input type="hidden" name="saved" value={saved.toString()} />
                <SubmitButton className="btn-outline btn-sm w-full">
                  {saved ? <><BookmarkCheck className="h-4 w-4 text-property" aria-hidden="true" /> Saved</> : <><Bookmark className="h-4 w-4" aria-hidden="true" /> Save karein</>}
                </SubmitButton>
              </form>
            )}
            <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-ink-mute">
              <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{listing.views} views</span>
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{fmtDate(listing.created_at)}</span>
            </div>
          </div>

          {isOwner && (
            <div className="space-y-3 rounded-2xl border-2 border-property/40 bg-white p-5">
              <h2 className="text-base">Meri listing</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-canvas p-2"><Eye className="mx-auto h-4 w-4 text-ink-mute" aria-hidden="true" /><div className="font-bold">{listing.views}</div><div className="text-[11px] text-ink-mute">Views</div></div>
                <div className="rounded-xl bg-canvas p-2"><Phone className="mx-auto h-4 w-4 text-ink-mute" aria-hidden="true" /><div className="font-bold">{lead.calls}</div><div className="text-[11px] text-ink-mute">Calls</div></div>
                <div className="rounded-xl bg-canvas p-2"><IconWhatsApp className="mx-auto h-4 w-4 text-ink-mute" /><div className="font-bold">{lead.whatsapp}</div><div className="text-[11px] text-ink-mute">WhatsApp</div></div>
              </div>
              <Link href={`/properties/${listing.id}/edit`} className="btn w-full bg-property hover:bg-property-ink"><Pencil className="h-4 w-4" aria-hidden="true" /> Edit karein</Link>
              <div className="grid grid-cols-2 gap-2">
                {[rent ? 'rented' : 'sold', listing.status === 'active' ? 'hidden' : 'active'].filter((s) => s !== listing.status).map((s) => (
                  <form key={s} action={setListingStatus}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <input type="hidden" name="status" value={s} />
                    <SubmitButton className="btn-outline btn-sm w-full">{{ rented: 'Rent ho gaya', sold: 'Bik gaya', hidden: 'Chupa dein', active: 'Dobara live' }[s]}</SubmitButton>
                  </form>
                ))}
              </div>
              <form action={deleteListing}>
                <input type="hidden" name="listing_id" value={listing.id} />
                <SubmitButton className="btn-outline btn-sm w-full border-due/40 text-due hover:bg-due-soft" confirm="Listing hamesha ke liye delete karein?">
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                </SubmitButton>
              </form>
            </div>
          )}

          {user && !isOwner && (
            <details className="rounded-2xl border border-line bg-white p-4">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft"><Flag className="h-4 w-4" aria-hidden="true" /> Fake / ghalat listing report karein</summary>
              <form action={submitComplaint} className="mt-3 space-y-2">
                <input type="hidden" name="listing_id" value={listing.id} />
                <textarea name="reason" rows={3} className="input" required placeholder="Kya ghalat hai?" />
                <SubmitButton className="btn-danger btn-sm">Report bhejein</SubmitButton>
              </form>
            </details>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3">{listing.city} mein aur {rent ? 'kiraye ke' : 'bikne wale'} ghar</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{similar.map((s) => <ListingCard key={s.id} l={s} />)}</div>
        </section>
      )}
    </div>
  );
}
