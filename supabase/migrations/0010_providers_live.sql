-- =====================================================================
-- 0010  Providers go live at once + chairman can verify his society's providers
--  * a new provider / dukaan shows in its category straight away
--    ("Naya" badge until verified); suspended / rejected stay hidden
--  * orders allowed to new (pending) providers too
--  * society admins see and verify / suspend providers who serve their society
-- Run after 0009. Safe to run more than once.
-- =====================================================================

drop policy if exists providers_select on public.providers;
create policy providers_select on public.providers for select to anon, authenticated
  using (status in ('verified','pending')
         or user_id = auth.uid()
         or public.is_super_admin()
         or exists (select 1 from provider_societies ps where ps.provider_id = providers.id and public.is_society_admin(ps.society_id)));

-- status can only change through the RPC below (or by super admin)
create or replace function public.providers_protect() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_super_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.rating_avg := 0; new.rating_count := 0;
  else
    if coalesce(current_setting('app.provider_status', true), '') <> '1' then
      new.status := old.status;
    end if;
    if coalesce(current_setting('app.rating_update', true), '') <> '1' then
      new.rating_avg := old.rating_avg; new.rating_count := old.rating_count;
    end if;
  end if;
  return new;
end $$;

create or replace function public.set_provider_status(p_provider uuid, p_status text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('verified','suspended','rejected','pending') then raise exception 'ghalat status'; end if;
  if not (public.is_super_admin() or exists (
            select 1 from provider_societies ps where ps.provider_id = p_provider and public.is_society_admin(ps.society_id))) then
    raise exception 'not allowed';
  end if;
  perform set_config('app.provider_status', '1', true);
  update providers set status = p_status where id = p_provider;
  perform set_config('app.provider_status', '', true);
  return p_status;
end $$;
revoke execute on function public.set_provider_status(uuid, text) from public, anon;
grant execute on function public.set_provider_status(uuid, text) to authenticated;

create or replace function public.service_orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where id = new.provider_id;
  if not found or pr.status not in ('verified','pending') then raise exception 'provider not available'; end if;
  if pr.user_id = auth.uid() then raise exception 'apne aap ko order nahi'; end if;
  new.customer_id := coalesce(auth.uid(), new.customer_id);
  select full_name, phone into new.customer_name, new.customer_phone from profiles where id = new.customer_id;
  new.status := 'new'; new.amount := null; new.customer_confirmed := false;
  new.accepted_at := null; new.done_at := null; new.cancelled_at := null; new.cancelled_by := null;
  new.ref_no := 'OR-' || lpad(nextval('service_order_seq')::text, 5, '0');
  return new;
end $$;

-- who should hear about a new provider: admins of the societies they picked + super admins
create or replace function public.provider_alert_recipients(p_provider uuid)
returns table (user_id uuid) language sql stable security definer set search_path = public as $$
  select distinct m.user_id from provider_societies ps join society_members m on m.society_id = ps.society_id and m.role = 'admin'
   where ps.provider_id = p_provider
  union
  select distinct s.chairman_user_id from provider_societies ps join societies s on s.id = ps.society_id
   where ps.provider_id = p_provider and s.chairman_user_id is not null
  union
  select id from profiles where is_super_admin
$$;
revoke execute on function public.provider_alert_recipients(uuid) from public, anon, authenticated;

-- society admins of a society (for "naya ghar request" alerts)
create or replace function public.society_admin_ids(sid uuid)
returns table (user_id uuid) language sql stable security definer set search_path = public as $$
  select user_id from society_members where society_id = sid and role = 'admin'
  union select chairman_user_id from societies where id = sid and chairman_user_id is not null
$$;
revoke execute on function public.society_admin_ids(uuid) from public, anon, authenticated;
grant execute on function public.provider_alert_recipients(uuid) to service_role;
grant execute on function public.society_admin_ids(uuid) to service_role;
