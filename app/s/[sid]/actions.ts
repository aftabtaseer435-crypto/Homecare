'use server';

import { revalidatePath } from 'next/cache';
import { requireSocietyStaff } from '@/lib/auth';
import { back, num, oneOf, str } from '@/lib/actions';
import { normalizePhone } from '@/lib/phone';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastNotice, sendReceipt } from '@/lib/notify';
import { whatsappApiEnabled } from '@/lib/whatsapp';
import { todayPK } from '@/lib/format';
import { uploadFile } from '@/lib/upload';

const sidOf = (fd: FormData) => str(fd, 'sid');

// ---------------------------------------------------------------- HOUSES
const EXPENSE_CATS = ['street_light', 'water', 'sewerage', 'road', 'cleaning', 'security', 'salary', 'repair', 'park', 'legal', 'other'] as const;

export async function bulkCreateHouses(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const path = `/s/${sid}/houses`;
  const sf = num(fd, 'street_from'), st = num(fd, 'street_to'), hf = num(fd, 'house_from'), ht = num(fd, 'house_to');
  if (!sf || !st || !hf || !ht || st < sf || ht < hf) back(path, 'err', 'Range sahi likhein (from ≤ to)');
  const { data, error } = await supabase.rpc('bulk_create_houses', {
    p_society: sid, p_block: str(fd, 'block'), p_street_from: sf, p_street_to: st,
    p_house_from: hf, p_house_to: ht, p_plot_size: str(fd, 'plot_size') || null,
  });
  if (error) back(path, 'err', error.message);
  revalidatePath(`/s/${sid}`);
  back(path, 'ok', `${data} naye ghar add ho gaye`);
}

/**
 * CSV / Excel paste. One line per house:
 *   block, gali, ghar_no, plot_size, owner_name, owner_mobile
 * Owner columns optional — if given, owner is added as verified.
 */
export async function importHousesCsv(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid, true);
  const path = `/s/${sid}/houses`;
  const lines = str(fd, 'csv').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) back(path, 'err', 'CSV khali hai');

  const rows = lines
    .map((l) => l.split(/[,\t]/).map((c) => c.trim()))
    .filter((c) => !/^block$/i.test(c[0] ?? '')); // skip header
  const houses = rows
    .filter((c) => c[1] && c[2])
    .map((c) => ({ society_id: sid, block: c[0] ?? '', street: c[1], house_no: c[2], plot_size: c[3] || null }));

  let made = 0;
  for (let i = 0; i < houses.length; i += 500) {
    const { data, error } = await supabase
      .from('houses')
      .upsert(houses.slice(i, i + 500), { onConflict: 'society_id,block,street,house_no', ignoreDuplicates: true })
      .select('id');
    if (error) back(path, 'err', error.message);
    made += data?.length ?? 0;
  }

  // owners
  const withOwner = rows.filter((c) => c[4] && normalizePhone(c[5]));
  let owners = 0;
  for (const c of withOwner) {
    const { data: h } = await supabase.from('houses').select('id').eq('society_id', sid).eq('block', c[0] ?? '').eq('street', c[1]).eq('house_no', c[2]).single();
    if (!h) continue;
    const { error } = await supabase.from('house_owners').insert({
      house_id: h.id, owner_name: c[4], owner_phone: normalizePhone(c[5])!, status: 'verified', verified_by: user.id, verified_at: new Date().toISOString(),
    });
    if (!error) owners++;
  }
  revalidatePath(`/s/${sid}`);
  back(path, 'ok', `${made} ghar import hue, ${owners} owners add hue`);
}

export async function updateHouse(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { error } = await supabase
    .from('houses')
    .update({
      fund_exempt: fd.get('fund_exempt') === 'on',
      occupancy: oneOf(str(fd, 'occupancy'), ['owner', 'rented', 'vacant', 'construction'], 'owner'),
      plot_size: str(fd, 'plot_size') || null,
    })
    .eq('id', str(fd, 'house_id'))
    .eq('society_id', sid);
  if (error) back(`/s/${sid}/houses`, 'err', error.message);
  back(`/s/${sid}/houses?street=${encodeURIComponent(str(fd, 'street'))}&block=${encodeURIComponent(str(fd, 'block'))}`, 'ok', 'Ghar update ho gaya');
}

