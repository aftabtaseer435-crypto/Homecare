'use server';

import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth';
import { back, num, str } from '@/lib/actions';

export async function approveRequest(fd: FormData) {
  const { supabase } = await requireSuperAdmin();
  const { data: sid, error } = await supabase.rpc('approve_society_request', { p_request: str(fd, 'request_id') });
  if (error) back('/admin', 'err', error.message);
  revalidatePath('/admin');
  back('/admin', 'ok', `Society approve ho gayi. Admin panel: /s/${sid}`);
}

export async function rejectRequest(fd: FormData) {
  const { supabase, user } = await requireSuperAdmin();
  const { error } = await supabase
    .from('society_requests')
    .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', str(fd, 'request_id'));
  if (error) back('/admin', 'err', error.message);
  back('/admin', 'ok', 'Request reject ho gayi');
}

export async function setSocietyStatus(fd: FormData) {
  const { supabase } = await requireSuperAdmin();
  await supabase.from('societies').update({ status: str(fd, 'status') }).eq('id', str(fd, 'society_id'));
  back('/admin/societies', 'ok', 'Updated');
}

export async function setProviderStatus(fd: FormData) {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from('providers').update({ status: str(fd, 'status') }).eq('id', str(fd, 'provider_id'));
  if (error) back('/admin/providers', 'err', error.message);
  revalidatePath('/services');
  back('/admin/providers', 'ok', 'Provider status update ho gaya');
}

export async function saveCategory(fd: FormData) {
  const { supabase } = await requireSuperAdmin();
  const name = str(fd, 'name');
  const slug = (str(fd, 'slug') || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const { error } = await supabase.from('service_categories').upsert(
    { slug, name, name_ur: str(fd, 'name_ur') || null, grp: str(fd, 'grp') || 'Other', icon: str(fd, 'icon') || null, sort: num(fd, 'sort') ?? 100 },
    { onConflict: 'slug' },
  );
  if (error) back('/admin/categories', 'err', error.message);
  revalidatePath('/services');
  back('/admin/categories', 'ok', 'Category save ho gayi');
}

export async function toggleCategory(fd: FormData) {
  const { supabase } = await requireSuperAdmin();
  await supabase.from('service_categories').update({ active: str(fd, 'active') === 'true' }).eq('id', str(fd, 'id'));
  revalidatePath('/services');
  back('/admin/categories', 'ok', 'Updated');
}

export async function closeComplaint(fd: FormData) {
  const { supabase } = await requireSuperAdmin();
  await supabase.from('complaints').update({ status: 'closed' }).eq('id', str(fd, 'id'));
  back('/admin/complaints', 'ok', 'Complaint close ho gayi');
}

export async function hideListing(fd: FormData) {
  const { supabase } = await requireSuperAdmin();
  await supabase.from('property_listings').update({ status: 'hidden' }).eq('id', str(fd, 'listing_id'));
  back('/admin/complaints', 'ok', 'Listing hide ho gayi');
}
