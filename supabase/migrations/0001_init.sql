-- =====================================================================
-- SocietyHub — initial schema
-- Modules: 1) Society + Development Fund, 2) Home Services, 3) Property
-- Run in Supabase SQL editor (or `supabase db push`).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- PROFILES (one row per auth user, created automatically on signup)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,                       -- digits only, e.g. 923001234567
  whatsapp_opt_in boolean not null default true,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MODULE 1: SOCIETY + FUND
-- ---------------------------------------------------------------------
create table public.society_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  society_name text not null,
  city text not null,
  address text not null,
  map_url text,
  total_houses int,
  president_name text,
  admin_name text not null,
  admin_phone text not null,
  email text,
  registration_no text,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  society_id uuid,
  created_at timestamptz not null default now()
);

create table public.societies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  city text not null,
  address text,
  total_houses int,
  status text not null default 'active' check (status in ('active','suspended')),
  reminder_offsets int[] not null default '{-3,0,3,7}',   -- days relative to due date
  created_at timestamptz not null default now()
);

alter table public.society_requests
  add constraint society_requests_society_fk foreign key (society_id) references public.societies(id) on delete set null;

create table public.society_members (
  society_id uuid not null references public.societies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','collector')),
  created_at timestamptz not null default now(),
  primary key (society_id, user_id)
);

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  block text not null default '',
  street text not null,
  house_no text not null,
  plot_size text,
  occupancy text not null default 'owner' check (occupancy in ('owner','rented','vacant','construction')),
  fund_exempt boolean not null default false,
  created_at timestamptz not null default now(),
  unique (society_id, block, street, house_no)
);
create index houses_society_idx on public.houses(society_id);

