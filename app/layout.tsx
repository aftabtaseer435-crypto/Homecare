import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import RegisterSW from '@/components/RegisterSW';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: 'Society development fund management, home services and property — ek hi app mein.',
  appleWebApp: { capable: true, title: appName, statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#059669', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterSW />
        <Header />
        <main className="container-app py-6">{children}</main>
        <footer className="container-app py-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {appName} ·{' '}
          <a href="/privacy" className="text-gray-400">Privacy</a> ·{' '}
          <a href="/account/delete" className="text-gray-400">Account delete</a>
        </footer>
      </body>
    </html>
  );
}
