import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { dueStatusStyle, fmtDate, houseLabel, rs } from '@/lib/format';
import { Flash } from '@/components/ui';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireUser('/dashboard');

  const [{ data: myOwners }, { data: staff }, { data: provider }, { data: requests }, { data: listings }] =
    await Promise.all([
      supabase.from('house_owners').select('id, status, house:houses(id, block, street, house_no, society:societies(id, name))').eq('user_id', user.id),
      supabase.from('society_members').select('role, society:societies(id, name, city)').eq('user_id', user.id),
      supabase.from('providers').select('id, display_name, status').eq('user_id', user.id).maybeSingle(),
      supabase.from('society_requests').select('id, society_name, status, created_at').eq('requester_id', user.id).order('created_at', { ascending: false }),
      supabase.from('property_listings').select('id, status').eq('owner_id', user.id),
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

  const pendingReq = (requests ?? []).find((r) => r.status === 'pending');
  const firstName = (profile.full_name ?? '').split(' ')[0];

  return (
    <div className="space-y-10">
      <Flash searchParams={searchParams} />
      <div>
        <h1 className="text-3xl font-extrabold">Assalam o Alaikum, {firstName}</h1>
        <p className="mt-1 text-ink-mute">Aaj kya karna hai?</p>
      </div>

      {/* Society admin panels first for admins — that's their daily job */}
      {(staff ?? []).length > 0 && (
        <section>
          <h2 className="mb-3">Meri societies (admin)</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(staff ?? []).map((m: any) => (
              <Link key={m.society.id} href={`/s/${m.society.id}`} className="group flex items-center gap-4 rounded-2xl bg-brand-800 p-5 text-white no-underline hover:bg-brand-900 hover:no-underline">
                <div className="flex-1">
                  <div className="font-display text-lg font-bold">{m.society.name}</div>
                  <div className="text-sm text-brand-100">{m.society.city} · {m.role === 'admin' ? 'Admin' : 'Collector'}</div>
                </div>
                <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold group-hover:bg-white/25">Panel kholein</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {pendingReq && (
        <div className="flex items-start gap-3 rounded-2xl border border-plate bg-plate-soft p-4 text-sm text-plate-ink">
          <span className="plate h-6 px-2 text-[11px]">!</span>
          <div>Aap ki society <b>{pendingReq.society_name}</b> ki request review mein hai. Hamari team call karegi; approve hote hi admin panel yahan aa jayega.</div>
        </div>
      )}

      {/* Houses */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2>Mere ghar</h2>
          <Link href="/societies/join" className="btn-outline btn-sm">Ghar add karein</Link>
        </div>
        {(myOwners ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 p-6">
            <p className="text-ink-soft">Abhi koi ghar add nahi. Apni society aur ghar number choose karein — admin approve karega to fund ka status yahan nazar aayega.</p>
            <Link href="/societies/join" className="btn mt-4">Apna ghar add karein</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(myOwners ?? []).map((o: any) => {
              const d = latestByHouse.get(o.house.id);
              const st = dueStatusStyle(d?.status);
              const balance = d ? Number(d.amount_due) - Number(d.paid_amount) : 0;
              const verified = o.status === 'verified';
              return (
                <div key={o.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <div className={`h-1.5 ${verified ? st.cls.split(' ')[0] : 'bg-plate'}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold">{o.house.society?.name}</div>
                        <div className="text-sm text-ink-mute">{houseLabel(o.house)}</div>
                      </div>
                      <span className="plate h-10 px-3 text-base">{o.house.house_no}</span>
                    </div>
                    {!verified ? (
                      <p className="mt-4 text-sm text-ink-soft">{o.status === 'pending' ? 'Society admin ke approval ka intezar hai.' : 'Request reject hui — society office se rabta karein.'}</p>
                    ) : d ? (
                      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <span className={`badge ${st.soft} text-sm`}>{st.label}</span>
                          <div className="mt-2 text-sm text-ink-soft">{d.plan?.name}, {d.period}</div>
                          {d.status !== 'paid' && d.status !== 'exempt' ? (
                            <div className="mt-1"><span className="font-display text-2xl font-bold">{rs(balance)}</span> <span className="text-sm text-ink-mute">due {fmtDate(d.due_date)}</span></div>
                          ) : (
                            <div className="mt-1 text-sm text-paid">Is period ka fund jama hai. Shukriya!</div>
                          )}
                        </div>
                        <Link href={`/my/houses/${o.house.id}`} className="btn-outline btn-sm">History aur payment</Link>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-ink-mute">Abhi koi fund due nahi.</p>
                        <Link href={`/my/houses/${o.house.id}`} className="btn-outline btn-sm">Ghar kholein</Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3">Aur kya kar sakte hain</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Action href="/services" title="Electrician, plumber, masi" body="Apne area ke verified log" />
          <Action href={provider ? '/provider/dashboard' : '/provider/register'} title={provider ? 'Provider dashboard' : 'Provider banein'} body={provider ? `${provider.display_name} (${provider.status})` : 'Apna kaam list karein, free'} />
          <Action href="/properties/new" title="Ghar rent / sale karein" body={`Meri listings: ${(listings ?? []).filter((l) => l.status === 'active').length} active`} sub={['Meri listings', '/my/listings']} />
          <Action href="/societies/register" title="Society register karein" body="Committee ke liye free" />
        </div>
      </section>

      <div className="text-sm text-ink-mute">
        Madad chahiye? <Link href="/guides">Guides parhein</Link>
        <span className="mx-2">|</span>
        <form action="/auth/signout" method="post" className="inline md:hidden"><button className="font-semibold text-due">Logout</button></form>
      </div>
    </div>
  );
}

function Action({ href, title, body, sub }: { href: string; title: string; body: string; sub?: [string, string] }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <Link href={href} className="font-semibold text-ink no-underline hover:text-brand-700 hover:no-underline">{title}</Link>
      <div className="mt-0.5 text-sm text-ink-mute">{body}</div>
      {sub && <Link href={sub[1]} className="mt-2 inline-block text-sm font-semibold">{sub[0]}</Link>}
    </div>
  );
}