export async function deleteHouse(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { error } = await supabase.from('houses').delete().eq('id', str(fd, 'house_id')).eq('society_id', sid);
  if (error) back(`/s/${sid}/houses`, 'err', error.message);
  back(`/s/${sid}/houses`, 'ok', 'Ghar delete ho gaya');
}

// ---------------------------------------------------------------- OWNERS
async function findHouse(supabase: any, sid: string, fd: FormData) {
  const houseId = str(fd, 'house_id');
  if (houseId) {
    const { data } = await supabase.from('houses').select('id').eq('id', houseId).eq('society_id', sid).maybeSingle();
    return data?.id as string | undefined;
  }
  const { data } = await supabase
    .from('houses')
    .select('id')
    .eq('society_id', sid)
    .eq('block', str(fd, 'block'))
    .eq('street', str(fd, 'street'))
    .eq('house_no', str(fd, 'house_no'))
    .maybeSingle();
  return data?.id as string | undefined;
}

export async function setOwnerStatus(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid);
  const status = oneOf(str(fd, 'status'), ['verified', 'rejected'], 'rejected');
  const { data, error } = await supabase
    .from('house_owners')
    .update({ status, verified_by: user.id, verified_at: new Date().toISOString() })
    .eq('id', str(fd, 'owner_id'))
    .select('id');
  if (error || !data?.length) {
    const msg = error?.code === '23505' ? 'Is ghar ka ek verified owner pehle se hai. Pehle usay remove karein.' : error?.message ?? 'Request nahi mili';
    back(`/s/${sid}/owners`, 'err', msg);
  }
  back(`/s/${sid}/owners`, 'ok', status === 'verified' ? 'Owner approve ho gaya' : 'Request reject ho gayi');
}

export async function addOwner(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid);
  const path = `/s/${sid}/owners`;
  const houseId = await findHouse(supabase, sid, fd);
  if (!houseId) back(path, 'err', 'Ghar nahi mila — block / gali / ghar number check karein');
  const phone = normalizePhone(str(fd, 'owner_phone'));
  if (!phone) back(path, 'err', 'Mobile number sahi nahi');

  // link to existing account if this phone already registered
  const admin = createAdminClient();
  const { data: prof } = await admin.from('profiles').select('id').eq('phone', phone!).maybeSingle();

  const { error } = await supabase.from('house_owners').insert({
    house_id: houseId, user_id: prof?.id ?? null, owner_name: str(fd, 'owner_name'), owner_phone: phone!,
    whatsapp_opt_in: fd.get('whatsapp_opt_in') === 'on', status: 'verified', verified_by: user.id, verified_at: new Date().toISOString(),
  });
  if (error) back(path, 'err', error.code === '23505' ? 'Is ghar ka verified owner pehle se hai' : error.message);
  back(path, 'ok', 'Owner add ho gaya. Woh isi number se login kare to ghar khud link ho jayega.');
}

export async function removeOwner(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { data, error } = await supabase.from('house_owners').delete().eq('id', str(fd, 'owner_id')).select('id');
  if (error || !data?.length) back(`/s/${sid}/owners`, 'err', error?.message ?? 'Owner nahi mila');
  back(`/s/${sid}/owners`, 'ok', 'Owner remove ho gaya');
}

// ---------------------------------------------------------------- FUND PLANS
export async function createPlan(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const path = `/s/${sid}/funds`;
  const amount = num(fd, 'amount');
  const due_day = num(fd, 'due_day') ?? 10;
  if (amount === null || amount < 0) back(path, 'err', 'Amount sahi likhein');
  if (due_day < 1 || due_day > 28) back(path, 'err', 'Due date 1 se 28 ke beech honi chahiye');
  const { data: plan, error } = await supabase
    .from('fund_plans')
    .insert({
      society_id: sid, name: str(fd, 'name'), amount, frequency: oneOf(str(fd, 'frequency'), ['monthly', 'quarterly', 'yearly', 'one_time'], 'monthly'), due_day,
      start_date: str(fd, 'start_date') || todayPK(), late_fee: num(fd, 'late_fee') ?? 0,
    })
    .select('id')
    .single();
  if (error) back(path, 'err', error.message);
  const { data: n } = await supabase.rpc('generate_dues', { p_plan: plan!.id, p_ref: todayPK() });
  revalidatePath(`/s/${sid}`);
  back(path, 'ok', `Plan ban gaya. Is period ke ${n ?? 0} dues generate ho gaye.`);
}

