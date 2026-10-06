import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX = 5 * 1024 * 1024;

/**
 * Upload a file from a form into `<bucket>/<userId>/<folder>/<random>.<ext>`.
 * Returns the storage path or null if no file was provided.
 */
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: 'public-media' | 'private-docs',
  userId: string,
  folder: string,
  file: FormDataEntryValue | null,
): Promise<string | null> {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  if (!ALLOWED.includes(file.type)) throw new Error('Sirf JPG, PNG, WEBP ya PDF file allowed hai');
  if (file.size > MAX) throw new Error('File 5MB se bari hai');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}
