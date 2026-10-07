import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';
import { typesFor } from '@/lib/property';
import { createWant } from '../../actions';

export const metadata = { title: 'Demand post karein', robots: { index: false } };

export default async function NewWant({ searchParams }: { searchParams: { type?: string; ok?: string; err?: string } }) {
  const type = searchParams.type === 'rent' ? 'rent' : 'buy';
  const rent = type === 'rent';
  const { supabase, profile } = await requireUser(`/properties/wanted/new?type=${type}`);
  const { data: societies } = await supabase.from('societies').select('id, name').eq('status', 'active').order('name');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={rent ? 'Kiraye par ghar chahiye' : 'Ghar / plot khareedna hai'} subtitle="Apni zaroorat likhein — jin ke paas aisa ghar hai woh aap ko call / WhatsApp karenge." back={['← Demands', `/properties/wanted?type=${type}`]} />
      <Flash searchParams={searchParams} />
      <div className="mb-4 flex w-max gap-1 rounded-xl border border-line bg-white p-1">
        {[{ id: 'buy', label: 'Khareedna hai' }, { id: 'rent', label: 'Kiraye par lena hai' }].map((t) => (
          <Link key={t.id} href={`/properties/wanted/new?type=${t.id}`} className={`rounded-lg px-4 py-2 text-sm font-semibold no-underline hover:no-underline ${type === t.id ? 'bg-property text-white' : 'text-ink-soft hover:bg-canvas'}`}>{t.label}</Link>
        ))}
      </div>
      <form action={createWant} className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2 md:p-6">
        <input type="hidden" name="want_type" value={type} />
        <div>
          <label className="label">Kya chahiye *</label>
          <select name="property_type" className="input" defaultValue={rent ? 'portion' : 'house'}>
            {typesFor(rent ? 'rent' : 'sale').map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div><label className="label">City *</label><input name="city" className="input" required maxLength={60} /></div>
        <div>
          <label className="label">Society (agar koi khaas)</label>
          <select name="society_id" className="input" defaultValue="">
            <option value="">— koi bhi —</option>
            {(societies ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="label">Area / mohalla</label><input name="area_text" className="input" maxLength={120} placeholder="Bosan Road, Gulgasht" /></div>
        <div><label className="label">{rent ? 'Kiraya kam az kam (Rs)' : 'Budget kam az kam (Rs)'}</label><input name="min_budget" type="number" min="0" className="input" placeholder={rent ? '25000' : '8000000'} /></div>
        <div><label className="label">{rent ? 'Kiraya zyada se zyada (Rs) *' : 'Budget zyada se zyada (Rs) *'}</label><input name="max_budget" type="number" min="1" className="input" required placeholder={rent ? '45000' : '12000000'} /></div>
        <div><label className="label">Size</label><input name="size_text" className="input" maxLength={60} placeholder="5 – 10 marla" /></div>
        <div><label className="label">Bedrooms (kam az kam)</label><input name="bedrooms" type="number" min="0" max="20" className="input" /></div>
        <div><label className="label">{rent ? 'Kab tak shift hona hai' : 'Kab tak khareedna hai'}</label><input name="needed_by" type="date" className="input" /></div>
        <div><label className="label">Rabta number *</label><input name="contact_phone" className="input" required defaultValue={displayPhone(profile.phone)} /></div>
        <div className="sm:col-span-2">
          <label className="label">Mazeed tafseel</label>
          <textarea name="details" rows={4} maxLength={1000} className="input" placeholder={rent ? 'Family hai, 2 bachay, school qareeb ho, gas zaroori…' : 'Cash buyer, corner pasand, registry wala ghar…'} />
        </div>
        <p className="text-xs text-ink-mute sm:col-span-2">Aap ka number demand par nazar nahi aata — log Call / WhatsApp button se rabta karte hain.</p>
        <div className="sm:col-span-2"><SubmitButton className="btn w-full sm:w-auto" pendingText="Post ho raha hai…">Demand post karein</SubmitButton></div>
      </form>
    </div>
  );
}
