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

/** Status colour classes — green paid, red not paid. */
export function dueStatusStyle(status: string | null | undefined) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', cls: 'bg-green-500 text-white', soft: 'bg-green-100 text-green-800' };
    case 'partial':
      return { label: 'Partial', cls: 'bg-orange-500 text-white', soft: 'bg-orange-100 text-orange-800' };
    case 'exempt':
      return { label: 'Exempt', cls: 'bg-gray-400 text-white', soft: 'bg-gray-100 text-gray-700' };
    case 'unpaid':
      return { label: 'Not paid', cls: 'bg-red-500 text-white', soft: 'bg-red-100 text-red-800' };
    default:
      return { label: 'No due', cls: 'bg-gray-200 text-gray-600', soft: 'bg-gray-100 text-gray-500' };
  }
}

export function storagePublicUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}
