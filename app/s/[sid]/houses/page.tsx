import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { getHouses, groupHouses } from '@/lib/societyData';
import { bulkCreateHouses, deleteHouse, importHousesCsv, updateHouse } from '../actions';

export default async function Houses({
  params,
  searchParams,
}: {
  params: { sid: string };
  searchParams: { block?: string; street?: string; ok?: string; err?: string };
}) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const houses = await getHouses(supabase, params.sid);
  const groups = groupHouses(houses);
  const block = searchParams.block ?? groups[0]?.block;
  const g = groups.find((x) => x.block === block);
  const street = searchParams.street;
  const s = g?.streets.find((x) => x.street === street);

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <div className="grid gap-4 md:grid-cols-2">
        <form action={bulkCreateHouses} className="card space-y-3">
          <h2>Ghar ek sath banayein</h2>
          <p className="muted">Misal: Block A, Gali 1 se 40, har gali mein Ghar 1 se 50 = 2000 ghar.</p>
          <input type="hidden" name="sid" value={params.sid} />
          <div>
            <label className="label">Block / Phase (optional)</label>
            <input name="block" className="input" placeholder="A" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Gali from</label><input name="street_from" type="number" min="1" className="input" required /></div>
            <div><label className="label">Gali to</label><input name="street_to" type="number" min="1" className="input" required /></div>
            <div><label className="label">Ghar from</label><input name="house_from" type="number" min="1" className="input" required /></div>
            <div><label className="label">Ghar to</label><input name="house_to" type="number" min="1" className="input" required /></div>
          </div>
          <div><label className="label">Plot size (optional)</label><input name="plot_size" className="input" placeholder="5 marla" /></div>
          <SubmitButton>Ghar banayein</SubmitButton>
        </form>

        <form action={importHousesCsv} className="card space-y-3">
          <h2>Excel / CSV se import</h2>
          <p className="muted">
            Har line: <code>block, gali, ghar_no, plot_size, owner_name, owner_mobile</code>. Owner columns optional hain —
            agar diye to owner verified add ho jayega aur WhatsApp reminders usi number par jayenge. Excel se copy-paste bhi chalega.
          </p>
          <input type="hidden" name="sid" value={params.sid} />
          <textarea name="csv" rows={8} className="input font-mono text-xs" placeholder={'A,1,1,5 marla,Ahmed Ali,03001234567\nA,1,2,5 marla,,\nB,3,14,10 marla,Sara Khan,03211234567'} />
          <SubmitButton>Import karein</SubmitButton>
        </form>
      </div>

      <div className="card">
        <h2 className="mb-1">Ghar ({houses.length})</h2>
        <p className="muted mb-4">Gali choose kar ke ghar edit karein (exempt, khali, rent pe, plot size).</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {groups.map((x) => (
            <a key={x.block} href={`?block=${encodeURIComponent(x.block)}`} className={`badge px-3 py-1 no-underline ${x.block === block ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {x.block ? `Block ${x.block}` : 'No block'} ({x.streets.reduce((n, st) => n + st.houses.length, 0)})
            </a>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {g?.streets.map((x) => (
            <a key={x.street} href={`?block=${encodeURIComponent(g.block)}&street=${encodeURIComponent(x.street)}`} className={`badge px-3 py-1 no-underline ${x.street === street ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Gali {x.street} ({x.houses.length})
            </a>
          ))}
        </div>
        {s && (
          <table className="table">
            <thead><tr><th>Ghar</th><th>Plot size</th><th>Occupancy</th><th>Fund exempt</th><th></th></tr></thead>
            <tbody>
              {s.houses.map((h) => (
                <tr key={h.id}>
                  <td className="font-semibold">{h.house_no}</td>
                  <td colSpan={4}>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateHouse} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="sid" value={params.sid} />
                        <input type="hidden" name="house_id" value={h.id} />
                        <input type="hidden" name="block" value={h.block} />
                        <input type="hidden" name="street" value={h.street} />
                        <input name="plot_size" defaultValue={h.plot_size ?? ''} className="input w-28" />
                        <select name="occupancy" defaultValue={h.occupancy} className="input w-36">
                          <option value="owner">Owner rehta hai</option>
                          <option value="rented">Rent pe</option>
                          <option value="vacant">Khali</option>
                          <option value="construction">Under construction</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="fund_exempt" defaultChecked={h.fund_exempt} /> Exempt</label>
                        <button className="btn-outline btn-sm">Save</button>
                      </form>
                      <form action={deleteHouse}>
                        <input type="hidden" name="sid" value={params.sid} />
                        <input type="hidden" name="house_id" value={h.id} />
                        <SubmitButton className="btn-danger btn-sm" confirm="Ghar aur us ka sara record delete ho jayega. Pakka?">Delete</SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
