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

export { safePath } from './safePath';

/** The value if it is one of `allowed`, else the fallback (keeps CHECK constraints happy). */
export function oneOf<T extends string>(v: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
