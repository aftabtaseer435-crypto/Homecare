import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Logo from './Logo';
import NavLinks from './NavLinks';
import MobileMenu from './MobileMenu';

export default async function Header() {
  const { user, profile } = await getSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';
  const initials = (profile?.full_name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-app flex h-16 items-center gap-4 lg:gap-6">
        <Logo name={appName} />
        <NavLinks superAdmin={!!profile?.is_super_admin} />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="flex min-h-[44px] items-center gap-2 rounded-full border border-ink/15 bg-white py-1 pl-1 pr-1 text-sm font-medium text-ink no-underline hover:border-ink/30 hover:no-underline sm:pr-3" aria-label="Mera dashboard">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials}</span>
                <span className="hidden max-w-[10rem] truncate sm:inline">{profile?.full_name || 'Mera account'}</span>
              </Link>
              <form action="/auth/signout" method="post" className="hidden lg:block">
                <button className="btn-ghost">Logout</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn">Login</Link>
          )}
          <MobileMenu loggedIn={!!user} name={profile?.full_name} superAdmin={!!profile?.is_super_admin} />
        </div>
      </div>
    </header>
  );
}
