export function rs(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return 'Rs ' + v.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d.length === 10 ? d + 'T00:00:00' : d) : d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function houseLabel(h: { block?: string | null; street: string; house_no: string }) {
  return `${h.block ? `Block ${h.block}, ` : ''}Gali ${h.street}, Ghar ${h.house_no}`;
}

/** Today's date in Pakistan time as YYYY-MM-DD */
export function todayPK() {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string) {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86_400_000);
}

/** Status colours — green = paid, red = not paid (the core promise of the app). */
export function dueStatusStyle(status: string | null | undefined) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', cls: 'bg-paid text-white', soft: 'bg-paid-soft text-paid-ink', plate: 'plate plate-paid' };
    case 'partial':
      return { label: 'Partial', cls: 'bg-part text-white', soft: 'bg-part-soft text-part-ink', plate: 'plate plate-partial' };
    case 'exempt':
      return { label: 'Exempt', cls: 'bg-ink-mute text-white', soft: 'bg-canvas text-ink-soft', plate: 'plate plate-exempt' };
    case 'unpaid':
      return { label: 'Not paid', cls: 'bg-due text-white', soft: 'bg-due-soft text-due-ink', plate: 'plate plate-due' };
    default:
      return { label: 'No due', cls: 'bg-line text-ink-mute', soft: 'bg-canvas text-ink-mute', plate: 'plate plate-none' };
  }
}

export function storagePublicUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}

const weekdays = ['Itwaar', 'Peer', 'Mangal', 'Budh', 'Jumeraat', 'Jumma', 'Hafta'];

/** "Jumeraat, 09 Oct" — for a YYYY-MM-DD day */
export function fmtDay(d: string | null | undefined) {
  if (!d) return '';
  const date = new Date(d.slice(0, 10) + 'T00:00:00Z');
  return `${weekdays[date.getUTCDay()]}, ${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })}`;
}

/** "Aaj" / "Kal" / "Parson" / weekday for a day relative to today (PK). */
export function dayWord(d: string | null | undefined) {
  if (!d) return '';
  const diff = Math.round((Date.parse(d.slice(0, 10)) - Date.parse(todayPK())) / 86_400_000);
  if (diff === 0) return 'Aaj';
  if (diff === 1) return 'Kal';
  if (diff === -1) return 'Kal (guzra)';
  return fmtDay(d);
}

/** "5 min pehle", "3 ghante pehle", "2 din pehle" */
export function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (m < 1) return 'abhi';
  if (m < 60) return `${m} min pehle`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ghante pehle`;
  return `${Math.round(h / 24)} din pehle`;
}

/** "Hafta, 10 Oct · 12:00 am" in Pakistan time */
export function fmtPK(iso: string) {
  const d = new Date(iso);
  const day = new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi' }).toLowerCase();
  return `${fmtDay(day)} · ${t}`;
}
