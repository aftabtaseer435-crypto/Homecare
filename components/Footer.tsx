import Link from 'next/link';
import { LogoMark } from './Logo';
import { modules, moduleTheme } from '@/lib/nav';
import { appName } from '@/lib/seo';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-white pb-24 lg:mt-16 lg:pb-0">
      <div className="container-app hidden gap-10 py-12 lg:grid lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="text-lg font-bold">{appName}</span>
          </div>
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
        <div className="container-app flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-5 text-xs text-ink-mute">
          <span>© {new Date().getFullYear()} {appName}</span>
          <span className="flex gap-4 lg:hidden">
            <Link href="/guides" className="text-ink-mute no-underline">Guides</Link>
            <Link href="/privacy" className="text-ink-mute no-underline">Privacy</Link>
            <Link href="/account/delete" className="text-ink-mute no-underline">Account delete</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
