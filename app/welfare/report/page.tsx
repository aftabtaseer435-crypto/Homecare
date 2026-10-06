import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { CategoryChip, IssueStatusBadge } from '@/components/IssueBadge';
import { fmtDate, houseLabel } from '@/lib/format';
import { categories, category, galiLabel } from '@/lib/welfare';
import { createIssue, supportIssue } from '../actions';

export default async function ReportIssue({ searchParams }: { searchParams: { house?: string; cat?: string; ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/welfare/report');

  // Houses this user may report for: own verified houses (+ any house an agent opens via ?house=)
  const { data: owned } = await supabase
    .from('house_owners')
    .select('house:houses(id, block, street, house_no, society:societies(name))')
    .eq('user_id', user.id)
    .eq('status', 'verified');
  const houses = ((owned ?? []) as any[]).map((o) => o.house).filter(Boolean);

  let house: any = houses.find((h) => h.id === searchParams.house) ?? (houses.length === 1 ? houses[0] : null);
  let onBehalf = false;
  if (!house && searchParams.house) {
    const { data: canAgent } = await supabase.rpc('is_agent_for_house', { hid: searchParams.house });
    if (canAgent) {
      const { data: h } = await supabase.from('houses').select('id, block, street, house_no, society:societies(name)').eq('id', searchParams.house).single();
      house = h;
      onBehalf = true;
    }
  }
  if (!house && houses.length === 0) redirect('/welfare');

  // Step 1 — pick a house
  if (!house) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Kis ghar ka masla hai?" back={['Welfare', '/welfare']} />
        <ul className="space-y-2">
          {houses.map((h) => (
            <li key={h.id}><Link href={`/welfare/report?house=${h.id}`} className="card block font-bold no-underline hover:border-brand-600">{h.society?.name} — {houseLabel(h)}</Link></li>
          ))}
        </ul>
      </div>
    );
  }

  const cat = categories.find((c) => c.id === searchParams.cat);
  const gali = galiLabel(house.block, house.street);

  // Step 2 — pick the kind of masla
  if (!cat) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Kya masla hai?" subtitle={`${house.society?.name} · ${houseLabel(house)}`} back={['Welfare', '/welfare']} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/welfare/report?house=${house.id}&cat=${c.id}`} className="flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-white p-4 text-center no-underline hover:border-brand-600 hover:no-underline">
                <span className="text-3xl" aria-hidden="true">{c.icon}</span>
                <span className="font-bold text-ink">{c.label}</span>
                <span className="text-xs text-ink-mute">{c.scope === 'private' ? 'Sirf agent dekhega' : `Hal: ${c.sla}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Step 3 — confirm the template message (and avoid duplicates for street issues)
  const { data: existing } = cat.scope === 'street' && !onBehalf
    ? await supabase.rpc('welfare_street_issues', { p_house: house.id })
    : { data: [] as any[] };
  const sameKind = ((existing ?? []) as any[]).filter((i) => i.category === cat.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={`${cat.icon} ${cat.label}`} subtitle={`${house.society?.name} · ${houseLabel(house)}${onBehalf ? ' (agent ki taraf se darj)' : ''}`} back={['Masla badlein', `/welfare/report?house=${house.id}`]} />
      <Flash searchParams={searchParams} />

      {sameKind.length > 0 && (
        <section className="rounded-2xl border border-plate bg-plate-soft p-4">
          <h2 className="text-base">Yeh masla {gali} mein pehle se report ho chuka hai</h2>
          <p className="mt-1 text-sm text-plate-ink">Naya report karne ke bajaye +1 karein — agent ko pata chalega ke kitne ghar mutasir hain.</p>
          <ul className="mt-3 space-y-2">
            {sameKind.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
                <div>
                  <CategoryChip id={i.category} /> <span className="text-xs text-ink-mute">{i.ref_no} · {fmtDate(i.created_at)} · {Number(i.supporters) + 1} ghar</span>
                  <div className="mt-1"><IssueStatusBadge status={i.status} /></div>
                </div>
                {i.mine || i.supported ? (
                  <Link href={`/welfare/issues/${i.id}`} className="btn-outline btn-sm">{i.mine ? 'Aap ka report' : 'Aap ne +1 kiya'} — dekhein</Link>
                ) : (
                  <form action={supportIssue}>
                    <input type="hidden" name="issue_id" value={i.id} />
                    <input type="hidden" name="house_id" value={house.id} />
                    <SubmitButton className="btn btn-sm">+1 — mera bhi yehi masla</SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={createIssue} className="card space-y-4">
        <input type="hidden" name="house_id" value={house.id} />
        <input type="hidden" name="category" value={cat.id} />
        <div>
          <label className="label" htmlFor="description">Paigham (zaroorat ho to badal lein)</label>
          <textarea id="description" name="description" rows={4} className="input" defaultValue={cat.template(gali)} required />
        </div>
        <div>
          <label className="label" htmlFor="photo">Tasveer (optional)</label>
          <input id="photo" name="photo" type="file" accept="image/*" capture="environment" className="input" />
          <p className="hint">Tasveer se agent ko masla jaldi samajh aata hai.</p>
        </div>
        <div className="well text-sm text-ink-soft">
          {cat.scope === 'private'
            ? 'Yeh masla private hai — sirf aap, aap ki gali ka welfare agent aur society admin dekh sakte hain.'
            : `Yeh masla aap ki gali ke welfare agent aur society admin ko nazar aayega. Padosi sirf "+1" kar sakte hain, aap ka naam nahi dekhte. Hal karne ka waqt: ${cat.sla}.`}
        </div>
        <SubmitButton className="btn w-full py-3 text-base" pendingText="Bhej rahe hain…">Report karein aur WhatsApp par bhejein</SubmitButton>
      </form>
    </div>
  );
}
