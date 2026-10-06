import { requireSuperAdmin } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';
import { fmtDate } from '@/lib/format';
import { approveRequest, rejectRequest } from './actions';

export default async function AdminRequests({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSuperAdmin();
  const { data: requests } = await supabase
    .from('society_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  const pending = (requests ?? []).filter((r) => r.status === 'pending');
  const done = (requests ?? []).filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <h2>Pending requests ({pending.length})</h2>
      {pending.length === 0 && <p className="muted">Koi pending request nahi.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {pending.map((r) => (
          <div key={r.id} className="card space-y-2 text-sm">
            <div className="text-base font-semibold">{r.society_name} <span className="font-normal text-gray-500">· {r.city}</span></div>
            <div>{r.address}</div>
            {r.map_url && <a href={r.map_url} target="_blank">Map</a>}
            <div className="grid grid-cols-2 gap-1 text-gray-600">
              <span>Admin: {r.admin_name}</span><span>Mobile: {displayPhone(r.admin_phone)}</span>
              <span>President: {r.president_name ?? '—'}</span><span>Ghar: {r.total_houses ?? '—'}</span>
              <span>Reg no: {r.registration_no ?? '—'}</span><span>Email: {r.email ?? '—'}</span>
            </div>
            {r.notes && <p className="rounded bg-gray-50 p-2">{r.notes}</p>}
            <div className="muted">{fmtDate(r.created_at)}</div>
            <div className="flex gap-2 pt-2">
              <form action={approveRequest}><input type="hidden" name="request_id" value={r.id} /><SubmitButton className="btn btn-sm">Approve</SubmitButton></form>
              <form action={rejectRequest}><input type="hidden" name="request_id" value={r.id} /><SubmitButton className="btn-outline btn-sm" confirm="Reject karein?">Reject</SubmitButton></form>
              <a className="btn-outline btn-sm" href={`tel:+${r.admin_phone}`}>Call</a>
            </div>
          </div>
        ))}
      </div>

      <h2>History</h2>
      <div className="card">
        <table className="table">
          <thead><tr><th>Society</th><th>City</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {done.map((r) => (
              <tr key={r.id}>
                <td>{r.society_id ? <a href={`/s/${r.society_id}`}>{r.society_name}</a> : r.society_name}</td>
                <td>{r.city}</td><td>{r.status}</td><td>{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