export async function togglePlan(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { data } = await supabase.from('fund_plans').update({ active: str(fd, 'active') === 'true' }).eq('id', str(fd, 'plan_id')).eq('society_id', sid).select('id');
  if (!data?.length) back(`/s/${sid}/funds`, 'err', 'Plan update nahi hua');
  back(`/s/${sid}/funds`, 'ok', 'Plan update ho gaya');
}

export async function generateDuesNow(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { data, error } = await supabase.rpc('generate_dues', { p_plan: str(fd, 'plan_id'), p_ref: str(fd, 'ref_date') || todayPK() });
  if (error) back(`/s/${sid}/funds`, 'err', error.message);
  revalidatePath(`/s/${sid}`);
  back(`/s/${sid}/funds`, 'ok', `${data ?? 0} naye dues generate hue (jo pehle se the woh skip)`);
}

export async function saveReminderOffsets(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const offsets = str(fd, 'offsets')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= -30 && n <= 60);
  const { error } = await supabase.from('societies').update({ reminder_offsets: Array.from(new Set(offsets)).sort((a, b) => a - b) }).eq('id', sid);
  if (error) back(`/s/${sid}/funds`, 'err', error.message);
  back(`/s/${sid}/funds`, 'ok', 'Reminder schedule save ho gaya');
}

// ---------------------------------------------------------------- PAYMENTS
export async function recordPayment(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid);
  const path = `/s/${sid}/payments`;
  const amount = num(fd, 'amount');
  if (!amount || amount <= 0) back(path, 'err', 'Amount sahi likhein');
  const fund_due_id = str(fd, 'fund_due_id');
  const { data: due } = await supabase.from('fund_dues').select('id, house_id, society_id').eq('id', fund_due_id).eq('society_id', sid).single();
  if (!due) back(path, 'err', 'Due nahi mila');

  const { data: pay, error } = await supabase
    .from('payments')
    .insert({
      society_id: sid, fund_due_id, house_id: due!.house_id, amount, method: oneOf(str(fd, 'method'), ['cash', 'bank', 'jazzcash', 'easypaisa', 'online'], 'cash'),
      reference: str(fd, 'reference') || null, status: 'verified', entered_by: user.id, verified_by: user.id,
    })
    .select('id, receipt_no')
    .single();
  if (error) back(path, 'err', error.message);
  await sendReceipt(pay!.id);
  revalidatePath(`/s/${sid}`);
  back(`${path}?house=${due!.house_id}&receipt=${pay!.id}`, 'ok', `Payment save — receipt ${pay!.receipt_no}.`);
}

export async function reviewPayment(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid);
  const status = str(fd, 'status') === 'verified' ? 'verified' : 'rejected';
  const id = str(fd, 'payment_id');
  const { error } = await supabase.from('payments').update({ status, verified_by: user.id }).eq('id', id).eq('society_id', sid);
  if (error) back(`/s/${sid}/payments`, 'err', error.message);
  if (status === 'verified') await sendReceipt(id);
  revalidatePath(`/s/${sid}`);
  if (status === 'verified') back(`/s/${sid}/payments?receipt=${id}`, 'ok', 'Payment verify ho gayi');
  back(`/s/${sid}/payments`, 'ok', 'Payment reject ho gayi');
}

