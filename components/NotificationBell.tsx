'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cleanTitle, kindOf } from '@/lib/notifKinds';
import { notifIcon } from '@/lib/icons';

type Item = { id: string; kind: string; title: string; body: string | null; url: string | null; read_at: string | null; created_at: string };

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (m < 1) return 'abhi';
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} ghante` : `${Math.round(h / 24)} din`;
};

/** Bell in the header: unread count, and a panel with the latest updates. */
export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [mounted, setMounted] = useState(false);
  const [top, setTop] = useState(72);
  const router = useRouter();
  const path = usePathname();
  const btn = useRef<HTMLButtonElement>(null);

  const count = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications?count=1', { cache: 'no-store' });
      if (r.ok) setUnread((await r.json()).unread ?? 0);
    } catch { /* offline */ }
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.items);
      setUnread(d.unread);
    } catch { /* offline */ }
  }, []);

  useEffect(() => setMounted(true), []);
  // refresh the count on every page change, and every 30 s while visible
  useEffect(() => { count(); }, [count, path]);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) count(); }, 30_000);
    const vis = () => { if (!document.hidden) count(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [count]);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  const toggle = () => {
    const next = !open;
    if (next && btn.current) setTop(Math.round(btn.current.getBoundingClientRect().bottom + 8));
    setOpen(next);
    if (next) load();
  };

  const go = async (n: Item) => {
    setOpen(false);
    if (!n.read_at) {
      setUnread((u) => Math.max(0, u - 1));
      fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
    }
    if (n.url) router.push(n.url);
  };

  const readAll = async () => {
    setUnread(0);
    setItems((list) => list?.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) ?? null);
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) }).catch(() => {});
  };

  const panel = open && mounted
    ? createPortal(
        <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Notifications"
            onClick={(e) => e.stopPropagation()}
            style={{ top }}
            className="absolute inset-x-2 max-h-[75vh] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[24rem] lg:right-[max(1rem,calc((100vw-72rem)/2))]"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="font-semibold">Notifications</div>
              {unread > 0 && <button type="button" onClick={readAll} className="text-xs font-semibold text-brand-700">Sab parh liye ✓</button>}
            </div>
            <div className="max-h-[calc(75vh-6.5rem)] overflow-y-auto">
              {items === null ? (
                <div className="p-6 text-center text-sm text-ink-mute">Load ho raha hai…</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-mute">Abhi koi notification nahi.</div>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((n) => {
                    const k = kindOf(n.kind);
                    const I = notifIcon(n.kind);
                    return (
                      <li key={n.id}>
                        <button type="button" onClick={() => go(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-canvas ${n.read_at ? '' : 'bg-brand-50/50'}`}>
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${k.cls}`} aria-hidden="true"><I className="h-[18px] w-[18px]" strokeWidth={2} /></span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm leading-snug ${n.read_at ? 'text-ink-soft' : 'font-semibold text-ink'}`}>{cleanTitle(n.title)}</span>
                            {n.body && <span className="mt-0.5 block truncate text-xs text-ink-mute">{n.body}</span>}
                            <span className="mt-0.5 block text-[11px] text-ink-mute">{k.label} · {ago(n.created_at)}</span>
                          </span>
                          {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="naya" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-semibold no-underline">
              Saari notifications dekhein
            </Link>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications — ${unread} naye` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-due px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}
