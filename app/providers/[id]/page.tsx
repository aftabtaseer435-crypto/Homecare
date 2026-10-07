import { serviceIcon } from '@/lib/icons';
import LogView from '@/components/LogView';
import { IconBag, IconVerified } from '@/components/Icons';
import HoursBadge from '@/components/HoursBadge';
import Link from 'next/link';
import { serviceImage } from '@/lib/serviceImages';
import ServiceThumb from '@/components/ServiceThumb';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Flash, RatingLine, Stars } from '@/components/ui';
import ContactButtons from '@/components/ContactButtons';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, storagePublicUrl } from '@/lib/format';
import { submitComplaint } from './actions';
import ReviewForm from '@/components/ReviewForm';
import { createPublicClient } from '@/lib/supabase/public';
import { jsonLd, siteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: p } = await createPublicClient()
    .from('providers')
    .select('display_name, city, area_note, rating_avg, rating_count, photo_path, provider_categories(category:service_categories(name))')
    .eq('id', params.id)
    .maybeSingle();
  if (!p) return { title: 'Provider', robots: { index: false } };
  const pr = p as any;
  const cats = pr.provider_categories.map((c: any) => c.category?.name).filter(Boolean).join(', ');
  const rating = pr.rating_count ? ` ${Number(pr.rating_avg).toFixed(1)}★ (${pr.rating_count} reviews).` : '';
  return {
    title: `${pr.display_name} — ${cats} in ${pr.city}`,
    description: `${pr.display_name}: CNIC-verified ${cats} in ${pr.city}${pr.area_note ? `, ${pr.area_note}` : ''}.${rating} Seedha call ya WhatsApp karein.`,
    alternates: { canonical: `/providers/${params.id}` },
    openGraph: pr.photo_path ? { images: [storagePublicUrl(pr.photo_path)!] } : undefined,
  };
}

