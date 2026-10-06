import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import ProviderForm from '../ProviderForm';
import { registerProvider } from '../actions';

export const metadata = { title: 'Provider register karein' };

export default async function ProviderRegister({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireUser('/provider/register');
  const { data: existing } = await supabase.from('providers').select('id').eq('user_id', user.id).maybeSingle();
  if (existing) redirect('/provider/dashboard');

  const [{ data: categories }, { data: societies }] = await Promise.all([
    supabase.from('service_categories').select('id, name, grp, icon').eq('active', true).order('sort'),
    supabase.from('societies').select('id, name, city').eq('status', 'active').order('name'),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Service provider ban kar register karein" subtitle="Electrician, plumber, masi, rickshaw — free profile. CNIC verification ke baad aap list mein nazar aayenge." />
      <Flash searchParams={searchParams} />
      <ProviderForm action={registerProvider} categories={categories ?? []} societies={societies ?? []} defaultPhone={profile.phone} />
    </div>
  );
}
