'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { back, num, str } from '@/lib/actions';
import { uploadFile } from '@/lib/upload';
import { category } from '@/lib/welfare';

async function me() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/welfare');
  return { supabase, user: user! };
}

/** Resident (or agent on behalf of a house) reports a masla. */
export async function createIssue(fd: FormData) {
  const { supabase, user } = await me();
  const house_id = str(fd, 'house_id');
  const cat = str(fd, 'category');
  const path = `/welfare/report?house=${house_id}&cat=${cat}`;
  const description = str(fd, 'description');
  if (!description) back(path, 'err', 'Masla likhein');

  let photo_path: string | null = null;
  try {
    photo_path = await uploadFile(supabase, 'private-docs', user.id, 'welfare', fd.get('photo'));
  } catch (e) {
    back(path, 'err', (e as Error).message);
  }

  const { data, error } = await supabase
    .from('welfare_issues')
    .insert({ house_id, category: cat, title: category(cat).label, description, photo_path })
    .select('id')
    .single();
  if (error) back(path, 'err', error.message.includes('not allowed') ? 'Aap is ghar ke liye masla report nahi kar sakte' : error.message);
  revalidatePath('/welfare');
  redirect(`/welfare/issues/${data!.id}?new=1`);
}

/** Neighbour adds +1 to an existing street issue instead of a duplicate. */
export async function supportIssue(fd: FormData) {
  const { supabase } = await me();
  const issue = str(fd, 'issue_id');
  const house = str(fd, 'house_id');
  const { error } = await supabase.rpc('welfare_support', { p_issue: issue, p_house: house });
  if (error) back(`/welfare/report?house=${house}`, 'err', 'Support nahi ho saka');
  revalidatePath('/welfare');
  back(`/welfare/issues/${issue}`, 'ok', 'Aap ki awaz shamil ho gayi (+1). Agent ko pata chal gaya ke yeh masla aur logon ka bhi hai.');
}

/** Every status change goes through one database function (cannot be faked). */
export async function transition(fd: FormData) {
  const { supabase, user } = await me();
  const id = str(fd, 'issue_id');
  const action = str(fd, 'action');
  const path = `/welfare/issues/${id}`;
  let photo: string | null = null;
  try {
    photo = await uploadFile(supabase, 'private-docs', user.id, 'welfare', fd.get('photo'));
  } catch (e) {
    back(path, 'err', (e as Error).message);
  }
  const { error } = await supabase.rpc('welfare_transition', {
    p_issue: id,
    p_action: action,
    p_note: str(fd, 'note') || null,
    p_photo: photo,
    p_cost: num(fd, 'cost'),
    p_rating: num(fd, 'rating'),
  });
  if (error) {
    const m = error.message;
    const msg = m.includes('note required') ? 'Pehle tafseel likhein' : m.includes('not allowed') ? 'Aap yeh nahi kar sakte' : m.includes('invalid status') ? 'Masle ka status pehle hi badal chuka hai' : m;
    back(path, 'err', msg);
  }
  revalidatePath(path);
  const ok: Record<string, string> = {
    ack: 'Masla dekh liya — resident ko pata chal gaya.',
    progress: 'Status: kaam jari hai.',
    resolve: 'Hal mark ho gaya. Ab resident ko WhatsApp par bata dein taake woh confirm kare.',
    confirm: 'Shukriya! Masla mukammal band ho gaya.',
    reopen: 'Masla dobara khol diya gaya, agent ko bata dein.',
    note: 'Update shamil ho gayi.',
  };
  back(`${path}${action === 'resolve' ? '?resolved=1' : ''}`, 'ok', ok[action] ?? 'Done');
}
