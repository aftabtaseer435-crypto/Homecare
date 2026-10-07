import Link from 'next/link';
import SideNav from '@/components/SideNav';
import { noindex } from '@/lib/seo';
import { areaLabel, requireAgent } from '@/lib/agent';

export const metadata = noindex;

export default async function AgentLayout({ children, params }: { children: React.ReactNode; params: { sid: string } }) {
  const { areas, society } = await requireAgent(params.sid);
  const base = `/w/${params.sid}`;
  const items = [
    { href: base, label: 'Masle', exact: true },
    { href: `${base}/houses`, label: 'Ghar (checking)' },
    { href: `${base}/kharcha`, label: 'Kharcha' },
    { href: `/hisaab/${params.sid}`, label: 'Fund ka hisaab' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
      <aside className="min-w-0 space-y-3 md:sticky md:top-24 md:space-y-4 md:self-start">
        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="eyebrow">Welfare agent</div>
          <div className="mt-0.5 text-lg font-bold leading-snug">{society?.name}</div>
          <div className="mt-1 text-sm text-ink-mute">{areas.map(areaLabel).join(' · ')}</div>
        </div>
        <SideNav items={items} label="Welfare agent" />
        <Link href="/guides/welfare-agent" className="hidden px-3.5 text-sm font-bold md:block">Agent guide</Link>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
