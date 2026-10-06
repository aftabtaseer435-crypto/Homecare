/**
 * Supabase returns max 1000 rows per request by default. A society with
 * 2000+ houses needs paging — this helper keeps fetching until done.
 *
 *   const rows = await fetchAll((from, to) =>
 *     supabase.from('houses').select('*').eq('society_id', id).order('id').range(from, to));
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
  maxRows = 50000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}
