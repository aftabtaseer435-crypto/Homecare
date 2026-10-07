// Provider working hours: a day shift and/or a night shift (night may cross midnight).
export type Hours = { day_start?: string | null; day_end?: string | null; night_start?: string | null; night_end?: string | null };

const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

export function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${ap}`;
}

function inWindow(now: number, s: string, e: string) {
  const a = mins(s), b = mins(e);
  return a <= b ? now >= a && now < b : now >= a || now < b; // crosses midnight
}

/** Minutes since midnight in Pakistan time. */
export function nowPK(date = new Date()) {
  const d = new Date(date.getTime() + 5 * 3600_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export const hasHours = (h: Hours) => !!((h.day_start && h.day_end) || (h.night_start && h.night_end));
export const hasNight = (h: Hours) => !!(h.night_start && h.night_end);

export function isOpenNow(h: Hours, now = nowPK()) {
  return (!!h.day_start && !!h.day_end && inWindow(now, h.day_start, h.day_end)) ||
         (!!h.night_start && !!h.night_end && inWindow(now, h.night_start, h.night_end));
}

/** "Din 9 AM – 6 PM · Raat 8 PM – 2 AM" */
export function hoursLabel(h: Hours) {
  const parts: string[] = [];
  if (h.day_start && h.day_end) parts.push(`Din ${fmtTime(h.day_start)} – ${fmtTime(h.day_end)}`);
  if (h.night_start && h.night_end) parts.push(`Raat ${fmtTime(h.night_start)} – ${fmtTime(h.night_end)}`);
  return parts.join(' · ');
}

/** Next opening time label when closed, e.g. "8 PM se". */
export function opensAt(h: Hours, now = nowPK()) {
  const starts = [h.day_start && h.day_end ? h.day_start : null, h.night_start && h.night_end ? h.night_start : null].filter(Boolean) as string[];
  if (!starts.length) return null;
  const next = starts.map((s) => ({ s, d: (mins(s) - now + 1440) % 1440 })).sort((a, b) => a.d - b.d)[0];
  return `${fmtTime(next.s)} se`;
}