create table public.house_owners (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null, -- null until owner logs in
  owner_name text not null,
  owner_phone text not null,              -- digits only
  whatsapp_opt_in boolean not null default true,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index house_owners_one_verified on public.house_owners(house_id) where status = 'verified';
create unique index house_owners_user_house on public.house_owners(house_id, user_id) where user_id is not null;
create index house_owners_phone_idx on public.house_owners(owner_phone);

create table public.fund_plans (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  frequency text not null check (frequency in ('monthly','quarterly','yearly','one_time')),
  due_day int not null default 10 check (due_day between 1 and 28),
  start_date date not null default current_date,
  late_fee numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.fund_dues (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  fund_plan_id uuid not null references public.fund_plans(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  period text not null,                    -- 2026-10 | 2026-Q4 | 2026 | ONCE
  amount_due numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid','exempt')),
  created_at timestamptz not null default now(),
  unique (fund_plan_id, house_id, period)
);
create index fund_dues_society_idx on public.fund_dues(society_id, period);
create index fund_dues_due_date_idx on public.fund_dues(due_date) where status in ('unpaid','partial');

create sequence public.receipt_seq start 1001;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  fund_due_id uuid not null references public.fund_dues(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('cash','bank','jazzcash','easypaisa','online')),
  reference text,
  proof_path text,                         -- private-docs bucket
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  receipt_no text,
  entered_by uuid references public.profiles(id),
  verified_by uuid references public.profiles(id),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index payments_society_idx on public.payments(society_id, status);

create table public.messages_log (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade,
  house_id uuid references public.houses(id) on delete set null,
  fund_due_id uuid references public.fund_dues(id) on delete set null,
  to_phone text not null,
  channel text not null default 'whatsapp',
  kind text not null,                      -- reminder | receipt | notice
  offset_days int,
  template text,
  status text not null,                    -- sent | failed | skipped
  error text,
  provider_message_id text,
  created_at timestamptz not null default now()
);
create unique index messages_log_reminder_once
  on public.messages_log(fund_due_id, to_phone, offset_days)
  where kind = 'reminder' and status = 'sent';

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MODULE 2: HOME SERVICES
-- ---------------------------------------------------------------------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ur text,
  grp text not null default 'Other',
  icon text,
  sort int not null default 100,
  active boolean not null default true
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null default auth.uid() references public.profiles(id) on delete cascade,
  display_name text not null,
  phone text not null,
  whatsapp text,
  photo_path text,                          -- public-media bucket
  cnic_front_path text,                     -- private-docs bucket
  cnic_back_path text,
  bio text,
  experience_years int,
  rate_note text,
  city text not null,
  area_note text,
  status text not null default 'pending' check (status in ('pending','verified','suspended','rejected')),
  available boolean not null default true,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.provider_categories (
  provider_id uuid not null references public.providers(id) on delete cascade,
  category_id uuid not null references public.service_categories(id) on delete cascade,
  primary key (provider_id, category_id)
);

create table public.provider_societies (
  provider_id uuid not null references public.providers(id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  primary key (provider_id, society_id)
);

create table public.contact_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  provider_id uuid references public.providers(id) on delete cascade,
  listing_id uuid,
  kind text not null check (kind in ('call','whatsapp','view')),
  created_at timestamptz not null default now()
);
create index contact_events_provider_idx on public.contact_events(provider_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (provider_id, user_id)
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete cascade,
  listing_id uuid,
  reason text not null,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MODULE 3: PROPERTY
-- ---------------------------------------------------------------------
create table public.property_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  society_id uuid references public.societies(id) on delete set null,
  house_id uuid references public.houses(id) on delete set null,
  listing_type text not null check (listing_type in ('rent','sale')),
  title text not null,
  city text not null,
  area_text text,
  plot_size text,
  bedrooms int,
  bathrooms int,
  portion text check (portion in ('full','upper','lower','room')),
  furnished text check (furnished in ('furnished','semi','unfurnished')),
  price numeric(14,2) not null check (price >= 0),
  advance numeric(14,2),
  available_from date,
  description text,
  contact_phone text not null,
  show_phone boolean not null default true,
  society_verified boolean not null default false,
  status text not null default 'active' check (status in ('active','rented','sold','hidden')),
  views int not null default 0,
  created_at timestamptz not null default now()
);
create index property_listings_search_idx on public.property_listings(status, listing_type, city);

alter table public.contact_events
  add constraint contact_events_listing_fk foreign key (listing_id) references public.property_listings(id) on delete cascade;
alter table public.complaints
  add constraint complaints_listing_fk foreign key (listing_id) references public.property_listings(id) on delete cascade;

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  path text not null,                       -- public-media bucket
  sort int not null default 0
);

create table public.saved_listings (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- =====================================================================
-- HELPER FUNCTIONS (security definer so RLS policies can call them)
-- =====================================================================
create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_super_admin from profiles where id = auth.uid()), false)
$$;

create or replace function public.is_society_staff(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_super_admin()
      or exists (select 1 from society_members where society_id = sid and user_id = auth.uid())
$$;

create or replace function public.is_society_admin(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_super_admin()
      or exists (select 1 from society_members where society_id = sid and user_id = auth.uid() and role = 'admin')
$$;

create or replace function public.owns_house(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from house_owners
                 where house_id = hid and user_id = auth.uid() and status = 'verified')
$$;

create or replace function public.is_society_resident(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from house_owners ho join houses h on h.id = ho.house_id
                 where h.society_id = sid and ho.user_id = auth.uid() and ho.status = 'verified')
$$;

create or replace function public.owns_provider(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from providers where id = pid and user_id = auth.uid())
$$;

create or replace function public.owns_listing(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from property_listings where id = lid and owner_id = auth.uid())
$$;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- New auth user → profile row; link any owner records the society admin
-- created earlier with the same phone number.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone)
  on conflict (id) do nothing;
  if new.phone is not null then
    update public.house_owners set user_id = new.id
     where owner_phone = new.phone and user_id is null;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recalculate a due's paid amount + status from verified payments.
create or replace function public.recalc_due(p_due uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_paid numeric; v_due fund_dues;
begin
  select * into v_due from fund_dues where id = p_due;
  if not found then return; end if;
  select coalesce(sum(amount), 0) into v_paid from payments
   where fund_due_id = p_due and status = 'verified';
  update fund_dues set
    paid_amount = v_paid,
    status = case
      when v_due.status = 'exempt' then 'exempt'
      when v_paid >= v_due.amount_due then 'paid'
      when v_paid > 0 then 'partial'
      else 'unpaid' end
  where id = p_due;
end $$;

create or replace function public.payments_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_due(old.fund_due_id);
    return old;
  end if;
  perform public.recalc_due(new.fund_due_id);
  return new;
end $$;

create trigger payments_recalc
  after insert or update or delete on public.payments
  for each row execute function public.payments_after_change();

-- Assign receipt number when a payment becomes verified; only staff may
-- set verified status (owners can only submit 'pending').
create or replace function public.payments_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_society_staff(new.society_id) then
    if tg_op = 'INSERT' then
      new.status := 'pending';
    else
      new.status := old.status;
    end if;
  end if;
  if new.status = 'verified' and new.receipt_no is null then
    new.receipt_no := 'R-' || nextval('public.receipt_seq');
    if new.verified_by is null then new.verified_by := auth.uid(); end if;
  end if;
  -- keep society_id / house_id consistent with the due
  select society_id, house_id into new.society_id, new.house_id
    from public.fund_dues where id = new.fund_due_id;
  return new;
end $$;

create trigger payments_before
  before insert or update on public.payments
  for each row execute function public.payments_before_write();

-- Providers: only super admin may change status; ratings only via review trigger.
create or replace function public.providers_protect() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_super_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.rating_avg := 0; new.rating_count := 0;
  else
    new.status := old.status;
    if coalesce(current_setting('app.rating_update', true), '') <> '1' then
      new.rating_avg := old.rating_avg; new.rating_count := old.rating_count;
    end if;
  end if;
  return new;
end $$;

create trigger providers_protect
  before insert or update on public.providers
  for each row execute function public.providers_protect();

create or replace function public.reviews_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.provider_id, old.provider_id);
begin
  perform set_config('app.rating_update', '1', true);
  update providers p set
    rating_avg = coalesce((select round(avg(stars)::numeric, 2) from reviews where provider_id = pid), 0),
    rating_count = (select count(*) from reviews where provider_id = pid)
  where p.id = pid;
  perform set_config('app.rating_update', '', true);
  return null;
end $$;

create trigger reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_after_change();

-- Listings: society_verified is computed, never set by the client.
create or replace function public.listings_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.house_id is not null then
    new.society_verified := exists (
      select 1 from house_owners ho
       where ho.house_id = new.house_id and ho.user_id = new.owner_id and ho.status = 'verified');
    select society_id into new.society_id from houses where id = new.house_id;
  else
    new.society_verified := false;
  end if;
  if tg_op = 'UPDATE' and auth.uid() is not null
     and not public.is_super_admin() and new.owner_id <> old.owner_id then
    new.owner_id := old.owner_id;
  end if;
  return new;
end $$;

create trigger listings_before
  before insert or update on public.property_listings
  for each row execute function public.listings_before_write();

-- =====================================================================
-- RPC FUNCTIONS
-- =====================================================================

-- Create the due rows for one plan for the period containing p_ref.
create or replace function public.generate_dues(p_plan uuid, p_ref date default current_date)
returns int language plpgsql security definer set search_path = public as $$
declare
  pl fund_plans; v_period text; v_due date; v_y int; v_m int; v_q int; n int;
begin
  select * into pl from fund_plans where id = p_plan;
  if not found or not pl.active then return 0; end if;
  if auth.uid() is not null and not public.is_society_staff(pl.society_id) then
    raise exception 'not allowed';
  end if;
  if p_ref < date_trunc('month', pl.start_date)::date then return 0; end if;

  v_y := extract(year from p_ref)::int;
  v_m := extract(month from p_ref)::int;

  if pl.frequency = 'monthly' then
    v_period := to_char(p_ref, 'YYYY-MM');
    v_due := make_date(v_y, v_m, pl.due_day);
  elsif pl.frequency = 'quarterly' then
    v_q := (v_m - 1) / 3;
    v_period := v_y || '-Q' || (v_q + 1);
    v_due := make_date(v_y, v_q * 3 + 1, pl.due_day);
  elsif pl.frequency = 'yearly' then
    v_period := v_y::text;
    v_due := make_date(v_y, extract(month from pl.start_date)::int, pl.due_day);
  else
    v_period := 'ONCE';
    v_due := make_date(extract(year from pl.start_date)::int,
                       extract(month from pl.start_date)::int, pl.due_day);
  end if;

  insert into fund_dues (society_id, fund_plan_id, house_id, period, amount_due, due_date, status)
  select pl.society_id, pl.id, h.id, v_period, pl.amount, v_due,
         case when h.fund_exempt then 'exempt' else 'unpaid' end
    from houses h where h.society_id = pl.society_id
  on conflict (fund_plan_id, house_id, period) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- Super admin approves a society request → creates society + makes requester admin.
create or replace function public.approve_society_request(p_request uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare r society_requests; sid uuid; base_slug text; v_slug text; i int := 1;
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

  insert into societies (name, slug, city, address, total_houses)
  values (r.society_name, v_slug, r.city, r.address, r.total_houses)
  returning id into sid;

  insert into society_members (society_id, user_id, role) values (sid, r.requester_id, 'admin');

  update society_requests
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), society_id = sid
   where id = p_request;
  return sid;
end $$;

-- Bulk create houses: streets a..b × houses x..y within one block.
create or replace function public.bulk_create_houses(
  p_society uuid, p_block text, p_street_from int, p_street_to int,
  p_house_from int, p_house_to int, p_plot_size text default null)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_society_admin(p_society) then raise exception 'not allowed'; end if;
  if (p_street_to - p_street_from + 1) * (p_house_to - p_house_from + 1) > 10000 then
    raise exception 'too many houses in one go (max 10000)';
  end if;
  insert into houses (society_id, block, street, house_no, plot_size)
  select p_society, coalesce(p_block, ''), s::text, h::text, p_plot_size
    from generate_series(p_street_from, p_street_to) s,
         generate_series(p_house_from, p_house_to) h
  on conflict (society_id, block, street, house_no) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- Distinct block/street pairs of a society (for the "claim your house" picker).
create or replace function public.house_streets(p_society uuid)
returns table (block text, street text) language sql stable security definer set search_path = public as $$
  select distinct h.block, h.street from houses h where h.society_id = p_society
$$;

-- Public view count bump (no direct UPDATE rights needed).
create or replace function public.bump_listing_view(p_listing uuid) returns void
language sql security definer set search_path = public as $$
  update property_listings set views = views + 1 where id = p_listing and status = 'active'
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.society_requests enable row level security;
alter table public.societies enable row level security;
alter table public.society_members enable row level security;
alter table public.houses enable row level security;
alter table public.house_owners enable row level security;
alter table public.fund_plans enable row level security;
alter table public.fund_dues enable row level security;
alter table public.payments enable row level security;
alter table public.messages_log enable row level security;
alter table public.notices enable row level security;
alter table public.service_categories enable row level security;
alter table public.providers enable row level security;
alter table public.provider_categories enable row level security;
alter table public.provider_societies enable row level security;
alter table public.contact_events enable row level security;
alter table public.reviews enable row level security;
alter table public.complaints enable row level security;
alter table public.property_listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.saved_listings enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin()
         or exists (select 1 from society_members m where m.user_id = profiles.id and public.is_society_staff(m.society_id)));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, whatsapp_opt_in) on public.profiles to authenticated;

