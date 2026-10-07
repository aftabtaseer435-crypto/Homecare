'use server';

import { revalidatePath } from 'next/cache';
import { requireSocietyStaff } from '@/lib/auth';
import { back, str } from '@/lib/actions';
import { pushToUser } from '@/lib/push';

export async function setSocietyProviderStatus(fd: FormData) {
  const sid = str(fd, 'sid');
  const path = `/s/${sid}/providers`;
  const { supabase } = await requireSocietyStaff(sid, true);
  const status = str(fd, 'status');
  const id = str(fd, 'provider_id');
  const { error } = await supabase.rpc('set_provider_status', { p_provider: id, p_status: status });
  if (error) back(path, 'err', error.message.includes('not allowed') ? 'Ye provider aap ki society mein nahi' : error.message);
  if (status === 'verified') {
    const { data: p } = await supabase.from('providers').select('user_id').eq('id', id).maybeSingle();
    if (p?.user_id) {
      await Promise.race([
        pushToUser(p.user_id, { title: '✓ Aap ki profile verify ho gayi', body: 'Ab aap ke naam ke sath "Verified" nazar aayega.', url: '/provider/dashboard', kind: 'update' }),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    }
  }
  revalidatePath(path);
  revalidatePath('/services');
  back(path, 'ok', status === 'verified' ? 'Provider verify ho gaya' : status === 'suspended' ? 'Provider band — ab list mein nazar nahi aayega' : 'Status update ho gaya');
}
