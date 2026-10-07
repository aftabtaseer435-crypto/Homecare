import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';
import { houseLabel } from '@/lib/format';
import {
  areaUnits, facings, featureOptions, furnishing, ownershipTypes, portions, possessionTypes, tenantPrefs, typesFor, utilityOptions, type Deal,
} from '@/lib/property';

type Home = { house: { id: string; block: string; street: string; house_no: string; society?: { name: string; city: string } | null } };

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
    <h2 className="text-base">{title}</h2>
    {hint && <p className="mt-0.5 text-sm text-ink-mute">{hint}</p>}
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);
const Field = ({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) => (
  <div className={wide ? 'sm:col-span-2' : ''}><label className="label">{label}</label>{children}</div>
);
const Checks = ({ name, options, selected }: { name: string; options: string[]; selected?: string[] }) => (
  <div className="flex flex-wrap gap-2 sm:col-span-2">
    {options.map((o) => (
      <label key={o} className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm has-[:checked]:border-property has-[:checked]:bg-property-soft has-[:checked]:text-property-ink">
        <input type="checkbox" name={name} value={o} defaultChecked={selected?.includes(o)} className="accent-[#7442C8]" /> {o}
      </label>
    ))}
  </div>
);
const Toggle = ({ name, label, checked }: { name: string; label: string; checked?: boolean }) => (
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-[#7442C8]" /> {label}</label>
);

/** Full listing form — sale and rent each ask what matters for that deal. */
export default function ListingForm({
  deal, action, homes, phone, initial, submitLabel,
}: {
  deal: Deal;
  action: (fd: FormData) => Promise<void>;
  homes: Home[];
  phone?: string | null;
  initial?: any;
  submitLabel: string;
}) {
  const i = initial ?? {};
  const sale = deal === 'sale';
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="listing_type" value={deal} />
      {i.id && <input type="hidden" name="id" value={i.id} />}

      <Section title="Property" hint="Kis qisam ki jagah hai aur kahan hai">
        <Field label="Qisam *">
          <select name="property_type" className="input" defaultValue={i.property_type ?? (sale ? 'house' : 'portion')}>
            {typesFor(deal).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Mera registered ghar (Society verified badge)">
          <select name="house_id" className="input" defaultValue={i.house_id ?? ''}>
            <option value="">— society se bahar / registered nahi —</option>
            {homes.map((h) => <option key={h.house.id} value={h.house.id}>{h.house.society?.name} — {houseLabel(h.house)}</option>)}
          </select>
        </Field>
        <Field label="Title *" wide>
          <input name="title" className="input" required maxLength={120} defaultValue={i.title ?? ''} placeholder={sale ? '5 marla double story, corner, park facing' : '10 marla upper portion, alag gate'} />
        </Field>
        <Field label="City *"><input name="city" className="input" required defaultValue={i.city ?? homes[0]?.house.society?.city ?? ''} /></Field>
        <Field label="Area / mohalla / society"><input name="area_text" className="input" defaultValue={i.area_text ?? ''} placeholder="Al-Quraish Phase 1, Bosan Road" /></Field>
        <Field label="Pata (gali / block)" wide><input name="address_line" className="input" defaultValue={i.address_line ?? ''} placeholder="Gali 3, ghar 10 ke qareeb — poora pata sirf deal par" /></Field>
        <Field label="Google map link"><input name="map_url" className="input" defaultValue={i.map_url ?? ''} placeholder="https://maps.google.com/..." /></Field>
      </Section>

      <Section title="Size aur banawat">
        <Field label="Plot / area size">
          <div className="flex gap-2">
            <input name="area_value" type="number" step="0.01" min="0" className="input min-w-0" defaultValue={i.area_value ?? ''} placeholder="5" />
            <select name="area_unit" className="input w-32 shrink-0" defaultValue={i.area_unit ?? 'marla'}>
              {areaUnits.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Covered area (sq. ft)"><input name="covered_sqft" type="number" min="0" className="input" defaultValue={i.covered_sqft ?? ''} /></Field>
        <Field label="Bedrooms"><input name="bedrooms" type="number" min="0" className="input" defaultValue={i.bedrooms ?? ''} /></Field>
        <Field label="Bathrooms"><input name="bathrooms" type="number" min="0" className="input" defaultValue={i.bathrooms ?? ''} /></Field>
        <Field label="Kitchens"><input name="kitchens" type="number" min="0" className="input" defaultValue={i.kitchens ?? ''} /></Field>
        <Field label="Manzilen (floors)"><input name="floors" type="number" min="0" className="input" defaultValue={i.floors ?? ''} /></Field>
        <Field label="Car parking"><input name="parking" type="number" min="0" className="input" defaultValue={i.parking ?? ''} /></Field>
        <Field label="Furnished">
          <select name="furnished" className="input" defaultValue={i.furnished ?? 'unfurnished'}>
            {furnishing.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Rukh (facing)">
          <select name="facing" className="input" defaultValue={i.facing ?? ''}>
            <option value="">—</option>
            {facings.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Banane ka saal"><input name="year_built" type="number" min="1950" max="2100" className="input" defaultValue={i.year_built ?? ''} placeholder="2018" /></Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          <Toggle name="corner" label="Corner" checked={i.corner} />
          <Toggle name="park_facing" label="Park facing" checked={i.park_facing} />
          <Toggle name="main_road" label="Main road par" checked={i.main_road} />
        </div>
        <div className="sm:col-span-2"><div className="label">Sahuliyat (utilities)</div><Checks name="utilities" options={utilityOptions} selected={i.utilities} /></div>
        <div className="sm:col-span-2"><div className="label">Khoobiyan (features)</div><Checks name="features" options={featureOptions} selected={i.features} /></div>
      </Section>

      {sale ? (
        <Section title="Sale ki shartein" hint="Khareedne wala sab se pehle yahi dekhta hai">
          <Field label="Demand (Rs) *"><input name="price" type="number" min="0" className="input" required defaultValue={i.price ?? ''} placeholder="12500000" /></Field>
          <div className="flex items-end pb-3"><Toggle name="negotiable" label="Demand mein guncha'ish hai (negotiable)" checked={i.negotiable ?? true} /></div>
          <Field label="Malkiyat (ownership)">
            <select name="ownership" className="input" defaultValue={i.ownership ?? ''}>
              <option value="">—</option>
              {ownershipTypes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Qabza (possession)">
            <select name="possession" className="input" defaultValue={i.possession ?? 'ready'}>
              {possessionTypes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Kaghzat (documents)">
            <select name="documents_clear" className="input" defaultValue={i.documents_clear === false ? 'no' : i.documents_clear ? 'yes' : ''}>
              <option value="">—</option><option value="yes">Sab clear — koi qarz / jhagra nahi</option><option value="no">Kuch kaam baqi hai</option>
            </select>
          </Field>
          <div className="flex items-end pb-3"><Toggle name="installments" label="Qiston par bhi de sakte hain" checked={i.installments} /></div>
          <Field label="Qiston ki detail" wide><input name="installment_note" className="input" defaultValue={i.installment_note ?? ''} placeholder="30% advance, baqi 24 mahine" /></Field>
        </Section>
      ) : (
        <Section title="Kiraye ki shartein" hint="Kirayedar sab se pehle yahi dekhta hai">
          <Field label="Mahana kiraya (Rs) *"><input name="price" type="number" min="0" className="input" required defaultValue={i.price ?? ''} placeholder="45000" /></Field>
          <Field label="Security deposit (Rs)"><input name="advance" type="number" min="0" className="input" defaultValue={i.advance ?? ''} placeholder="90000" /></Field>
          <Field label="Advance kiraya (kitne mahine)"><input name="advance_months" type="number" min="0" max="24" className="input" defaultValue={i.advance_months ?? ''} placeholder="1" /></Field>
          <Field label="Kam az kam muddat (mahine)"><input name="min_lease_months" type="number" min="0" max="120" className="input" defaultValue={i.min_lease_months ?? ''} placeholder="11" /></Field>
          <Field label="Portion">
            <select name="portion" className="input" defaultValue={i.portion ?? 'full'}>
              {portions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Kis ko dena hai">
            <select name="tenant_pref" className="input" defaultValue={i.tenant_pref ?? 'family'}>
              {tenantPrefs.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Kab se khali"><input name="available_from" type="date" className="input" defaultValue={i.available_from ?? ''} /></Field>
          <Field label="Maintenance / society charges (Rs / mahina)"><input name="maintenance" type="number" min="0" className="input" defaultValue={i.maintenance ?? ''} /></Field>
          <div className="sm:col-span-2"><Toggle name="bills_included" label="Bijli / gas ke bill kiraye mein shamil hain" checked={i.bills_included} /></div>
        </Section>
      )}

      <Section title="Tafseel, photos aur rabta">
        <Field label="Tafseel" wide>
          <textarea name="description" rows={5} className="input" defaultValue={i.description ?? ''} placeholder={sale ? 'Ghar ki halat, renovation, qareeb school / masjid / market, kyun bech rahe hain…' : 'Ghar ki halat, kya shamil hai, qareeb school / masjid / market, shartein…'} />
        </Field>
        <Field label={i.id ? 'Mazeed photos (15 tak)' : 'Photos (15 tak) — bahar, har kamra, kitchen, bathroom'} wide>
          <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="input py-2 text-sm" />
        </Field>
        <Field label="Rabta number *"><input name="contact_phone" className="input" required defaultValue={displayPhone(i.contact_phone ?? phone)} /></Field>
        <p className="flex items-end pb-2 text-xs text-ink-mute">Number listing par nazar nahi aata — log &quot;Call now&quot; / &quot;WhatsApp now&quot; se rabta karte hain.</p>
      </Section>

      <SubmitButton className="btn w-full bg-property py-3 text-base hover:bg-property-ink sm:w-auto" pendingText="Save ho raha hai…">{submitLabel}</SubmitButton>
    </form>
  );
}
