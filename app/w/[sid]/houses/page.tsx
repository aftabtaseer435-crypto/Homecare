import Link from 'next/link';
import { inAreas, requireAgent } from '@/lib/agent';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fetchAll } from '@/lib/fetchAll';
import { fmtDate } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { waSend } from '@/lib/messages';
import { natural } from '@/lib/societyData';
import { openStatuses } from '@/lib/welfare';
import { logVisit } from '../actions';

const outcomeLabel: Record<string, string> = { ok: 'Sab theek', issue_found: 'Masla mila', not_home: 'Ghar par koi nahi' };

export default async function AgentHouses({ params, searchParams }: { params: { sid: string }; searchParams: { block?: string; street?: string; ok?: string; err?: string } }) {
  const { supabase, areas } = await requireAgent(params.sid);
  const sid = params.sid;

  const houses = (await fetchAll<any>((from, to) =>
    supabase.from('houses').select('id, block, street, house_no, occupancy').eq('society_id', sid).order('id').range(from, to),
  )).filter((h) => inAreas(areas, h.block, h.street));
  const galis = Array.from(new Map(houses.map((h) => [`${h.block}|${h.street}`, { block: h.block, street: h.street }])).values())
    .sort((a, b) => natural(a.block, b.block) || natural(a.street, b.street));
  const sel = galis.find((g) => g.street === searchParams.street && g.block === (searchParams.block ?? g.block)) ?? galis[0];

  const inGali = sel ? houses.filter((h) => h.block === sel.block && h.street === sel.street).sort((a, b) => natural(a.house_no, b.house_no)) : [];
  const ids = inGali.map((h) => h.id);
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ data: owners }, { data: issues }, { data: visits }] = ids.length
    ? await Promise.all([
        supabase.from('house_owners').select('house_id, owner_name, owner_phone').in('house_id', ids).eq('status', 'verified'),
        supabase.from('welfare_issues').select('id, house_id, status').in('house_id', ids).in('status', openStatuses),
        supabase.from('welfare_visits').select('house_id, outcome, note, created_at').in('house_id', ids).order('created_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }] as any;
  const ownerOf = new Map(((owners ?? []) as any[]).map((o) => [o.house_id, o]));
  const openCount = new Map<string, number>();
  for (const i of (issues ?? []) as any[]) openCount.set(i.house_id, (openCount.get(i.house_id) ?? 0) + 1);
  const lastVisit = new Map<string, any>();
  for (const v of (visits ?? []) as any[]) if (!lastVisit.has(v.house_id)) lastVisit.set(v.house_id, v);
  const checked30 = inGali.filter((h) => lastVisit.get(h.id) && lastVisit.get(h.id).created_at > since).length;

  return (
    <div className="space-y-5">
      <Flash searchParams={searchParams} />
      <div>
        <h1>Ghar — checking list</h1>
        <p className="muted mt-1">Har ghar ka chakkar lagayein, haal poochein, aur yahan &quot;check&quot; karein. Masla mile to wahin darj karein.</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto" aria-label="Galiyan">
        {galis.map((g) => {
          const active = sel && g.block === sel.block && g.street === sel.street;
          return (
            <Link key={`${g.block}|${g.street}`} href={`?block=${encodeURIComponent(g.block)}&street=${encodeURIComponent(g.street)}`} aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold no-underline hover:no-underline ${active ? 'bg-ink text-white' : 'bg-white text-ink-soft'}`}>
              {g.block ? `${g.block}-` : ''}Gali {g.street}
            </Link>
          );
        })}
      </nav>

      {sel && (
        <div className="well flex flex-wrap items-center justify-between gap-3 text-sm">
          <span><b>{checked30}</b> / {inGali.length} ghar pichle 30 din mein check hue</span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-line" role="img" aria-label={`${checked30} of ${inGali.length} checked`}>
            <div className="h-full bg-paid" style={{ width: `${inGali.length ? (checked30 / inGali.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {inGali.map((h) => {
          const o = ownerOf.get(h.id);
          const v = lastVisit.get(h.id);
          const n = openCount.get(h.id) ?? 0;
          return (
            <li key={h.id} className={`card ${n ? 'border-due/40' : ''}`}>
              <div className="flex flex-wrap items-start gap-3">
                <span className={`plate h-10 px-3 text-base ${n ? 'plate-due' : v && v.created_at > since ? 'plate-paid' : ''}`}>{h.house_no}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{o?.owner_name ?? <span className="text-ink-mute">Owner record mein nahi</span>}</div>
                  <div className="text-xs text-ink-mute">
                    {o ? displayPhone(o.owner_phone) : ''}{n ? ` · ${n} khula masla` : ''}
                    {v ? ` · Aakhri check ${fmtDate(v.created_at)}: ${outcomeLabel[v.outcome]}` : ' · Abhi check nahi hua'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o && <a href={`tel:+${o.owner_phone}`} className="btn-outline btn-sm">Call</a>}
                  {o && <a href={waSend(o.owner_phone, `Assalam o Alaikum ${o.owner_name}, main aap ki gali ka welfare agent hoon. Koi masla ho to mujhe batayein.`)} target="_blank" rel="noopener" className="btn-wa btn-sm">WhatsApp</a>}
                  <Link href={`/welfare/report?house=${h.id}`} className="btn-outline btn-sm">Masla darj</Link>
                </div>
              </div>
              <form action={logVisit} className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center">
                <input type="hidden" name="sid" value={params.sid} />
                <input type="hidden" name="house_id" value={h.id} />
                <input type="hidden" name="block" value={h.block} />
                <input type="hidden" name="street" value={h.street} />
                <select name="outcome" className="input sm:w-44" aria-label="Nateeja">
                  <option value="ok">Sab theek</option>
                  <option value="issue_found">Masla mila</option>
                  <option value="not_home">Ghar par koi nahi</option>
                </select>
                <input name="note" className="input" placeholder="Note (optional)" aria-label="Note" />
                <SubmitButton className="btn btn-sm whitespace-nowrap">Check ✓</SubmitButton>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
