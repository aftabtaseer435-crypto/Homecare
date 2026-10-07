import { appName } from '@/lib/seo';
import type { MetadataRoute } from 'next';

// Web app manifest — used by "Add to Home screen" AND by Bubblewrap to
// generate the Android (Play Store) app. Keep name/colours/icons here.
export default function manifest(): MetadataRoute.Manifest {
  const name = appName;
  return {
    id: '/',
    name,
    short_name: name,
    description: 'Society fund, WhatsApp reminders, electrician / plumber / masi, aur ghar rent ya sale — ek app mein.',
    start_url: '/dashboard?source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#147A59',
    lang: 'en-PK',
    categories: ['lifestyle', 'utilities', 'business'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Services', url: '/services', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Rent / Sale', url: '/properties', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
