'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { back, num, safePath, str } from '@/lib/actions';
import { normalizePhone } from '@/lib/phone';
import { uploadFile } from '@/lib/upload';
import { areaUnits, facings, featureOptions, furnishing, ownershipTypes, portions, possessionTypes, propertyTypes, tenantPrefs, utilityOptions } from '@/lib/property';

const pick = (v: string, list: string[]) => (list.includes(v) ? v : null);
const ids = (l: { id: string }[]) => l.map((x) => x.id);
const many = (fd: FormData, key: string, allowed: string[]) =>
  Array.from(new Set(fd.getAll(key).filter((v): v is string => typeof v === 'string' && allowed.includes(v))));
const pos = (n: number | null) => (n === null || n < 0 ? null : Math.round(n));

/** Everything the form sends, checked; sale-only and rent-only fields are cleared for the other deal. */
function readListing(fd: FormData, path: string) {
  const deal = str(fd, 'listing_type') === 'sale' ? 'sale' : 'rent';
  const property_type = pick(str(fd, 'property_type'), propertyTypes.filter((t) => t[deal]).map((t) => t.id));
  if (!property_type) back(path, 'err', 'Property ki qisam chunein');
  const title = str(fd, 'title').slice(0, 120);
  const city = str(fd, 'city').slice(0, 60);
  if (title.length < 5) back(path, 'err', 'Title thora wazeh likhein (kam az kam 5 huroof)');
  if (!city) back(path, 'err', 'City likhein');
  const price = num(fd, 'price');
  if (price === null || price <= 0) back(path, 'err', deal === 'sale' ? 'Demand (qeemat) likhein' : 'Mahana kiraya likhein');
  if (price! > 100_000_000_000) back(path, 'err', 'Qeemat sahi likhein');
  const contact_phone = normalizePhone(str(fd, 'contact_phone'));
  if (!contact_phone) back(path, 'err', 'Rabta number sahi nahi (03xx-xxxxxxx)');
  const map = str(fd, 'map_url');
  const area_value = num(fd, 'area_value');
  const year = num(fd, 'year_built');
  const sale = deal === 'sale';

  const row = {
    listing_type: deal,
    property_type,
    house_id: str(fd, 'house_id') || null,
    title,
    city,
    area_text: str(fd, 'area_text').slice(0, 120) || null,
    address_line: str(fd, 'address_line').slice(0, 160) || null,
    map_url: /^https:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)\//i.test(map) ? map.slice(0, 400) : null,
    area_value: area_value && area_value > 0 ? area_value : null,
    area_unit: area_value && area_value > 0 ? pick(str(fd, 'area_unit'), ids(areaUnits)) : null,
    plot_size: null as string | null,
    covered_sqft: pos(num(fd, 'covered_sqft')),
    bedrooms: pos(num(fd, 'bedrooms')),
    bathrooms: pos(num(fd, 'bathrooms')),
    kitchens: pos(num(fd, 'kitchens')),
    floors: pos(num(fd, 'floors')),
    parking: pos(num(fd, 'parking')),
    furnished: pick(str(fd, 'furnished'), ids(furnishing)),
    facing: pick(str(fd, 'facing'), facings),
    year_built: year && year >= 1950 && year <= 2100 ? year : null,
    corner: fd.get('corner') === 'on',
    park_facing: fd.get('park_facing') === 'on',
    main_road: fd.get('main_road') === 'on',
    utilities: many(fd, 'utilities', utilityOptions),
    features: many(fd, 'features', featureOptions),
    price: price!,
    description: str(fd, 'description').slice(0, 4000) || null,
    contact_phone: contact_phone!,
    // sale
    negotiable: sale ? fd.get('negotiable') === 'on' : true,
    ownership: sale ? pick(str(fd, 'ownership'), ids(ownershipTypes)) : null,
    possession: sale ? pick(str(fd, 'possession'), ids(possessionTypes)) : null,
    documents_clear: sale ? (str(fd, 'documents_clear') === 'yes' ? true : str(fd, 'documents_clear') === 'no' ? false : null) : null,
    installments: sale ? fd.get('installments') === 'on' : false,
    installment_note: sale && fd.get('installments') === 'on' ? str(fd, 'installment_note').slice(0, 200) || null : null,
    // rent
    advance: sale ? null : pos(num(fd, 'advance')),
    advance_months: sale ? null : pos(num(fd, 'advance_months')),
    min_lease_months: sale ? null : pos(num(fd, 'min_lease_months')),
    portion: sale ? null : pick(str(fd, 'portion'), ids(portions)),
    tenant_pref: sale ? null : pick(str(fd, 'tenant_pref'), ids(tenantPrefs)),
    available_from: sale ? null : str(fd, 'available_from') || null,
    maintenance: sale ? null : pos(num(fd, 'maintenance')),
    bills_included: sale ? false : fd.get('bills_included') === 'on',
  };
  row.plot_size = row.area_value ? `${row.area_value} ${areaUnits.find((u) => u.id === row.area_unit)?.label ?? ''}`.trim() : null;
  return row;
}

