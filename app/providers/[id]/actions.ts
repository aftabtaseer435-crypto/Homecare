'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { back, num, str } from '@/lib/actions';

export async function logContact(input: { providerId?: string; listingId?: string; kind: 'call' | 'whatsapp' | 'view' }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('contact_events').insert({
    user_id: user?.id ?? null,
    provider_id: input.providerId ?? null,
    listing_id: input.listingId ?? null,
    kind: input.kind,
  });
}

export async function submitReview(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const provider_id = str(fd, 'provider_id');
  const n = str(fd, 'next');
  const path = n.startsWith('/') && !n.startsWith('//') ? n.split('?')[0].split('#')[0] : `/providers/${provider_id}`;
  if (!user) back(`/login?next=${path}`, 'err', 'Review ke liye login karein');
  const stars = num(fd, 'stars');
  if (!stars || stars < 1 || stars > 5) back(path, 'err', 'Stars chunein');
  const { error } = await supabase
    .from('reviews')
    .upsert({ provider_id, user_id: user!.id, stars, comment: str(fd, 'comment').slice(0, 500) || null }, { onConflict: 'provider_id,user_id' });
  if (error) back(path, 'err', 'Review sirf woh de sakta hai jis ne is provider se order liya ya call / WhatsApp kiya ho.');
  revalidatePath(`/providers/${provider_id}`);
  back(path, 'ok', 'Shukriya! Aap ka review save ho gaya.');
}

export async function submitComplaint(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const provider_id = str(fd, 'provider_id') || null;
  const listing_id = str(fd, 'listing_id') || null;
  const path = provider_id ? `/providers/${provider_id}` : `/properties/${listing_id}`;
  if (!user) back(`/login?next=${path}`, 'err', 'Complaint ke liye login karein');
  const { error } = await supabase.from('complaints').insert({ reporter_id: user!.id, provider_id, listing_id, reason: str(fd, 'reason') });
  if (error) back(path, 'err', error.message);
  back(path, 'ok', 'Complaint mil gayi. Admin review karega.');
}
