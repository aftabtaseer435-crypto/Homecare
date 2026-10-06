'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/societies/join', label: 'Meri society' },
  { href: '/services', label: 'Services' },
  { href: '/properties', label: 'Rent / Sale' },
  { href: '/guides', label: 'Guides' },
];

export default function NavLinks({ superAdmin }: { superAdmin: boolean }) {
  const path = usePathname();
  const all = superAdmin ? [...links, { href: '/admin', label: 'Super Admin' }] : links;
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {all.map((l) => {
        const active = path === l.href || path.startsWith(l.href + '/');
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-semibold no-underline hover:no-underline ${active ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:bg-white/70 hover:text-ink'}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
