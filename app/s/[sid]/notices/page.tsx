import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate } from '@/lib/format';
import { createNotice } from '../actions';
import WaButton from '@/components/WaButton';
import { noticeText, waSend } from '@/lib/messages';
import { whatsappApiEnabled } from '@/lib/whatsapp';

export default async function Notices({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const apiOn = whatsappApiEnabled();
  const { data: society } = await supabase.from('societies').select('name').eq('id', params.sid).single();
  const { data: notices } = await supabase.from('notices').select('id, title, body, created_at').eq('society_id', params.sid).order('created_at', { ascending: false }).limit(50);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Flash searchParams={searchParams} />
        <form action={createNotice} className="card space-y-3">
          <h2>Naya notice</h2>
          <input type="hidden" name="sid" value={params.sid} />
          <div><label className="label">Title *</label><input name="title" className="input" required placeholder="Pani ki supply band — Itwaar 10 se 2" /></div>
          <div><label className="label">Detail *</label><textarea name="body" rows={5} className="input" required /></div>
          {apiOn ? (
            <>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="whatsapp" /> WhatsApp par har owner ko bhejein</label>
              <div><label className="label">Sirf ek block ko (optional)</label><input name="block" className="input w-32" /></div>
            </>
          ) : (
            <p className="muted">Post karne ke baad notice ke neeche &quot;WhatsApp group mein share&quot; dabayein — society ke WhatsApp group mein chala jayega.</p>
          )}
          <SubmitButton>Post karein</SubmitButton>
        </form>
      </div>
      <div className="space-y-3">
        {(notices ?? []).map((n) => (
          <div key={n.id} className="card">
            <div className="font-semibold">{n.title}</div>
            <div className="mt-1 whitespace-pre-line text-sm text-ink-soft">{n.body}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="muted">{fmtDate(n.created_at)}</span>
              <WaButton label="WhatsApp group mein share" href={waSend(null, noticeText({ society: society?.name ?? '', title: n.title, body: n.body }))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
