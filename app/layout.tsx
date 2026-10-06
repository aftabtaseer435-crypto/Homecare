import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: 'Society development fund management, home services and property — ek hi app mein.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#059669', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="container-app py-6">{children}</main>
        <footer className="container-app py-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {appName}
        </footer>
      </body>
    </html>
  );
}
