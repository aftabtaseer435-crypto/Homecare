import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { storagePublicUrl } from '@/lib/format';

export const noticeKinds = [
  { id: 'info', label: 'Elaan' },
  { id: 'bijli', label: 'Bijli' },
  { id: 'pani', label: 'Pani' },
  { id: 'gas', label: 'Gas' },
  { id: 'safai', label: 'Safai' },
  { id: 'security', label: 'Security' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'event', label: 'Taqreeb' },
] as const;
export type NoticeKind = (typeof noticeKinds)[number]['id'];
export const noticeKindLabel = (k: string) => noticeKinds.find((x) => x.id === k)?.label ?? 'Elaan';

export type NoticeView = {
  id: string;
  society_id: string;
  society_name: string;
  title: string;
  body: string;
  kind: string;
  event_date: string | null;
  created_at: string;
  expires_at: string | null;
  resolved_at: string | null;
  author: { name: string; avatar: string | null; chairman: boolean };
  read: boolean;
};

/**
 * Notices for the given societies. `activeOnly` → not resolved and not past
 * expiry (24h after the event day). RLS decides who can see what.
 */
export async function loadNotices(
  supabase: SupabaseClient,
  userId: string | null,
  societyIds: string[],
  { activeOnly = true, limit = 20 }: { activeOnly?: boolean; limit?: number } = {},
): Promise<NoticeView[]> {
  if (!societyIds.length) return [];
  let q = supabase
    .from('notices')
    .select('id, society_id, title, body, kind, event_date, created_at, expires_at, resolved_at, created_by, society:societies(name)')
    .in('society_id', societyIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (activeOnly) q = q.is('resolved_at', null).gt('expires_at', new Date().toISOString());
  const { data: rows } = await q;
  const list = (rows ?? []) as any[];
  if (!list.length) return [];

  const [authorsBySociety, { data: reads }] = await Promise.all([
    Promise.all(Array.from(new Set(list.map((n) => n.society_id))).map((sid) => supabase.rpc('notice_authors', { sid }).then((r) => (r.data ?? []) as any[]))),
    userId
      ? supabase.from('notice_reads').select('notice_id').eq('user_id', userId).in('notice_id', list.map((n) => n.id))
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const authors = new Map<string, any>();
  for (const a of authorsBySociety.flat()) authors.set(a.user_id, a);
  const readSet = new Set(((reads ?? []) as any[]).map((r) => r.notice_id));

  return list.map((n) => {
    const a = authors.get(n.created_by);
    return {
      id: n.id,
      society_id: n.society_id,
      society_name: n.society?.name ?? '',
      title: n.title,
      body: n.body,
      kind: n.kind ?? 'info',
      event_date: n.event_date,
      created_at: n.created_at,
      expires_at: n.expires_at,
      resolved_at: n.resolved_at,
      author: { name: a?.full_name ?? 'Society office', avatar: storagePublicUrl(a?.avatar_path), chairman: !!a?.is_chairman },
      read: readSet.has(n.id) || n.created_by === userId,
    };
  });
}

/** Societies the user belongs to in any way (owner/tenant, staff, agent). */
export async function mySocietyIds(supabase: SupabaseClient, userId: string) {
  const [{ data: h }, { data: m }, { data: a }] = await Promise.all([
    supabase.from('house_owners').select('house:houses(society_id)').eq('user_id', userId).eq('status', 'verified'),
    supabase.from('society_members').select('society_id').eq('user_id', userId),
    supabase.from('welfare_agents').select('society_id').eq('user_id', userId).eq('active', true),
  ]);
  return Array.from(new Set([
    ...((h ?? []) as any[]).map((r) => r.house?.society_id),
    ...((m ?? []) as any[]).map((r) => r.society_id),
    ...((a ?? []) as any[]).map((r) => r.society_id),
  ].filter(Boolean))) as string[];
}