-- society_requests
create policy sreq_insert on public.society_requests for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
create policy sreq_select on public.society_requests for select to authenticated
  using (requester_id = auth.uid() or public.is_super_admin());
create policy sreq_update on public.society_requests for update to authenticated
  using (public.is_super_admin());

-- societies (public directory)
create policy societies_select on public.societies for select to anon, authenticated
  using (status = 'active' or public.is_society_staff(id));
create policy societies_update on public.societies for update to authenticated
  using (public.is_society_admin(id)) with check (public.is_society_admin(id));
create policy societies_insert on public.societies for insert to authenticated
  with check (public.is_super_admin());

-- society_members
create policy members_select on public.society_members for select to authenticated
  using (user_id = auth.uid() or public.is_society_staff(society_id));
create policy members_write on public.society_members for all to authenticated
  using (public.is_society_admin(society_id)) with check (public.is_society_admin(society_id));

-- houses (numbers are not sensitive; residents need them to claim)
create policy houses_select on public.houses for select to authenticated using (true);
create policy houses_write on public.houses for all to authenticated
  using (public.is_society_admin(society_id)) with check (public.is_society_admin(society_id));

-- house_owners
create policy owners_select on public.house_owners for select to authenticated
  using (user_id = auth.uid()
         or public.is_society_staff((select society_id from houses where id = house_id)));
