// Welfare (masle) — categories, templates, statuses. Shared by resident,
// agent and admin screens so every side speaks the same language.

import { houseLabel } from '@/lib/format';

export type IssueCategory = 'street_light' | 'water' | 'sewerage' | 'road' | 'cleanliness' | 'security' | 'legal' | 'other';
export type IssueStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'reopened';

export const categories: {
  id: IssueCategory;
  label: string;
  ur: string;
  icon: string;
  scope: 'street' | 'private';
  sla: string;
  template: (gali: string) => string;
}[] = [
  { id: 'street_light', label: 'Street light', ur: 'گلی کی لائٹ', icon: '💡', scope: 'street', sla: '48 ghante',
    template: (g) => `${g} mein street light band hai, raat ko andhera rehta hai. Meharbani kar ke theek karwa dein.` },
  { id: 'water', label: 'Pani', ur: 'پانی', icon: '🚰', scope: 'street', sla: '24 ghante',
    template: (g) => `${g} mein pani ki supply ka masla hai (pani nahi aa raha / pipe leak hai). Meharbani kar ke check karwa dein.` },
  { id: 'sewerage', label: 'Gutter / sewerage', ur: 'گٹر', icon: '🕳️', scope: 'street', sla: '48 ghante',
    template: (g) => `${g} mein gutter band hai / sewerage overflow ho raha hai. Meharbani kar ke safai karwa dein.` },
  { id: 'road', label: 'Sarak / garha', ur: 'سڑک', icon: '🛣️', scope: 'street', sla: '7 din',
    template: (g) => `${g} ki sarak toot gayi hai / garha hai. Meharbani kar ke marammat karwa dein.` },
  { id: 'cleanliness', label: 'Safai / kachra', ur: 'صفائی', icon: '🧹', scope: 'street', sla: '48 ghante',
    template: (g) => `${g} mein kachra nahi utha / safai nahi hui. Meharbani kar ke safai karwa dein.` },
  { id: 'security', label: 'Security', ur: 'سیکیورٹی', icon: '🛡️', scope: 'street', sla: '24 ghante',
    template: (g) => `${g} mein security ka masla hai (guard / gate / mashkook afraad). Meharbani kar ke dekh lein.` },
  { id: 'legal', label: 'Legal / qanooni', ur: 'قانونی مسئلہ', icon: '⚖️', scope: 'private', sla: '72 ghante',
    template: () => `Mujhe ek qanooni (legal) masle mein rehnumai chahiye. Meharbani kar ke mujh se rabta karein.` },
  { id: 'other', label: 'Koi aur masla', ur: 'دیگر', icon: '📝', scope: 'private', sla: '72 ghante',
    template: () => `Mera ek masla hai, meharbani kar ke rabta karein: ` },
];

export function category(id: string) {
  return categories.find((c) => c.id === id) ?? categories[categories.length - 1];
}

/** Colour story: red = waiting on the agent, yellow = being worked on, green = done. */
export function issueStatus(status: string) {
  switch (status) {
    case 'open':
      return { label: 'Naya — agent ka intezar', short: 'Open', cls: 'bg-due text-white', soft: 'bg-due-soft text-due-ink', step: 0 };
    case 'reopened':
      return { label: 'Dobara khola gaya', short: 'Reopened', cls: 'bg-due text-white', soft: 'bg-due-soft text-due-ink', step: 0 };
    case 'acknowledged':
      return { label: 'Agent ne dekh liya', short: 'Seen', cls: 'bg-plate text-plate-ink', soft: 'bg-plate-soft text-plate-ink', step: 1 };
    case 'in_progress':
      return { label: 'Kaam jari hai', short: 'Working', cls: 'bg-plate text-plate-ink', soft: 'bg-plate-soft text-plate-ink', step: 2 };
    case 'resolved':
      return { label: 'Hal ho gaya — aap confirm karein', short: 'Resolved', cls: 'bg-paid text-white', soft: 'bg-paid-soft text-paid-ink', step: 3 };
    case 'closed':
      return { label: 'Mukammal (confirm)', short: 'Done', cls: 'bg-paid text-white', soft: 'bg-paid-soft text-paid-ink', step: 4 };
    default:
      return { label: status, short: status, cls: 'bg-line text-ink', soft: 'bg-canvas text-ink-soft', step: 0 };
  }
}

export const openStatuses = ['open', 'acknowledged', 'in_progress', 'reopened'];

export const expenseCategories: { id: string; label: string }[] = [
  { id: 'street_light', label: 'Street lights' },
  { id: 'water', label: 'Pani / pipes' },
  { id: 'sewerage', label: 'Gutter / sewerage' },
  { id: 'road', label: 'Sarak' },
  { id: 'cleaning', label: 'Safai' },
  { id: 'security', label: 'Security' },
  { id: 'salary', label: 'Tankhwah (staff)' },
  { id: 'repair', label: 'Marammat' },
  { id: 'park', label: 'Park / masjid / common area' },
  { id: 'legal', label: 'Legal' },
  { id: 'other', label: 'Doosra' },
];

export function expenseLabel(id: string) {
  return expenseCategories.find((c) => c.id === id)?.label ?? id;
}

export function galiLabel(block: string | null | undefined, street: string | null | undefined) {
  if (!street) return block ? `Block ${block}` : 'Society';
  return `${block ? `Block ${block}, ` : ''}Gali ${street}`;
}

type HouseLike = { block?: string | null; street: string; house_no: string };

export function issueToAgentText(o: { refNo: string; category: string; house: HouseLike; ownerName: string; text: string; link: string }) {
  const c = category(o.category);
  return `*Naya masla ${o.refNo}* — ${c.label}\n${houseLabel(o.house)} (${o.ownerName})\n\n${o.text}\n\nApp mein dekhein / update karein: ${o.link}`;
}

export function resolvedToResidentText(o: { refNo: string; ownerName: string; note: string; link: string }) {
  return `Assalam o Alaikum ${o.ownerName},\nAap ka masla ${o.refNo} hal kar diya gaya hai: ${o.note}\n\nMeharbani kar ke app mein confirm karein (ya agar theek nahi hua to dobara kholein): ${o.link}`;
}

export function hoursLeft(due: string | null) {
  if (!due) return null;
  return Math.round((Date.parse(due) - Date.now()) / 3_600_000);
}
