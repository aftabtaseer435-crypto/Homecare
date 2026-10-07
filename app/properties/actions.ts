'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { back, num, str } from '@/lib/actions';
import { normalizePhone } from '@/lib/phone';
import { uploadFile } from '@/lib/upload';

export async function createListing(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login?next=/properties/new', 'err', 'Pehle login karein');

  const contact_phone = normalizePhone(str(fd, 'contact_phone'));
  if (!contact_phone) back('/properties/new', 'err', 'Contact number sahi nahi');
  const price = num(fd, 'price');
  if (price === null) back('/properties/new', 'err', 'Price likhein');

  const house_id = str(fd, 'house_id') || null;
  const { data: listing, error } = await supabase
    .from('property_listings')
    .insert({
      owner_id: user!.id,
      house_id,
      listing_type: str(fd, 'listing_type') === 'sale' ? 'sale' : 'rent',
      title: str(fd, 'title'),
      city: str(fd, 'city'),
      area_text: str(fd, 'area_text') || null,
      plot_size: str(fd, 'plot_size') || null,
      bedrooms: num(fd, 'bedrooms'),
      bathrooms: num(fd, 'bathrooms'),
      portion: str(fd, 'portion') || null,
      furnished: str(fd, 'furnished') || null,
      price,
      advance: num(fd, 'advance'),
      available_from: str(fd, 'available_from') || null,
      description: str(fd, 'description') || null,
      contact_phone,
      show_phone: true, // number hiding needs in-app messaging (roadmap)
    })
    .select('id')
    .single();
  if (error) back('/properties/new', 'err', error.message);

  const files = fd.getAll('photos').slice(0, 15);
  let sort = 0;
  for (const f of files) {
    try {
      const path = await uploadFile(supabase, 'public-media', user!.id, `listings/${listing!.id}`, f);
      if (path) await supabase.from('listing_photos').insert({ listing_id: listing!.id, path, sort: sort++ });
    } catch {
      // skip bad file, keep the listing
    }
  }
  revalidatePath('/properties');
  back(`/properties/${listing!.id}`, 'ok', 'Listing live ho gayi!');
}

export async function setListingStatus(fd: FormData) {
  const supabase = createClient();
  const id = str(fd, 'listing_id');
  const status = str(fd, 'status');
  if (!['active', 'rented', 'sold', 'hidden'].includes(status)) back(`/properties/${id}`, 'err', 'Invalid status');
  const { data, error } = await supabase.from('property_listings').update({ status }).eq('id', id).select('id');
  if (error || !data?.length) back(`/properties/${id}`, 'err', error?.message ?? 'Sirf listing ka malik status badal sakta hai');
  revalidatePath('/properties');
  back(`/properties/${id}`, 'ok', 'Status update ho gaya');
}

export async function deleteListing(fd: FormData) {
  const supabase = createClient();
  const id = str(fd, 'listing_id');
  const { data, error } = await supabase.from('property_listings').delete().eq('id', id).select('id');
  if (error || !data?.length) back(`/properties/${id}`, 'err', error?.message ?? 'Sirf listing ka malik delete kar sakta hai');
  revalidatePath('/properties');
  back('/my/listings', 'ok', 'Listing delete ho gayi');
}

export async function toggleSave(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = str(fd, 'listing_id');
  if (!user) back(`/login?next=/properties/${id}`, 'err', 'Save karne ke liye login karein');
  if (str(fd, 'saved') === 'true') await supabase.from('saved_listings').delete().eq('listing_id', id).eq('user_id', user!.id);
  else await supabase.from('saved_listings').insert({ listing_id: id, user_id: user!.id });
  revalidatePath(`/properties/${id}`);
  back(`/properties/${id}`, 'ok', str(fd, 'saved') === 'true' ? 'Saved list se hata diya' : 'Save ho gaya');
}
