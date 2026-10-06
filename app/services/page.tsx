import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';

export const metadata = { title: 'Home Services — Electrician, Plumber, Masi, Rickshaw' };

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
                <Link key={c.id} href={`/services/${c.slug}`} className="card flex flex-col items-center gap-1 py-5 text-center no-underline hover:border-brand-500">
                  <span className="text-3xl">{c.icon}</span>
                  <span className="font-semibold text-gray-900">{c.name}</span>
                  {c.name_ur && <span className="text-sm text-gray-500" dir="rtl">{c.name_ur}</span>}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
