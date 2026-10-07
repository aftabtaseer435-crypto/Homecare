-- =====================================================================
-- 0008  Kharidar ↔ provider orders, monthly stats + audit fixes
--  * service_orders: customer sends an order / work request to a provider;
--    provider accepts → done (with bill); customer can cancel or confirm
--    "mil gaya". All status changes go through order_action().
--  * provider_monthly_stats(): calls, WhatsApp, views, orders, earnings per month
--  * reviews allowed after a completed order too
--  * fixes: re-request after rejection, approved society gets the named
--    admin, agent can log a masle ka kharcha even if area changed
-- Run after 0007. Safe to run more than once.
-- =====================================================================

create sequence if not exists public.service_order_seq;

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  ref_no text unique,
  provider_id uuid not null references public.providers(id) on delete cascade,
  customer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  details text not null check (length(details) between 2 and 1500),
  address text,
  when_note text,
  customer_name text,
  customer_phone text,
  status text not null default 'new' check (status in ('new','accepted','done','cancelled')),
  amount numeric(12,0) check (amount is null or amount >= 0),
  cancelled_by text check (cancelled_by in ('customer','provider')),
  cancel_reason text,
  customer_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  done_at timestamptz,
  cancelled_at timestamptz
);
create index if not exists service_orders_provider on public.service_orders(provider_id, created_at desc);
create index if not exists service_orders_customer on public.service_orders(customer_id, created_at desc);
alter table public.service_orders enable row level security;

create or replace function public.service_orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where id = new.provider_id;
  if not found or pr.status <> 'verified' then raise exception 'provider not available'; end if;
  if pr.user_id = auth.uid() then raise exception 'apne aap ko order nahi'; end if;
  new.customer_id := coalesce(auth.uid(), new.customer_id);
  select full_name, phone into new.customer_name, new.customer_phone from profiles where id = new.customer_id;
  new.status := 'new'; new.amount := null; new.customer_confirmed := false;
  new.accepted_at := null; new.done_at := null; new.cancelled_at := null; new.cancelled_by := null;
  new.ref_no := 'OR-' || lpad(nextval('service_order_seq')::text, 5, '0');
  return new;
end $$;
drop trigger if exists service_orders_bi on public.service_orders;
create trigger service_orders_bi before insert on public.service_orders
  for each row execute function public.service_orders_before_insert();

drop policy if exists so_select on public.service_orders;
create policy so_select on public.service_orders for select to authenticated
  using (customer_id = auth.uid() or public.owns_provider(provider_id) or public.is_super_admin());
drop policy if exists so_insert on public.service_orders;
create policy so_insert on public.service_orders for insert to authenticated
  with check (customer_id = auth.uid());
-- no direct update/delete: use order_action()

create or replace function public.order_action(p_order uuid, p_action text, p_amount numeric default null, p_reason text default null)
returns text language plpgsql security definer set search_path = public as $$
declare o service_orders; is_provider boolean; is_customer boolean;
begin
  select * into o from service_orders where id = p_order for update;
  if not found then raise exception 'order nahi mila'; end if;
  is_provider := public.owns_provider(o.provider_id);
  is_customer := o.customer_id = auth.uid();
  if p_amount is not null and p_amount < 0 then raise exception 'amount ghalat'; end if;

  if p_action = 'accept' and is_provider and o.status = 'new' then
    update service_orders set status = 'accepted', accepted_at = now() where id = p_order;
  elsif p_action = 'done' and is_provider and o.status in ('new','accepted') then
    update service_orders set status = 'done', done_at = now(), accepted_at = coalesce(accepted_at, now()),
           amount = coalesce(p_amount, amount) where id = p_order;
  elsif p_action = 'received' and is_customer and o.status in ('new','accepted','done') then
    update service_orders set status = 'done', customer_confirmed = true, done_at = coalesce(done_at, now()),
           amount = coalesce(amount, p_amount) where id = p_order;
  elsif p_action = 'cancel' and is_provider and o.status in ('new','accepted') then
    update service_orders set status = 'cancelled', cancelled_by = 'provider', cancelled_at = now(),
           cancel_reason = nullif(trim(p_reason), '') where id = p_order;
  elsif p_action = 'cancel' and is_customer and o.status in ('new','accepted') then
    update service_orders set status = 'cancelled', cancelled_by = 'customer', cancelled_at = now(),
           cancel_reason = nullif(trim(p_reason), '') where id = p_order;
  else
    raise exception 'ye kaam abhi nahi ho sakta';
  end if;
  return (select status from service_orders where id = p_order);
end $$;
revoke execute on function public.order_action(uuid, text, numeric, text) from public, anon;
grant execute on function public.order_action(uuid, text, numeric, text) to authenticated;

