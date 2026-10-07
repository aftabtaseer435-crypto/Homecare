'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { back, str } from '@/lib/actions';

export async function deleteAccount(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (str(fd, 'confirm') !== 'DELETE') back('/account/delete', 'err', 'Confirm ke liye DELETE (bare harfon mein) likhein');

  const admin = createAdminClient();

  // remove everything the user uploaded (every file lives under "<uid>/...") from both buckets
  for (const bucket of ['public-media', 'private-docs'] as const) {
    const files: string[] = [];
    const walk = async (dir: string, depth: number) => {
      const { data } = await admin.storage.from(bucket).list(dir, { limit: 1000 });
      for (const f of data ?? []) {
        const p = `${dir}/${f.name}`;
        if (f.id) files.push(p);
        else if (depth < 4) await walk(p, depth + 1); // folders have no id
      }
    };
    await walk(user!.id, 0);
    for (let i = 0; i < files.length; i += 100) await admin.storage.from(bucket).remove(files.slice(i, i + 100));
  }

  // profile → cascades to provider, listings, reviews, saved, memberships;
  // house_owners.user_id is set null (society keeps its record)
  const { error } = await admin.auth.admin.deleteUser(user!.id);
  if (error) back('/account/delete', 'err', error.message);
  await supabase.auth.signOut();
  redirect('/?ok=' + encodeURIComponent('Aap ka account delete ho gaya.'));
}
