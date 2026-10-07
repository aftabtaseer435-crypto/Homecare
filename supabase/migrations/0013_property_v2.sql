-- =====================================================================
-- 0013  Property v2 — sale and rent as two separate systems
--  * full details for both deals (type, size, features, ownership, rent terms…)
--  * property_wants: buyers / tenants post what they need ("demand")
--  * public seller profile (name, photo, member since, listings)
--  * leads per listing (calls / WhatsApp) for the owner's dashboard
-- Run after 0012. Safe to run more than once.
-- =====================================================================

alter table public.property_listings
  add column if not exists property_type text not null default 'house',
  add column if not exists area_value numeric(10,2),
  add column if not exists area_unit text,
  add column if not exists covered_sqft int,
  add column if not exists floors int,
  add column if not exists kitchens int,
  add column if not exists parking int,
  add column if not exists facing text,
  add column if not exists corner boolean not null default false,
  add column if not exists park_facing boolean not null default false,
  add column if not exists main_road boolean not null default false,
  add column if not exists year_built int,
  add column if not exists features text[] not null default '{}',
  add column if not exists utilities text[] not null default '{}',
  add column if not exists address_line text,
  add column if not exists map_url text,
  -- sale
  add column if not exists negotiable boolean not null default true,
  add column if not exists ownership text,
  add column if not exists possession text,
  add column if not exists installments boolean not null default false,
  add column if not exists installment_note text,
  add column if not exists documents_clear boolean,
  -- rent
  add column if not exists advance_months int,
  add column if not exists min_lease_months int,
  add column if not exists tenant_pref text,
  add column if not exists bills_included boolean not null default false,
  add column if not exists maintenance numeric(12,0),
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.property_listings add constraint pl_type_chk
    check (property_type in ('house','portion','flat','room','plot','shop','office','farmhouse'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.property_listings add constraint pl_unit_chk check (area_unit is null or area_unit in ('marla','kanal','sqft','sqyd'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.property_listings add constraint pl_tenant_chk check (tenant_pref is null or tenant_pref in ('family','bachelor','female','any'));
exception when duplicate_object then null; end $$;
create index if not exists property_listings_type_idx on public.property_listings(listing_type, status, property_type, created_at desc);

-- ------------------------------------------------------------- demands (buyers / tenants)
create table if not exists public.property_wants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  want_type text not null check (want_type in ('buy','rent')),
  property_type text not null default 'house',
  city text not null,
  area_text text,
  society_id uuid references public.societies(id) on delete set null,
  min_budget numeric(14,0),
  max_budget numeric(14,0),
  bedrooms int,
  size_text text,
  needed_by date,
  details text,
  contact_phone text not null,
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now()
);
create index if not exists property_wants_idx on public.property_wants(want_type, status, created_at desc);
alter table public.property_wants enable row level security;
drop policy if exists pw_select on public.property_wants;
create policy pw_select on public.property_wants for select to anon, authenticated
  using (status = 'active' or user_id = auth.uid() or public.is_super_admin());
drop policy if exists pw_write on public.property_wants;
create policy pw_write on public.property_wants for all to authenticated
  using (user_id = auth.uid() or public.is_super_admin()) with check (user_id = auth.uid() or public.is_super_admin());

-- contact on a demand is logged too (who called whom)
alter table public.contact_events add column if not exists want_id uuid references public.property_wants(id) on delete cascade;

-- ------------------------------------------------------------- public seller profile
create or replace function public.property_seller(uid uuid)
returns table (full_name text, avatar_path text, member_since timestamptz, active_sale bigint, active_rent bigint, closed bigint, verified bigint)
language sql stable security definer set search_path = public as $$
  select p.full_name, p.avatar_path, p.created_at,
    (select count(*) from property_listings where owner_id = uid and status = 'active' and listing_type = 'sale'),
    (select count(*) from property_listings where owner_id = uid and status = 'active' and listing_type = 'rent'),
    (select count(*) from property_listings where owner_id = uid and status in ('sold','rented')),
    (select count(*) from property_listings where owner_id = uid and society_verified)
  from profiles p
  where p.id = uid and exists (select 1 from property_listings where owner_id = uid and status in ('active','sold','rented'))
$$;
grant execute on function public.property_seller(uuid) to anon, authenticated;

-- names of the people behind listings / demands (no phone numbers)
create or replace function public.public_names(ids uuid[])
returns table (id uuid, full_name text, avatar_path text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_path from profiles p
   where p.id = any(ids)
     and (exists (select 1 from property_listings l where l.owner_id = p.id and l.status in ('active','sold','rented'))
          or exists (select 1 from property_wants w where w.user_id = p.id and w.status = 'active'))
$$;
grant execute on function public.public_names(uuid[]) to anon, authenticated;

-- owner's leads per listing
create or replace function public.listing_leads(p_owner uuid)
returns table (listing_id uuid, calls bigint, whatsapp bigint)
language sql stable security definer set search_path = public as $$
  select c.listing_id, count(*) filter (where c.kind = 'call'), count(*) filter (where c.kind = 'whatsapp')
    from contact_events c join property_listings l on l.id = c.listing_id
   where l.owner_id = p_owner and p_owner = auth.uid()
   group by c.listing_id
$$;
revoke execute on function public.listing_leads(uuid) from public, anon;
grant execute on function public.listing_leads(uuid) to authenticated;

-- ------------------------------------------------------------- tell the owner when someone calls / WhatsApps
create or replace function public.trg_notify_property_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare o uuid; t text; who text; via text;
begin
  if new.kind not in ('call','whatsapp') then return new; end if;
  via := case when new.kind = 'call' then 'call' else 'WhatsApp' end;
  select coalesce(full_name, 'Koi') into who from profiles where id = new.user_id;
  who := coalesce(who, 'Koi');
  if new.listing_id is not null then
    select owner_id, title into o, t from property_listings where id = new.listing_id;
    perform notify_users(array[o], 'property', who || ' ne aap ki listing par ' || via || ' kiya', t, '/my/listings', new.user_id);
  elsif new.want_id is not null then
    select user_id, case when want_type = 'buy' then 'Khareedne ki demand' else 'Kiraye ki demand' end || ' — ' || city into o, t from property_wants where id = new.want_id;
    perform notify_users(array[o], 'property', who || ' ne aap ki demand par ' || via || ' kiya', t, '/my/listings?tab=wants', new.user_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_property_contact on public.contact_events;
create trigger notify_property_contact after insert on public.contact_events
  for each row execute function public.trg_notify_property_contact();
grant select, insert, update, delete on public.property_wants to authenticated; grant select on public.property_wants to anon;
