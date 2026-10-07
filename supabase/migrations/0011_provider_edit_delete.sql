-- =====================================================================
-- 0011  Provider edits go back to review + provider can delete profile
--  * any profile edit by the provider (not the busy/available switch)
--    sets status back to 'pending' → admin / chairman verifies again
--  * provider can delete own profile; customers keep their order history
--    (orders keep the shop name, provider link becomes empty)
-- Run after 0010. Safe to run more than once.
-- =====================================================================

alter table public.providers add column if not exists review_requested_at timestamptz;

create or replace function public.providers_protect() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_super_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.rating_avg := 0; new.rating_count := 0;
  else
    if coalesce(current_setting('app.provider_status', true), '') <> '1' then
      new.status := old.status;
      -- the owner edited the profile → needs review again (busy switch doesn't count)
      if new.review_requested_at is distinct from old.review_requested_at and old.status in ('verified', 'pending') then
        new.status := 'pending';
      end if;
    end if;
    if coalesce(current_setting('app.rating_update', true), '') <> '1' then
      new.rating_avg := old.rating_avg; new.rating_count := old.rating_count;
    end if;
  end if;
  return new;
end $$;

-- orders survive a deleted provider
alter table public.service_orders add column if not exists provider_name text;
update public.service_orders o set provider_name = p.display_name from public.providers p where p.id = o.provider_id and o.provider_name is null;
alter table public.service_orders alter column provider_id drop not null;
alter table public.service_orders drop constraint if exists service_orders_provider_id_fkey;
alter table public.service_orders add constraint service_orders_provider_id_fkey
  foreign key (provider_id) references public.providers(id) on delete set null;

create or replace function public.service_orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where id = new.provider_id;
  if not found or pr.status not in ('verified','pending') then raise exception 'provider not available'; end if;
  if pr.user_id = auth.uid() then raise exception 'apne aap ko order nahi'; end if;
  new.customer_id := coalesce(auth.uid(), new.customer_id);
  new.provider_name := pr.display_name;
  select full_name, phone into new.customer_name, new.customer_phone from profiles where id = new.customer_id;
  new.status := 'new'; new.amount := null; new.customer_confirmed := false;
  new.accepted_at := null; new.done_at := null; new.cancelled_at := null; new.cancelled_by := null;
  new.ref_no := 'OR-' || lpad(nextval('service_order_seq')::text, 5, '0');
  return new;
end $$;

-- open orders of a deleted provider are cancelled for the customer
create or replace function public.providers_before_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update service_orders set status = 'cancelled', cancelled_by = 'provider', cancelled_at = now(),
         cancel_reason = 'Provider ne profile band kar di'
   where provider_id = old.id and status in ('new','accepted');
  return old;
end $$;
drop trigger if exists providers_bd on public.providers;
create trigger providers_bd before delete on public.providers
  for each row execute function public.providers_before_delete();

drop policy if exists providers_delete on public.providers;
create policy providers_delete on public.providers for delete to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
