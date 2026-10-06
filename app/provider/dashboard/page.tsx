import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader, Stat, Stars } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import ProviderForm from '../ProviderForm';
import { setAvailability, updateProvider } from '../actions';

export const metadata = { title: 'Provider dashboard' };

export default async function ProviderDashboard({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user } = await requireUser('/provider/dashboard');
  const { data: prov } = await supabase
    .from('providers')
    .select('*, provider_categories(category_id), provider_societies(society_id)')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!prov) redirect('/provider/register');

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [{ data: categories }, { data: societies }, { count: calls }, { count: whats }, { data: reviews }] = await Promise.all([
    supabase.from('service_categories').select('id, name, grp, icon').eq('active', true).order('sort'),
    supabase.from('societies').select('id, name, city').eq('status', 'active').order('name'),
    supabase.from('contact_events').select('id', { count: 'exact', head: true }).eq('provider_id', prov.id).eq('kind', 'call').gte('created_at', since),
    supabase.from('contact_events').select('id', { count: 'exact', head: true }).eq('provider_id', prov.id).eq('kind', 'whatsapp').gte('created_at', since),
    supabase.from('reviews').select('id, stars, comment, created_at').eq('provider_id', prov.id).order('created_at', { ascending: false }).limit(5),
  ]);

  const statusText: Record<string, string> = {
    pending: 'Verification pending — admin CNIC check kar raha hai',
    verified: 'Verified — aap list mein nazar aa rahe hain',
    suspended: 'Suspended — admin se rabta karein',
    rejected: 'Rejected — admin se rabta karein',
  };

  return (
    <div className="space-y-6">
      <PageHeader title={prov.display_name} subtitle={statusText[prov.status]} action={<Link href={`/providers/${prov.id}`} className="btn-outline">Public profile dekhein</Link>} />
      <Flash searchParams={searchParams} />

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Calls (30 din)" value={calls ?? 0} />
        <Stat label="WhatsApp (30 din)" value={whats ?? 0} />
        <Stat label="Rating" value={<Stars value={Number(prov.rating_avg)} count={prov.rating_count} />} />
        <div className="card">
          <div className="muted">Abhi available?</div>
          <form action={setAvailability} className="mt-2">
            <input type="hidden" name="available" value={(!prov.available).toString()} />
            <SubmitButton className={prov.available ? 'btn btn-sm' : 'btn-outline btn-sm'}>{prov.available ? '✓ Available — busy karein' : 'Busy — available karein'}</SubmitButton>
          </form>
        </div>
      </div>

      {(reviews ?? []).length > 0 && (
        <div className="card">
          <h2 className="mb-3">Latest reviews</h2>
          <ul className="space-y-2 text-sm">
            {(reviews ?? []).map((r) => <li key={r.id}><Stars value={r.stars} /> {r.comment}</li>)}
          </ul>
        </div>
      )}

      <h2>Profile edit karein</h2>
      <ProviderForm action={updateProvider} categories={categories ?? []} societies={societies ?? []} initial={prov} isEdit />
    </div>
  );
}
