import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { dueStatusStyle, fmtDate, houseLabel, rs } from '@/lib/format';
import { Flash } from '@/components/ui';
import { issueStatus } from '@/lib/welfare';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireUser('/dashboard');

  const [{ data: myOwners }, { data: staff }, { data: provider }, { data: requests }, { data: listings }, { data: myIssues }, { data: agentRows }] =
    await Promise.all([
      supabase.from('house_owners').select('id, status, house:houses(id, block, street, house_no, society:societies(id, name))').eq('user_id', user.id),
      supabase.from('society_members').select('role, society:societies(id, name, city)').eq('user_id', user.id),
      supabase.from('providers').select('id, display_name, status').eq('user_id', user.id).maybeSingle(),
      supabase.from('society_requests').select('id, society_name, status, created_at').eq('requester_id', user.id).order('created_at', { ascending: false }),
      supabase.from('property_listings').select('id, status').eq('owner_id', user.id),
      supabase.from('welfare_issues').select('id, ref_no, category, status').eq('reporter_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('welfare_agents').select('society_id, society:societies(name)').eq('user_id', user.id).eq('active', true),
    ]);
  // Super admin manages every society — show them all, not just memberships
  const { data: allSocieties } = profile.is_super_admin
    ? await supabase.from('societies').select('id, name, city').order('created_at', { ascending: false }).limit(50)
    : { data: null };
  const staffList: { id: string; name: string; city: string; role: string }[] = allSocieties
    ? (allSocieties as any[]).map((s) => ({ ...s, role: 'super' }))
    : ((staff ?? []) as any[]).map((m) => ({ ...m.society, role: m.role }));
  const agentSocieties = Array.from(new Map(((agentRows ?? []) as any[]).map((r) => [r.society_id, r.society?.name])).entries());

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
        <h1 className="text-3xl font-bold">Assalam o Alaikum, {firstName}</h1>
        <p className="mt-1 text-ink-mute">Aaj kya karna hai?</p>
      </div>

      {/* ===== Society Fund ===== */}
      <ModuleBlock tone="society" title="Society" action={<Link href="/societies/join" className="btn-outline btn-sm">Ghar add karein</Link>}>
      {/* Society admin panels first for admins — that's their daily job */}
      {staffList.length > 0 && (
        <section>
          <h3 className="mb-3">{profile.is_super_admin ? 'Tamam societies (Super Admin)' : 'Meri societies (admin panel)'}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {staffList.map((m) => (
              <Link key={m.id} href={`/s/${m.id}`} className="group flex items-center gap-4 rounded-2xl bg-brand-800 p-5 text-white no-underline hover:bg-brand-900 hover:no-underline">
                <div className="flex-1">
                  <div className="font-display text-lg font-semibold">{m.name}</div>
                  <div className="text-sm text-white/85">{m.city} · {m.role === 'super' ? 'Super Admin' : m.role === 'admin' ? 'Admin' : 'Collector'}</div>
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
        <h3 className="mb-3">Mere ghar</h3>
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
                            <div className="mt-1 text-sm text-paid-ink">Is period ka fund jama hai. Shukriya!</div>
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

        {/* Welfare + accountability */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Action href="/welfare" title="Masla report karein" body="Light, pani, gutter, legal — ek click mein gali ke welfare agent ko" />
          <Action href="/hisaab" title="Fund ka hisaab" body="Aap ka paisa kahan aur kitna laga — raseed ke sath" />
          <div className="rounded-2xl border border-line bg-canvas/50 p-4">
            <Link href="/welfare" className="font-bold text-ink no-underline hover:no-underline">Mere masle</Link>
            {(myIssues ?? []).length === 0 ? (
              <div className="mt-0.5 text-sm text-ink-mute">Koi masla report nahi kiya</div>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {((myIssues ?? []) as any[]).map((i) => {
                  const st = issueStatus(i.status);
                  return (
                    <li key={i.id}><Link href={`/welfare/issues/${i.id}`} className="flex items-center justify-between gap-2 text-sm no-underline hover:no-underline"><span className="font-bold text-ink">{i.ref_no}</span><span className={`badge ${st.soft}`}>{st.short}</span></Link></li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
        {agentSocieties.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-ink p-4 text-white">
            <span className="font-bold">Welfare agent panel:</span>
            {agentSocieties.map(([sid, name]) => <Link key={sid} href={`/w/${sid}`} className="btn btn-sm bg-plate text-plate-ink hover:bg-[#FFC933]">{name}</Link>)}
          </div>
        )}
        {!staffList.length && !pendingReq && (
          <p className="text-sm text-ink-mute">Committee member hain? <Link href="/societies/register">Apni society free register karein</Link>.</p>
        )}
      </ModuleBlock>

      {/* ===== Home Services ===== */}
      <ModuleBlock tone="services" title="Home Services">
        <div className="grid gap-3 sm:grid-cols-2">
          <Action href="/services" title="Service dhoondein" body="Electrician, plumber, masi, rickshaw — apne area ke verified log" />
          <Action href={provider ? '/provider/dashboard' : '/provider/register'} title={provider ? 'Mera provider dashboard' : 'Provider banein'} body={provider ? `${provider.display_name} (${provider.status})` : 'Apna kaam list karein, free'} />
        </div>
      </ModuleBlock>

      {/* ===== Rent / Sale ===== */}
      <ModuleBlock tone="property" title="Rent / Sale">
        <div className="grid gap-3 sm:grid-cols-2">
          <Action href="/properties" title="Ghar dekhein" body="Society-verified ghar rent aur sale" />
          <Action href="/properties/new" title="Apna ghar list karein" body={`Meri listings: ${(listings ?? []).filter((l) => l.status === 'active').length} active`} sub={['Meri listings', '/my/listings']} />
        </div>
      </ModuleBlock>

      <div className="text-sm text-ink-mute">
        Madad chahiye? <Link href="/guides">Guides parhein</Link>
        <span className="mx-2">|</span>
        <form action="/auth/signout" method="post" className="inline lg:hidden"><button className="font-semibold text-due">Logout</button></form>
      </div>
    </div>
  );
}

const toneCls = {
  society: { bar: 'bg-society', chip: 'bg-society-soft text-society-ink' },
  services: { bar: 'bg-service', chip: 'bg-service-soft text-service-ink' },
  property: { bar: 'bg-property', chip: 'bg-property-soft text-property-ink' },
};

function ModuleBlock({ tone, title, action, children }: { tone: keyof typeof toneCls; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  const t = toneCls[tone];
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white" aria-label={title}>
      <div className={`h-1.5 ${t.bar}`} aria-hidden="true" />
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className={`badge ${t.chip} px-3 py-1 text-sm`}>{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

function Action({ href, title, body, sub }: { href: string; title: string; body: string; sub?: [string, string] }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/50 p-4">
      <Link href={href} className="font-bold text-ink no-underline hover:text-brand-700 hover:no-underline">{title}</Link>
      <div className="mt-0.5 text-sm text-ink-mute">{body}</div>
      {sub && <Link href={sub[1]} className="mt-2 inline-block text-sm font-semibold">{sub[0]}</Link>}
    </div>
  );
}
