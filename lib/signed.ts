import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Temporary (1 hour) links for files in the private bucket.
 * Call ONLY after the caller's own RLS query has proven they may see the
 * row the file belongs to.
 */
export async function signPaths(paths: (string | null | undefined)[]) {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const out = new Map<string, string>();
  if (!unique.length) return out;
  const { data } = await createAdminClient().storage.from('private-docs').createSignedUrls(unique, 3600);
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  return out;
}
