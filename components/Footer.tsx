import Link from 'next/link';
import { LogoMark } from './Logo';

export default function Footer() {
  const name = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';
  const cols = [
    { title: 'Society', links: [['Society register karein', '/societies/register'], ['Apna ghar add karein', '/societies/join'], ['Society admin guide', '/guides/society-admin']] },
    { title: 'Services', links: [['Electrician, plumber, masi', '/services'], ['Provider banein', '/provider/register'], ['Provider guide', '/guides/service-provider']] },
    { title: 'Property', links: [['Ghar rent / sale', '/properties'], ['Apna ghar list karein', '/properties/new'], ['Listing guide', '/guides/ghar-rent-sale']] },
    { title: 'Madad', links: [['Saari guides', '/guides'], ['App install karein', '/guides/app-install'], ['Privacy policy', '/privacy'], ['Account delete', '/account/delete']] },
  ];
  return (
    <footer className="mt-16 border-t border-line bg-white pb-24 md:pb-0">
      <div className="container-app grid gap-10 py-12 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-lg font-bold">{name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-mute">Society ka fund, ghar ke kaam ke liye bharosemand log, aur ghar rent ya sale — ek jagah.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="mb-3 text-sm">{c.title}</h3>
            <ul className="space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="text-ink-mute no-underline hover:text-ink">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-app py-5 text-xs text-ink-mute">© {new Date().getFullYear()} {name}. Pakistan ki housing societies ke liye.</div>
      </div>
    </footer>
  );
}
