import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTemplate, templates, whatsappApiEnabled } from '@/lib/whatsapp';
import { fmtDate, houseLabel, rs, todayPK, daysBetween } from '@/lib/format';

type Owner = { owner_name: string; owner_phone: string; whatsapp_opt_in: boolean; user_id: string | null };

/** Verified owners of a house who accept WhatsApp (respecting the profile opt-in too). */
async function recipients(admin: ReturnType<typeof createAdminClient>, houseIds: string[], ownersOnly = true) {
  const map = new Map<string, Owner[]>();
  if (!houseIds.length) return map;
  for (let i = 0; i < houseIds.length; i += 500) {
    const chunk = houseIds.slice(i, i + 500);
    const { data } = await admin
      .from('house_owners')
      .select('house_id, owner_name, owner_phone, whatsapp_opt_in, user_id, profile:profiles!house_owners_user_id_fkey(whatsapp_opt_in)')
      .in('house_id', chunk)
      .eq('status', 'verified')
      .in('relation', ownersOnly ? ['owner'] : ['owner', 'tenant']);
    for (const o of (data ?? []) as any[]) {
      const optIn = o.whatsapp_opt_in && (o.profile ? o.profile.whatsapp_opt_in : true);
      if (!optIn || !o.owner_phone) continue;
      const list = map.get(o.house_id) ?? [];
      list.push(o);
      map.set(o.house_id, list);
    }
  }
  return map;
}

/** WhatsApp receipt after a payment is verified. Never throws. */
export async function sendReceipt(paymentId: string) {
  if (!whatsappApiEnabled()) return; // manual mode: admin taps the receipt WhatsApp button
  try {
    const admin = createAdminClient();
    const { data: p } = await admin
      .from('payments')
      .select('id, amount, receipt_no, paid_at, society_id, house_id, fund_due_id, house:houses(block, street, house_no), society:societies(name), due:fund_dues(period, plan:fund_plans(name))')
      .eq('id', paymentId)
      .single();
    if (!p) return;
    const pay = p as any;
    const owners = (await recipients(admin, [pay.house_id])).get(pay.house_id) ?? [];
    for (const o of owners) {
      // {{1}} name, {{2}} amount, {{3}} society, {{4}} house, {{5}} fund + period, {{6}} receipt no
      const params = [o.owner_name, rs(pay.amount), pay.society.name, houseLabel(pay.house), `${pay.due.plan.name} ${pay.due.period}`, pay.receipt_no ?? ''];
      const r = await sendTemplate(o.owner_phone, templates.receipt(), params);
      await admin.from('messages_log').insert({
        society_id: pay.society_id, house_id: pay.house_id, fund_due_id: pay.fund_due_id, to_phone: o.owner_phone,
        kind: 'receipt', template: templates.receipt(), status: r.ok ? (r.dryRun ? 'dry_run' : 'sent') : 'failed',
        error: r.error ?? null, provider_message_id: r.id ?? null,
      });
    }
  } catch (e) {
    console.error('sendReceipt failed', e);
  }
}

/** Broadcast a notice to all verified owners of a society (or one block). */
export async function broadcastNotice(societyId: string, title: string, block?: string | null) {
  if (!whatsappApiEnabled()) return { sent: 0, failed: 0 };
  const admin = createAdminClient();
  const { data: society } = await admin.from('societies').select('name').eq('id', societyId).single();
  const houseIds: string[] = [];
  for (let from = 0; ; from += 1000) {
    let hq = admin.from('houses').select('id').eq('society_id', societyId);
    if (block) hq = hq.eq('block', block);
    const { data } = await hq.order('id').range(from, from + 999);
    houseIds.push(...(data ?? []).map((h: any) => h.id));
    if (!data || data.length < 1000) break;
  }
  const rec = await recipients(admin, houseIds, false); // notices reach tenants too
  let sent = 0, failed = 0;
  const seen = new Set<string>();
  for (const [houseId, owners] of rec) {
    for (const o of owners) {
      if (seen.has(o.owner_phone)) continue;
      seen.add(o.owner_phone);
      // {{1}} name, {{2}} society, {{3}} notice title
      const r = await sendTemplate(o.owner_phone, templates.notice(), [o.owner_name, society?.name ?? '', title]);
      r.ok ? sent++ : failed++;
      await admin.from('messages_log').insert({
        society_id: societyId, house_id: houseId, to_phone: o.owner_phone, kind: 'notice',
        template: templates.notice(), status: r.ok ? (r.dryRun ? 'dry_run' : 'sent') : 'failed', error: r.error ?? null,
        provider_message_id: r.id ?? null,
      });
    }
  }
  return { sent, failed };
}