async function savePhotos(supabase: ReturnType<typeof createClient>, userId: string, listingId: string, fd: FormData, start: number) {
  const files = fd.getAll('photos').filter((f) => typeof f !== 'string' && f.size > 0).slice(0, Math.max(0, 15 - start));
  let sort = start;
  let failed = 0;
  for (const f of files) {
    try {
      const path = await uploadFile(supabase, 'public-media', userId, `listings/${listingId}`, f);
      if (path) await supabase.from('listing_photos').insert({ listing_id: listingId, path, sort: sort++ });
    } catch {
      failed++;
    }
  }
  return failed;
}

function refresh(id?: string) {
  revalidatePath('/properties', 'layout');
  revalidatePath('/my/listings');
  if (id) revalidatePath(`/properties/${id}`);
}

export async function createListing(fd: FormData) {
  const deal = str(fd, 'listing_type') === 'sale' ? 'sale' : 'rent';
  const path = `/properties/new?type=${deal}`;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back(`/login?next=${encodeURIComponent(path)}`, 'err', 'Pehle login karein');
  const row = readListing(fd, path);

  const { data: listing, error } = await supabase
    .from('property_listings')
    .insert({ ...row, owner_id: user!.id, show_phone: false })
    .select('id')
    .single();
  if (error || !listing) back(path, 'err', error?.message ?? 'Listing save nahi hui');

  const failed = await savePhotos(supabase, user!.id, listing!.id, fd, 0);
  refresh(listing!.id);
  back(`/properties/${listing!.id}`, 'ok', failed ? `Listing live ho gayi — ${failed} photo upload nahi hui (JPG/PNG, 5MB tak)` : 'Listing live ho gayi!');
}

export async function updateListing(fd: FormData) {
  const id = str(fd, 'id');
  const path = `/properties/${id}/edit`;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back(`/login?next=${encodeURIComponent(path)}`, 'err', 'Pehle login karein');
  const { data: old } = await supabase.from('property_listings').select('id, owner_id, listing_type').eq('id', id).maybeSingle();
  if (!old || old.owner_id !== user!.id) back('/my/listings', 'err', 'Sirf listing ka malik isay badal sakta hai');
  fd.set('listing_type', old!.listing_type); // a sale stays a sale, a rent stays a rent
  const row = readListing(fd, path);

  const { data, error } = await supabase
    .from('property_listings')
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  if (error || !data?.length) back(path, 'err', error?.message ?? 'Save nahi hua');

  const { count } = await supabase.from('listing_photos').select('id', { count: 'exact', head: true }).eq('listing_id', id);
  const failed = await savePhotos(supabase, user!.id, id, fd, count ?? 0);
  refresh(id);
  back(`/properties/${id}`, 'ok', failed ? `Save ho gaya — ${failed} photo upload nahi hui` : 'Listing update ho gayi');
}

export async function deletePhoto(fd: FormData) {
  const supabase = createClient();
  const id = str(fd, 'listing_id');
  const photo = str(fd, 'photo_id');
  const { data: { user } } = await supabase.auth.getUser();
  const { data: own } = await supabase.from('property_listings').select('id').eq('id', id).eq('owner_id', user?.id ?? '').maybeSingle();
  if (!own) back(`/properties/${id}`, 'err', 'Sirf listing ka malik photo hata sakta hai');
  const { data: p } = await supabase.from('listing_photos').delete().eq('id', photo).eq('listing_id', id).select('path');
  if (p?.[0]?.path) await supabase.storage.from('public-media').remove([p[0].path]);
  refresh(id);
  back(`/properties/${id}/edit`, 'ok', 'Photo hata di');
}

export async function setListingStatus(fd: FormData) {
  const supabase = createClient();
  const id = str(fd, 'listing_id');
  const status = str(fd, 'status');
  const next = safePath(str(fd, 'next'), `/properties/${id}`);
  if (!['active', 'rented', 'sold', 'hidden'].includes(status)) back(next, 'err', 'Ghalat status');
  const { data, error } = await supabase.from('property_listings').update({ status }).eq('id', id).select('id');
  if (error || !data?.length) back(next, 'err', error?.message ?? 'Sirf listing ka malik status badal sakta hai');
  refresh(id);
  back(next, 'ok', { active: 'Listing dobara live', hidden: 'Listing chupa di gayi', sold: 'Mubarak ho — bik gaya!', rented: 'Mubarak ho — kiraye par chala gaya!' }[status]!);
}

