import ServiceThumb from '@/components/ServiceThumb';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';
import { DELIVERY_GROUP, serviceImage } from '@/lib/serviceImages';

export const metadata = {
  title: 'Electrician, plumber, masi, sabzi, dawai ghar tak — verified home services',
  description: 'Apni society aur area ke CNIC-verified electrician, plumber, masi, AC repair, rickshaw aur mistri. Rating dekhein aur seedha call ya WhatsApp karein. Koi commission nahi.',
  alternates: { canonical: '/services' },
};

export default async function Services() {
  const supabase = createClient();
  const { data: cats } = await supabase.from('service_categories').select('id, slug, name, name_ur, grp, icon, sort').eq('active', true).order('sort');

  const groups = new Map<string, NonNullable<typeof cats>>();
  for (const c of cats ?? []) {
    if (!groups.has(c.grp)) groups.set(c.grp, []);
    groups.get(c.grp)!.push(c);
  }

  return (
    <div>
      <PageHeader
        title="Kis kaam ke liye banda chahiye?"
        subtitle="Ghar ka kaam ho ya rozmarra ka saman — apne area ke verified log aur dukanein, rating aur auqaat ke sath. Seedha call ya WhatsApp."
        action={<Link href="/provider/register" className="btn-outline">Provider ban kar register karein</Link>}
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
                  <ServiceThumb src={serviceImage(c.slug)} icon={c.icon} />
                  <span><span className="block font-semibold text-ink">{c.name}</span>
                  {c.name_ur && <span className="block text-sm text-ink-mute"><span dir="rtl">{c.name_ur}</span></span>}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
