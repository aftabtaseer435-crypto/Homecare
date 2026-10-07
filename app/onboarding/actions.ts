'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safePath, str } from '@/lib/actions';

export async function saveName(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const full_name = str(fd, 'full_name');
  const next = str(fd, 'next');
  await supabase
    .from('profiles')
    .update({ full_name, whatsapp_opt_in: fd.get('whatsapp_opt_in') === 'on' })
    .eq('id', user.id);
  redirect(safePath(next));
}