create policy owners_self_claim on public.house_owners for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy owners_staff_insert on public.house_owners for insert to authenticated
  with check (public.is_society_staff((select society_id from houses where id = house_id)));
create policy owners_staff_update on public.house_owners for update to authenticated
  using (public.is_society_staff((select society_id from houses where id = house_id)));
create policy owners_staff_delete on public.house_owners for delete to authenticated
  using (public.is_society_admin((select society_id from houses where id = house_id)));

-- fund_plans
create policy plans_select on public.fund_plans for select to authenticated
  using (public.is_society_staff(society_id) or public.is_society_resident(society_id));
create policy plans_write on public.fund_plans for all to authenticated
  using (public.is_society_admin(society_id)) with check (public.is_society_admin(society_id));

-- fund_dues
create policy dues_select on public.fund_dues for select to authenticated
  using (public.is_society_staff(society_id) or public.owns_house(house_id));
create policy dues_write on public.fund_dues for all to authenticated
  using (public.is_society_staff(society_id)) with check (public.is_society_staff(society_id));

-- payments
create policy payments_select on public.payments for select to authenticated
  using (public.is_society_staff(society_id) or public.owns_house(house_id));
create policy payments_owner_insert on public.payments for insert to authenticated
  with check (public.owns_house(house_id) and status = 'pending');