export default async function ProviderProfile({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from('providers')
    .select('id, user_id, display_name, phone, whatsapp, photo_path, bio, city, area_note, experience_years, rate_note, rating_avg, rating_count, status, available, created_at, day_start, day_end, night_start, night_end, provider_categories(category:service_categories(name, slug, icon)), provider_societies(society:societies(name))')
    .eq('id', params.id)
    .single();
  if (!p) notFound();
  const prov = p as any;

  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: reviews }, contacted] = await Promise.all([
    supabase.from('reviews').select('id, stars, comment, created_at, user_id').eq('provider_id', params.id).order('created_at', { ascending: false }).limit(50),
    user
      ? Promise.all([
          supabase.from('contact_events').select('id', { count: 'exact', head: true }).eq('provider_id', params.id).eq('user_id', user.id).in('kind', ['call', 'whatsapp']),
          supabase.from('service_orders').select('id', { count: 'exact', head: true }).eq('provider_id', params.id).eq('customer_id', user.id).eq('status', 'done'),
        ]).then(([a, b]) => (a.count ?? 0) + (b.count ?? 0) > 0)
      : Promise.resolve(false),
  ]);
  const myReview = (reviews ?? []).find((r) => r.user_id === user?.id);

  const ld = prov.status === 'verified' ? {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: prov.display_name,
    url: `${siteUrl()}/providers/${prov.id}`,
    telephone: '+' + prov.phone,
    image: prov.photo_path ? storagePublicUrl(prov.photo_path) : undefined,
    address: { '@type': 'PostalAddress', addressLocality: prov.city, addressCountry: 'PK' },
    areaServed: prov.area_note || prov.city,
    knowsAbout: prov.provider_categories.map((c: any) => c.category?.name),
    ...(prov.rating_count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(prov.rating_avg), reviewCount: prov.rating_count } } : {}),
  } : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />}
      <Flash searchParams={searchParams} />
      {user && prov.user_id === user.id && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-ink">Ye aap ki profile hai — customers ko aise nazar aati hai</div>
            <div className="text-ink-soft">{prov.status === 'verified' ? 'Verified ✓' : prov.status === 'pending' ? 'Review mein — "Naya" badge ke sath list mein hai' : `Status: ${prov.status}`}</div>
          </div>
          <Link href="/provider/dashboard" className="btn btn-sm">Seller dashboard</Link>
          <Link href="/provider/dashboard?tab=profile" className="btn-outline btn-sm">Profile edit</Link>
        </div>
      )}
      {(prov.status === 'verified' || prov.status === 'pending') && prov.user_id !== user?.id && <LogView providerId={prov.id} />}
      {(prov.status === 'suspended' || prov.status === 'rejected') && (
        <div className="rounded-lg bg-due-soft p-3 text-sm text-due-ink">Yeh profile band hai (status: {prov.status}) aur list mein nazar nahi aati. Admin se rabta karein.</div>
      )}
      <div className="card flex flex-col gap-5 sm:flex-row">
        {prov.photo_path ? (
          <img src={storagePublicUrl(prov.photo_path)!} alt={prov.display_name} className="h-32 w-32 rounded-2xl object-cover" />
        ) : (
          <ServiceThumb src={serviceImage(prov.provider_categories[0]?.category?.slug ?? '', 256)} slug={prov.provider_categories[0]?.category?.slug} className="h-32 w-32 rounded-2xl" />
        )}
        <div className="flex-1 space-y-2">
          <h1 className="flex items-center gap-2">{prov.display_name}{prov.status === 'verified' && <IconVerified className="h-6 w-6 text-service" />}</h1>
          <RatingLine avg={Number(prov.rating_avg)} count={prov.rating_count} />
          <div className="flex flex-wrap gap-2">
            {prov.status === 'verified' ? <span className="badge bg-paid-soft text-paid-ink">✓ CNIC Verified</span> : prov.status === 'pending' ? <span className="badge bg-plate-soft text-plate-ink">Naya — verification jari</span> : null}
            {!prov.available && <span className="badge bg-canvas text-ink-soft">Abhi busy</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {prov.provider_categories.map((c: any) => (
              <Link key={c.category.slug} href={`/services/${c.category.slug}`} className="badge bg-canvas text-ink-soft no-underline">{(() => { const I = serviceIcon(c.category.slug); return <I className="h-3.5 w-3.5" aria-hidden="true" />; })()} {c.category.name}</Link>
            ))}
          </div>
          <div className="muted">
            {prov.city}{prov.area_note ? ` · ${prov.area_note}` : ''}
            {prov.experience_years ? ` · ${prov.experience_years} saal tajurba` : ''}
          </div>
          <HoursBadge h={prov} available={prov.available} />
          {prov.rate_note && <div className="text-sm"><b>Rates:</b> {prov.rate_note}</div>}
          <div className="grid max-w-md gap-2 pt-2">
            {(prov.status === 'verified' || prov.status === 'pending') && prov.user_id !== user?.id && (
              <Link href={`/providers/${prov.id}/order`} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-service text-sm font-semibold text-white no-underline hover:bg-service-ink hover:no-underline">
                <IconBag className="h-4 w-4" /> Order / kaam bhejein
              </Link>
            )}
            <ContactButtons phone={prov.phone} whatsapp={prov.whatsapp} providerId={prov.id} message="Assalam o Alaikum, aap ka number Housing Welfare se mila." />
          </div>
        </div>
      </div>

      {prov.bio && (
        <div className="card">
          <h2 className="mb-2">Taaruf</h2>
          <p className="whitespace-pre-line text-sm">{prov.bio}</p>
        </div>
      )}

      {prov.provider_societies.length > 0 && (
        <div className="card">
          <h2 className="mb-2">In societies mein kaam karta hai</h2>
          <div className="flex flex-wrap gap-2">
            {prov.provider_societies.map((s: any, i: number) => <span key={i} className="badge bg-brand-50 text-brand-700">{s.society?.name}</span>)}
          </div>
        </div>
      )}

      <div id="reviews" className="card scroll-mt-24">
        <h2 className="mb-3">Reviews ({prov.rating_count})</h2>
        {user && contacted && (
          <div className="mb-5 rounded-xl bg-canvas p-4">
            <ReviewForm providerId={prov.id} providerName={prov.display_name} next={`/providers/${prov.id}`} initialStars={myReview?.stars ?? 0} initialComment={myReview?.comment ?? ''} />
          </div>
        )}
        {user && !contacted && <p className="muted mb-4">Call, WhatsApp ya order mukammal hone ke baad aap review de sakte hain.</p>}
        {(reviews ?? []).length === 0 ? (
          <p className="muted">Abhi koi review nahi.</p>
        ) : (
          <ul className="space-y-3">
            {(reviews ?? []).map((r) => (
              <li key={r.id} className="border-b border-line pb-3">
                <Stars value={r.stars} /> <span className="muted ml-2">{fmtDate(r.created_at)}</span>
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {user && user.id !== prov.user_id && (
        <details className="card">
          <summary className="cursor-pointer text-sm text-ink-soft">Shikayat / report karein</summary>
          <form action={submitComplaint} className="mt-3 space-y-2">
            <input type="hidden" name="provider_id" value={prov.id} />
            <textarea name="reason" rows={3} className="input" required placeholder="Kya masla hua?" />
            <SubmitButton className="btn-danger">Report bhejein</SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}
