import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';

export const metadata = {
  title: 'Electrician, plumber, masi aur rickshaw — verified home services',
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
        subtitle="Category choose karein — apne area ke verified providers, rating ke sath. Seedha call ya WhatsApp."
        action={<Link href="/provider/register" className="btn-outline">Provider ban kar register karein</Link>}
      />
      <div className="space-y-8">
        {Array.from(groups.entries()).map(([grp, list]) => (
          <section key={grp}>
            <h2 className="mb-3">{grp}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {list.map((c) => (
                <Link key={c.id} href={`/services/${c.slug}`} className="group flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-4 no-underline hover:border-brand-500 hover:no-underline">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-2xl group-hover:bg-brand-50">{c.icon}</span>
                  <span><span className="block font-semibold text-ink">{c.name}</span>
                  {c.name_ur && <span className="block text-sm text-ink-mute" dir="rtl">{c.name_ur}</span>}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
