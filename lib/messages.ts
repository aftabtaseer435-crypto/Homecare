// Ready-made WhatsApp message texts (Roman Urdu). Used for click-to-send
// links (wa.me) from the admin's own WhatsApp — no Meta API needed.

import { fmtDate, houseLabel, rs } from '@/lib/format';

type HouseLike = { block?: string | null; street: string; house_no: string };

export function reminderText(o: {
  name: string; society: string; fund: string; amount: number; house: HouseLike; dueDate: string; overdue: boolean; payLink?: string;
}) {
  const head = `Assalam o Alaikum ${o.name},`;
  const body = o.overdue
    ? `${o.society} ka ${o.fund} — ${rs(o.amount)} (${houseLabel(o.house)}) ki due date ${fmtDate(o.dueDate)} guzar chuki hai. Meharbani kar ke jald jama karwayein.`
    : `${o.society} ka ${o.fund} — ${rs(o.amount)} (${houseLabel(o.house)}) ${fmtDate(o.dueDate)} tak jama karwana hai. Abhi tak aap ka fund jama nahi hua.`;
  const link = o.payLink ? `\n\nApna status aur payment: ${o.payLink}` : '';
  return `${head}\n${body}${link}\n\nShukriya.`;
}

export function receiptText(o: { name: string; society: string; amount: number; house: HouseLike; fund: string; receiptNo: string }) {
  return `Shukriya ${o.name}!\n${o.society}: ${rs(o.amount)} jama ho gaye.\n${o.fund} — ${houseLabel(o.house)}\nReceipt no: ${o.receiptNo}`;
}

export function noticeText(o: { society: string; title: string; body: string }) {
  return `*${o.society} — Notice*\n\n${o.title}\n\n${o.body}`;
}

/** wa.me link; phone null → WhatsApp asks which chat/group to send to. */
export function waSend(phone: string | null, text: string) {
  return `https://wa.me/${phone ?? ''}?text=${encodeURIComponent(text)}`;
}

export function appUrl(path = '') {
  return (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') + path;
}
