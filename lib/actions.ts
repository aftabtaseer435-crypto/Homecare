import { redirect } from 'next/navigation';

/** Redirect back with a flash message. */
export function back(path: string, kind: 'ok' | 'err', msg: string): never {
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}${kind}=${encodeURIComponent(msg)}`);
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Only same-site relative paths ("/x"), never "//evil.com" or "/\evil.com". */
export function safePath(p: string | null | undefined, fallback = '/dashboard') {
  return p && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\') ? p : fallback;
}
