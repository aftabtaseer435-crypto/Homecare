import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Empty, PageHeader } from '@/components/ui';
import { noindex } from '@/lib/seo';

export const metadata = noindex;

export default async function AgentHome() {
  const { supabase, user } = await requireUser('/w');
  const { data } = await supabase.from('welfare_agents').select('society_id, society:societies(name, city)').eq('user_id', user.id).eq('active', true);
  const list = Array.from(new Map(((data ?? []) as any[]).map((r) => [r.society_id, r.society])).entries());
  if (list.length === 1) redirect(`/w/${list[0][0]}`);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Welfare agent panel" />
      {list.length === 0 ? (
        <Empty>Aap kisi society mein welfare agent muqarrar nahi hain. Society admin aap ko &quot;Welfare&quot; tab se add karega.</Empty>
      ) : (
        <ul className="space-y-2">
          {list.map(([sid, s]: any) => (
            <li key={sid}><Link href={`/w/${sid}`} className="card block font-bold no-underline">{s?.name} <span className="font-normal text-ink-mute">{s?.city}</span></Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
