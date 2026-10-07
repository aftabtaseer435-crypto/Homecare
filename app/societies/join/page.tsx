import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { claimHouse } from './actions';

export const metadata = { title: 'Apna ghar register karein' };

export default async function JoinSociety({
  searchParams,
}: {
  searchParams: { q?: string; society?: string; block?: string; street?: string; ok?: string; err?: string };
}) {
  const { supabase, profile } = await requireUser('/societies/join');
  const q = (searchParams.q ?? '').trim();

  // Step 2: society chosen
  if (searchParams.society) {
    const { data: society } = await supabase.from('societies').select('id, name, city').eq('id', searchParams.society).single();
    if (!society) return <p>Society nahi mili.</p>;

    const { data: pairs } = await supabase.rpc('house_streets', { p_society: society.id });
    const all = (pairs ?? []) as { block: string; street: string }[];
    const blocks = Array.from(new Set(all.map((h) => h.block))).sort(natural);
    const block = searchParams.block ?? (blocks.length === 1 ? blocks[0] : undefined);
    const streets = block !== undefined ? all.filter((h) => h.block === block).map((h) => h.street).sort(natural) : [];
    const street = searchParams.street;
    let inStreet: { id: string; house_no: string }[] = [];
    if (street && block !== undefined) {
      const { data } = await supabase
        .from('houses')
        .select('id, house_no')
        .eq('society_id', society.id)
        .eq('block', block)
        .eq('street', street);
      inStreet = (data ?? []).sort((a, b) => natural(a.house_no, b.house_no));
    }

    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={society.name} subtitle={`${society.city} — apna ghar choose karein`} />
        <Flash searchParams={searchParams} />
        {all.length === 0 ? (
          <div className="card text-sm">Society admin ne abhi ghar add nahi kiye. Thori der baad try karein.</div>
        ) : (
          <div className="card space-y-4">
            {blocks.length > 1 && (
              <form className="flex items-end gap-2">
                <input type="hidden" name="society" value={society.id} />
                <div className="flex-1">
                  <label className="label">Block / Phase</label>
                  <select name="block" defaultValue={block} className="input">
                    <option value="">— choose —</option>
                    {blocks.map((b) => <option key={b} value={b}>{b || '(no block)'}</option>)}
                  </select>
                </div>
                <button className="btn-outline">Next</button>
              </form>
            )}
            {block !== undefined && (
              <form className="flex items-end gap-2">
                <input type="hidden" name="society" value={society.id} />
                <input type="hidden" name="block" value={block} />
                <div className="flex-1">
                  <label className="label">Gali number</label>
                  <select name="street" defaultValue={street} className="input">
                    <option value="">— choose —</option>
                    {streets.map((s) => <option key={s} value={s}>Gali {s}</option>)}
                  </select>
                </div>
                <button className="btn-outline">Next</button>
              </form>
            )}
            {street && (
              <form action={claimHouse} className="space-y-4 border-t pt-4">
                <input type="hidden" name="society_id" value={society.id} />
                <div>
                  <label className="label">Ghar number</label>
                  <select name="house_id" className="input" required>
                    {inStreet.map((h) => <option key={h.id} value={h.id}>Ghar {h.house_no}</option>)}
                  </select>
                </div>
                <fieldset>
                  <legend className="label">Aap is ghar ke kya hain?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                      <input type="radio" name="relation" value="owner" defaultChecked /> Makan malik
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                      <input type="radio" name="relation" value="tenant" /> Kirayedar
                    </label>
                  </div>
                  <p className="hint">Dono ko society ke notices aur welfare milta hai. Fund ke reminders sirf malik ko jate hain.</p>
                </fieldset>
                <div>
                  <label className="label">Aap ka naam</label>
                  <input name="owner_name" className="input" defaultValue={profile.full_name ?? ''} required />
                </div>
                <p className="muted">Mobile number: verified ({profile.phone}). Society admin approve karega, phir aap ka status nazar aayega.</p>
                <SubmitButton>Register karein</SubmitButton>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // Step 1: search society
  let query = supabase.from('societies').select('id, name, city, address').eq('status', 'active').order('name').limit(30);
  if (q) query = query.or(`name.ilike.%${q.replace(/[%,()]/g, '')}%,city.ilike.%${q.replace(/[%,()]/g, '')}%`);
  const { data: societies } = await query;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Apni society dhoondein" subtitle="Society choose karein, phir gali aur ghar number." />
      <Flash searchParams={searchParams} />
      <form className="mb-4 flex items-end gap-2">
        <div className="min-w-0 flex-1"><label htmlFor="j-q" className="mb-1 block text-xs font-semibold text-ink-soft">Society ka naam ya city</label><input id="j-q" name="q" defaultValue={q} placeholder="Al-Quraish, Multan" className="input" /></div>
        <button className="btn">Search</button>
      </form>
      <div className="space-y-2">
        {(societies ?? []).map((s) => (
          <Link key={s.id} href={`/societies/join?society=${s.id}`} className="card block no-underline hover:border-brand-500">
            <div className="font-semibold text-ink">{s.name}</div>
            <div className="muted">{s.city}{s.address ? ` · ${s.address}` : ''}</div>
          </Link>
        ))}
        {(societies ?? []).length === 0 && (
          <div className="card text-sm text-ink-mute">
            Koi society nahi mili. Apni society ko <Link href="/societies/register">free register</Link> karwayein.
          </div>
        )}
      </div>
    </div>
  );
}

function natural(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true });
}
