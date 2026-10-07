/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import ContactButtons from './ContactButtons';
import ServiceThumb from './ServiceThumb';
import { IconBag, IconClock, IconPin, IconTool, IconVerified } from './Icons';
import { RatingLine } from './ui';
import { storagePublicUrl } from '@/lib/format';
import { serviceImage } from '@/lib/serviceImages';
import { hoursLabel, isOpenNow, opensAt } from '@/lib/hours';

/** One provider / dukaan in a category list (buyer view). Number stays hidden. */
export default function ProviderCard({
  p,
  cat,
  isDelivery,
  mySociety,
}: {
  p: any;
  cat: { slug: string; name: string; icon: string | null };
  isDelivery: boolean;
  mySociety?: boolean;
}) {
  const open = p.available && isOpenNow(p);
  const hours = hoursLabel(p);
  const message = isDelivery
    ? `Assalam o Alaikum, Housing Welfare se aap ka number mila. Mujhe ghar par ${cat.name} mangwana hai: `
    : `Assalam o Alaikum, Housing Welfare se aap ka number mila. Mujhe ${cat.name} ka kaam karwana hai.`;
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-soft">
      <div className="flex gap-3.5">
        <Link href={`/providers/${p.id}`} className="shrink-0" aria-label={p.display_name}>
          {p.photo_path ? (
            <img src={storagePublicUrl(p.photo_path)!} alt="" loading="lazy" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-line" />
          ) : (
            <ServiceThumb src={serviceImage(cat.slug, 160)} slug={cat.slug} className="h-16 w-16" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/providers/${p.id}`} className="flex min-w-0 items-center gap-1 text-[15px] font-semibold leading-tight text-ink no-underline hover:underline">
              <span className="truncate">{p.display_name}</span>
              {p.status === 'verified' && <IconVerified className="h-4 w-4 shrink-0 text-service" />}
            </Link>
            {p.status !== 'verified' && <span className="shrink-0 rounded-full bg-plate-soft px-2 py-0.5 text-[11px] font-semibold text-plate-ink">Naya</span>}
          </div>
          <div className="mt-1"><RatingLine avg={Number(p.rating_avg)} count={p.rating_count} /></div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
            <span className={`inline-flex items-center gap-1 font-medium ${open ? 'text-paid-ink' : 'text-ink-mute'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-paid' : 'bg-line'}`} aria-hidden="true" />
              {!p.available ? 'Abhi busy' : open ? 'Abhi khula' : `Band · ${opensAt(p) ?? ''}`}
            </span>
            <span className="inline-flex items-center gap-1"><IconPin className="h-3.5 w-3.5" />{p.area_note ? `${p.city} · ${p.area_note}` : p.city}</span>
            {mySociety && <span className="font-medium text-brand-700">Aap ki society</span>}
          </div>
        </div>
      </div>
      {(hours || p.rate_note) && (
        <div className="mt-3 space-y-1 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-soft">
          {hours && <div className="flex items-center gap-1.5"><IconClock className="h-3.5 w-3.5 shrink-0 text-ink-mute" />{hours}</div>}
          {p.rate_note && <div className="truncate">{p.rate_note}</div>}
        </div>
      )}
      <div className="mt-3 grid gap-2">
        <Link href={`/providers/${p.id}/order?cat=${cat.slug}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-service text-[13px] font-semibold text-white no-underline transition-colors hover:bg-service-ink hover:no-underline">
          {isDelivery ? <IconBag className="h-4 w-4" /> : <IconTool className="h-4 w-4" />} {isDelivery ? 'Order bhejein' : 'Kaam bhejein'}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <ContactButtons phone={p.phone} whatsapp={p.whatsapp} providerId={p.id} compact bare message={message} />
        </div>
      </div>
    </article>
  );
}
