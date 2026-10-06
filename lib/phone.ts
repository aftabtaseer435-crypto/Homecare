/**
 * Normalise a Pakistani mobile number to digits-only international form.
 *   03001234567  → 923001234567
 *   +92 300 1234567 → 923001234567
 *   3001234567   → 923001234567
 * Returns null if it does not look like a valid mobile number.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.replace(/\D/g, '');
  if (d.startsWith('0092')) d = d.slice(2);
  if (d.startsWith('0')) d = '92' + d.slice(1);
  if (d.length === 10 && d.startsWith('3')) d = '92' + d;
  if (!/^\d{10,15}$/.test(d)) return null;
  return d;
}

/** 923001234567 → 0300-1234567 for display */
export function displayPhone(p: string | null | undefined): string {
  if (!p) return '';
  if (p.startsWith('92') && p.length === 12) return `0${p.slice(2, 5)}-${p.slice(5)}`;
  return '+' + p;
}

export function waLink(phone: string, text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${phone}${q}`;
}