/**
 * Daily job:
 *  1. create dues for the current period of every active plan
 *  2. send WhatsApp reminders for dues whose (due_date - today) matches the
 *     society's reminder offsets (default: 3 days before, on the day, 3 & 7 days after)
 */
export async function runDailyJob(today = todayPK()) {
  const admin = createAdminClient();
  const summary = { duesCreated: 0, remindersSent: 0, remindersFailed: 0, skipped: 0 };

  // Resolved masle the resident never confirmed close after 7 days
  await admin.rpc('welfare_autoclose');
  await admin.rpc('notifications_cleanup');

  const { data: plans } = await admin.from('fund_plans').select('id').eq('active', true);
  for (const p of plans ?? []) {
    const { data } = await admin.rpc('generate_dues', { p_plan: p.id, p_ref: today });
    summary.duesCreated += Number(data ?? 0);
  }

  // Manual mode: reminders are sent by admins from /s/<id>/reminders
  if (!whatsappApiEnabled()) return summary;

  const { data: societies } = await admin.from('societies').select('id, name, reminder_offsets').eq('status', 'active');
  for (const s of societies ?? []) {
    const offsets: number[] = s.reminder_offsets ?? [-3, 0, 3, 7];
    for (const offset of offsets) {
      // offset -3 → due date is 3 days from today
      const dueDate = new Date(Date.parse(today) - offset * 86_400_000).toISOString().slice(0, 10);
      const dues: any[] = [];
      for (let from = 0; ; from += 1000) {
        const { data } = await admin
          .from('fund_dues')
          .select('id, house_id, amount_due, paid_amount, due_date, period, plan:fund_plans(name), house:houses(block, street, house_no)')
          .eq('society_id', s.id)
          .eq('due_date', dueDate)
          .in('status', ['unpaid', 'partial'])
          .order('id')
          .range(from, from + 999);
        dues.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      if (!dues.length) continue;

      const rec = await recipients(admin, dues.map((d) => d.house_id));
      for (const d of dues) {
        for (const o of rec.get(d.house_id) ?? []) {
          const balance = Number(d.amount_due) - Number(d.paid_amount);
          const overdue = daysBetween(d.due_date, today) > 0;
          const template = overdue ? templates.overdue() : templates.reminder();
          // {{1}} name, {{2}} society, {{3}} fund + period, {{4}} amount, {{5}} house, {{6}} due date
          const params = [o.owner_name, s.name, `${d.plan.name} ${d.period}`, rs(balance), houseLabel(d.house), fmtDate(d.due_date)];

          // skip if this exact reminder already went out (cron re-run safety)
          const { count } = await admin
            .from('messages_log')
            .select('id', { count: 'exact', head: true })
            .eq('fund_due_id', d.id).eq('to_phone', o.owner_phone).eq('offset_days', offset).eq('kind', 'reminder').in('status', ['sent', 'dry_run']);
          if (count) { summary.skipped++; continue; }

          const r = await sendTemplate(o.owner_phone, template, params);
          r.ok ? summary.remindersSent++ : summary.remindersFailed++;
          await admin.from('messages_log').insert({
            society_id: s.id, house_id: d.house_id, fund_due_id: d.id, to_phone: o.owner_phone, kind: 'reminder',
            offset_days: offset, template, status: r.ok ? (r.dryRun ? 'dry_run' : 'sent') : 'failed',
            error: r.error ?? null, provider_message_id: r.id ?? null,
          });
          await new Promise((res) => setTimeout(res, 60)); // gentle rate limit
        }
      }
    }
  }
  return summary;
}
