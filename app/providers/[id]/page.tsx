import LogView from '@/components/LogView';
import HoursBadge from '@/components/HoursBadge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Flash, RatingLine, Stars } from '@/components/ui';
import ContactButtons from '@/components/ContactButtons';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, storagePublicUrl } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { submitComplaint, submitReview } from './actions';
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
      {(prov.status === 'verified' || prov.status === 'pending') && prov.user_id !== user?.id && <LogView providerId={prov.id} />}
      {(prov.status === 'suspended' || prov.status === 'rejected') && (
        <div className="rounded-lg bg-due-soft p-3 text-sm text-due-ink">Yeh profile band hai (status: {prov.status}) aur list mein nazar nahi aati. Admin se rabta karein.</div>
      )}
      <div className="card flex flex-col gap-5 sm:flex-row">
        {prov.photo_path ? (
          <img src={storagePublicUrl(prov.photo_path)!} alt={prov.display_name} className="h-32 w-32 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-brand-50 text-5xl">{prov.provider_categories[0]?.category?.icon ?? '🛠️'}</div>
        )}
        <div className="flex-1 space-y-2">
          <h1>{prov.display_name}</h1>
          <RatingLine avg={Number(prov.rating_avg)} count={prov.rating_count} />
          <div className="flex flex-wrap gap-2">
            {prov.status === 'verified' ? <span className="badge bg-paid-soft text-paid-ink">✓ CNIC Verified</span> : prov.status === 'pending' ? <span className="badge bg-plate-soft text-plate-ink">Naya — verification jari</span> : null}
            {!prov.available && <span className="badge bg-canvas text-ink-soft">Abhi busy</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {prov.provider_categories.map((c: any) => (
              <Link key={c.category.slug} href={`/services/${c.category.slug}`} className="badge bg-canvas text-ink-soft no-underline">{c.category.icon} {c.category.name}</Link>
            ))}
          </div>
          <div className="muted">
            {prov.city}{prov.area_note ? ` · ${prov.area_note}` : ''}
            {prov.experience_years ? ` · ${prov.experience_years} saal tajurba` : ''}
          </div>
          <HoursBadge h={prov} available={prov.available} />
          {prov.rate_note && <div className="text-sm"><b>Rates:</b> {prov.rate_note}</div>}
          <div className="flex flex-wrap gap-2 pt-2">
            {(prov.status === 'verified' || prov.status === 'pending') && prov.user_id !== user?.id && (
              <Link href={`/providers/${prov.id}/order`} className="btn bg-service hover:bg-service-ink">🛍️ Order bhejein</Link>
            )}
            <ContactButtons phone={prov.phone} whatsapp={prov.whatsapp} providerId={prov.id} message="Assalam o Alaikum, aap ka number Housing Welfare se mila. Mujhe kaam karwana hai." />
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
          <form action={submitReview} className="mb-5 space-y-2 rounded-lg bg-canvas p-3">
            <input type="hidden" name="provider_id" value={prov.id} />
            <div className="flex items-center gap-3 text-sm">
              <span>Aap ka review:</span>
              <select name="stars" defaultValue={myReview?.stars ?? 5} className="input w-28">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
              </select>
            </div>
            <textarea name="comment" rows={2} defaultValue={myReview?.comment ?? ''} className="input" placeholder="Kaam kaisa raha?" />
            <SubmitButton className="btn bg-service hover:bg-service-ink btn-sm">{myReview ? 'Review update' : 'Review dein'}</SubmitButton>
          </form>
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
