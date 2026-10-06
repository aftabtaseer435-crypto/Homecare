'use server';

import { createClient } from '@/lib/supabase/server';
import { back, num, str } from '@/lib/actions';
import { uploadFile } from '@/lib/upload';

export async function submitPaymentProof(fd: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) back('/login', 'err', 'Pehle login karein');

  const house_id = str(fd, 'house_id');
  const path = `/my/houses/${house_id}`;
  const fund_due_id = str(fd, 'fund_due_id');
  const amount = num(fd, 'amount');
  if (!amount || amount <= 0) back(path, 'err', 'Amount sahi likhein');

  const { data: due } = await supabase.from('fund_dues').select('society_id, house_id').eq('id', fund_due_id).single();
  if (!due || due.house_id !== house_id) back(path, 'err', 'Due nahi mila');

  let proof_path: string | null = null;
  try {
    proof_path = await uploadFile(supabase, 'private-docs', user!.id, 'payments', fd.get('proof'));
  } catch (e) {
    back(path, 'err', (e as Error).message);
  }

  const { error } = await supabase.from('payments').insert({
    society_id: due!.society_id,
    fund_due_id,
    house_id,
    amount,
    method: str(fd, 'method') || 'bank',
    reference: str(fd, 'reference') || null,
    proof_path,
    status: 'pending',
    entered_by: user!.id,
  });
  if (error) back(path, 'err', error.message);
  back(path, 'ok', 'Payment submit ho gayi. Admin verify karega to receipt WhatsApp par aayegi.');
}
