import { ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import ServiceThumb from '@/components/ServiceThumb';
import { serviceImage, DELIVERY_GROUP } from '@/lib/serviceImages';

export const metadata = {
  title: 'Home services — saman mangwayein ya apni service bechein',
  description:
    'Chicken, sabzi, rashan, dawai ghar tak, aur verified electrician, plumber, masi. Kharidna hai to order bhejein; kaam karte ya dukaan chalate hain to free provider profile banayein.',
  alternates: { canonical: '/services' },
};

export default async function ServicesChooser() {
  const { supabase, user } = await getSession();
  const [{ data: daily }, prov, active] = await Promise.all([
    supabase.from('service_categories').select('slug, name, icon').eq('active', true).eq('grp', DELIVERY_GROUP).order('sort').limit(6),
    user ? supabase.from('providers').select('id, status').eq('user_id', user.id).maybeSingle().then((r) => r.data) : Promise.resolve(null),
    user
      ? supabase.from('service_orders').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).in('status', ['new', 'accepted']).then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ]);
  const newForMe = prov
    ? await supabase.from('service_orders').select('id', { count: 'exact', head: true }).eq('provider_id', prov.id).eq('status', 'new').then((r) => r.count ?? 0)
    : 0;

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Home services</p>
        <h1 className="mt-1 text-[1.9rem] md:text-[2.4rem]">Aap kya karna chahte hain?</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link href="/services/find" className="group flex flex-col rounded-3xl border border-line bg-white p-6 no-underline transition-shadow hover:border-service hover:shadow-lift hover:no-underline md:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-service-soft text-service" aria-hidden="true"><ShoppingBag className="h-7 w-7" strokeWidth={1.8} /></span>
          <h2 className="mt-5 text-2xl text-ink">Mujhe kuch chahiye</h2>
          <p className="mt-2 flex-1 text-ink-soft">Saman mangwayein ya kaam karwayein — chicken, sabzi, rashan, electrician, plumber, masi.</p>
          <span className="btn mt-6 self-start bg-service group-hover:bg-service-ink">Kharidna / mangwana hai →</span>
        </Link>

        <Link href="/provider" className="group flex flex-col rounded-3xl border border-line bg-white p-6 no-underline transition-shadow hover:border-brand-500 hover:shadow-lift hover:no-underline md:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600" aria-hidden="true"><Store className="h-7 w-7" strokeWidth={1.8} /></span>
          <h2 className="mt-5 text-2xl text-ink">Main kaam karta / bechta hoon</h2>
          <p className="mt-2 flex-1 text-ink-soft">Kaarigar ya dukaan — free profile banayein aur orders paayein.</p>
          <span className="btn mt-6 self-start group-hover:bg-brand-700">{prov ? 'Mera provider dashboard →' : 'Provider / dukaan register karein →'}</span>
        </Link>
      </div>

      {user && (active > 0 || prov) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {active > 0 && <Link href="/my/orders" className="badge bg-service-soft px-3 py-1.5 text-service-ink no-underline">Aap ki {active} order jari hain →</Link>}
          {prov && newForMe > 0 && <Link href="/provider/dashboard" className="badge bg-plate-soft px-3 py-1.5 text-plate-ink no-underline">{newForMe} naye order aap ke liye →</Link>}
        </div>
      )}

      {(daily ?? []).length > 0 && (
        <section>
          <h2 className="mb-4">Ya seedha mangwayein</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {(daily ?? []).map((c) => (
              <Link key={c.slug} href={`/services/${c.slug}`} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-3 text-center text-sm font-medium text-ink no-underline hover:border-service hover:no-underline">
                <ServiceThumb src={serviceImage(c.slug)} slug={c.slug} />
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
