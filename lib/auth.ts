import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp_opt_in: boolean;
  is_super_admin: boolean;
};

export async function getSession() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, whatsapp_opt_in, is_super_admin')
    .eq('id', user.id)
    .single();
  return { supabase, user, profile: (profile as Profile) ?? null };
}

/** Requires login (and a name on the profile). */
export async function requireUser(next?: string) {
  const s = await getSession();
  if (!s.user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  if (!s.profile?.full_name) redirect(`/onboarding${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  return s as { supabase: typeof s.supabase; user: NonNullable<typeof s.user>; profile: Profile };
}

export async function requireSuperAdmin() {
  const s = await requireUser();
  if (!s.profile.is_super_admin) redirect('/dashboard');
  return s;
}

/** Society staff check. Returns role ('admin' | 'collector'); super admin counts as admin. */
export async function requireSocietyStaff(societyId: string, adminOnly = false) {
  const s = await requireUser(`/s/${societyId}`);
  let role: 'admin' | 'collector' | null = null;
  if (s.profile.is_super_admin) role = 'admin';
  else {
    const { data } = await s.supabase
      .from('society_members')
      .select('role')
      .eq('society_id', societyId)
      .eq('user_id', s.user.id)
      .maybeSingle();
    role = (data?.role as 'admin' | 'collector') ?? null;
  }
  if (!role || (adminOnly && role !== 'admin')) redirect('/dashboard');
  return { ...s, role };
}
