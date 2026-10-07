'use server';

import { createClient } from '@/lib/supabase/server';
import { back, str } from '@/lib/actions';
import { pushToUsers, recipientsFrom } from '@/lib/push';

export async function claimHouse(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login', 'err', 'Pehle login karein');
  const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user!.id).single();

  const house_id = str(fd, 'house_id');
  const { data: home } = await supabase.from('houses').select('society_id').eq('id', house_id).maybeSingle();
  if (!home) back('/societies/join', 'err', 'Ghar nahi mila');
  const society_id = home!.society_id as string;
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
  const { data: h } = await supabase.from('houses').select('block, street, house_no').eq('id', house_id).maybeSingle();
  const admins = await recipientsFrom('society_admin_ids', { sid: society_id });
  await Promise.race([
    pushToUsers(admins, {
      title: `🏠 Nayi ghar request: ${str(fd, 'owner_name')}`,
      body: `${h ? `${h.block ? `Block ${h.block}, ` : ''}Gali ${h.street}, Ghar ${h.house_no}` : ''} · ${str(fd, 'relation') === 'tenant' ? 'Kirayedar' : 'Malik'} — approve karein`,
      url: `/s/${society_id}/owners`,
      tag: `owner-${house_id}`,
      kind: 'update',
    }),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  back('/dashboard', 'ok', 'Request bhej di gayi. Society admin approve karega to status nazar aayega.');
}
