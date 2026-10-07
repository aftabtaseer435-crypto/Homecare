'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { audioReady, chime, speakOrder, startAlarm, stopAlarm, unlockAudio } from '@/lib/alarm';
import { orderAction } from '@/app/orders/actions';

type NewOrder = { id: string; ref_no: string; customer_name: string | null; details: string; when_note: string | null; address: string | null; created_at: string; category?: { name: string } | null };
type Update = { id: string; ref_no: string; status: string; amount: number | null; provider?: { display_name: string } | null };

const ACK = 'hw-acked-orders';
const SINCE = 'hw-alerts-since';
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const acked = (): string[] => { try { return JSON.parse(read(ACK) || '[]'); } catch { return []; } };
const short = (t: string, n = 90) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

/**
 * Live order alarm, mounted on every page for providers (and for customers
 * with open orders). Polls /api/alerts; a new order rings loudly, vibrates,
 * speaks, flashes the tab and shows a big card until the provider acts.
 */
export default function OrderAlerts({ isProvider }: { isProvider: boolean }) {
  const [queue, setQueue] = useState<NewOrder[]>([]);
  const [toast, setToast] = useState<{ text: string; href: string } | null>(null);
  const [needTap, setNeedTap] = useState(false);
  const spoken = useRef<Set<string>>(new Set());
  const title = useRef<string>('');

  // unlock audio on the first tap anywhere
  useEffect(() => {
    const on = () => { unlockAudio().then((ok) => ok && setNeedTap(false)); };
    window.addEventListener('pointerdown', on, { once: true });
    window.addEventListener('keydown', on, { once: true });
    return () => { window.removeEventListener('pointerdown', on); window.removeEventListener('keydown', on); };
  }, []);

  const poll = useCallback(async () => {
    const since = read(SINCE) || new Date(Date.now() - 60_000).toISOString();
    try {
      const r = await fetch(`/api/alerts?since=${encodeURIComponent(since)}`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      write(SINCE, d.now);
      if (isProvider) {
        const seen = new Set(acked());
        setQueue((d.provider as NewOrder[]).filter((o) => !seen.has(o.id)));
      }
      const ups = (d.customer as Update[]) ?? [];
      if (ups.length) {
        const u = ups[0];
        const who = u.provider?.display_name ?? 'Provider';
        const text = u.status === 'accepted' ? `${who} ne order ${u.ref_no} qubool kar liya` : u.status === 'done' ? `Order ${u.ref_no} mukammal${u.amount != null ? ` — Rs ${u.amount}` : ''}. Review dein ★` : `${who} ne order ${u.ref_no} cancel kar diya`;
        setToast({ text, href: u.status === 'done' ? `/my/orders/${u.id}#review` : `/my/orders/${u.id}` });
        chime();
        if (document.hidden) localNotify(`Order update`, text, `/my/orders/${u.id}`, `upd-${u.id}`);
        setTimeout(() => setToast(null), 9000);
      }
    } catch { /* offline — try again next tick */ }
  }, [isProvider]);

  // polling loop: fast when visible, slower in background
  useEffect(() => {
    let stop = false;
    let t: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await poll();
      if (!stop) t = setTimeout(loop, document.hidden ? 40_000 : 12_000);
    };
    loop();
    const vis = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', vis);
    return () => { stop = true; clearTimeout(t); document.removeEventListener('visibilitychange', vis); };
  }, [poll]);

  // ring while anything is unacknowledged
  const current = queue[0];
  useEffect(() => {
    if (!current) {
      stopAlarm();
      if (title.current) { document.title = title.current; title.current = ''; }
      return;
    }
    if (!audioReady()) setNeedTap(true);
    startAlarm();
    if (!spoken.current.has(current.id)) {
      spoken.current.add(current.id);
      setTimeout(() => speakOrder(current.customer_name), 1800);
      if (document.hidden) localNotify(`🔔 Naya order ${current.ref_no}`, `${current.customer_name ?? ''}: ${short(current.details, 70)}`, '/provider/dashboard', `order-${current.id}`, true);
    }
    if (!title.current) title.current = document.title;
    let on = false;
    const flash = setInterval(() => { on = !on; document.title = on ? `🔔 NAYA ORDER (${queue.length})` : title.current; }, 1000);
    return () => clearInterval(flash);
  }, [current, queue.length]);

  useEffect(() => () => stopAlarm(), []);

  const ack = (id: string) => {
    write(ACK, JSON.stringify([...acked(), id].slice(-300)));
    setQueue((q) => q.filter((o) => o.id !== id));
  };

  return (
    <>
      {current && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="order-alert-title">
          <div className="w-full max-w-md animate-[bubbleIn_.25s_ease-out] overflow-hidden rounded-3xl bg-white shadow-2xl ring-4 ring-plate">
            <div className="flex items-center gap-3 bg-plate px-5 py-4 text-plate-ink">
              <span className="text-3xl motion-safe:animate-bounce" aria-hidden="true">🔔</span>
              <div>
                <div id="order-alert-title" className="text-lg font-bold">Naya order aaya hai!</div>
                <div className="text-sm">{current.ref_no}{current.category ? ` · ${current.category.name}` : ''}{queue.length > 1 ? ` · ${queue.length - 1} aur bhi` : ''}</div>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div className="text-base font-semibold">{current.customer_name ?? 'Customer'}</div>
              <p className="whitespace-pre-line rounded-xl bg-canvas p-3 text-sm">{short(current.details, 220)}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                {current.when_note && <span>🕒 {current.when_note}</span>}
                {current.address && <span>📍 {current.address}</span>}
              </div>
              {needTap && (
                <button type="button" onClick={() => unlockAudio().then((ok) => { if (ok) { setNeedTap(false); stopAlarm(); startAlarm(); } })} className="w-full rounded-xl bg-due-soft px-3 py-2 text-sm font-semibold text-due-ink">
                  🔊 Awaz band hai — yahan dabayein
                </button>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <form action={orderAction} onSubmit={() => ack(current.id)}>
                  <input type="hidden" name="id" value={current.id} />
                  <input type="hidden" name="action" value="accept" />
                  <input type="hidden" name="next" value="/provider/dashboard" />
                  <button className="btn w-full bg-service hover:bg-service-ink">Qubool karein</button>
                </form>
                <Link href="/provider/dashboard" onClick={() => ack(current.id)} className="btn-outline w-full">Dashboard</Link>
              </div>
              <button type="button" onClick={() => ack(current.id)} className="w-full py-1 text-sm font-medium text-ink-mute">Awaz band karein — baad mein dekhunga</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed inset-x-4 top-20 z-[65] mx-auto max-w-md rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-2xl sm:inset-x-auto sm:right-6" role="status">
          🔔 {toast.text}
          <Link href={toast.href} className="ml-2 text-plate underline">Dekhein</Link>
        </div>
      )}
    </>
  );
}

function localNotify(title: string, body: string, url: string, tag: string, loud = false) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    navigator.serviceWorker?.getRegistration().then((reg) => {
      const opts: any = { body, tag, renotify: true, requireInteraction: loud, icon: '/icons/icon-192.png', vibrate: loud ? [600, 200, 600, 200, 1200] : [200], data: { url } };
      if (reg) reg.showNotification(title, opts);
      else new Notification(title, opts);
    });
  } catch { /* ignore */ }
}
