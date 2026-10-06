import Link from 'next/link';
import { getSession } from '@/lib/auth';

export default async function Header() {
  const { user, profile } = await getSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container-app flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700 no-underline">
          <img src="/icon.svg" alt="" className="h-7 w-7" />
          {appName}
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-4 text-sm">
          <Link href="/services" className="text-gray-700 no-underline hover:text-brand-700">Services</Link>
          <Link href="/properties" className="text-gray-700 no-underline hover:text-brand-700">Rent / Sale</Link>
          <Link href="/societies/join" className="text-gray-700 no-underline hover:text-brand-700">Meri Society</Link>
          {profile?.is_super_admin && (
            <Link href="/admin" className="text-gray-700 no-underline hover:text-brand-700">Super Admin</Link>
          )}
        </nav>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="btn-outline btn-sm">{profile?.full_name || 'Dashboard'}</Link>
            <form action="/auth/signout" method="post">
              <button className="text-gray-500 hover:text-red-600">Logout</button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn btn-sm">Login</Link>
        )}
      </div>
    </header>
  );
}
