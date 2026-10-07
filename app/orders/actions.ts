'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { back, num, str } from '@/lib/actions';
import { pushToUser } from '@/lib/push';

const short = (t: string, n = 70) => (t.length > n ? t.slice(0, n - 1) + '…' : t).replace(/\s+/g, ' ');
/** Don't let a slow push service hold up the page. */
const within = (p: Promise<unknown>, ms = 2500) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

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
  const { supabase, user } = await requireUser();
  const next = safeNext(fd, '/my/orders');
  const action = str(fd, 'action');
  const id = str(fd, 'id');
  const { error } = await supabase.rpc('order_action', {
    p_order: id,
    p_action: action,
    p_amount: num(fd, 'amount'),
    p_reason: str(fd, 'reason') || null,
  });
  if (error) back(next, 'err', error.message.includes('abhi nahi') ? 'Ye order ab is haalat mein nahi — page refresh karein' : error.message);
  // tell the other side
  const { data: o } = await supabase
    .from('service_orders')
    .select('ref_no, customer_id, customer_name, details, amount, provider:providers(user_id, display_name)')
    .eq('id', id)
    .maybeSingle();
  if (o) {
    const ord = o as any;
    const byCustomer = ord.customer_id === user.id;
    const msg: Record<string, string> = {
      accept: `${ord.provider?.display_name} ne aap ka order qubool kar liya`,
      done: `${ord.provider?.display_name}: order mukammal${ord.amount != null ? ` — bill Rs ${ord.amount}` : ''} · review dein ★`,
      received: `${ord.customer_name ?? 'Customer'} ne order mil jane ki tasdeeq ki`,
      cancel: byCustomer ? `${ord.customer_name ?? 'Customer'} ne order cancel kar diya` : `${ord.provider?.display_name} ne order cancel kar diya`,
    };
    const to = byCustomer ? ord.provider?.user_id : ord.customer_id;
    if (to && msg[action]) {
      await within(pushToUser(to, {
        title: `${ord.ref_no}: ${msg[action]}`,
        body: short(ord.details),
        url: byCustomer ? '/provider/dashboard' : `/my/orders/${id}`,
        tag: `order-${id}`,
        kind: 'update',
      }));
    }
  }
  revalidatePath(next);
  if (action === 'received') back(`/my/orders/${id}`, 'ok', 'Shukriya! Ab neeche stars de kar review karein.');
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
    .select('id, ref_no, details, when_note, address, customer_name, provider:providers(user_id)')
    .single();
  if (error || !data) back(`/providers/${pid}/order`, 'err', error?.message.includes('apne aap') ? 'Apne aap ko order nahi bhej sakte' : 'Order nahi gaya — provider abhi available nahi');
  const o = data as any;
  await within(pushToUser(o.provider?.user_id, {
    title: `🔔 Naya order ${o.ref_no} — ${o.customer_name ?? 'Customer'}`,
    body: [short(o.details), o.when_note, o.address].filter(Boolean).join(' · '),
    url: '/provider/dashboard',
    tag: `order-${o.id}`,
    kind: 'order',
  }));
  back(`/my/orders/${data!.id}?sent=1`, 'ok', 'Order bhej diya! Ab WhatsApp par bhi bhej dein taake foran pata chale.');
}
