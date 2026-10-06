import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import SideNav from '@/components/SideNav';
import { noindex } from '@/lib/seo';

export const metadata = noindex;

export default async function SocietyAdminLayout({ children, params }: { children: React.ReactNode; params: { sid: string } }) {
  const { supabase, role } = await requireSocietyStaff(params.sid);
  const { data: society } = await supabase.from('societies').select('name, city').eq('id', params.sid).single();
  const base = `/s/${params.sid}`;
  const items = [
    { href: base, label: 'Overview', exact: true },
    { href: `${base}/reminders`, label: 'WhatsApp reminders' },
    { href: `${base}/payments`, label: 'Payments' },
    { href: `${base}/defaulters`, label: 'Defaulters' },
    { href: `${base}/owners`, label: 'Owners' },
    ...(role === 'admin'
      ? [
          { href: `${base}/houses`, label: 'Ghar' },
          { href: `${base}/funds`, label: 'Fund plans' },
          { href: `${base}/notices`, label: 'Notices' },
          { href: `${base}/team`, label: 'Team' },
        ]
      : []),
    { href: `${base}/messages`, label: 'Message log' },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-[13rem_1fr] md:gap-8">
      <aside className="space-y-4 md:sticky md:top-24 md:self-start">
        <div className="rounded-2xl bg-brand-800 p-4 text-white">
          <div className="text-xs font-semibold text-white/75">{role === 'admin' ? 'Society admin' : 'Collector'}</div>
          <div className="mt-0.5 font-display text-lg font-bold leading-snug">{society?.name}</div>
          <div className="text-sm text-white/85">{society?.city}</div>
        </div>
        <SideNav items={items} label="Society admin" />
        <Link href="/guides/society-admin" className="hidden px-3.5 text-sm font-semibold md:block">Admin guide</Link>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
