'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { safePath, str } from '@/lib/actions';

export async function openNotification(fd: FormData) {
  const { supabase, user } = await requireUser('/notifications');
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', str(fd, 'id')).eq('user_id', user.id).is('read_at', null);
  redirect(safePath(str(fd, 'url'), '/notifications'));
}

export async function markAllRead() {
  const { supabase, user } = await requireUser('/notifications');
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  revalidatePath('/notifications');
}