// ---------------------------------------------------------------- NOTICES
export async function createNotice(fd: FormData) {
  const sid = sidOf(fd);
  const path = `/s/${sid}/notices`;
  const { supabase, user } = await requireSocietyStaff(sid, true);
  const { data: canPost } = await supabase.rpc('can_post_notice', { sid });
  if (!canPost) back(path, 'err', 'Notice sirf chairman bhej sakta hai');

  // sender photo (optional, saved on the profile so every notice shows it)
  const photo = fd.get('photo');
  if (photo && typeof photo !== 'string' && photo.size > 0) {
    let p: string | null = null;
    try {
      if (!photo.type.startsWith('image/')) throw new Error('Photo JPG / PNG / WEBP honi chahiye');
      p = await uploadFile(supabase, 'public-media', user.id, 'avatar', photo);
    } catch (e: any) {
      back(path, 'err', e.message);
    }
    if (p) await supabase.from('profiles').update({ avatar_path: p }).eq('id', user.id);
  }

  const title = str(fd, 'title');
  const event_date = str(fd, 'event_date') || todayPK();
  if (event_date < todayPK()) back(path, 'err', 'Guzri hui tareekh ka notice nahi bheja ja sakta');
  const { error } = await supabase.from('notices').insert({
    society_id: sid, title, body: str(fd, 'body'), kind: str(fd, 'kind') || 'info', event_date, created_by: user.id,
  });
  if (error) back(path, 'err', error.message);
  revalidatePath(path);
  if (whatsappApiEnabled() && fd.get('whatsapp') === 'on') {
    const r = await broadcastNotice(sid, title, null);
    back(path, 'ok', `Notice post ho gaya. WhatsApp: ${r.sent} sent, ${r.failed} failed.`);
  }
  back(path, 'ok', 'Notice post ho gaya — har registered malik aur kirayedar ko app mein nazar aayega. Ab "WhatsApp group mein share" bhi kar dein.');
}

// ---------------------------------------------------------------- MANUAL WHATSAPP
/** Records that the admin opened WhatsApp for this reminder / receipt (manual mode). */
export async function logManualMessage(input: {
  sid: string; houseId: string; dueId?: string | null; phone: string; kind: 'reminder' | 'receipt' | 'notice'; offset?: number | null;
}) {
  await requireSocietyStaff(input.sid);
  const admin = createAdminClient();
  await admin.from('messages_log').insert({
    society_id: input.sid, house_id: input.houseId, fund_due_id: input.dueId ?? null, to_phone: input.phone,
    channel: 'whatsapp_manual', kind: input.kind, offset_days: input.offset ?? null, status: 'sent_manual',
  });
}

// ---------------------------------------------------------------- TEAM
export async function addMember(fd: FormData) {
  const sid = sidOf(fd);
  await requireSocietyStaff(sid, true);
  const phone = normalizePhone(str(fd, 'phone'));
  if (!phone) back(`/s/${sid}/team`, 'err', 'Mobile number sahi nahi');
  const admin = createAdminClient();
  const { data: prof } = await admin.from('profiles').select('id').eq('phone', phone!).maybeSingle();
  const role = str(fd, 'role') === 'admin' ? 'admin' : 'collector';
  if (!prof) {
    const { supabase } = await requireSocietyStaff(sid, true);
    const { error } = await supabase.from('society_member_invites').upsert({ society_id: sid, phone: phone!, name: str(fd, 'name') || null, role }, { onConflict: 'society_id,phone' });
    if (error) back(`/s/${sid}/team`, 'err', error.message);
    back(`/s/${sid}/team`, 'ok', 'Invite save ho gaya — jab woh is number se pehli dafa login karega, khud team mein aa jayega.');
  }
  const { error } = await admin.from('society_members').upsert({ society_id: sid, user_id: prof!.id, role });
  if (error) back(`/s/${sid}/team`, 'err', error.message);
  back(`/s/${sid}/team`, 'ok', 'Team member add ho gaya');
}

export async function removeMember(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid, true);
  const uid = str(fd, 'user_id');
  if (uid === user.id) back(`/s/${sid}/team`, 'err', 'Aap khud ko remove nahi kar sakte');
  const { error } = await supabase.from('society_members').delete().eq('society_id', sid).eq('user_id', uid);
  if (error) back(`/s/${sid}/team`, 'err', error.message);
  back(`/s/${sid}/team`, 'ok', 'Member remove ho gaya');
}

