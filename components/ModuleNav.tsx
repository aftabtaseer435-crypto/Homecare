'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { moduleFor, moduleTheme } from '@/lib/nav';

/**
 * Coloured strip under the header that tells you which part of the app you
 * are in (Society Fund / Home Services / Rent-Sale) and shows only that
 * part's links — so the three products never blur together.
 */
export default function ModuleNav() {
  const path = usePathname();
  const m = moduleFor(path);
  if (!m || m.id === 'help' || path.startsWith('/s/')) return null;
  const t = moduleTheme[m.id];
  return (
    <div className={`${t.bg} text-white`}>
      <div className="container-app flex items-center gap-4 overflow-x-auto py-2">
        <Link href={m.home} className="shrink-0 whitespace-nowrap text-sm font-extrabold text-white no-underline hover:no-underline">
          {m.name}
        </Link>
        <span className="h-4 w-px shrink-0 bg-white/30" aria-hidden="true" />
        <nav aria-label={m.name} className="flex gap-1">
          {m.links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold no-underline hover:no-underline ${active ? 'bg-white text-ink' : 'text-white hover:bg-white/15'}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
