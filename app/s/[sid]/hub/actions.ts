'use server';

import { revalidatePath } from 'next/cache';
import { requireSocietyStaff } from '@/lib/auth';
import { back, num, oneOf, str } from '@/lib/actions';
import { normalizePhone } from '@/lib/phone';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadFile } from '@/lib/upload';

const sidOf = (fd: FormData) => str(fd, 'sid');
const path = (sid: string) => `/s/${sid}/hub`;

async function image(supabase: any, userId: string, fd: FormData, key: string, sid: string) {
  const f = fd.get(key);
  if (!f || typeof f === 'string' || f.size === 0) return null;
  let p: string | null = null;
  try {
    if (!f.type.startsWith('image/')) throw new Error('Sirf JPG / PNG / WEBP photo');
    p = await uploadFile(supabase, 'public-media', userId, 'society', f);
  } catch (e: any) {
    back(path(sid), 'err', e.message);
  }
  return p;
}

export async function saveHub(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user, profile } = await requireSocietyStaff(sid, true);
  const { data: before } = await supabase.from('societies').select('slug, chairman_phone, chairman_user_id').eq('id', sid).single();
  const chairmanPhone = str(fd, 'chairman_phone') ? normalizePhone(str(fd, 'chairman_phone')) : null;
  if (str(fd, 'chairman_phone') && !chairmanPhone) back(path(sid), 'err', 'Chairman ka mobile number sahi nahi');
  const officePhone = str(fd, 'office_phone') ? normalizePhone(str(fd, 'office_phone')) : null;

  const patch: Record<string, any> = {
    tagline: str(fd, 'tagline') || null,
    about: str(fd, 'about') || null,
    chairman_name: str(fd, 'chairman_name') || null,
    welfare_name: str(fd, 'welfare_name') || null,
    address: str(fd, 'address') || null,
    office_phone: officePhone,
    office_hours: str(fd, 'office_hours') || null,
    map_url: /^https?:\/\//.test(str(fd, 'map_url')) ? str(fd, 'map_url') : null,
    established: str(fd, 'established') || null,
    amenities: str(fd, 'amenities').split(/\n|,/).map((x) => x.trim()).filter(Boolean).slice(0, 24),
  };
  const banner = await image(supabase, user.id, fd, 'banner', sid);
  if (banner) patch.banner_path = banner;
  const { error } = await supabase.from('societies').update(patch).eq('id', sid);
  if (error) back(path(sid), 'err', error.message);

  // chairman number changed → link to that account now (or on their first login)
  if (chairmanPhone !== (before?.chairman_phone ?? null)) {
    // only the current chairman (or platform super admin) can hand over the chair
    if (before?.chairman_user_id && before.chairman_user_id !== user.id && !profile.is_super_admin) {
      back(path(sid), 'err', 'Baqi sab save ho gaya, magar chairman sirf mojooda chairman ya Super Admin badal sakta hai');
    }
    const admin = createAdminClient();
    const { data: prof } = chairmanPhone ? await admin.from('profiles').select('id').eq('phone', chairmanPhone).maybeSingle() : { data: null };
    await admin.from('societies').update({ chairman_phone: chairmanPhone, chairman_user_id: prof?.id ?? null }).eq('id', sid);
    if (prof) await admin.from('society_members').upsert({ society_id: sid, user_id: prof.id, role: 'admin' }, { onConflict: 'society_id,user_id' });
  }
  revalidatePath(`/society/${before?.slug}`);
  back(path(sid), 'ok', 'Society page save ho gaya');
}

export async function saveProject(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid, true);
  const status = ['planned', 'in_progress', 'done'].includes(str(fd, 'status')) ? str(fd, 'status') : 'planned';
  const progress = status === 'done' ? 100 : status === 'planned' ? 0 : Math.min(100, Math.max(0, num(fd, 'progress') ?? 0));
  const row: Record<string, any> = {
    society_id: sid,
    title: str(fd, 'title'),
    category: oneOf(str(fd, 'category'), ['lights', 'safai', 'roads', 'water', 'sewerage', 'security', 'parks', 'mosque', 'other'], 'other'),
    status,
    description: str(fd, 'description') || null,
    area: str(fd, 'area') || null,
    cost: num(fd, 'cost'),
    progress,
    target_date: str(fd, 'target_date') || null,
    completed_on: status === 'done' ? str(fd, 'completed_on') || new Date().toISOString().slice(0, 10) : null,
    sort: num(fd, 'sort') ?? 100,
  };
  if (!row.title) back(path(sid), 'err', 'Kaam ka naam likhein');
  const img = await image(supabase, user.id, fd, 'image', sid);
  if (img) row.image_path = img;
  if (fd.get('remove_image') === 'on') row.image_path = null;
  const id = str(fd, 'id');
  const { error } = id
    ? await supabase.from('society_projects').update(row).eq('id', id).eq('society_id', sid)
    : await supabase.from('society_projects').insert({ ...row, created_by: user.id });
  if (error) back(path(sid), 'err', error.message);
  back(path(sid), 'ok', id ? 'Kaam update ho gaya' : 'Naya kaam add ho gaya');
}

export async function deleteProject(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { error } = await supabase.from('society_projects').delete().eq('id', str(fd, 'id')).eq('society_id', sid);
  if (error) back(path(sid), 'err', error.message);
  back(path(sid), 'ok', 'Kaam hata diya');
}
