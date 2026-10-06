'use server';

import { createClient } from '@/lib/supabase/server';
import { back, num, str } from '@/lib/actions';
import { normalizePhone } from '@/lib/phone';

export async function submitSocietyRequest(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login', 'err', 'Pehle login karein');

  const admin_phone = normalizePhone(str(fd, 'admin_phone'));
  if (!admin_phone) back('/societies/register', 'err', 'Admin mobile number sahi nahi');

  const { error } = await supabase.from('society_requests').insert({
    requester_id: user!.id,
    society_name: str(fd, 'society_name'),
    city: str(fd, 'city'),
    address: str(fd, 'address'),
    map_url: str(fd, 'map_url') || null,
    total_houses: num(fd, 'total_houses'),
    president_name: str(fd, 'president_name') || null,
    admin_name: str(fd, 'admin_name'),
    admin_phone,
    email: str(fd, 'email') || null,
    registration_no: str(fd, 'registration_no') || null,
    notes: str(fd, 'notes') || null,
  });
  if (error) back('/societies/register', 'err', error.message);
  back('/dashboard', 'ok', 'Request mil gayi! Hamari team jald call karegi.');
}
