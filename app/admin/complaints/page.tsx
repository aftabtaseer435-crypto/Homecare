import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate } from '@/lib/format';
import { closeComplaint, hideListing, setProviderStatus } from '../actions';

export default async function AdminComplaints({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSuperAdmin();
  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, reason, status, created_at, provider:providers(id, display_name), listing:property_listings(id, title)')
    .order('status')
    .order('created_at', { ascending: false })
    .limit(200);

  // count open complaints per provider (auto-suspend suggestion at 3+)
  const openPer = new Map<string, number>();
  for (const c of (complaints ?? []) as any[]) if (c.status === 'open' && c.provider) openPer.set(c.provider.id, (openPer.get(c.provider.id) ?? 0) + 1);

  return (
    <div className="card">
      <Flash searchParams={searchParams} />
      <table className="table">
        <thead><tr><th>Against</th><th>Reason</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {((complaints ?? []) as any[]).map((c) => (
            <tr key={c.id}>
              <td>
                {c.provider && <Link href={`/providers/${c.provider.id}`}>{c.provider.display_name}</Link>}
                {c.listing && <Link href={`/properties/${c.listing.id}`}>{c.listing.title}</Link>}
                {c.provider && (openPer.get(c.provider.id) ?? 0) >= 3 && <div className="badge mt-1 bg-due-soft text-due-ink">{openPer.get(c.provider.id)} open complaints</div>}
              </td>
              <td className="max-w-md whitespace-pre-line">{c.reason}</td>
              <td>{fmtDate(c.created_at)}</td>
              <td>{c.status}</td>
              <td className="flex flex-wrap gap-2">
                {c.status === 'open' && (
                  <form action={closeComplaint}><input type="hidden" name="id" value={c.id} /><SubmitButton className="btn-outline btn-sm">Close</SubmitButton></form>
                )}
                {c.provider && (
                  <form action={setProviderStatus}>
                    <input type="hidden" name="provider_id" value={c.provider.id} /><input type="hidden" name="status" value="suspended" />
                    <SubmitButton className="btn-danger btn-sm" confirm="Provider suspend karein?">Suspend</SubmitButton>
                  </form>
                )}
                {c.listing && (
                  <form action={hideListing}>
                    <input type="hidden" name="listing_id" value={c.listing.id} />
                    <SubmitButton className="btn-danger btn-sm">Hide listing</SubmitButton>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
