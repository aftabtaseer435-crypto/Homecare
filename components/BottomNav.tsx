'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { moduleFor } from '@/lib/nav';

/** Phone tab bar (also used by the Play Store app). One tab per module. */
const tabs = [
  { href: '/dashboard', id: 'home', label: 'Home', color: 'text-ink', icon: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { href: '/society', id: 'society', label: 'Society', color: 'text-society', icon: 'M4 21V8l8-5 8 5v13M9 21v-5h6v5M8 10h2M14 10h2M8 13h2M14 13h2' },
  { href: '/services', id: 'services', label: 'Services', color: 'text-service', icon: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z' },
  { href: '/properties', id: 'property', label: 'Rent/Sale', color: 'text-property', icon: 'M3 10.5 12 3l9 7.5M5 9v12h14V9M10 21v-6h4v6' },
];

export default function BottomNav() {
  const path = usePathname();
  if (path.startsWith('/login') || path.startsWith('/onboarding')) return null;
  const current = path === '/dashboard' ? 'home' : moduleFor(path)?.id;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="App">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = current === t.id;
          return (
            <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined} className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold no-underline hover:no-underline ${active ? t.color : 'text-ink-mute'}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={t.icon} />
              </svg>
              {t.label}
              <span className={`mt-0.5 h-1 w-6 rounded-full ${active ? 'bg-current' : 'bg-transparent'}`} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
