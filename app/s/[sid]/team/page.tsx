import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';
import { addMember, removeMember } from '../actions';

export default async function Team({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const { data: members } = await supabase
    .from('society_members')
    .select('user_id, role, profile:profiles(full_name, phone)')
    .eq('society_id', params.sid);

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <section className="card">
        <h2 className="mb-3">Team</h2>
        <table className="table">
          <thead><tr><th>Naam</th><th>Mobile</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {(members ?? []).map((m: any) => (
              <tr key={m.user_id}>
                <td>{m.profile?.full_name}</td>
                <td>{displayPhone(m.profile?.phone)}</td>
                <td>{m.role === 'admin' ? 'Admin' : 'Collector'}</td>
                <td>
                  <form action={removeMember}>
                    <input type="hidden" name="sid" value={params.sid} />
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <SubmitButton className="text-xs text-due" confirm="Remove karein?">Remove</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <form action={addMember} className="card flex flex-wrap items-end gap-3">
        <input type="hidden" name="sid" value={params.sid} />
        <div><label className="label">Mobile number</label><input name="phone" className="input" required /></div>
        <div>
          <label className="label">Role</label>
          <select name="role" className="input">
            <option value="collector">Collector (sirf payment entry)</option>
            <option value="admin">Admin (sab kuch)</option>
          </select>
        </div>
        <SubmitButton>Add</SubmitButton>
        <p className="muted w-full">Member pehle is number se app par login kare, phir yahan add karein.</p>
      </form>
    </div>
  );
}
