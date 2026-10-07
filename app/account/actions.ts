'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { back, str } from '@/lib/actions';
import { uploadFile } from '@/lib/upload';

export async function updateAccount(fd: FormData) {
  const { supabase, user } = await requireUser('/account');
  const patch: Record<string, string> = {};
  const name = str(fd, 'full_name');
  if (name) patch.full_name = name;
  const photo = fd.get('photo');
  if (photo && typeof photo !== 'string' && photo.size > 0) {
    let p: string | null = null;
    try {
      if (!photo.type.startsWith('image/')) throw new Error('Photo JPG / PNG / WEBP honi chahiye');
      p = await uploadFile(supabase, 'public-media', user.id, 'avatar', photo);
    } catch (e: any) {
      back('/account', 'err', e.message);
    }
    if (p) patch.avatar_path = p;
  }
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) back('/account', 'err', error.message);
  revalidatePath('/', 'layout');
  back('/account', 'ok', 'Save ho gaya');
}
