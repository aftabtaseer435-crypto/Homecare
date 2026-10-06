import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import AutoWhatsApp from '@/components/AutoWhatsApp';
import { CategoryChip, IssueStatusBadge, IssueSteps } from '@/components/IssueBadge';
import { fmtDate, houseLabel, rs } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { appUrl, waSend } from '@/lib/messages';
import { signPaths } from '@/lib/signed';
import { category, hoursLeft, issueToAgentText, openStatuses, resolvedToResidentText } from '@/lib/welfare';
import { transition } from '../../actions';

const kindLabel: Record<string, string> = {
  created: 'Masla report hua',
  acknowledged: 'Agent ne dekh liya',
  in_progress: 'Kaam shuru',
  resolved: 'Hal kar diya gaya',
  closed: 'Resident ne confirm kiya',
  reopened: 'Dobara khola gaya',
  note: 'Update',
  supported: 'Ek aur ghar ne +1 kiya',
  auto_closed: 'Khud band (7 din)',
};

export default async function IssuePage({ params, searchParams }: { params: { id: string }; searchParams: { new?: string; resolved?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser(`/welfare/issues/${params.id}`);
  const { data: issue } = await supabase
    .from('welfare_issues')
    .select('*, house:houses(id, block, street, house_no), society:societies(id, name)')
    .eq('id', params.id)
    .maybeSingle();
  if (!issue) notFound();
  const i = issue as any;

  const [{ data: updates }, { data: agents }, { data: owner }, { data: agentHere }, { data: adminHere }, { count: supporters }] = await Promise.all([
    supabase.from('welfare_issue_updates').select('id, actor_id, kind, note, photo_path, created_at').eq('issue_id', i.id).order('created_at'),
    supabase.rpc('agents_for_house', { p_house: i.house_id }),
    supabase.from('house_owners').select('owner_name, owner_phone').eq('house_id', i.house_id).eq('status', 'verified').maybeSingle(),
    supabase.rpc('is_agent_for_house', { hid: i.house_id }),
    supabase.rpc('is_society_admin', { sid: i.society_id }),
    supabase.from('welfare_issue_supporters').select('user_id', { count: 'exact', head: true }).eq('issue_id', i.id),
  ]);

  const isReporter = i.reporter_id === user.id;
  const isAgent = !!agentHere || i.assigned_to === user.id;
  const isAdmin = !!adminHere;
  const canWork = isAgent || isAdmin;
  const agentList = (agents ?? []) as any[];
  const agent = agentList.find((a) => a.user_id && a.user_id === i.assigned_to) ?? agentList[0];
  const agentIds = new Set(agentList.map((a) => a.user_id).filter(Boolean).concat(i.assigned_to ? [i.assigned_to] : []));
  const signed = await signPaths([i.photo_path, i.resolution_photo_path, ...((updates ?? []) as any[]).map((u) => u.photo_path)]);
  const link = appUrl(`/welfare/issues/${i.id}`);
  const ownerName = owner?.owner_name ?? 'Resident';
  const toAgent = agent ? waSend(agent.phone, issueToAgentText({ refNo: i.ref_no, category: i.category, house: i.house, ownerName, text: i.description ?? i.title, link })) : null;
  const toResident = owner?.owner_phone ? waSend(owner.owner_phone, resolvedToResidentText({ refNo: i.ref_no, ownerName, note: i.resolution_note ?? '', link })) : null;
  const left = openStatuses.includes(i.status) ? hoursLeft(i.due_at) : null;
  const who = (actor: string | null) => (actor === i.reporter_id ? (isReporter ? 'Aap' : ownerName) : actor && agentIds.has(actor) ? 'Welfare agent' : actor ? 'Society admin' : 'System');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {searchParams.new && toAgent && isReporter && <AutoWhatsApp href={toAgent} onceKey={`wa-${i.id}`} />}
      <Link href={canWork && !isReporter ? `/w/${i.society_id}` : '/welfare'} className="text-sm font-bold">{canWork && !isReporter ? 'Agent panel' : 'Welfare'}</Link>
      <Flash searchParams={searchParams} />

      {searchParams.new && (
        <div className="rounded-2xl border border-paid/30 bg-paid-soft p-4 text-paid-ink">
          <div className="font-bold">Masla {i.ref_no} darj ho gaya.</div>
          <p className="mt-1 text-sm">
            {toAgent ? 'WhatsApp khul raha hai — agent ko paigham bhejne ke liye Send dabayein.' : 'Is gali ka agent abhi muqarrar nahi — society admin ko app mein nazar aa gaya hai.'}
          </p>
          {toAgent && <a href={toAgent} target="_blank" rel="noopener" className="btn-wa mt-3">WhatsApp nahi khula? Yahan dabayein</a>}
        </div>
      )}

      <header className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><span className="plate h-7 px-2 text-[11px]">{i.ref_no}</span><CategoryChip id={i.category} /></div>
            <h1 className="mt-2 text-2xl">{i.title}</h1>
            <p className="text-sm text-ink-mute">{i.society?.name} · {houseLabel(i.house)} · {fmtDate(i.created_at)}{supporters ? ` · ${supporters + 1} ghar mutasir` : ''}</p>
          </div>
          <IssueStatusBadge status={i.status} />
        </div>
        <IssueSteps status={i.status} />
        {left !== null && (
          <p className={`text-sm font-bold ${left < 0 ? 'text-due-ink' : 'text-ink-soft'}`}>
            {left < 0 ? `Waqt guzar gaya — ${Math.abs(left)} ghante late` : `Hal karne ka waqt baqi: ${left} ghante (${category(i.category).sla})`}
          </p>
        )}
        {i.description && <p className="whitespace-pre-line text-[15px]">{i.description}</p>}
        {i.photo_path && signed.get(i.photo_path) && (
          <a href={signed.get(i.photo_path)} target="_blank" rel="noopener"><img src={signed.get(i.photo_path)} alt={`${i.ref_no} — masle ki tasveer`} className="max-h-72 rounded-xl border border-line object-cover" /></a>
        )}
      </header>

      {(i.status === 'resolved' || i.status === 'closed') && (
        <section className="card space-y-3 border-paid/40">
          <h2 className="text-paid-ink">Hal: {i.resolution_note}</h2>
          <p className="text-sm text-ink-mute">{fmtDate(i.resolved_at)}{i.cost ? ` · kharcha ${rs(i.cost)} (fund ke hisaab mein)` : ''}{i.rating ? ` · ${'★'.repeat(i.rating)}` : ''}</p>
          {i.resolution_photo_path && signed.get(i.resolution_photo_path) && (
            <img src={signed.get(i.resolution_photo_path)} alt={`${i.ref_no} — kaam ke baad`} className="max-h-72 rounded-xl border border-line object-cover" />
          )}
        </section>
      )}

      {/* Contact row */}
      <section className="flex flex-wrap gap-2">
        {isReporter && toAgent && <a href={toAgent} target="_blank" rel="noopener" className="btn-wa">Agent ({agent.name}) ko WhatsApp</a>}
        {canWork && owner?.owner_phone && <a href={`tel:+${owner.owner_phone}`} className="btn-outline">Call {ownerName} ({displayPhone(owner.owner_phone)})</a>}
        {canWork && i.status === 'resolved' && toResident && <a href={toResident} target="_blank" rel="noopener" className="btn-wa">Resident ko batayein — confirm karwayein</a>}
      </section>

      {/* Agent / admin actions */}
      {canWork && !['resolved', 'closed'].includes(i.status) && (
        <section className="card space-y-4">
          <h2>Agent ke liye</h2>
          <div className="flex flex-wrap gap-2">
            {['open', 'reopened'].includes(i.status) && <ActionButton id={i.id} action="ack" label="Dekh liya" />}
            {['open', 'acknowledged', 'reopened'].includes(i.status) && <ActionButton id={i.id} action="progress" label="Kaam shuru" outline />}
          </div>
          <form action={transition} className="space-y-3 border-t border-line pt-4">
            <input type="hidden" name="issue_id" value={i.id} />
            <input type="hidden" name="action" value="resolve" />
            <h3>Hal ho gaya? Submit karein</h3>
            <div>
              <label className="label" htmlFor="note">Kya kiya? *</label>
              <textarea id="note" name="note" rows={2} className="input" required placeholder="Naya bulb lagwaya, wiring theek ki" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="photo">Kaam ke baad tasveer</label>
                <input id="photo" name="photo" type="file" accept="image/*" capture="environment" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="cost">Fund se kharcha (Rs, agar hua)</label>
                <input id="cost" name="cost" type="number" min="0" className="input" />
                <p className="hint">Admin approve karega, phir sab residents ko hisaab mein nazar aayega.</p>
              </div>
            </div>
            <SubmitButton className="btn bg-paid hover:bg-paid-ink">Hal ho gaya — submit</SubmitButton>
          </form>
        </section>
      )}

      {/* Resident confirms or reopens */}
      {(isReporter || isAdmin) && i.status === 'resolved' && (
        <section className="card space-y-4 border-paid/40">
          <h2>Kya masla waqai hal ho gaya?</h2>
          <form action={transition} className="space-y-3">
            <input type="hidden" name="issue_id" value={i.id} />
            <input type="hidden" name="action" value="confirm" />
            <fieldset>
              <legend className="label">Agent ka kaam kaisa raha?</legend>
              <div className="flex gap-2">
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n} className="flex min-h-[44px] cursor-pointer items-center gap-1 rounded-xl border border-line px-3 text-sm font-bold has-[:checked]:border-paid has-[:checked]:bg-paid-soft">
                    <input type="radio" name="rating" value={n} defaultChecked={n === 5} className="sr-only" />
                    {n}★
                  </label>
                ))}
              </div>
            </fieldset>
            <input name="note" className="input" placeholder="Kuch kehna hai? (optional)" />
            <SubmitButton className="btn bg-paid hover:bg-paid-ink">Haan, hal ho gaya ✓</SubmitButton>
          </form>
          <details>
            <summary className="cursor-pointer text-sm font-bold text-due-ink">Nahi, abhi bhi masla hai</summary>
            <form action={transition} className="mt-3 space-y-2">
              <input type="hidden" name="issue_id" value={i.id} />
              <input type="hidden" name="action" value="reopen" />
              <textarea name="note" rows={2} className="input" required placeholder="Kya theek nahi hua?" />
              <input name="photo" type="file" accept="image/*" className="input" />
              <SubmitButton className="btn-danger">Dobara kholein</SubmitButton>
            </form>
          </details>
        </section>
      )}
      {(isReporter || isAdmin) && i.status === 'closed' && (
        <details className="card">
          <summary className="cursor-pointer text-sm font-bold">Masla phir se ho gaya?</summary>
          <form action={transition} className="mt-3 space-y-2">
            <input type="hidden" name="issue_id" value={i.id} />
            <input type="hidden" name="action" value="reopen" />
            <textarea name="note" rows={2} className="input" required />
            <SubmitButton className="btn-danger">Dobara kholein</SubmitButton>
          </form>
        </details>
      )}

      {/* Timeline */}
      <section className="card">
        <h2 className="mb-4">Poori tareekh</h2>
        <ol className="relative space-y-5 border-l-2 border-line pl-5">
          {((updates ?? []) as any[]).map((u) => (
            <li key={u.id} className="relative">
              <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${u.kind === 'resolved' || u.kind === 'closed' || u.kind === 'auto_closed' ? 'bg-paid' : u.kind === 'created' || u.kind === 'reopened' ? 'bg-due' : 'bg-plate'}`} aria-hidden="true" />
              <div className="text-sm font-bold">{kindLabel[u.kind] ?? u.kind} <span className="font-normal text-ink-mute">· {who(u.actor_id)} · {new Date(u.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
              {u.note && u.kind !== 'created' && <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{u.note}</p>}
              {u.photo_path && u.kind !== 'created' && signed.get(u.photo_path) && (
                <a href={signed.get(u.photo_path)} target="_blank" rel="noopener" className="mt-1 inline-block text-sm font-bold">Tasveer dekhein</a>
              )}
            </li>
          ))}
        </ol>
        <form action={transition} className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
          <input type="hidden" name="issue_id" value={i.id} />
          <input type="hidden" name="action" value="note" />
          <input name="note" className="input" placeholder="Update / sawal likhein" required />
          <SubmitButton className="btn-outline">Shamil karein</SubmitButton>
        </form>
      </section>
    </div>
  );
}

function ActionButton({ id, action, label, outline }: { id: string; action: string; label: string; outline?: boolean }) {
  return (
    <form action={transition}>
      <input type="hidden" name="issue_id" value={id} />
      <input type="hidden" name="action" value={action} />
      <SubmitButton className={outline ? 'btn-outline' : 'btn bg-plate text-plate-ink hover:bg-[#FFC933]'}>{label}</SubmitButton>
    </form>
  );
}
