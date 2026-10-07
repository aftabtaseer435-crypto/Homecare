'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { moduleFor, moduleTheme } from '@/lib/nav';

/**
 * Light sub-navigation under the header: shows only the current section's
 * links (Society / Home Services / Rent-Sale) as underlined tabs, so the
 * three products never blur together.
 */
export default function ModuleNav() {
  const path = usePathname();
  const m = moduleFor(path);
  if (!m || m.id === 'help' || path.startsWith('/s/') || path.startsWith('/w/')) return null;
  const t = moduleTheme[m.id];
  return (
    <div className="border-b border-line bg-white">
      <nav aria-label={m.name} className="container-app flex gap-6 overflow-x-auto [scrollbar-width:none]">
        {m.links.map((l) => {
          const active = path === l.href || (l.href !== m.home && path.startsWith(l.href + '/'));
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 py-3 text-sm no-underline hover:no-underline ${
                active ? `${t.border} font-semibold text-ink` : 'border-transparent font-medium text-ink-mute hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
