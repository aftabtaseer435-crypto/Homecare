'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { back, safePath, str } from '@/lib/actions';

const safeNext = (fd: FormData) => {
  const n = str(fd, 'next');
  return safePath(n).split('?')[0];
};

/** Resident taps "Parh liya" — the notice stops showing as NAYA for them. */
export async function markNoticeRead(fd: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from('notice_reads').upsert({ notice_id: str(fd, 'id'), user_id: user.id }, { onConflict: 'notice_id,user_id' });
  revalidatePath(safeNext(fd));
  back(safeNext(fd), 'ok', 'Theek hai — notice parh liya');
}

/** Chairman: the issue in the notice is over — remove it for everyone. */
export async function resolveNotice(fd: FormData) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('notices')
    .update({ resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq('id', str(fd, 'id'))
    .select('id');
  if (error || !data?.length) back(safeNext(fd), 'err', 'Sirf chairman notice band kar sakta hai');
  revalidatePath(safeNext(fd));
  back(safeNext(fd), 'ok', 'Notice khatam — ab residents ko nazar nahi aayega');
}

export async function deleteNotice(fd: FormData) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from('notices').delete().eq('id', str(fd, 'id')).select('id');
  if (error || !data?.length) back(safeNext(fd), 'err', 'Notice delete nahi hua');
  back(safeNext(fd), 'ok', 'Notice delete ho gaya');
}
