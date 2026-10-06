import type { MetadataRoute } from 'next';

// PWA manifest — lets residents "install" the site on their phone like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub',
    short_name: process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#059669',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
