import { Lightbulb, Scale } from 'lucide-react';
import NoticeBoard from '@/components/NoticeBoard';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import { CategoryChip, IssueStatusBadge } from '@/components/IssueBadge';
import { fmtDate, houseLabel } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { waSend } from '@/lib/messages';
import { openStatuses } from '@/lib/welfare';

export default async function WelfareHub({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/welfare');

  const [{ data: owned }, { data: agentRows }] = await Promise.all([
    supabase
      .from('house_owners')
      .select('house:houses(id, block, street, house_no, society:societies(id, name))')
      .eq('user_id', user.id)
      .eq('status', 'verified'),
    supabase.from('welfare_agents').select('society_id, society:societies(name)').eq('user_id', user.id).eq('active', true),
  ]);
  const houses = ((owned ?? []) as any[]).map((o) => o.house).filter(Boolean);

  const [{ data: mine }, agentsByHouse] = await Promise.all([
    supabase
      .from('welfare_issues')
      .select('id, ref_no, category, title, status, created_at, house:houses(block, street, house_no), supporters:welfare_issue_supporters(count)')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    Promise.all(houses.map(async (h: any) => [h.id, (await supabase.rpc('agents_for_house', { p_house: h.id })).data ?? []] as const)),
  ]);
  const agentMap = new Map<string, any[]>(agentsByHouse as any);
  const open = (mine ?? []).filter((i: any) => openStatuses.includes(i.status));
  const done = (mine ?? []).filter((i: any) => !openStatuses.includes(i.status));
  const agentSocieties = Array.from(new Map(((agentRows ?? []) as any[]).map((r) => [r.society_id, r.society?.name])).entries());

  return (
    <div className="space-y-8">
      <NoticeBoard next="/welfare" />
      <PageHeader
        title="Welfare — apni gali ke masle"
        subtitle="Light, pani, gutter, sarak, safai, security ya legal masla — ek click mein apni gali ke welfare agent tak. Har qadam ka status yahan."
      />
      <Flash searchParams={searchParams} />

      {agentSocieties.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-plate/50 bg-plate-soft p-4 text-plate-ink">
          <span className="font-bold">Aap welfare agent hain:</span>
          {agentSocieties.map(([sid, name]) => (
            <Link key={sid} href={`/w/${sid}`} className="btn btn-sm">{name} — agent panel</Link>
          ))}
        </div>
      )}

      {houses.length === 0 ? (
        <div className="card">
          <p className="text-ink-soft">Masla report karne ke liye pehle apna ghar society mein add karein (admin approve karega).</p>
          <Link href="/societies/join" className="btn mt-4">Apna ghar add karein</Link>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {houses.map((h: any) => {
            const agents = agentMap.get(h.id) ?? [];
            const agent = agents[0];
            return (
              <div key={h.id} className="card space-y-4">
                <div>
                  <div className="font-bold">{h.society?.name}</div>
                  <div className="text-sm text-ink-mute">{houseLabel(h)}</div>
                </div>
                <div className="well">
                  <div className="text-xs font-bold text-ink-mute">Aap ki gali ka welfare agent</div>
                  {agent ? (
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-bold">{agent.name}</div>
                        <div className="text-xs text-ink-mute">{agent.area} · {displayPhone(agent.phone)}</div>
                      </div>
                      <a className="btn-wa btn-sm" target="_blank" rel="noopener" href={waSend(agent.phone, `Assalam o Alaikum ${agent.name}, main ${houseLabel(h)} se hoon.`)}>WhatsApp</a>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-ink-soft">Abhi agent muqarrar nahi — aap ka masla seedha society admin ke paas jayega.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/welfare/report?house=${h.id}&cat=street_light`} className="btn"><Lightbulb className="h-4 w-4" aria-hidden="true" /> Light ka masla</Link>
                  <Link href={`/welfare/report?house=${h.id}&cat=legal`} className="btn-outline"><Scale className="h-4 w-4" aria-hidden="true" /> Legal masla</Link>
                  <Link href={`/welfare/report?house=${h.id}`} className="btn-outline">Koi aur masla</Link>
                </div>
                <Link href={`/hisaab/${h.society?.id}`} className="inline-block text-sm font-bold">Fund ka hisaab dekhein — paisa kahan laga</Link>
              </div>
            );
          })}
        </section>
      )}

      <section>
        <h2 className="mb-3">Mere khule masle ({open.length})</h2>
        <IssueList items={open} empty="Koi khula masla nahi." />
      </section>
      {done.length > 0 && (
        <section>
          <h2 className="mb-3">Hal shuda</h2>
          <IssueList items={done} empty="" />
        </section>
      )}
    </div>
  );
}

function IssueList({ items, empty }: { items: any[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {items.map((i) => (
        <li key={i.id}>
          <Link href={`/welfare/issues/${i.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 no-underline hover:bg-canvas hover:no-underline">
            <span className="plate h-7 px-2 text-[11px]">{i.ref_no}</span>
            <div className="min-w-[12rem] flex-1">
              <CategoryChip id={i.category} />
              <div className="text-xs text-ink-mute">{houseLabel(i.house)} · {fmtDate(i.created_at)}{i.supporters?.[0]?.count ? ` · +${i.supporters[0].count} log` : ''}</div>
            </div>
            <IssueStatusBadge status={i.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
