import Link from 'next/link';
import { BadgeCheck, BedDouble, Bath, House, Maximize2 } from 'lucide-react';
import { storagePublicUrl } from '@/lib/format';
import { firstPhoto, pkPrice, portionLabel, sizeLabel, tenantLabel, typeLabel } from '@/lib/property';

/** One property in a list — price first, then what it is and where. No phone number. */
export default function ListingCard({ l }: { l: any }) {
  const photo = firstPhoto(l);
  const rent = l.listing_type === 'rent';
  const size = sizeLabel(l.area_value, l.area_unit, l.plot_size);
  const tags = rent
    ? [l.portion && l.portion !== 'full' && portionLabel(l.portion), l.tenant_pref && tenantLabel(l.tenant_pref)]
    : [l.installments && 'Qiston par', l.negotiable && 'Negotiable', l.corner && 'Corner', l.park_facing && 'Park facing'];
  return (
    <Link href={`/properties/${l.id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white no-underline transition hover:border-property/60 hover:shadow-md hover:no-underline">
      <div className="relative aspect-[4/3] bg-canvas">
        {photo ? (
          <img src={storagePublicUrl(photo)!} alt={l.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-property-soft text-property"><House className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" /></div>
        )}
        <span className={`badge absolute left-2 top-2 ${rent ? 'bg-ink text-white' : 'bg-property text-white'}`}>{rent ? 'Kiraye par' : 'Bikao'} · {typeLabel(l.property_type)}</span>
        {l.society_verified && (
          <span className="badge absolute right-2 top-2 gap-1 bg-paid text-white"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Society verified</span>
        )}
        {l.status && l.status !== 'active' && <span className="badge absolute bottom-2 left-2 bg-white text-ink">{({ sold: 'Bik gaya', rented: 'Rent ho gaya', hidden: 'Chupi hui' } as any)[l.status]}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="text-lg font-bold text-ink">
          {pkPrice(l.price)}
          {rent ? <span className="text-sm font-normal text-ink-mute"> / mahina</span> : <span className="text-sm font-normal text-ink-mute"> demand</span>}
        </div>
        <div className="line-clamp-2 font-semibold leading-snug text-ink group-hover:text-property-ink">{l.title}</div>
        <div className="truncate text-sm text-ink-mute">{[l.society?.name, l.area_text, l.city].filter(Boolean).join(' · ')}</div>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-ink-soft">
          {size && <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />{size}</span>}
          {l.bedrooms ? <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" aria-hidden="true" />{l.bedrooms} bed</span> : null}
          {l.bathrooms ? <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" aria-hidden="true" />{l.bathrooms} bath</span> : null}
        </div>
        {tags.some(Boolean) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.filter(Boolean).map((t) => <span key={t as string} className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-soft">{t}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}
