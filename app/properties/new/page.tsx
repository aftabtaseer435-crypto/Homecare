import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';
import { houseLabel } from '@/lib/format';
import { createListing } from '../actions';

export const metadata = { title: 'Ghar list karein' };

export default async function NewListing({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireUser('/properties/new');
  const { data: myHouses } = await supabase
    .from('house_owners')
    .select('house:houses(id, block, street, house_no, plot_size, society:societies(name, city))')
    .eq('user_id', user.id)
    .eq('status', 'verified');

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ghar rent ya sale ke liye list karein" subtitle="Agar ghar society mein verified hai to listing par 'Society verified' badge lagega." />
      <Flash searchParams={searchParams} />
      <form action={createListing} className="card grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Rent ya sale *</label>
          <select name="listing_type" className="input"><option value="rent">Rent</option><option value="sale">Sale</option></select>
        </div>
        <div>
          <label className="label">Mera registered ghar (verified badge ke liye)</label>
          <select name="house_id" className="input">
            <option value="">— society se bahar / registered nahi —</option>
            {((myHouses ?? []) as any[]).map((h) => (
              <option key={h.house.id} value={h.house.id}>{h.house.society?.name} — {houseLabel(h.house)}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2"><label className="label">Title *</label><input name="title" className="input" required placeholder="5 marla double story, corner" /></div>
        <div><label className="label">City *</label><input name="city" className="input" required defaultValue={((myHouses ?? [])[0] as any)?.house?.society?.city ?? ''} /></div>
        <div><label className="label">Area / mohalla</label><input name="area_text" className="input" /></div>
        <div><label className="label">Plot size</label><input name="plot_size" className="input" placeholder="5 marla" /></div>
        <div>
          <label className="label">Portion</label>
          <select name="portion" className="input">
            <option value="full">Poora ghar</option><option value="upper">Upper portion</option><option value="lower">Lower portion</option><option value="room">Room</option>
          </select>
        </div>
        <div><label className="label">Bedrooms</label><input name="bedrooms" type="number" min="0" className="input" /></div>
        <div><label className="label">Bathrooms</label><input name="bathrooms" type="number" min="0" className="input" /></div>
        <div>
          <label className="label">Furnished</label>
          <select name="furnished" className="input">
            <option value="unfurnished">Unfurnished</option><option value="semi">Semi furnished</option><option value="furnished">Furnished</option>
          </select>
        </div>
        <div><label className="label">Available from</label><input name="available_from" type="date" className="input" /></div>
        <div><label className="label">Price / monthly rent (Rs) *</label><input name="price" type="number" min="0" className="input" required /></div>
        <div><label className="label">Advance / security (Rs)</label><input name="advance" type="number" min="0" className="input" /></div>
        <div className="md:col-span-2"><label className="label">Detail</label><textarea name="description" rows={4} className="input" placeholder="Gas, bijli, pani meter alag, parking, school qareeb…" /></div>
        <div><label className="label">Contact number *</label><input name="contact_phone" className="input" required defaultValue={displayPhone(profile.phone)} /></div>
        <p className="flex items-end pb-2 text-xs text-gray-500">Yeh number listing par buyers / tenants ko dikhega.</p>
        <div className="md:col-span-2"><label className="label">Photos (15 tak)</label><input name="photos" type="file" accept="image/*" multiple className="input" /></div>
        <div className="md:col-span-2"><SubmitButton pendingText="Upload ho raha hai…">Listing publish karein</SubmitButton></div>
      </form>
    </div>
  );
}
