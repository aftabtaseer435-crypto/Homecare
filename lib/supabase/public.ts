import { createClient } from '@supabase/supabase-js';

/**
 * Cookie-less anon client for public data (sitemap, metadata). RLS still
 * applies, so it can only read what an anonymous visitor could read.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
