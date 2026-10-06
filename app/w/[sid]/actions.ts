'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { back, num, str } from '@/lib/actions';
import { uploadFile } from '@/lib/upload';

export async function logVisit(fd: FormData) {
  const supabase = createClient();
  const sid = str(fd, 'sid');
  const street = str(fd, 'street');
  const path = `/w/${sid}/houses?street=${encodeURIComponent(street)}&block=${encodeURIComponent(str(fd, 'block'))}`;
  const { error } = await supabase.from('welfare_visits').insert({
    society_id: sid,
    house_id: str(fd, 'house_id'),
    outcome: str(fd, 'outcome') || 'ok',
    note: str(fd, 'note') || null,
  });
  if (error) back(path, 'err', 'Visit save nahi hui: ' + error.message);
  revalidatePath(`/w/${sid}/houses`);
  back(path, 'ok', 'Ghar check ho gaya ✓');
}

/** Agent asks for money spent on their area — the admin approves before it shows in the hisaab. */
export async function submitExpense(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sid = str(fd, 'sid');
  const path = `/w/${sid}/kharcha`;
  if (!user) back('/login', 'err', 'Login karein');
  const amount = num(fd, 'amount');
  if (!amount || amount <= 0) back(path, 'err', 'Amount likhein');
  const [block, street] = str(fd, 'area').split('|');
  let receipt_path: string | null = null;
  try {
    receipt_path = await uploadFile(supabase, 'private-docs', user!.id, 'receipts', fd.get('receipt'));
  } catch (e) {
    back(path, 'err', (e as Error).message);
  }
  const { error } = await supabase.from('fund_expenses').insert({
    society_id: sid,
    amount,
    category: str(fd, 'category') || 'other',
    description: str(fd, 'description'),
    vendor: str(fd, 'vendor') || null,
    spent_on: str(fd, 'spent_on') || undefined,
    block: block ?? '',
    street: street || null,
    receipt_path,
    status: 'pending',
  });
  if (error) back(path, 'err', error.message.includes('not allowed') ? 'Sirf apne area ka kharcha bhej sakte hain' : error.message);
  back(path, 'ok', 'Kharcha admin ko approval ke liye bhej diya gaya.');
}
