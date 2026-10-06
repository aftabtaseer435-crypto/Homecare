import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Logo from './Logo';
import NavLinks from './NavLinks';

export default async function Header() {
  const { user, profile } = await getSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';
  const initials = (profile?.full_name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/85 backdrop-blur">
      <div className="container-app flex h-16 items-center gap-6">
        <Logo name={appName} />
        <NavLinks superAdmin={!!profile?.is_super_admin} />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink no-underline hover:border-ink/30 hover:no-underline">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials}</span>
                <span className="hidden max-w-[10rem] truncate sm:inline">{profile?.full_name || 'Mera account'}</span>
              </Link>
              <form action="/auth/signout" method="post" className="hidden md:block">
                <button className="btn-ghost">Logout</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn">Login</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
