import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** GET ?count=1 → unread count only; otherwise latest 30 + unread count. */
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ unread: 0, items: [] }, { status: 401 });
  const countOnly = new URL(req.url).searchParams.get('count') === '1';
  const unreadQ = supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null);
  if (countOnly) {
    const { count } = await unreadQ;
    return NextResponse.json({ unread: count ?? 0 }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const [{ count }, { data }] = await Promise.all([
    unreadQ,
    supabase.from('notifications').select('id, kind, title, body, url, read_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
  ]);
  return NextResponse.json({ unread: count ?? 0, items: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

/** POST { id } → mark one read; { all: true } → mark all read. */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  if (!body?.all) {
    if (typeof body?.id !== 'string') return NextResponse.json({ ok: false }, { status: 400 });
    q = q.eq('id', body.id);
  }
  const { error } = await q;
  return NextResponse.json({ ok: !error });
}
