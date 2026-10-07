'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Avatar from './Avatar';

type Props = { name: string; avatar: string | null; seller: boolean; agent: boolean; superAdmin: boolean };

/** Avatar button in the header → one tidy menu for everything account-related. */
export default function AccountMenu({ name, avatar, seller, agent, superAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', off);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); window.removeEventListener('keydown', esc); };
  }, [open]);

  const first = (name || 'Account').split(' ')[0];
  const item = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink no-underline hover:bg-canvas hover:no-underline';
  const groups: { label?: string; links: [string, string, string][] }[] = [
    { links: [['/dashboard', 'Mera dashboard', '🏠'], ['/my/orders', 'Mere orders', '🛍️'], ['/notifications', 'Notifications', '🔔']] },
    {
      label: 'Kaam',
      links: [
        ...(seller ? ([['/provider/dashboard', 'Seller dashboard', '🧰']] as [string, string, string][]) : [['/provider', 'Seller / provider banein', '🧰']] as [string, string, string][]),
        ...(agent ? ([['/w', 'Welfare agent panel', '🛠️']] as [string, string, string][]) : []),
        ...(superAdmin ? ([['/admin', 'Super Admin', '🛡️']] as [string, string, string][]) : []),
      ],
    },
    { links: [['/account', 'Account settings', '⚙️']] },
  ];

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-medium text-ink hover:border-ink/30"
      >
        <Avatar name={name} src={avatar} size={34} />
        <span className="max-w-[8rem] truncate">{first}</span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 text-ink-mute transition-transform ${open ? 'rotate-180' : ''}`} fill="currentColor" aria-hidden="true">
          <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06z" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-2xl">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={name} src={avatar} size={40} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink">{name || 'Mera account'}</div>
              <div className="text-xs text-ink-mute">{superAdmin ? 'Super Admin' : seller ? 'Seller' : 'Member'}</div>
            </div>
          </div>
          {groups.filter((g) => g.links.length).map((g, i) => (
            <div key={i} className="mt-1 border-t border-line pt-1">
              {g.label && <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{g.label}</div>}
              {g.links.map(([href, label, icon]) => (
                <Link key={href} href={href} role="menuitem" className={item}>
                  <span className="w-5 text-center" aria-hidden="true">{icon}</span>{label}
                </Link>
              ))}
            </div>
          ))}
          <form action="/auth/signout" method="post" className="mt-1 border-t border-line pt-1">
            <button role="menuitem" className={`${item} w-full text-due-ink`}>
              <span className="w-5 text-center" aria-hidden="true">↩</span>Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
