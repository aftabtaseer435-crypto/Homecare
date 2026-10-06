import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate } from '@/lib/format';
import { createNotice } from '../actions';

export default async function Notices({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
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
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="whatsapp" /> WhatsApp par bhi bhejein</label>
          <div><label className="label">Sirf ek block ko (optional)</label><input name="block" className="input w-32" /></div>
          <SubmitButton>Post karein</SubmitButton>
        </form>
      </div>
      <div className="space-y-3">
        {(notices ?? []).map((n) => (
          <div key={n.id} className="card">
            <div className="font-semibold">{n.title}</div>
            <div className="mt-1 whitespace-pre-line text-sm text-gray-700">{n.body}</div>
            <div className="muted mt-2">{fmtDate(n.created_at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
