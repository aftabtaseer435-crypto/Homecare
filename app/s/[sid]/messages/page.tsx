import { requireSocietyStaff } from '@/lib/auth';
import { displayPhone } from '@/lib/phone';

export default async function Messages({ params }: { params: { sid: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid);
  const { data: logs } = await supabase
    .from('messages_log')
    .select('id, to_phone, kind, offset_days, template, status, error, created_at')
    .eq('society_id', params.sid)
    .order('created_at', { ascending: false })
    .limit(200);

  const label = (k: string, o: number | null) =>
    k === 'reminder' ? (o === null ? 'Reminder' : o < 0 ? `Reminder (${-o} din pehle)` : o === 0 ? 'Reminder (due din)' : `Overdue (+${o} din)`) : k === 'receipt' ? 'Receipt' : 'Notice';

  return (
    <div className="card">
      <h2 className="mb-1">Message log (last 200)</h2>
      <p className="muted mb-4">&quot;sent_manual&quot; = admin ne apne WhatsApp se button daba kar bheja. &quot;sent&quot; = automatic (sirf jab Meta API connect ho).</p>
      <table className="table">
        <thead><tr><th>Time</th><th>To</th><th>Type</th><th>Status</th><th>Error</th></tr></thead>
        <tbody>
          {(logs ?? []).map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })}</td>
              <td>{displayPhone(l.to_phone)}</td>
              <td>{label(l.kind, l.offset_days)}</td>
              <td>
                <span className={`badge ${l.status === 'sent' || l.status === 'sent_manual' ? 'bg-paid-soft text-paid' : l.status === 'failed' ? 'bg-due-soft text-due' : 'bg-canvas text-ink-soft'}`}>{l.status}</span>
              </td>
              <td className="max-w-xs truncate text-xs text-due" title={l.error ?? ''}>{l.error}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
