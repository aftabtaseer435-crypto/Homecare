import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import NoticeCard from '@/components/NoticeCard';
import Avatar from '@/components/Avatar';
import { loadNotices, noticeKinds } from '@/lib/notices';
import { storagePublicUrl, todayPK } from '@/lib/format';
import { whatsappApiEnabled } from '@/lib/whatsapp';
import { createNotice } from '../actions';

export default async function Notices({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase, user, profile } = await requireSocietyStaff(params.sid, true);
  const apiOn = whatsappApiEnabled();
  const [{ data: canPost }, { data: society }, { data: me }] = await Promise.all([
    supabase.rpc('can_post_notice', { sid: params.sid }),
    supabase.from('societies').select('name, chairman_name, chairman_user_id').eq('id', params.sid).single(),
    supabase.from('profiles').select('avatar_path').eq('id', user.id).single(),
  ]);
  const all = await loadNotices(supabase, user.id, [params.sid], { activeOnly: false, limit: 60 });
  const now = Date.now();
  const active = all.filter((n) => !n.resolved_at && (!n.expires_at || Date.parse(n.expires_at) > now));
  const past = all.filter((n) => !active.includes(n));
  const next = `/s/${params.sid}/notices`;
  const avatar = storagePublicUrl(me?.avatar_path);
  const isChairman = society?.chairman_user_id === user.id;

  return (
    <div className="space-y-8">
      <Flash searchParams={searchParams} />
      <div>
        <p className="eyebrow">Society notices</p>
        <h1 className="mt-1">Notices</h1>
        <p className="muted mt-1 max-w-2xl">
          Notice har verified makan malik aur kirayedar ko app mein sab se upar nazar aata hai. Masla hal ho jaye to &quot;Masla hal ho gaya&quot; dabayein — bhool jayein to notice tareekh guzarne ke 24 ghante baad khud hat jata hai.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        {canPost ? (
          <form action={createNotice} className="card space-y-4 self-start lg:sticky lg:top-24">
            <input type="hidden" name="sid" value={params.sid} />
            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
              <Avatar name={profile.full_name ?? ''} src={avatar} />
              <div className="min-w-0 text-sm">
                <div className="font-semibold">{profile.full_name}</div>
                <div className="text-ink-mute">{isChairman ? 'Chairman' : 'Society admin'} · aap ke naam se jayega</div>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="kind">Kis cheez ka notice</label>
              <select id="kind" name="kind" className="input">
                {noticeKinds.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="title">Title *</label>
              <input id="title" name="title" className="input" required maxLength={120} placeholder="Bijli 3 baje tak band rahegi" />
            </div>
            <div>
              <label className="label" htmlFor="event_date">Kis din ka masla / kaam *</label>
              <input id="event_date" name="event_date" type="date" className="input" required min={todayPK()} defaultValue={todayPK()} />
              <p className="hint">Is din ke 24 ghante baad notice khud hat jayega.</p>
            </div>
            <div>
              <label className="label" htmlFor="body">Detail *</label>
              <textarea id="body" name="body" rows={4} className="input" required maxLength={1500} placeholder="Transformer badla ja raha hai. Subah 10 se 3 baje tak bijli band rahegi." />
            </div>
            <div>
              <label className="label" htmlFor="photo">{avatar ? 'Apni photo badlein (optional)' : 'Apni photo (notice par nazar aayegi)'}</label>
              <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2 text-sm" />
            </div>
            {apiOn && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="whatsapp" /> WhatsApp par har ghar ko bhi bhejein</label>
            )}
            <SubmitButton className="btn w-full">Notice bhejein</SubmitButton>
          </form>
        ) : (
          <div className="card self-start">
            <h2>Notice sirf chairman bhejte hain</h2>
            <p className="muted mt-2">
              Is society mein notice bhejne ka ikhtiyar chairman{society?.chairman_name ? ` (${society.chairman_name})` : ''} ke paas hai, taake residents ko ek hi jagah se pakki khabar mile. Aap notices dekh sakte hain.
            </p>
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="mb-3">Abhi chal rahe ({active.length})</h2>
            {active.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-ink-mute">Koi active notice nahi.</p>
            ) : (
              <div className="space-y-4">{active.map((n) => <NoticeCard key={n.id} n={n} next={next} manage={!!canPost} />)}</div>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-ink-soft">Purane notices</h2>
              <div className="space-y-3">{past.slice(0, 15).map((n) => <NoticeCard key={n.id} n={n} next={next} manage={!!canPost} />)}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
