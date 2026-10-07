'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { back, num, str } from '@/lib/actions';
import { normalizePhone } from '@/lib/phone';
import { uploadFile } from '@/lib/upload';
import { pushToUsers, recipientsFrom } from '@/lib/push';

async function saveLinks(supabase: ReturnType<typeof createClient>, providerId: string, fd: FormData) {
  const cats = fd.getAll('categories').map(String);
  const socs = fd.getAll('societies').map(String);
  await supabase.from('provider_categories').delete().eq('provider_id', providerId);
  if (cats.length) await supabase.from('provider_categories').insert(cats.map((category_id) => ({ provider_id: providerId, category_id })));
  await supabase.from('provider_societies').delete().eq('provider_id', providerId);
  if (socs.length) await supabase.from('provider_societies').insert(socs.map((society_id) => ({ provider_id: providerId, society_id })));
}

function fields(fd: FormData) {
  return {
    display_name: str(fd, 'display_name'),
    city: str(fd, 'city'),
    phone: normalizePhone(str(fd, 'phone')),
    whatsapp: normalizePhone(str(fd, 'whatsapp')),
    experience_years: num(fd, 'experience_years'),
    rate_note: str(fd, 'rate_note') || null,
    area_note: str(fd, 'area_note') || null,
    bio: str(fd, 'bio') || null,
    ...hours(fd),
  };
}

const t = (v: string) => (/^\d{2}:\d{2}$/.test(v) ? v : null);
/** Din / raat ke auqaat — unticked shift = null */
function hours(fd: FormData) {
  const day = fd.get('day_on') === 'on', night = fd.get('night_on') === 'on';
  return {
    day_start: day ? t(str(fd, 'day_start')) : null,
    day_end: day ? t(str(fd, 'day_end')) : null,
    night_start: night ? t(str(fd, 'night_start')) : null,
    night_end: night ? t(str(fd, 'night_end')) : null,
  };
}

export async function registerProvider(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login?next=/provider/register', 'err', 'Pehle login karein');
  const f = fields(fd);
  if (!f.phone) back('/provider/register', 'err', 'Mobile number sahi nahi');
  if (fd.getAll('categories').length === 0) back('/provider/register', 'err', 'Kam az kam ek kaam choose karein');
  if (!f.day_start && !f.night_start) back('/provider/register', 'err', 'Batayein kab service dete hain — din, raat ya dono');

  let photo_path: string | null = null, cnic_front_path: string | null = null, cnic_back_path: string | null = null;
  try {
    photo_path = await uploadFile(supabase, 'public-media', user!.id, 'provider', fd.get('photo'));
    cnic_front_path = await uploadFile(supabase, 'private-docs', user!.id, 'cnic', fd.get('cnic_front'));
    cnic_back_path = await uploadFile(supabase, 'private-docs', user!.id, 'cnic', fd.get('cnic_back'));
  } catch (e) {
    back('/provider/register', 'err', (e as Error).message);
  }

  const { data: p, error } = await supabase
    .from('providers')
    .insert({ ...f, phone: f.phone!, user_id: user!.id, photo_path, cnic_front_path, cnic_back_path })
    .select('id')
    .single();
  if (error) back('/provider/register', 'err', error.code === '23505' ? 'Aap ki provider profile pehle se bani hui hai.' : error.message);
  await saveLinks(supabase, p!.id, fd);

  // tell the chairman / society admins (and super admin) right away
  const socs = fd.getAll('societies').map(String);
  const { data: cats } = await supabase.from('service_categories').select('name').in('id', fd.getAll('categories').map(String));
  const to = await recipientsFrom('provider_alert_recipients', { p_provider: p!.id });
  await Promise.race([
    pushToUsers(to.filter((id) => id !== user!.id), {
      title: `🧰 Naya provider: ${f.display_name}`,
      body: `${(cats ?? []).map((c) => c.name).join(', ')} · ${f.city} — verify karein`,
      url: socs[0] ? `/s/${socs[0]}/providers` : '/admin/providers?status=pending',
      tag: `provider-${p!.id}`,
      kind: 'update',
    }),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  back('/provider/dashboard', 'ok', 'Profile ban gayi aur list mein nazar aa rahi hai (Naya badge ke sath). CNIC verify hone par "Verified" lag jayega.');
}

export async function updateProvider(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login', 'err', 'Pehle login karein');
  const { data: prov } = await supabase.from('providers').select('id').eq('user_id', user!.id).single();
  if (!prov) back('/provider/register', 'err', 'Pehle register karein');
  const f = fields(fd);
  if (!f.phone) back('/provider/dashboard?tab=profile', 'err', 'Mobile number sahi nahi');
  if (!f.day_start && !f.night_start) back('/provider/dashboard?tab=profile', 'err', 'Batayein kab service dete hain — din, raat ya dono');
  let photo_path: string | null = null;
  try {
    photo_path = await uploadFile(supabase, 'public-media', user!.id, 'provider', fd.get('photo'));
  } catch (e) {
    back('/provider/dashboard?tab=profile', 'err', (e as Error).message);
  }
  const { error } = await supabase.from('providers').update({ ...f, phone: f.phone!, ...(photo_path ? { photo_path } : {}) }).eq('id', prov!.id);
  if (error) back('/provider/dashboard?tab=profile', 'err', error.message);
  await saveLinks(supabase, prov!.id, fd);
  revalidatePath(`/providers/${prov!.id}`);
  back('/provider/dashboard?tab=profile', 'ok', 'Profile update ho gayi');
}

export async function setAvailability(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login', 'err', 'Pehle login karein');
  await supabase.from('providers').update({ available: str(fd, 'available') === 'true' }).eq('user_id', user!.id);
  back('/provider/dashboard', 'ok', 'Status update ho gaya');
}
