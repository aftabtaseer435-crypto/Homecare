import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';

type Cat = { id: string; name: string; grp: string; icon: string | null };
type Soc = { id: string; name: string; city: string };

export default function ProviderForm({
  action,
  categories,
  societies,
  initial,
  defaultPhone,
  isEdit,
}: {
  action: (fd: FormData) => Promise<void>;
  categories: Cat[];
  societies: Soc[];
  initial?: any;
  defaultPhone?: string | null;
  isEdit?: boolean;
}) {
  const selCats = new Set<string>((initial?.provider_categories ?? []).map((c: any) => c.category_id));
  const selSocs = new Set<string>((initial?.provider_societies ?? []).map((s: any) => s.society_id));
  return (
    <form action={action} className="card grid gap-4 md:grid-cols-2">
      <div><label className="label">Naam / dukaan ka naam *</label><input name="display_name" defaultValue={initial?.display_name} className="input" required /></div>
      <div><label className="label">City *</label><input name="city" defaultValue={initial?.city} className="input" required /></div>
      <div><label className="label">Call number *</label><input name="phone" defaultValue={displayPhone(initial?.phone ?? defaultPhone)} className="input" required /></div>
      <div><label className="label">WhatsApp number (agar alag hai)</label><input name="whatsapp" defaultValue={displayPhone(initial?.whatsapp)} className="input" /></div>
      <div><label className="label">Tajurba (saal)</label><input name="experience_years" type="number" min="0" defaultValue={initial?.experience_years ?? ''} className="input" /></div>
      <div><label className="label">Rates</label><input name="rate_note" defaultValue={initial?.rate_note ?? ''} className="input" placeholder="Visit Rs 500, baqi kaam dekh kar" /></div>
      <div className="md:col-span-2"><label className="label">Area (kahan kahan jate hain)</label><input name="area_note" defaultValue={initial?.area_note ?? ''} className="input" placeholder="Bosan Road, Gulgasht, 10 km tak" /></div>
      <div className="md:col-span-2"><label className="label">Apne baare mein</label><textarea name="bio" rows={3} defaultValue={initial?.bio ?? ''} className="input" /></div>

      <div className="md:col-span-2">
        <label className="label">Kaun sa kaam karte hain? * (ek se zyada choose kar sakte hain)</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <input type="checkbox" name="categories" value={c.id} defaultChecked={selCats.has(c.id)} /> {c.icon} {c.name}
            </label>
          ))}
        </div>
      </div>

      {societies.length > 0 && (
        <div className="md:col-span-2">
          <label className="label">Kin societies mein kaam karte hain?</label>
          <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {societies.map((s) => (
              <label key={s.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <input type="checkbox" name="societies" value={s.id} defaultChecked={selSocs.has(s.id)} /> {s.name} <span className="text-ink-mute">({s.city})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div><label className="label">Apni photo</label><input name="photo" type="file" accept="image/*" className="input" /></div>
      <div />
      {!isEdit && (
        <>
          <div><label className="label">CNIC front * (sirf verification ke liye, public nahi hoga)</label><input name="cnic_front" type="file" accept="image/*" className="input" required /></div>
          <div><label className="label">CNIC back *</label><input name="cnic_back" type="file" accept="image/*" className="input" required /></div>
        </>
      )}
      <div className="md:col-span-2"><SubmitButton className="btn bg-service hover:bg-service-ink">{isEdit ? 'Save' : 'Register karein'}</SubmitButton></div>
    </form>
  );
}
