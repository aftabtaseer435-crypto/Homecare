import { getSession } from '@/lib/auth';
import OrderAlerts from './OrderAlerts';

/** Mounts the live order alarm only for providers, or customers with an open order. */
export default async function AlertsMount() {
  const { supabase, user } = await getSession();
  if (!user) return null;
  const [{ data: prov }, { count }] = await Promise.all([
    supabase.from('providers').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('service_orders').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).in('status', ['new', 'accepted']),
  ]);
  if (!prov && !count) return null;
  return <OrderAlerts isProvider={!!prov} />;
}
