'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { moduleFor, modules } from '@/lib/nav';

/** Desktop top-level navigation: one tab per module. */
export default function NavLinks({ superAdmin }: { superAdmin: boolean }) {
  const path = usePathname();
  const current = moduleFor(path)?.id;
  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
      {modules.map((m) => {
        const active = current === m.id;
        return (
          <Link
            key={m.id}
            href={m.home}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline hover:no-underline ${active ? 'bg-canvas font-semibold text-ink' : 'font-medium text-ink-mute hover:bg-canvas hover:text-ink'}`}
          >
            {m.id === 'help' ? 'Guides' : m.name}
          </Link>
        );
      })}
      {superAdmin && (
        <Link href="/admin" className={`rounded-lg px-3 py-2 text-sm font-medium no-underline hover:no-underline ${path.startsWith('/admin') ? 'bg-canvas font-semibold text-ink' : 'text-ink-mute hover:bg-canvas hover:text-ink'}`}>
          Super Admin
        </Link>
      )}
    </nav>
  );
}
