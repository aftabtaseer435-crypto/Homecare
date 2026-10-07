import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** Save (POST) or remove (DELETE) this device's push subscription. */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const sub = body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth || !/^https:\/\//.test(sub.endpoint)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // a device can move between accounts: drop the old owner's row first
  await createAdminClient().from('push_subscriptions').delete().eq('endpoint', sub.endpoint).neq('user_id', user.id);
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: req.headers.get('user-agent')?.slice(0, 200) ?? null },
    { onConflict: 'endpoint' },
  );
  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}

export async function DELETE(req: Request) {
  const supabase = createClient();
  const body = await req.json().catch(() => null);
  if (body?.endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint);
  return NextResponse.json({ ok: true });
}
