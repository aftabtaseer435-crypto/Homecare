import 'server-only';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export type AgentArea = { block: string; street: string | null };

/** The welfare agent's areas in a society (redirects if not an agent). */
export async function requireAgent(sid: string) {
  const s = await requireUser(`/w/${sid}`);
  const { data } = await s.supabase
    .from('welfare_agents')
    .select('block, street, society:societies(name, city)')
    .eq('society_id', sid)
    .eq('user_id', s.user.id)
    .eq('active', true);
  if (!data?.length) redirect('/welfare');
  const areas: AgentArea[] = data.map((r: any) => ({ block: r.block, street: r.street }));
  const society = (data[0] as any).society as { name: string; city: string };
  return { ...s, areas, society };
}

/** Is a house / issue (block, street) inside one of the agent's areas? */
export function inAreas(areas: AgentArea[], block: string | null | undefined, street: string | null | undefined) {
  return areas.some((a) => a.block === (block ?? '') && (!a.street || a.street === street));
}

export function areaLabel(a: AgentArea) {
  return `${a.block ? `Block ${a.block}, ` : ''}${a.street ? `Gali ${a.street}` : 'poora block'}`;
}
