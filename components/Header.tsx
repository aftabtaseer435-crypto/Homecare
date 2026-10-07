import { appName } from '@/lib/seo';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Logo from './Logo';
import AccountMenu from './AccountMenu';
import { storagePublicUrl } from '@/lib/format';
import NavLinks from './NavLinks';
import MobileMenu from './MobileMenu';
import NotificationBell from './NotificationBell';

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
      <div className="container-app flex h-16 items-center gap-3 lg:gap-8">
        <Logo name={appName} />
        <NavLinks />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <AccountMenu name={profile?.full_name ?? ''} avatar={storagePublicUrl(profile?.avatar_path)} seller={isSeller} agent={isAgent} superAdmin={!!profile?.is_super_admin} />
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
