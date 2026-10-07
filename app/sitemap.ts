import type { MetadataRoute } from 'next';
import { guides } from '@/lib/guides';
import { siteUrl } from '@/lib/seo';
import { createPublicClient } from '@/lib/supabase/public';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1, lastModified: now },
    { url: `${base}/society`, changeFrequency: 'monthly', priority: 0.9, lastModified: now },
    { url: `${base}/services`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${base}/properties`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${base}/properties/sale`, changeFrequency: 'daily', priority: 0.8, lastModified: now },
    { url: `${base}/properties/rent`, changeFrequency: 'daily', priority: 0.8, lastModified: now },
    { url: `${base}/properties/wanted`, changeFrequency: 'daily', priority: 0.6, lastModified: now },
    { url: `${base}/societies/register`, changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${base}/provider/register`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${base}/guides`, changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    ...guides.map((g) => ({ url: `${base}/guides/${g.slug}`, changeFrequency: 'monthly' as const, priority: 0.6, lastModified: now })),
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2, lastModified: now },
  ];

  try {
    const sb = createPublicClient();
    const [{ data: cats }, { data: providers }, { data: listings }, { data: socs }] = await Promise.all([
      sb.from('service_categories').select('slug').eq('active', true),
      sb.from('providers').select('id, created_at').eq('status', 'verified').limit(5000),
      sb.from('property_listings').select('id, created_at').eq('status', 'active').limit(5000),
      sb.from('societies').select('slug').eq('status', 'active').limit(5000),
    ]);
    return [
      ...staticPages,
      ...(socs ?? []).map((s) => ({ url: `${base}/society/${s.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
      ...(cats ?? []).map((c) => ({ url: `${base}/services/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.8 })),
      ...(providers ?? []).map((p) => ({ url: `${base}/providers/${p.id}`, lastModified: new Date(p.created_at), changeFrequency: 'weekly' as const, priority: 0.6 })),
      ...(listings ?? []).map((l) => ({ url: `${base}/properties/${l.id}`, lastModified: new Date(l.created_at), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ];
  } catch {
    return staticPages;
  }
}