-- Seller history: last N months
create or replace function public.provider_monthly_stats(pid uuid, months int default 6)
returns table (month text, calls bigint, whatsapp bigint, views bigint, orders bigint, done bigint, cancelled bigint, earnings numeric)
language sql stable security definer set search_path = public as $$
  with m as (
    select to_char(d, 'YYYY-MM') as month, d as start, d + interval '1 month' as stop
      from generate_series(date_trunc('month', now() at time zone 'Asia/Karachi') - ((least(greatest(months, 1), 24) - 1) || ' months')::interval,
                           date_trunc('month', now() at time zone 'Asia/Karachi'), interval '1 month') d
  )
  select m.month,
    (select count(*) from contact_events c where c.provider_id = pid and c.kind = 'call' and (c.created_at at time zone 'Asia/Karachi') >= m.start and (c.created_at at time zone 'Asia/Karachi') < m.stop),
    (select count(*) from contact_events c where c.provider_id = pid and c.kind = 'whatsapp' and (c.created_at at time zone 'Asia/Karachi') >= m.start and (c.created_at at time zone 'Asia/Karachi') < m.stop),
    (select count(*) from contact_events c where c.provider_id = pid and c.kind = 'view' and (c.created_at at time zone 'Asia/Karachi') >= m.start and (c.created_at at time zone 'Asia/Karachi') < m.stop),
    (select count(*) from service_orders o where o.provider_id = pid and (o.created_at at time zone 'Asia/Karachi') >= m.start and (o.created_at at time zone 'Asia/Karachi') < m.stop),
    (select count(*) from service_orders o where o.provider_id = pid and o.status = 'done' and (o.created_at at time zone 'Asia/Karachi') >= m.start and (o.created_at at time zone 'Asia/Karachi') < m.stop),
    (select count(*) from service_orders o where o.provider_id = pid and o.status = 'cancelled' and (o.created_at at time zone 'Asia/Karachi') >= m.start and (o.created_at at time zone 'Asia/Karachi') < m.stop),
    (select coalesce(sum(o.amount), 0) from service_orders o where o.provider_id = pid and o.status = 'done' and (o.created_at at time zone 'Asia/Karachi') >= m.start and (o.created_at at time zone 'Asia/Karachi') < m.stop)
  from m
  where public.owns_provider(pid) or public.is_super_admin()
  order by m.month desc
$$;
revoke execute on function public.provider_monthly_stats(uuid, int) from public, anon;
grant execute on function public.provider_monthly_stats(uuid, int) to authenticated;

-- Reviews: after a call / WhatsApp OR a completed order
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert to authenticated
  with check (user_id = auth.uid()
              and (exists (select 1 from contact_events c
                            where c.user_id = auth.uid() and c.provider_id = reviews.provider_id and c.kind in ('call','whatsapp'))
                   or exists (select 1 from service_orders o
                               where o.customer_id = auth.uid() and o.provider_id = reviews.provider_id and o.status = 'done')));

-- ------------------------------------------------------------- fix: re-request after rejection
drop index if exists public.house_owners_user_house;
create unique index house_owners_user_house on public.house_owners(house_id, user_id)
  where user_id is not null and status <> 'rejected';

-- ------------------------------------------------------------- fix: approved society gets the named admin + chairman
create or replace function public.approve_society_request(p_request uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare r society_requests; sid uuid; base_slug text; v_slug text; i int := 1; admin_user uuid;
begin
  if not public.is_super_admin() then raise exception 'not allowed'; end if;
  select * into r from society_requests where id = p_request for update;
  if not found or r.status <> 'pending' then raise exception 'request not pending'; end if;

  base_slug := trim(both '-' from regexp_replace(lower(r.society_name || '-' || r.city), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then base_slug := 'society'; end if;
  v_slug := base_slug;
  while exists (select 1 from societies where slug = v_slug) loop
    i := i + 1; v_slug := base_slug || '-' || i;
  end loop;

  insert into societies (name, slug, city, address, total_houses, map_url, chairman_name)
  values (r.society_name, v_slug, r.city, r.address, r.total_houses, r.map_url, nullif(trim(r.president_name), ''))
  returning id into sid;

  insert into society_members (society_id, user_id, role) values (sid, r.requester_id, 'admin')
  on conflict do nothing;

  -- the admin named on the form (if a different number) — now or on first login
  if r.admin_phone is not null then
    select id into admin_user from profiles where phone = r.admin_phone;
    if admin_user is not null then
      insert into society_members (society_id, user_id, role) values (sid, admin_user, 'admin') on conflict do nothing;
    else
      insert into society_member_invites (society_id, phone, name, role)
      values (sid, r.admin_phone, r.admin_name, 'admin') on conflict (society_id, phone) do nothing;
    end if;
  end if;

  update society_requests
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), society_id = sid
   where id = p_request;
  return sid;
end $$;

-- ------------------------------------------------------------- fix: assignee can log a masle ka kharcha
create or replace function public.fund_expense_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_society_admin(new.society_id) then
    if tg_op = 'INSERT' and new.status = 'approved' then
      new.approved_by := auth.uid(); new.approved_at := now();
    elsif tg_op = 'UPDATE' and new.status <> old.status then
      new.approved_by := auth.uid(); new.approved_at := now();
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if not (public.is_agent_for_area(new.society_id, coalesce(new.block, ''), new.street)
            or (new.issue_id is not null and exists (select 1 from welfare_issues w
                                                       where w.id = new.issue_id and w.assigned_to = auth.uid()))) then
      raise exception 'not allowed';
    end if;
    new.status := 'pending'; new.submitted_by := auth.uid();
    new.approved_by := null; new.approved_at := null;
    return new;
  end if;
  raise exception 'not allowed';
end $$;
