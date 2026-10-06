import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/s/', '/admin', '/dashboard', '/my/', '/account/', '/onboarding', '/login', '/api/', '/auth/', '/provider/dashboard', '/properties/new', '/w/', '/welfare', '/hisaab'],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
