import ServiceThumb from '@/components/ServiceThumb';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';
import { DELIVERY_GROUP, serviceImage } from '@/lib/serviceImages';

export const metadata = {
  title: 'Electrician, plumber, masi, sabzi, dawai ghar tak — verified home services',
  description: 'Apni society aur area ke CNIC-verified electrician, plumber, masi, AC repair, rickshaw aur mistri. Rating dekhein aur seedha call ya WhatsApp karein. Koi commission nahi.',
  alternates: { canonical: '/services/find' },
};

export default async function Services() {
  const supabase = createClient();
  const [{ data: cats }, { data: links }] = await Promise.all([
    supabase.from('service_categories').select('id, slug, name, name_ur, grp, icon, sort').eq('active', true).order('sort'),
    supabase
      .from('provider_categories')
      .select('category_id, provider:providers!inner(id, display_name, status, rating_avg)')
      .in('provider.status', ['verified', 'pending'])
      .limit(5000),
  ]);
  // who is listed under each service button
  const people = new Map<string, { id: string; display_name: string; status: string; rating_avg: number }[]>();
  for (const l of (links ?? []) as any[]) {
    if (!l.provider) continue;
    people.set(l.category_id, [...(people.get(l.category_id) ?? []), l.provider]);
  }
  for (const arr of Array.from(people.values())) arr.sort((a, b) => Number(b.status === 'verified') - Number(a.status === 'verified') || Number(b.rating_avg) - Number(a.rating_avg));

  const groups = new Map<string, NonNullable<typeof cats>>();
  for (const c of cats ?? []) {
    if (!groups.has(c.grp)) groups.set(c.grp, []);
    groups.get(c.grp)!.push(c);
  }

  return (
    <div>
      <PageHeader
        title="Kya chahiye?"
        subtitle="Ghar ka kaam ho ya rozmarra ka saman — apne area ke verified log aur dukanein, rating aur auqaat ke sath. Seedha call ya WhatsApp."
        action={<Link href="/my/orders" className="btn-outline">Mere orders</Link>}
      />
      <div className="space-y-8">
        {Array.from(groups.entries()).map(([grp, list]) => (
          <section key={grp}>
            <h2 className="mb-1">{grp}</h2>
            {grp === DELIVERY_GROUP ? (
              <p className="mb-3 text-sm text-ink-mute">Chicken, sabzi, rashan, dawai, bakery — din ho ya raat, qareeb ki dukaan se ghar tak. &quot;Abhi khule hue&quot; filter se raat ko bhi dhoondein.</p>
            ) : <div className="mb-3" />}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {list.map((c) => (
                <Link key={c.id} href={`/services/${c.slug}`} className="group flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-4 no-underline hover:border-brand-500 hover:no-underline">
                  <ServiceThumb src={serviceImage(c.slug)} slug={c.slug} />
                  <span><span className="block font-semibold text-ink">{c.name}</span>
                  {c.name_ur && <span className="block text-sm text-ink-mute"><span dir="rtl">{c.name_ur}</span></span>}</span>
                  {(people.get(c.id) ?? []).length > 0 ? (
                    <span className="mt-auto block w-full border-t border-line pt-2 text-xs text-ink-soft">
                      {(people.get(c.id) ?? []).slice(0, 2).map((p) => <span key={p.id} className="block truncate">• {p.display_name}</span>)}
                      {(people.get(c.id) ?? []).length > 2 && <span className="block font-medium text-service-ink">+{(people.get(c.id) ?? []).length - 2} aur</span>}
                    </span>
                  ) : (
                    <span className="mt-auto block w-full border-t border-line pt-2 text-xs text-ink-mute">Abhi koi nahi</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
