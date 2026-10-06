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
      <h2 className="mb-1">WhatsApp log (last 200)</h2>
      <p className="muted mb-4">&quot;dry_run&quot; ka matlab WhatsApp API abhi connect nahi — message log hua lekin bheja nahi gaya.</p>
      <table className="table">
        <thead><tr><th>Time</th><th>To</th><th>Type</th><th>Status</th><th>Error</th></tr></thead>
        <tbody>
          {(logs ?? []).map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })}</td>
              <td>{displayPhone(l.to_phone)}</td>
              <td>{label(l.kind, l.offset_days)}</td>
              <td>
                <span className={`badge ${l.status === 'sent' ? 'bg-green-100 text-green-800' : l.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
              </td>
              <td className="max-w-xs truncate text-xs text-red-600" title={l.error ?? ''}>{l.error}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
