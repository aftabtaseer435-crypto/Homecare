import Link from 'next/link';
import { guides } from '@/lib/guides';

export const metadata = {
  title: 'Guides — society admin, makan malik, provider (step by step)',
  description: 'Roman Urdu mein step-by-step guides: society setup, fund plan, WhatsApp reminders, payment entry, provider profile, ghar rent / sale aur phone par app install.',
  alternates: { canonical: '/guides' },
};

export const revalidate = 3600;

export default function Guides() {
  const [admin, owner, ...rest] = guides;
  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-extrabold">Guides</h1>
        <p className="mt-3 text-lg text-ink-soft">Apna kirdar choose karein aur qadam ba qadam chalein. Har guide mein app ke asal buttons ke naam hain.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[admin, owner].map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="panel group block no-underline hover:no-underline">
            <div className="text-sm font-semibold text-brand-700">{g.who}</div>
            <h2 className="mt-1 font-display text-2xl font-bold">{g.title}</h2>
            <p className="mt-2 text-ink-soft">{g.summary}</p>
            <div className="mt-5 flex items-center gap-3 text-sm text-ink-mute">
              <span className="plate h-6 px-2 text-[11px]">{g.steps.length} steps</span>
              <span>{g.time}</span>
            </div>
          </Link>
        ))}
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {rest.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-5 no-underline hover:bg-canvas hover:no-underline">
              <div className="min-w-[14rem] flex-1">
                <div className="font-display text-lg font-bold text-ink">{g.title}</div>
                <div className="text-sm text-ink-mute">{g.summary}</div>
              </div>
              <span className="text-sm text-ink-mute">{g.steps.length} steps, {g.time}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
