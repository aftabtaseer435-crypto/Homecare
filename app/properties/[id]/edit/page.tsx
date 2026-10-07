import { notFound, redirect } from 'next/navigation';
import { X } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import ListingForm from '@/components/property/ListingForm';
import SubmitButton from '@/components/SubmitButton';
import { storagePublicUrl } from '@/lib/format';
import { deletePhoto, updateListing } from '../../actions';

export const metadata = { title: 'Listing edit karein', robots: { index: false } };

export default async function EditListing({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireUser(`/properties/${params.id}/edit`);
  const { data: l } = await supabase.from('property_listings').select('*, listing_photos(id, path, sort)').eq('id', params.id).maybeSingle();
  if (!l) notFound();
  if (l.owner_id !== user.id) redirect(`/properties/${params.id}?err=${encodeURIComponent('Sirf listing ka malik edit kar sakta hai')}`);
  const { data: homes } = await supabase
    .from('house_owners')
    .select('house:houses(id, block, street, house_no, society:societies(name, city))')
    .eq('user_id', user.id)
    .eq('status', 'verified')
    .eq('relation', 'owner');
  const photos = [...((l as any).listing_photos ?? [])].sort((a: any, b: any) => a.sort - b.sort);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Listing edit karein" subtitle={l.title} back={['← Listing par wapas', `/properties/${l.id}`]} />
      <Flash searchParams={searchParams} />
      {photos.length > 0 && (
        <section className="mb-5 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Mojooda photos ({photos.length}/15)</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((p: any) => (
              <div key={p.id} className="relative">
                <img src={storagePublicUrl(p.path)!} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <form action={deletePhoto} className="absolute right-1 top-1">
                  <input type="hidden" name="listing_id" value={l.id} />
                  <input type="hidden" name="photo_id" value={p.id} />
                  <SubmitButton className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-due shadow" confirm="Yeh photo hata dein?" pendingText="…">
                    <X className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Photo hatayein</span>
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
      <ListingForm deal={l.listing_type} action={updateListing} homes={(homes ?? []) as any} phone={profile.phone} initial={l} submitLabel="Tabdeeliyan save karein" />
    </div>
  );
}
