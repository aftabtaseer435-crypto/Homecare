import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

/** "Main kaam karta / bechta hoon" → dashboard if a profile exists, else register. */
export default async function ProviderHome() {
  const { supabase, user } = await requireUser('/provider');
  const { data } = await supabase.from('providers').select('id').eq('user_id', user.id).maybeSingle();
  redirect(data ? '/provider/dashboard' : '/provider/register');
}
