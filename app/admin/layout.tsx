import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  const tabs = [
    { href: '/admin', label: 'Society requests' },
    { href: '/admin/societies', label: 'Societies' },
    { href: '/admin/providers', label: 'Providers' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/complaints', label: 'Complaints' },
  ];
  return (
    <div>
      <h1 className="mb-4">Super Admin</h1>
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
