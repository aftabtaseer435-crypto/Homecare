'use client';

import { useEffect, useState } from 'react';
import { chime, speakOrder, startAlarm, stopAlarm, unlockAudio } from '@/lib/alarm';

const b64ToUint8 = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

type State = 'checking' | 'on' | 'off' | 'blocked' | 'unsupported';

/**
 * "Order alerts" switch: asks notification permission, subscribes this phone
 * to push (so it rings even when the app is closed) and plays a test alarm.
 */
export default function AlertSetup({ vapidKey, who = 'provider' }: { vapidKey: string | null; who?: 'provider' | 'customer' | 'admin' }) {
  const [state, setState] = useState<State>('checking');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return setState('unsupported');
      if (Notification.permission === 'denied') return setState('blocked');
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager?.getSubscription();
      setState(Notification.permission === 'granted' && (sub || !vapidKey) ? 'on' : 'off');
    })().catch(() => setState('off'));
  }, [vapidKey]);

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await unlockAudio();
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'blocked' : 'off');
        return;
      }
      if (vapidKey) {
        const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'));
        await navigator.serviceWorker.ready;
        const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(vapidKey) }));
        const r = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) });
        if (!r.ok) throw new Error('save failed');
      }
      setState('on');
      test();
    } catch {
      setMsg('Alerts on nahi ho sake — Chrome mein site kholein aur dobara koshish karein.');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    await unlockAudio();
    if (who === 'provider') {
      startAlarm();
      speakOrder();
      setTimeout(stopAlarm, 3500);
    } else chime();
  };

  if (state === 'checking') return null;
  const title = who === 'provider' ? 'Order alert (zor ki awaz)' : who === 'admin' ? 'Admin alerts' : 'Order updates ka alert';

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${state === 'on' ? 'border-paid/30 bg-paid-soft' : 'border-plate bg-plate-soft'}`}>
      <span className="text-2xl" aria-hidden="true">{state === 'on' ? '🔔' : '🔕'}</span>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-semibold text-ink">{title}: {state === 'on' ? 'ON' : 'OFF'}</div>
        <div className="text-ink-soft">
          {state === 'on' && (who === 'provider' ? 'Naya order aate hi is phone par zor ki awaz aur notification aayegi — app band ho tab bhi.' : who === 'admin' ? 'Naya provider / dukaan ya nayi ghar request aate hi is phone par notification aayegi.' : 'Order qubool / mukammal hone par is phone par alert aayega.')}
          {state === 'off' && (who === 'provider' ? 'Zaroor on karein — warna order aane ka pata sirf app khulne par chalega.' : who === 'admin' ? 'On karein — naye provider aur ghar ki requests ka foran pata chalega.' : 'On karein taake order ka status foran pata chale.')}
          {state === 'blocked' && 'Notifications block hain. Phone Settings → Apps → Chrome / Housing Welfare → Notifications → Allow karein, phir page refresh.'}
          {state === 'unsupported' && 'Is browser mein notifications nahi. Chrome mein kholein ya Play Store app install karein. App khula ho to awaz phir bhi aayegi.'}
        </div>
        {msg && <div className="mt-1 text-due-ink">{msg}</div>}
      </div>
      {state === 'off' && <button type="button" onClick={enable} disabled={busy} className="btn btn-sm">{busy ? '...' : 'Alerts on karein'}</button>}
      {(state === 'on' || state === 'unsupported') && <button type="button" onClick={test} className="btn-outline btn-sm">🔊 Test awaz</button>}
    </div>
  );
}
