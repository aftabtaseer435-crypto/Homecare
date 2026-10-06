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
    <div className="grid gap-6 md:grid-cols-[13rem_1fr] md:gap-8">
      <aside className="space-y-4 md:sticky md:top-24 md:self-start">
        <div className="rounded-2xl bg-ink p-4 text-white">
          <div className="text-xs font-semibold text-white/60">Platform</div>
          <div className="mt-0.5 font-display text-lg font-bold">Super Admin</div>
        </div>
        <SideNav items={items} label="Super admin" />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
