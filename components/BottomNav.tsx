'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Phone-style tab bar — makes the site feel like an app (and the Play Store build). */
const tabs = [
  { href: '/dashboard', label: 'Home', icon: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { href: '/services', label: 'Services', icon: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z' },
  { href: '/properties', label: 'Rent/Sale', icon: 'M4 21V9l8-6 8 6v12M9 21v-6h6v6M9 11h.01M15 11h.01' },
  { href: '/guides', label: 'Guides', icon: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 5v16M8 7h6' },
];

export default function BottomNav() {
  const path = usePathname();
  if (path.startsWith('/login') || path.startsWith('/onboarding')) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="App">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = path === t.href || path.startsWith(t.href + '/');
          return (
            <Link key={t.href} href={t.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold no-underline hover:no-underline ${active ? 'text-brand-700' : 'text-ink-mute'}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={t.icon} />
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
