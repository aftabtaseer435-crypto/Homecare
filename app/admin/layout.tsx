import { requireSuperAdmin } from '@/lib/auth';
import SideNav from '@/components/SideNav';
import { noindex } from '@/lib/seo';

export const metadata = noindex;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  const items = [
    { href: '/admin', label: 'Society requests', exact: true },
    { href: '/admin/societies', label: 'Societies' },
    { href: '/admin/providers', label: 'Providers' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/complaints', label: 'Complaints' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
      <aside className="min-w-0 space-y-3 md:sticky md:top-24 md:space-y-4 md:self-start">
        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="eyebrow">Platform</div>
          <div className="mt-0.5 font-display text-lg font-bold">Super Admin</div>
        </div>
        <SideNav items={items} label="Super admin" />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
