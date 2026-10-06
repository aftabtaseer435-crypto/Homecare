import Link from 'next/link';
import { LogoMark } from './Logo';
import { modules, moduleTheme } from '@/lib/nav';
import { appName } from '@/lib/seo';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white pb-24 lg:pb-0">
      <div className="container-app grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="text-lg font-bold">{appName}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-mute">
            Pakistan ki housing societies ke liye: fund ka hisaab, ghar ke kaam ke liye bharosemand log, aur ghar rent ya sale.
          </p>
        </div>
        {modules.map((m) => (
          <div key={m.id}>
            <h2 className="mb-3 flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${moduleTheme[m.id].dot}`} aria-hidden="true" />
              {m.name}
            </h2>
            <ul className="space-y-2 text-sm">
              {m.links.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-ink-mute no-underline hover:text-ink hover:underline">{l.label}</Link></li>
              ))}
              {m.id === 'help' && <li><Link href="/account/delete" className="text-ink-mute no-underline hover:text-ink hover:underline">Account delete</Link></li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-app flex flex-wrap justify-between gap-2 py-5 text-xs text-ink-mute">
          <span>© {new Date().getFullYear()} {appName}</span>
          <span>Made for housing societies in Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
