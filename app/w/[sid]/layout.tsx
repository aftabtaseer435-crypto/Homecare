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
    <div className="grid gap-6 md:grid-cols-[13rem_1fr] md:gap-8">
      <aside className="space-y-4 md:sticky md:top-24 md:self-start">
        <div className="rounded-2xl bg-ink p-4 text-white">
          <div className="text-xs font-bold text-plate">Welfare agent</div>
          <div className="mt-0.5 text-lg font-extrabold leading-snug">{society?.name}</div>
          <div className="mt-1 text-sm text-white/85">{areas.map(areaLabel).join(' · ')}</div>
        </div>
        <SideNav items={items} label="Welfare agent" />
        <Link href="/guides/welfare-agent" className="hidden px-3.5 text-sm font-bold md:block">Agent guide</Link>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
