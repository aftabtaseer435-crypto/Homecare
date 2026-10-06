import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth';
import { Flash, Stars } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { createAdminClient } from '@/lib/supabase/admin';
import { displayPhone } from '@/lib/phone';
import { fmtDate } from '@/lib/format';
import { setProviderStatus } from '../actions';

export default async function AdminProviders({ searchParams }: { searchParams: { status?: string; ok?: string; err?: string } }) {
  const { supabase } = await requireSuperAdmin();
  const status = searchParams.status ?? 'pending';
  const { data: providers } = await supabase
    .from('providers')
    .select('id, display_name, phone, city, status, cnic_front_path, cnic_back_path, rating_avg, rating_count, created_at, provider_categories(category:service_categories(name))')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(200);

  const admin = createAdminClient();
  const sign = async (path: string | null) =>
    path ? (await admin.storage.from('private-docs').createSignedUrl(path, 3600)).data?.signedUrl ?? null : null;
  const rows = await Promise.all(
    (providers ?? []).map(async (p: any) => ({ ...p, front: await sign(p.cnic_front_path), back: await sign(p.cnic_back_path) })),
  );

  const action = (id: string, to: string, label: string, cls = 'btn-outline btn-sm') => (
    <form action={setProviderStatus}>
      <input type="hidden" name="provider_id" value={id} />
      <input type="hidden" name="status" value={to} />
      <SubmitButton className={cls}>{label}</SubmitButton>
    </form>
  );

  return (
    <div className="space-y-4">
      <Flash searchParams={searchParams} />
      <div className="flex gap-2">
        {['pending', 'verified', 'suspended', 'rejected'].map((s) => (
          <Link key={s} href={`?status=${s}`} className={`badge px-3 py-1 no-underline ${s === status ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{s}</Link>
        ))}
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Provider</th><th>Kaam</th><th>CNIC</th><th>Rating</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/providers/${p.id}`} className="font-semibold">{p.display_name}</Link>
                  <div className="muted">{displayPhone(p.phone)} · {p.city} · {fmtDate(p.created_at)}</div>
                </td>
                <td>{p.provider_categories.map((c: any) => c.category?.name).join(', ')}</td>
                <td className="space-x-2">
                  {p.front ? <a href={p.front} target="_blank">Front</a> : '—'}
                  {p.back && <a href={p.back} target="_blank">Back</a>}
                </td>
                <td><Stars value={Number(p.rating_avg)} count={p.rating_count} /></td>
                <td className="flex flex-wrap gap-2">
                  {p.status !== 'verified' && action(p.id, 'verified', 'Verify', 'btn btn-sm')}
                  {p.status === 'pending' && action(p.id, 'rejected', 'Reject')}
                  {p.status === 'verified' && action(p.id, 'suspended', 'Suspend', 'btn-danger btn-sm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">Koi provider nahi.</p>}
      </div>
    </div>
  );
}
