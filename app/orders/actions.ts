'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { back, num, str } from '@/lib/actions';

const safeNext = (fd: FormData, fallback: string) => {
  const n = str(fd, 'next');
  return n.startsWith('/') && !n.startsWith('//') ? n.split('?')[0] : fallback;
};

const done: Record<string, string> = {
  accept: 'Order qubool — customer ko bata dein kab tak pohanchenge',
  done: 'Order mukammal ho gaya',
  received: 'Shukriya! Order mukammal mark ho gaya — review zaroor dein',
  cancel: 'Order cancel ho gaya',
};

/** Every order status change (both sides) goes through the order_action RPC. */
export async function orderAction(fd: FormData) {
  const { supabase } = await requireUser();
  const next = safeNext(fd, '/my/orders');
  const action = str(fd, 'action');
  const { error } = await supabase.rpc('order_action', {
    p_order: str(fd, 'id'),
    p_action: action,
    p_amount: num(fd, 'amount'),
    p_reason: str(fd, 'reason') || null,
  });
  if (error) back(next, 'err', error.message.includes('abhi nahi') ? 'Ye order ab is haalat mein nahi — page refresh karein' : error.message);
  revalidatePath(next);
  back(next, 'ok', done[action] ?? 'Ho gaya');
}

/** Customer places an order / work request with a provider. */
export async function createOrder(fd: FormData) {
  const pid = str(fd, 'provider_id');
  const { supabase } = await requireUser(`/providers/${pid}/order`);
  const details = str(fd, 'details');
  if (details.length < 2) back(`/providers/${pid}/order`, 'err', 'Batayein kya chahiye');
  const { data, error } = await supabase
    .from('service_orders')
    .insert({
      provider_id: pid,
      category_id: str(fd, 'category_id') || null,
      details: details.slice(0, 1500),
      address: str(fd, 'address').slice(0, 300) || null,
      when_note: str(fd, 'when_note').slice(0, 80) || null,
    })
    .select('id')
    .single();
  if (error || !data) back(`/providers/${pid}/order`, 'err', error?.message.includes('apne aap') ? 'Apne aap ko order nahi bhej sakte' : 'Order nahi gaya — provider abhi available nahi');
  back(`/my/orders/${data!.id}?sent=1`, 'ok', 'Order bhej diya! Ab WhatsApp par bhi bhej dein taake foran pata chale.');
}
