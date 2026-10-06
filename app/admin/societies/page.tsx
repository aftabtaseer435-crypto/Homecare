import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate } from '@/lib/format';
import { setSocietyStatus } from '../actions';

export default async function AdminSocieties({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSuperAdmin();
  const { data: societies } = await supabase.from('societies').select('id, name, city, status, created_at').order('created_at', { ascending: false });
  return (
    <div className="card">
      <Flash searchParams={searchParams} />
      <table className="table">
        <thead><tr><th>Society</th><th>City</th><th>Status</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          {(societies ?? []).map((s) => (
            <tr key={s.id}>
              <td><Link href={`/s/${s.id}`}>{s.name}</Link></td>
              <td>{s.city}</td>
              <td>{s.status}</td>
              <td>{fmtDate(s.created_at)}</td>
              <td>
                <form action={setSocietyStatus}>
                  <input type="hidden" name="society_id" value={s.id} />
                  <input type="hidden" name="status" value={s.status === 'active' ? 'suspended' : 'active'} />
                  <SubmitButton className="btn-outline btn-sm">{s.status === 'active' ? 'Suspend' : 'Activate'}</SubmitButton>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