// ---------------------------------------------------------------- WELFARE AGENTS
export async function addAgent(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const path = `/s/${sid}/welfare`;
  const phone = normalizePhone(str(fd, 'phone'));
  if (!phone) back(path, 'err', 'Mobile number sahi nahi');
  const name = str(fd, 'name');
  if (!name) back(path, 'err', 'Agent ka naam likhein');
  // Linked now if this number already has an account, otherwise on first login
  const { data: prof } = await createAdminClient().from('profiles').select('id').eq('phone', phone!).maybeSingle();
  const [block, street] = str(fd, 'area').split('|');
  const { error } = await supabase.from('welfare_agents').insert({
    society_id: sid, user_id: prof?.id ?? null, name, phone, block: block ?? '', street: street ? street : null,
  });
  if (error) back(path, 'err', error.code === '23505' ? 'Yeh agent is area mein pehle se hai' : error.message);
  back(path, 'ok', prof ? 'Agent muqarrar ho gaya.' : 'Agent muqarrar ho gaya. Jab woh is number se pehli dafa login karega, panel khud khul jayega.');
}

export async function updateAgent(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const path = `/s/${sid}/welfare`;
  const phone = normalizePhone(str(fd, 'phone'));
  if (!phone) back(path, 'err', 'Mobile number sahi nahi');
  const { data: prof } = await createAdminClient().from('profiles').select('id').eq('phone', phone!).maybeSingle();
  const { error } = await supabase
    .from('welfare_agents')
    .update({ name: str(fd, 'name'), phone, user_id: prof?.id ?? null })
    .eq('id', str(fd, 'agent_row'))
    .eq('society_id', sid);
  if (error) back(path, 'err', error.code === '23505' ? 'Yeh number is area mein pehle se hai' : error.message);
  back(path, 'ok', 'Agent update ho gaya');
}

export async function removeAgent(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { data } = await supabase.from('welfare_agents').update({ active: false }).eq('id', str(fd, 'agent_row')).eq('society_id', sid).select('id');
  if (!data?.length) back(`/s/${sid}/welfare`, 'err', 'Agent nahi mila');
  back(`/s/${sid}/welfare`, 'ok', 'Agent hata diya gaya (purana record mehfooz hai).');
}

// ---------------------------------------------------------------- FUND LEDGER
export async function addExpense(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase, user } = await requireSocietyStaff(sid, true);
  const path = `/s/${sid}/kharcha`;
  const amount = num(fd, 'amount');
  if (!amount || amount <= 0) back(path, 'err', 'Amount likhein');
  const [block, street] = str(fd, 'area').split('|');
  let receipt_path: string | null = null;
  try {
    receipt_path = await uploadFile(supabase, 'private-docs', user.id, 'receipts', fd.get('receipt'));
  } catch (e) {
    back(path, 'err', (e as Error).message);
  }
  const { error } = await supabase.from('fund_expenses').insert({
    society_id: sid, amount, category: oneOf(str(fd, 'category'), EXPENSE_CATS, 'other'), description: str(fd, 'description'),
    vendor: str(fd, 'vendor') || null, spent_on: str(fd, 'spent_on') || todayPK(),
    block: block || null, street: street || null, receipt_path, status: 'approved',
  });
  if (error) back(path, 'err', error.message);
  revalidatePath(`/hisaab/${sid}`);
  back(path, 'ok', 'Kharcha hisaab mein shamil — sab residents ko nazar aayega.');
}

export async function reviewExpense(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const approve = str(fd, 'decision') === 'approve';
  const { error } = await supabase
    .from('fund_expenses')
    .update({ status: approve ? 'approved' : 'rejected', reject_reason: approve ? null : str(fd, 'reason') || 'Admin ne reject kiya' })
    .eq('id', str(fd, 'expense_id'))
    .eq('society_id', sid);
  if (error) back(`/s/${sid}/kharcha`, 'err', error.message);
  revalidatePath(`/hisaab/${sid}`);
  back(`/s/${sid}/kharcha`, 'ok', approve ? 'Approved — hisaab mein shamil' : 'Reject kar diya');
}

export async function removeInvite(fd: FormData) {
  const sid = sidOf(fd);
  const { supabase } = await requireSocietyStaff(sid, true);
  const { data } = await supabase.from('society_member_invites').delete().eq('id', str(fd, 'invite_id')).eq('society_id', sid).select('id');
  if (!data?.length) back(`/s/${sid}/team`, 'err', 'Invite nahi mila');
  back(`/s/${sid}/team`, 'ok', 'Invite hata diya');
}
