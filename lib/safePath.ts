/** Only same-site relative paths ("/x"), never "//evil.com" or "/\evil.com". */
export function safePath(p: string | null | undefined, fallback = '/dashboard') {
  if (!p || !p.startsWith('/') || /[\\\x00-\x20]/.test(p.slice(0, 2)) || /[\x00-\x1f\\]/.test(p)) return fallback;
  try {
    return new URL(p, 'http://x').origin === 'http://x' && !p.startsWith('//') ? p : fallback;
  } catch {
    return fallback;
  }
}
