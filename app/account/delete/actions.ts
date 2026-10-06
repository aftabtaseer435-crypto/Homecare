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

  // remove the user's uploaded files from both buckets
  for (const bucket of ['public-media', 'private-docs'] as const) {
    for (const folder of ['provider', 'cnic', 'payments']) {
      const { data } = await admin.storage.from(bucket).list(`${user!.id}/${folder}`, { limit: 1000 });
      if (data?.length) await admin.storage.from(bucket).remove(data.map((f) => `${user!.id}/${folder}/${f.name}`));
    }
    const { data: listingDirs } = await admin.storage.from(bucket).list(`${user!.id}/listings`, { limit: 1000 });
    for (const d of listingDirs ?? []) {
      const { data } = await admin.storage.from(bucket).list(`${user!.id}/listings/${d.name}`, { limit: 1000 });
      if (data?.length) await admin.storage.from(bucket).remove(data.map((f) => `${user!.id}/listings/${d.name}/${f.name}`));
    }
  }

  // profile → cascades to provider, listings, reviews, saved, memberships;
  // house_owners.user_id is set null (society keeps its record)
  const { error } = await admin.auth.admin.deleteUser(user!.id);
  if (error) back('/account/delete', 'err', error.message);
  await supabase.auth.signOut();
  redirect('/?ok=' + encodeURIComponent('Aap ka account delete ho gaya.'));
}
