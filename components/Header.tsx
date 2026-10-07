import { appName } from '@/lib/seo';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Logo from './Logo';
import Avatar from './Avatar';
import { storagePublicUrl } from '@/lib/format';
import NavLinks from './NavLinks';
import MobileMenu from './MobileMenu';

export default async function Header() {
  const { supabase, user, profile } = await getSession();
  const [isAgent, isSeller] = user
    ? await Promise.all([
        supabase.from('welfare_agents').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('active', true).then((r) => (r.count ?? 0) > 0),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then((r) => (r.count ?? 0) > 0),
      ])
    : [false, false];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-app flex h-16 items-center gap-4 lg:gap-6">
        <Logo name={appName} />
        <NavLinks superAdmin={!!profile?.is_super_admin} />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-1 text-sm font-medium text-ink no-underline hover:border-ink/30 hover:no-underline sm:pr-3" aria-label="Mera dashboard">
                <Avatar name={profile?.full_name ?? ''} src={storagePublicUrl(profile?.avatar_path)} size={36} />
                <span className="hidden max-w-[10rem] truncate sm:inline">{profile?.full_name || 'Mera account'}</span>
              </Link>
              {isSeller && <Link href="/provider/dashboard" className="btn-ghost hidden lg:inline-flex">Seller dashboard</Link>}
              {isAgent && <Link href="/w" className="btn-ghost hidden lg:inline-flex">Agent panel</Link>}
              <Link href="/account" className="btn-ghost hidden lg:inline-flex">Account</Link>
              <form action="/auth/signout" method="post" className="hidden lg:block">
                <button className="btn-ghost">Logout</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn">Login</Link>
          )}
          <MobileMenu loggedIn={!!user} name={profile?.full_name} superAdmin={!!profile?.is_super_admin} agent={isAgent} seller={isSeller} />
        </div>
      </div>
    </header>
  );
}
