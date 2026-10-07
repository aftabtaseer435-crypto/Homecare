'use server';

import { createClient } from '@/lib/supabase/server';
import { back, str } from '@/lib/actions';

export async function claimHouse(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login', 'err', 'Pehle login karein');
  const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user!.id).single();

  const house_id = str(fd, 'house_id');
  const society_id = str(fd, 'society_id');
  const { error } = await supabase.from('house_owners').insert({
    house_id,
    user_id: user!.id,
    owner_name: str(fd, 'owner_name'),
    owner_phone: profile?.phone ?? '',
    relation: str(fd, 'relation') === 'tenant' ? 'tenant' : 'owner',
    status: 'pending',
  });
  if (error) {
    const msg = error.code === '23505' ? 'Aap is ghar ke liye pehle hi request bhej chuke hain.' : error.message;
    back(`/societies/join?society=${society_id}`, 'err', msg);
  }
  back('/dashboard', 'ok', 'Request bhej di gayi. Society admin approve karega to status nazar aayega.');
}
