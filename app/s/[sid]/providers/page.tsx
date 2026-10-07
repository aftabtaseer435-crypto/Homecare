import { Phone } from 'lucide-react';
import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import { Empty, Flash, Stars } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import Avatar from '@/components/Avatar';
import { fmtDate, storagePublicUrl } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { hoursLabel } from '@/lib/hours';
import { setSocietyProviderStatus } from './actions';

const label: Record<string, { t: string; cls: string }> = {
  pending: { t: 'Naya — verify karein', cls: 'bg-plate-soft text-plate-ink' },
  verified: { t: 'Verified', cls: 'bg-paid-soft text-paid-ink' },
  suspended: { t: 'Band (suspended)', cls: 'bg-due-soft text-due-ink' },
  rejected: { t: 'Rejected', cls: 'bg-canvas text-ink-mute' },
};

export default async function SocietyProviders({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const { data } = await supabase
    .from('providers')
    .select('id, display_name, phone, city, area_note, photo_path, status, rating_avg, rating_count, created_at, day_start, day_end, night_start, night_end, provider_societies!inner(society_id), provider_categories(category:service_categories(name, icon))')
    .eq('provider_societies.society_id', params.sid)
    .order('created_at', { ascending: false });
  const list = (data ?? []) as any[];
  const order = ['pending', 'verified', 'suspended', 'rejected'];
  list.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const btn = (p: any, status: string, text: string, cls: string, confirm?: string) => (
    <form action={setSocietyProviderStatus}>
      <input type="hidden" name="sid" value={params.sid} />
      <input type="hidden" name="provider_id" value={p.id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={cls} confirm={confirm}>{text}</SubmitButton>
    </form>
  );

  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <div>
        <p className="eyebrow">Home services</p>
        <h1 className="mt-1">Society ke providers aur dukanein</h1>
        <p className="muted mt-1">Naye providers ko pehchan kar Verify karein, ghalat ho to Band karein.</p>
      </div>
      {list.length === 0 ? (
        <Empty>Abhi kisi provider ne aap ki society nahi chuni.</Empty>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li key={p.id} className="card">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar name={p.display_name} src={storagePublicUrl(p.photo_path)} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/providers/${p.id}`} className="font-semibold text-ink">{p.display_name}</Link>
                    <span className={`badge ${label[p.status]?.cls}`}>{label[p.status]?.t}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-ink-soft">{p.provider_categories.map((c: any) => `${c.category?.icon ?? ''} ${c.category?.name}`).join(', ')}</div>
                  <div className="mt-0.5 text-xs text-ink-mute">
                    {displayPhone(p.phone)} · {p.city}{p.area_note ? ` · ${p.area_note}` : ''} · {fmtDate(p.created_at)}
                    {hoursLabel(p) ? ` · ${hoursLabel(p)}` : ''}
                  </div>
                  <div className="mt-1"><Stars value={Number(p.rating_avg)} count={p.rating_count} /></div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                <a href={`tel:+${p.phone}`} className="btn-outline btn-sm"><Phone className="h-3.5 w-3.5" aria-hidden="true" /> Call</a>
                {p.status !== 'verified' && btn(p, 'verified', '✓ Verify karein', 'btn btn-sm')}
                {p.status !== 'suspended' && btn(p, 'suspended', 'Band karein', 'btn-ghost btn-sm text-due-ink', 'Ye provider list se hat jayega. Band karein?')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
