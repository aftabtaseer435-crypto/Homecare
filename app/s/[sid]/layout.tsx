import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';

export default async function SocietyAdminLayout({ children, params }: { children: React.ReactNode; params: { sid: string } }) {
  const { supabase, role } = await requireSocietyStaff(params.sid);
  const { data: society } = await supabase.from('societies').select('name, city').eq('id', params.sid).single();
  const base = `/s/${params.sid}`;
  const tabs = [
    { href: base, label: 'Overview' },
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
    <div>
      <div className="mb-4">
        <div className="muted">Society admin · {role === 'admin' ? 'Admin' : 'Collector'}</div>
        <h1>{society?.name} <span className="text-base font-normal text-gray-500">{society?.city}</span></h1>
      </div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium text-gray-600 no-underline hover:bg-white hover:text-brand-700">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
