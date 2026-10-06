import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import RegisterSW from '@/components/RegisterSW';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: { default: `${appName} — society fund, home services, rent / sale`, template: `%s · ${appName}` },
  description: 'Society ka development fund green/red status ke sath, WhatsApp reminders, verified electrician / plumber / masi, aur ghar rent ya sale — ek app mein.',
  appleWebApp: { capable: true, title: appName, statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  openGraph: { siteName: appName, type: 'website', locale: 'en_PK' },
};

export const viewport: Viewport = { themeColor: '#0B6E4F', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <RegisterSW />
        <Header />
        <main className="container-app pb-6 pt-6 md:pt-8">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
