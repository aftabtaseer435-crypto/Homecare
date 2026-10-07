import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import Avatar from '@/components/Avatar';
import { storagePublicUrl } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { updateAccount } from './actions';

export const metadata = { title: 'Mera account' };

export default async function Account({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireUser('/account');
  const [{ data: me }, { data: prov }] = await Promise.all([
    supabase.from('profiles').select('avatar_path').eq('id', user.id).single(),
    supabase.from('providers').select('id, display_name, status').eq('user_id', user.id).maybeSingle(),
  ]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Mera account" subtitle="Naam aur photo — notices aur welfare mein yahi nazar aate hain." />
      <Flash searchParams={searchParams} />
      <form action={updateAccount} className="card space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name ?? ''} src={storagePublicUrl(me?.avatar_path)} size={64} />
          <div className="text-sm">
            <div className="font-semibold">{profile.full_name}</div>
            <div className="text-ink-mute">{displayPhone(profile.phone ?? '')}</div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="full_name">Poora naam</label>
          <input id="full_name" name="full_name" className="input" defaultValue={profile.full_name ?? ''} required maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="photo">Photo</label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2 text-sm" />
          <p className="hint">Saaf chehre wali photo, 5MB tak.</p>
        </div>
        <SubmitButton>Save karein</SubmitButton>
      </form>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/my/orders" className="card no-underline hover:border-service hover:no-underline">
          <div className="font-semibold text-ink">🛍️ Mere orders</div>
          <div className="mt-1 text-sm text-ink-mute">Jo kharida / karwaya — history aur kharch</div>
        </Link>
        <Link href={prov ? '/provider/dashboard' : '/provider/register'} className="card no-underline hover:border-brand-500 hover:no-underline">
          <div className="font-semibold text-ink">🧰 {prov ? 'Seller dashboard' : 'Seller / provider banein'}</div>
          <div className="mt-1 text-sm text-ink-mute">{prov ? `${prov.display_name} — orders, hisaab, profile edit` : 'Apni dukaan ya kaam list karein, free'}</div>
        </Link>
      </div>
      <p className="mt-6 text-sm text-ink-mute">Account band karna hai? <Link href="/account/delete">Account delete</Link></p>
    </div>
  );
}
