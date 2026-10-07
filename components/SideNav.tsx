'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = { href: string; label: string; exact?: boolean };

/** Sidebar on desktop, horizontal scroll tabs on phones. */
export default function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const path = usePathname();
  const isActive = (i: NavItem) => (i.exact ? path === i.href : path === i.href || path.startsWith(i.href + '/'));
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <ul className="flex gap-1 md:flex-col">
        {items.map((i) => {
          const active = isActive(i);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold no-underline hover:no-underline ${active ? 'bg-brand-50 font-semibold text-brand-800' : 'font-medium text-ink-mute hover:bg-white hover:text-ink'}`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
