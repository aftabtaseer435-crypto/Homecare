'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { modules, moduleTheme } from '@/lib/nav';

/** Hamburger button + slide-in drawer with every section, grouped by module. */
export default function MobileMenu({ loggedIn, name, superAdmin, agent = false, seller = false }: { loggedIn: boolean; name?: string | null; superAdmin: boolean; agent?: boolean; seller?: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      btnRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink/15 bg-white text-ink lg:hidden"
        aria-label="Menu kholein"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="mobile-menu">
          <button className="absolute inset-0 bg-ink/50" aria-label="Menu band karein" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm animate-[drawerIn_.22s_ease-out] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink-mute">{loggedIn ? 'Logged in' : 'Khush aamdeed'}</div>
                <div className="truncate font-bold">{loggedIn ? name || 'Mera account' : 'Housing Welfare'}</div>
              </div>
              <button ref={closeRef} className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-canvas" aria-label="Menu band karein" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              <Link href={loggedIn ? '/dashboard' : '/login'} className="mb-3 flex min-h-[48px] items-center rounded-xl bg-brand-600 px-4 font-semibold text-white no-underline hover:no-underline">
                {loggedIn ? 'Mera dashboard' : 'Login / Sign up'}
              </Link>
              {modules.map((m) => {
                const t = moduleTheme[m.id];
                return (
                  <div key={m.id} className="mb-3 rounded-2xl border border-line p-2">
                    <Link href={m.home} className="flex items-center gap-2.5 rounded-xl px-2 py-2 font-bold text-ink no-underline hover:no-underline">
                      <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} aria-hidden="true" />
                      {m.name}
                    </Link>
                    <ul>
                      {m.links.filter((l) => loggedIn || !l.auth || l.href.includes('register') || l.href.includes('new') || l.href.includes('join')).map((l) => (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            aria-current={path === l.href ? 'page' : undefined}
                            className={`flex min-h-[44px] items-center rounded-lg px-3 text-[15px] no-underline hover:bg-canvas hover:no-underline ${path === l.href ? 'font-bold text-ink' : 'text-ink-soft'}`}
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {loggedIn && (
                <Link href="/notifications" className="flex min-h-[44px] items-center rounded-xl px-4 font-semibold text-ink no-underline">Notifications</Link>
              )}
              {loggedIn && (
                <Link href="/my/orders" className="flex min-h-[44px] items-center rounded-xl px-4 font-semibold text-ink no-underline">Mere orders</Link>
              )}
              {seller && (
                <Link href="/provider/dashboard" className="flex min-h-[44px] items-center rounded-xl px-4 font-semibold text-ink no-underline">Seller dashboard</Link>
              )}
              {agent && (
                <Link href="/w" className="flex min-h-[44px] items-center rounded-xl px-4 font-semibold text-ink no-underline">Welfare agent panel</Link>
              )}
              {loggedIn && (
                <Link href="/account" className="flex min-h-[44px] items-center rounded-xl px-4 font-semibold text-ink no-underline">Mera account (naam, photo)</Link>
              )}
              {superAdmin && (
                <Link href="/admin" className="flex min-h-[44px] items-center rounded-xl px-4 font-bold text-ink no-underline">Super Admin</Link>
              )}
            </nav>

            {loggedIn && (
              <form action="/auth/signout" method="post" className="border-t border-line p-4">
                <button className="btn-outline w-full">Logout</button>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
