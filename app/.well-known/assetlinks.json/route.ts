import { NextResponse } from 'next/server';

/**
 * Digital Asset Links — proves to Android that the Play Store app and this
 * website belong together, so the app opens full-screen (no browser bar).
 *
 * Set in Vercel env:
 *   ANDROID_PACKAGE_NAME=com.societyhub.app
 *   ANDROID_SHA256_FINGERPRINTS=AB:CD:...   (comma-separated; from Play Console →
 *     Setup → App signing → "App signing key certificate" SHA-256, plus the
 *     upload key one if you test locally built APKs)
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME;
  const prints = (process.env.ANDROID_SHA256_FINGERPRINTS || '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const body =
    pkg && prints.length
      ? [
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: prints },
          },
        ]
      : [];

  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
