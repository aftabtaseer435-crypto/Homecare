// Shared helpers for kharidar ↔ provider orders.
export const orderStatus: Record<string, { label: string; cls: string }> = {
  new: { label: 'Naya — jawab ka intezar', cls: 'bg-plate-soft text-plate-ink' },
  accepted: { label: 'Qubool — raste mein / kaam jari', cls: 'bg-service-soft text-service-ink' },
  done: { label: 'Mukammal', cls: 'bg-paid-soft text-paid-ink' },
  cancelled: { label: 'Cancel', cls: 'bg-canvas text-ink-mute ring-1 ring-inset ring-line' },
};

export const whenOptions = ['Abhi (jitna jaldi ho sake)', '1 ghante mein', 'Aaj shaam', 'Aaj raat', 'Kal subah'];

/** Example text in the order box, per category */
export const orderPlaceholder: Record<string, string> = {
  'chicken-meat': '1 kg chicken — karahi cut, 1/2 kg qeema',
  'sabzi-fruit': '1 kg aloo, 1/2 kg tamatar, 1 darjan kele',
  rashan: '5 kg atta, 1 kg cheeni, 1 packet chai',
  medicine: 'Panadol 1 patta, ORS 2 sachet (nuskha WhatsApp par bhej dunga)',
  bakery: '1 double roti, 6 anday, rusk 1 packet',
  'night-food': '2 plate biryani, 1 raita, 2 cold drink',
  milk: '2 kg doodh rozana, 1 kg dahi',
  'water-cans': '2 bottle 19 litre',
  'gas-cylinder': '1 cylinder 11.8 kg refill',
};
export const placeholderFor = (slug?: string | null) =>
  (slug && orderPlaceholder[slug]) || 'Kya kaam hai? Masalan: kitchen ka nalka tapak raha hai, aaj shaam aa sakte hain?';

export function orderWhatsAppText(o: { ref_no: string; details: string; address?: string | null; when_note?: string | null; customer_name?: string | null; category?: string | null }) {
  return [
    `Assalam o Alaikum! Housing Welfare se order ${o.ref_no}${o.category ? ` — ${o.category}` : ''}`,
    '',
    o.details,
    o.when_note ? `\nKab: ${o.when_note}` : '',
    o.address ? `Pata: ${o.address}` : '',
    o.customer_name ? `\n— ${o.customer_name}` : '',
  ].filter((x) => x !== '').join('\n');
}

export const monthName = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};
