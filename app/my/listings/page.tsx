import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Empty, Flash, PageHeader } from '@/components/ui';
import { fmtDate, rs } from '@/lib/format';

export const metadata = { title: 'Meri listings' };

export default async function MyListings({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/my/listings');
  const [{ data: mine }, { data: saved }] = await Promise.all([
    supabase.from('property_listings').select('id, title, listing_type, price, status, views, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('saved_listings').select('listing:property_listings(id, title, listing_type, price, city, status)').eq('user_id', user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Meri listings" action={<Link href="/properties/new" className="btn bg-property hover:bg-property-ink">+ Nayi listing</Link>} />
      <Flash searchParams={searchParams} />
      {(mine ?? []).length === 0 ? (
        <Empty href="/properties/new" cta="Ghar list karein">Abhi koi listing nahi.</Empty>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Listing</th><th>Type</th><th>Price</th><th>Status</th><th>Views</th><th>Date</th></tr></thead>
            <tbody>
              {(mine ?? []).map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/properties/${l.id}`}>{l.title}</Link></td>
                  <td className="capitalize">{l.listing_type}</td>
                  <td>{rs(l.price)}</td>
                  <td>{l.status}</td>
                  <td>{l.views}</td>
                  <td>{fmtDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Saved</h2>
      {(saved ?? []).length === 0 ? (
        <p className="muted">Koi saved listing nahi.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {((saved ?? []) as any[]).filter((s) => s.listing).map((s) => (
            <Link key={s.listing.id} href={`/properties/${s.listing.id}`} className="card no-underline hover:border-brand-500">
              <div className="font-semibold text-ink">{s.listing.title}</div>
              <div className="muted">{s.listing.city} · {rs(s.listing.price)} · {s.listing.status}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
