import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-nastaliq-urdu';
import './globals.css';
import HadithBar from '@/components/HadithBar';
import Header from '@/components/Header';
import ModuleNav from '@/components/ModuleNav';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import RegisterSW from '@/components/RegisterSW';
import { siteUrl, appName } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${appName} — Society fund app, home services aur ghar rent / sale (Pakistan)`,
    template: `%s | ${appName}`,
  },
  description:
    'Housing society ka development fund ek app mein: har ghar green ya red, WhatsApp reminders, receipts. Saath mein verified electrician, plumber, masi aur society-verified ghar rent / sale.',
  applicationName: appName,
  keywords: ['society management app Pakistan', 'development fund', 'housing society app', 'maintenance fund', 'electrician', 'plumber', 'masi', 'house for rent', 'society app Lahore', 'society app Karachi'],
  alternates: { canonical: '/' },
  openGraph: { siteName: appName, type: 'website', locale: 'en_PK', url: '/' },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { capable: true, title: appName, statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#EFF8F4', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK">
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">
          Content par jayein
        </a>
        <RegisterSW />
        <HadithBar />
        <Header />
        <ModuleNav />
        <main id="main" className="container-app pb-12 pt-8 md:pb-16 md:pt-10">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
