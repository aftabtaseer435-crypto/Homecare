export const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return raw.replace(/\/$/, '');
}

/** <script type="application/ld+json"> payload helper. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}

/** Private / logged-in areas should never be indexed. */
export const noindex = { robots: { index: false, follow: false } } as const;
