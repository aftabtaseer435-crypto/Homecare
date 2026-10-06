import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Empty, PageHeader } from '@/components/ui';

export default async function HisaabHome() {
  const { supabase, user } = await requireUser('/hisaab');
  const [{ data: owned }, { data: staff }, { data: agent }] = await Promise.all([
    supabase.from('house_owners').select('house:houses(society:societies(id, name))').eq('user_id', user.id).eq('status', 'verified'),
    supabase.from('society_members').select('society:societies(id, name)').eq('user_id', user.id),
    supabase.from('welfare_agents').select('society:societies(id, name)').eq('user_id', user.id).eq('active', true),
  ]);
  const map = new Map<string, string>();
  for (const r of (owned ?? []) as any[]) if (r.house?.society) map.set(r.house.society.id, r.house.society.name);
  for (const r of [...((staff ?? []) as any[]), ...((agent ?? []) as any[])]) if (r.society) map.set(r.society.id, r.society.name);
  const list = Array.from(map.entries());
  if (list.length === 1) redirect(`/hisaab/${list[0][0]}`);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Fund ka hisaab" subtitle="Society choose karein" />
      {list.length === 0 ? (
        <Empty href="/societies/join" cta="Apna ghar add karein">Hisaab dekhne ke liye pehle apna ghar society mein add karein.</Empty>
      ) : (
        <ul className="space-y-2">{list.map(([id, name]) => <li key={id}><Link href={`/hisaab/${id}`} className="card block font-bold no-underline">{name}</Link></li>)}</ul>
      )}
    </div>
  );
}
