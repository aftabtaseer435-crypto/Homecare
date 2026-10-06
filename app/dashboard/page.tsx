import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { dueStatusStyle, fmtDate, houseLabel, rs } from '@/lib/format';
import { Flash } from '@/components/ui';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireUser('/dashboard');

  const [{ data: myOwners }, { data: staff }, { data: provider }, { data: requests }, { data: listings }] =
    await Promise.all([
      supabase
        .from('house_owners')
        .select('id, status, house:houses(id, block, street, house_no, society:societies(id, name))')
        .eq('user_id', user.id),
      supabase.from('society_members').select('role, society:societies(id, name, city)').eq('user_id', user.id),
      supabase.from('providers').select('id, display_name, status').eq('user_id', user.id).maybeSingle(),
      supabase.from('society_requests').select('id, society_name, status, created_at').eq('requester_id', user.id).order('created_at', { ascending: false }),
      supabase.from('property_listings').select('id').eq('owner_id', user.id),
    ]);

  const verifiedHouseIds = (myOwners ?? []).filter((o) => o.status === 'verified').map((o: any) => o.house.id);
  const { data: dues } = verifiedHouseIds.length
    ? await supabase
        .from('fund_dues')
        .select('house_id, status, amount_due, paid_amount, due_date, period, plan:fund_plans(name)')
        .in('house_id', verifiedHouseIds)
        .order('due_date', { ascending: false })
    : { data: [] as any[] };

  const latestByHouse = new Map<string, any>();
  for (const d of dues ?? []) if (!latestByHouse.has(d.house_id)) latestByHouse.set(d.house_id, d);

  return (
    <div className="space-y-8">
      <Flash searchParams={searchParams} />
      <div>
        <h1>Assalam o Alaikum, {profile.full_name}</h1>
        <p className="muted">Aap ka account</p>
      </div>

      {/* Houses */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2>Mere ghar</h2>
          <Link href="/societies/join" className="btn-outline btn-sm">+ Ghar add karein</Link>
        </div>
        {(myOwners ?? []).length === 0 ? (
          <div className="card text-sm text-gray-500">Abhi koi ghar register nahi. <Link href="/societies/join">Apni society dhoond kar ghar add karein.</Link></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(myOwners ?? []).map((o: any) => {
              const d = latestByHouse.get(o.house.id);
              const st = dueStatusStyle(d?.status);
              return (
                <div key={o.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{o.house.society?.name}</div>
                      <div className="muted">{houseLabel(o.house)}</div>
                    </div>
                    {o.status === 'verified' ? (
                      <span className={`badge ${st.cls} px-3 py-1 text-sm`}>{st.label}</span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-800">{o.status === 'pending' ? 'Verification pending' : 'Rejected'}</span>
                    )}
                  </div>
                  {o.status === 'verified' && d && (
                    <div className="mt-3 text-sm">
                      {d.plan?.name} ({d.period}): {rs(d.amount_due)} — due {fmtDate(d.due_date)}
                      {d.status !== 'paid' && d.status !== 'exempt' && <> · baqi {rs(Number(d.amount_due) - Number(d.paid_amount))}</>}
                    </div>
                  )}
                  {o.status === 'verified' && (
                    <Link href={`/my/houses/${o.house.id}`} className="mt-3 inline-block text-sm font-semibold">History aur payment →</Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Society admin */}
      {(staff ?? []).length > 0 && (
        <section>
          <h2 className="mb-3">Society admin panel</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {(staff ?? []).map((m: any) => (
              <Link key={m.society.id} href={`/s/${m.society.id}`} className="card no-underline hover:border-brand-500">
                <div className="font-semibold text-gray-900">{m.society.name}</div>
                <div className="muted">{m.society.city} · {m.role === 'admin' ? 'Admin' : 'Collector'}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(requests ?? []).some((r) => r.status === 'pending') && (
        <section className="card text-sm">
          Aap ki society request{' '}
          <b>{requests!.find((r) => r.status === 'pending')!.society_name}</b> review mein hai. Approve hote hi admin panel yahan nazar aayega.
        </section>
      )}

      {/* Other modules */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h2>Services</h2>
          {provider ? (
            <p className="muted mt-1">Provider profile: <b>{provider.display_name}</b> ({provider.status})</p>
          ) : (
            <p className="muted mt-1">Electrician, plumber, masi waghera dhoondein.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/services" className="btn btn-sm">Service dhoondein</Link>
            <Link href={provider ? '/provider/dashboard' : '/provider/register'} className="btn-outline btn-sm">
              {provider ? 'Provider dashboard' : 'Provider banein'}
            </Link>
          </div>
        </div>
        <div className="card">
          <h2>Rent / Sale</h2>
          <p className="muted mt-1">Meri listings: {(listings ?? []).length}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/properties/new" className="btn btn-sm">Ghar list karein</Link>
            <Link href="/my/listings" className="btn-outline btn-sm">Meri listings</Link>
          </div>
        </div>
        <div className="card">
          <h2>Society</h2>
          <p className="muted mt-1">Apni society abhi tak platform par nahi?</p>
          <Link href="/societies/register" className="btn-outline btn-sm mt-3">Society register karein</Link>
        </div>
      </section>
    </div>
  );
}