export async function deleteListing(fd: FormData) {
  const supabase = createClient();
  const id = str(fd, 'listing_id');
  const { data: photos } = await supabase.from('listing_photos').select('path').eq('listing_id', id);
  const { data, error } = await supabase.from('property_listings').delete().eq('id', id).select('id');
  if (error || !data?.length) back(`/properties/${id}`, 'err', error?.message ?? 'Sirf listing ka malik delete kar sakta hai');
  if (photos?.length) await supabase.storage.from('public-media').remove(photos.map((p) => p.path));
  refresh();
  back('/my/listings', 'ok', 'Listing delete ho gayi');
}

export async function toggleSave(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = str(fd, 'listing_id');
  const next = safePath(str(fd, 'next'), `/properties/${id}`);
  if (!user) back(`/login?next=${encodeURIComponent(`/properties/${id}`)}`, 'err', 'Save karne ke liye login karein');
  if (str(fd, 'saved') === 'true') await supabase.from('saved_listings').delete().eq('listing_id', id).eq('user_id', user!.id);
  else await supabase.from('saved_listings').insert({ listing_id: id, user_id: user!.id });
  revalidatePath(`/properties/${id}`);
  revalidatePath('/my/listings');
  back(next, 'ok', str(fd, 'saved') === 'true' ? 'Saved list se hata diya' : 'Save ho gaya — dashboard mein "Saved" mein milega');
}

// ------------------------------------------------------------------ demands (buyers / tenants)

export async function createWant(fd: FormData) {
  const want_type = str(fd, 'want_type') === 'rent' ? 'rent' : 'buy';
  const path = `/properties/wanted/new?type=${want_type}`;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back(`/login?next=${encodeURIComponent(path)}`, 'err', 'Pehle login karein');
  const deal = want_type === 'buy' ? 'sale' : 'rent';
  const property_type = pick(str(fd, 'property_type'), propertyTypes.filter((t) => t[deal]).map((t) => t.id));
  const city = str(fd, 'city').slice(0, 60);
  const contact_phone = normalizePhone(str(fd, 'contact_phone'));
  const min = pos(num(fd, 'min_budget'));
  const max = pos(num(fd, 'max_budget'));
  if (!property_type) back(path, 'err', 'Qisam chunein');
  if (!city) back(path, 'err', 'City likhein');
  if (!max) back(path, 'err', 'Budget (zyada se zyada) likhein');
  if (min && max && min > max) back(path, 'err', 'Kam budget zyada budget se bara nahi ho sakta');
  if (!contact_phone) back(path, 'err', 'Rabta number sahi nahi');

  const { error } = await supabase.from('property_wants').insert({
    user_id: user!.id,
    want_type,
    property_type,
    city,
    area_text: str(fd, 'area_text').slice(0, 120) || null,
    society_id: str(fd, 'society_id') || null,
    min_budget: min,
    max_budget: max,
    bedrooms: pos(num(fd, 'bedrooms')),
    size_text: str(fd, 'size_text').slice(0, 60) || null,
    needed_by: str(fd, 'needed_by') || null,
    details: str(fd, 'details').slice(0, 1000) || null,
    contact_phone,
  });
  if (error) back(path, 'err', error.message);
  revalidatePath('/properties/wanted');
  revalidatePath('/my/listings');
  back(`/properties/wanted?type=${want_type}`, 'ok', 'Aap ki demand live ho gayi — sellers / malik aap se rabta karenge');
}

export async function setWantStatus(fd: FormData) {
  const supabase = createClient();
  const id = str(fd, 'want_id');
  const status = str(fd, 'status');
  const next = safePath(str(fd, 'next'), '/my/listings?tab=wants');
  if (status === 'delete') {
    const { data, error } = await supabase.from('property_wants').delete().eq('id', id).select('id');
    if (error || !data?.length) back(next, 'err', 'Sirf demand dalne wala isay hata sakta hai');
  } else {
    if (!['active', 'closed'].includes(status)) back(next, 'err', 'Ghalat status');
    const { data, error } = await supabase.from('property_wants').update({ status }).eq('id', id).select('id');
    if (error || !data?.length) back(next, 'err', 'Sirf demand dalne wala isay badal sakta hai');
  }
  revalidatePath('/properties/wanted');
  revalidatePath('/my/listings');
  back(next, 'ok', status === 'delete' ? 'Demand delete ho gayi' : status === 'closed' ? 'Demand band — ab list mein nazar nahi aayegi' : 'Demand dobara live');
}
