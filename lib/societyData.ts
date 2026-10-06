import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchAll } from '@/lib/fetchAll';

export type House = { id: string; block: string; street: string; house_no: string; plot_size: string | null; fund_exempt: boolean; occupancy: string };
export type Due = { id: string; house_id: string; status: string; amount_due: number; paid_amount: number; due_date: string; period: string };

export async function getPlans(supabase: SupabaseClient, sid: string) {
  const { data } = await supabase
    .from('fund_plans')
    .select('id, name, amount, frequency, due_day, start_date, active')
    .eq('society_id', sid)
    .order('created_at');
  return data ?? [];
}

/** Periods that exist for a plan, newest first. */
export async function getPeriods(supabase: SupabaseClient, planId: string) {
  const { data } = await supabase
    .from('fund_dues')
    .select('period, due_date')
    .eq('fund_plan_id', planId)
    .order('due_date', { ascending: false })
    .limit(1000);
  const seen = new Set<string>();
  const out: { period: string; due_date: string }[] = [];
  for (const r of data ?? []) if (!seen.has(r.period)) { seen.add(r.period); out.push(r); }
  return out;
}

export async function getHouses(supabase: SupabaseClient, sid: string) {
  return fetchAll<House>((from, to) =>
    supabase.from('houses').select('id, block, street, house_no, plot_size, fund_exempt, occupancy').eq('society_id', sid).order('id').range(from, to),
  );
}

export async function getDues(supabase: SupabaseClient, planId: string, period: string) {
  return fetchAll<Due>((from, to) =>
    supabase
      .from('fund_dues')
      .select('id, house_id, status, amount_due, paid_amount, due_date, period')
      .eq('fund_plan_id', planId)
      .eq('period', period)
      .order('id')
      .range(from, to),
  );
}

export function natural(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true });
}

/** Group houses Block → Gali → houses, naturally sorted. */
export function groupHouses(houses: House[]) {
  const blocks = new Map<string, Map<string, House[]>>();
  for (const h of houses) {
    if (!blocks.has(h.block)) blocks.set(h.block, new Map());
    const streets = blocks.get(h.block)!;
    if (!streets.has(h.street)) streets.set(h.street, []);
    streets.get(h.street)!.push(h);
  }
  return Array.from(blocks.entries())
    .sort((a, b) => natural(a[0], b[0]))
    .map(([block, streets]) => ({
      block,
      streets: Array.from(streets.entries())
        .sort((a, b) => natural(a[0], b[0]))
        .map(([street, hs]) => ({ street, houses: hs.sort((a, b) => natural(a.house_no, b.house_no)) })),
    }));
}
