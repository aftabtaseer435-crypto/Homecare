import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Polled by the in-app alarm.
 *  provider: every order still "new" (last 2 days) — the phone rings until each one is seen
 *  customer: my orders that changed after `since`
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ provider: [], customer: [] }, { status: 401 });
  const sinceRaw = new URL(req.url).searchParams.get('since');
  const since = new Date(sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? Date.parse(sinceRaw) : Date.now() - 60_000).toISOString();
  const twoDays = new Date(Date.now() - 2 * 86_400_000).toISOString();

  const { data: prov } = await supabase.from('providers').select('id').eq('user_id', user.id).maybeSingle();
  const [provider, customer] = await Promise.all([
    prov
      ? supabase
          .from('service_orders')
          .select('id, ref_no, customer_name, details, when_note, address, created_at, category:service_categories(name)')
          .eq('provider_id', prov.id)
          .eq('status', 'new')
          .gte('created_at', twoDays)
          .order('created_at', { ascending: true })
          .limit(20)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    supabase
      .from('service_orders')
      .select('id, ref_no, status, amount, accepted_at, done_at, cancelled_at, cancelled_by, provider:providers(display_name)')
      .eq('customer_id', user.id)
      .or(`accepted_at.gt."${since}",done_at.gt."${since}",cancelled_at.gt."${since}"`)
      .limit(20)
      .then((r) => r.data ?? []),
  ]);
  return NextResponse.json(
    { provider, customer: customer.filter((o: any) => !(o.status === 'cancelled' && o.cancelled_by === 'customer')), now: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