create policy payments_staff_insert on public.payments for insert to authenticated
  with check (public.is_society_staff(society_id));
create policy payments_staff_update on public.payments for update to authenticated
  using (public.is_society_staff(society_id));

-- messages_log (written by server with service role)
create policy messages_select on public.messages_log for select to authenticated
  using (public.is_society_staff(society_id));

-- notices
create policy notices_select on public.notices for select to authenticated
  using (public.is_society_staff(society_id) or public.is_society_resident(society_id));
create policy notices_write on public.notices for all to authenticated
  using (public.is_society_admin(society_id)) with check (public.is_society_admin(society_id));

-- service_categories
create policy cats_select on public.service_categories for select to anon, authenticated using (true);
create policy cats_write on public.service_categories for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- providers
create policy providers_select on public.providers for select to anon, authenticated
  using (status = 'verified' or user_id = auth.uid() or public.is_super_admin());
create policy providers_insert on public.providers for insert to authenticated
  with check (user_id = auth.uid());
create policy providers_update on public.providers for update to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

create policy pcats_select on public.provider_categories for select to anon, authenticated using (true);
create policy pcats_write on public.provider_categories for all to authenticated
  using (public.owns_provider(provider_id) or public.is_super_admin())
  with check (public.owns_provider(provider_id) or public.is_super_admin());

create policy psoc_select on public.provider_societies for select to anon, authenticated using (true);
create policy psoc_write on public.provider_societies for all to authenticated
  using (public.owns_provider(provider_id) or public.is_super_admin())
  with check (public.owns_provider(provider_id) or public.is_super_admin());

-- contact_events
create policy contacts_insert on public.contact_events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy contacts_select on public.contact_events for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin()
         or (provider_id is not null and public.owns_provider(provider_id))
         or (listing_id is not null and public.owns_listing(listing_id)));

-- reviews: only someone who actually contacted the provider
create policy reviews_select on public.reviews for select to anon, authenticated using (true);
create policy reviews_insert on public.reviews for insert to authenticated
  with check (user_id = auth.uid()
              and exists (select 1 from contact_events c
                          where c.user_id = auth.uid() and c.provider_id = reviews.provider_id
                            and c.kind in ('call','whatsapp')));
create policy reviews_update on public.reviews for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_delete on public.reviews for delete to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

-- complaints
create policy complaints_insert on public.complaints for insert to authenticated
  with check (reporter_id = auth.uid());
create policy complaints_select on public.complaints for select to authenticated
  using (reporter_id = auth.uid() or public.is_super_admin());
create policy complaints_update on public.complaints for update to authenticated
  using (public.is_super_admin());

-- property_listings
create policy listings_select on public.property_listings for select to anon, authenticated
  using (status in ('active','rented','sold') or owner_id = auth.uid() or public.is_super_admin()
         or (society_id is not null and public.is_society_admin(society_id)));
create policy listings_insert on public.property_listings for insert to authenticated
  with check (owner_id = auth.uid());
create policy listings_update on public.property_listings for update to authenticated
  using (owner_id = auth.uid() or public.is_super_admin()
         or (society_id is not null and public.is_society_admin(society_id)));
create policy listings_delete on public.property_listings for delete to authenticated
  using (owner_id = auth.uid() or public.is_super_admin());

create policy photos_select on public.listing_photos for select to anon, authenticated using (true);
create policy photos_write on public.listing_photos for all to authenticated
  using (public.owns_listing(listing_id)) with check (public.owns_listing(listing_id));

create policy saved_all on public.saved_listings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- RPC permissions
revoke execute on function public.generate_dues(uuid, date) from public, anon;
revoke execute on function public.approve_society_request(uuid) from public, anon;
revoke execute on function public.bulk_create_houses(uuid, text, int, int, int, int, text) from public, anon;
revoke execute on function public.recalc_due(uuid) from public, anon, authenticated;
grant execute on function public.generate_dues(uuid, date) to authenticated;
grant execute on function public.approve_society_request(uuid) to authenticated;
grant execute on function public.bulk_create_houses(uuid, text, int, int, int, int, text) to authenticated;
grant execute on function public.bump_listing_view(uuid) to anon, authenticated;
grant execute on function public.house_streets(uuid) to authenticated;
