-- =====================================================================
-- 0006  Society hub page, chairman notices, tenants, profile photos
--  * societies get hub details (chairman, welfare committee, about, banner)
--  * society_projects: development work shown on the hub (street lights,
--    safai, roads …) with status and progress
--  * notices: only the chairman posts; event date; "hal ho gaya" resolves;
--    auto-hidden 24h after the event day (expires_at); read receipts
--  * house_owners.relation: 'owner' or 'tenant' (kirayedar) — tenants see
--    notices and can report masle; fund reminders still go to owners only
--  * profiles.avatar_path: photo shown on notices
-- Run after 0005. Safe to run more than once.
-- =====================================================================

-- ------------------------------------------------------------- profile photo
alter table public.profiles add column if not exists avatar_path text;
grant update (avatar_path) on public.profiles to authenticated;

-- ------------------------------------------------------------- society hub details
alter table public.societies add column if not exists tagline text;
alter table public.societies add column if not exists about text;
alter table public.societies add column if not exists chairman_name text;
alter table public.societies add column if not exists chairman_phone text;
alter table public.societies add column if not exists chairman_user_id uuid references public.profiles(id) on delete set null;
alter table public.societies add column if not exists welfare_name text;
alter table public.societies add column if not exists banner_path text;
alter table public.societies add column if not exists office_phone text;
alter table public.societies add column if not exists office_hours text;
alter table public.societies add column if not exists map_url text;
alter table public.societies add column if not exists established text;
alter table public.societies add column if not exists amenities text[] not null default '{}';

-- ------------------------------------------------------------- tenants
alter table public.house_owners add column if not exists relation text not null default 'owner';
do $$ begin
  alter table public.house_owners add constraint house_owners_relation_chk check (relation in ('owner','tenant'));
exception when duplicate_object then null; end $$;
drop index if exists public.house_owners_one_verified;
create unique index house_owners_one_verified on public.house_owners(house_id) where status = 'verified' and relation = 'owner';

-- Only a verified OWNER makes a listing "society verified"
create or replace function public.listings_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.house_id is not null then
    new.society_verified := exists (
      select 1 from house_owners ho
       where ho.house_id = new.house_id and ho.user_id = new.owner_id and ho.status = 'verified' and ho.relation = 'owner');
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

-- ------------------------------------------------------------- development projects
create table if not exists public.society_projects (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  title text not null,
  category text not null default 'other'
    check (category in ('lights','safai','roads','water','sewerage','security','parks','mosque','other')),
  status text not null default 'planned' check (status in ('planned','in_progress','done')),
  description text,
  area text,                 -- "Gali 1–8", "Poori society"
  cost numeric(12,0),
  progress int not null default 0 check (progress between 0 and 100),
  image_path text,           -- public-media path; null → built-in illustration
  target_date date,
  completed_on date,
  sort int not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists society_projects_sid on public.society_projects(society_id, sort);
alter table public.society_projects enable row level security;
drop policy if exists sp_select on public.society_projects;
create policy sp_select on public.society_projects for select to anon, authenticated using (true);
drop policy if exists sp_write on public.society_projects;
create policy sp_write on public.society_projects for all to authenticated
  using (public.is_society_admin(society_id)) with check (public.is_society_admin(society_id));

-- ------------------------------------------------------------- notices v2
alter table public.notices add column if not exists kind text not null default 'info';
alter table public.notices add column if not exists event_date date;
alter table public.notices add column if not exists expires_at timestamptz;
alter table public.notices add column if not exists resolved_at timestamptz;
alter table public.notices add column if not exists resolved_by uuid references public.profiles(id) on delete set null;
update public.notices set expires_at = created_at + interval '24 hours' where expires_at is null;
create index if not exists notices_active on public.notices(society_id, expires_at) where resolved_at is null;

-- expires 24h after the event day starts (Pakistan time), never earlier than 24h after posting
create or replace function public.notices_before_write() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.event_date := coalesce(new.event_date, (now() at time zone 'Asia/Karachi')::date);
  end if;
  if tg_op = 'INSERT' or new.event_date is distinct from old.event_date then
    new.expires_at := greatest(
      coalesce(new.created_at, now()),
      (new.event_date::timestamp at time zone 'Asia/Karachi')) + interval '24 hours';
  end if;
  return new;
end $$;
drop trigger if exists notices_bw on public.notices;
create trigger notices_bw before insert or update on public.notices
  for each row execute function public.notices_before_write();

create table if not exists public.notice_reads (
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, user_id)
);
alter table public.notice_reads enable row level security;
drop policy if exists nr_own on public.notice_reads;
create policy nr_own on public.notice_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Who may post: the society's chairman (or super admin). If no chairman is
-- linked yet, any society admin may post so the society is never stuck.
create or replace function public.can_post_notice(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_super_admin()
      or exists (select 1 from societies s where s.id = sid and s.chairman_user_id = auth.uid())
      or (public.is_society_admin(sid)
          and not exists (select 1 from societies s where s.id = sid and s.chairman_user_id is not null))
$$;

drop policy if exists notices_select on public.notices;
create policy notices_select on public.notices for select to authenticated
  using (public.is_society_staff(society_id) or public.is_society_resident(society_id) or public.is_society_agent(society_id));
drop policy if exists notices_write on public.notices;
drop policy if exists notices_insert on public.notices;
create policy notices_insert on public.notices for insert to authenticated
  with check (public.can_post_notice(society_id));
drop policy if exists notices_update on public.notices;
create policy notices_update on public.notices for update to authenticated
  using (public.can_post_notice(society_id) or public.is_society_admin(society_id));
drop policy if exists notices_delete on public.notices;
create policy notices_delete on public.notices for delete to authenticated
  using (public.can_post_notice(society_id));

-- Name + photo of the person who posted a notice (residents can't read other profiles)
create or replace function public.notice_authors(sid uuid)
returns table (user_id uuid, full_name text, avatar_path text, is_chairman boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_path, s.chairman_user_id = p.id
    from profiles p join societies s on s.id = sid
   where p.id in (select created_by from notices where society_id = sid)
     and (public.is_society_staff(sid) or public.is_society_resident(sid) or public.is_society_agent(sid))
$$;
revoke execute on function public.notice_authors(uuid) from public, anon;
grant execute on function public.notice_authors(uuid) to authenticated;

-- ------------------------------------------------------------- public hub numbers
create or replace function public.society_hub_stats(sid uuid)
returns table (houses bigint, galis bigint, residents bigint, agents bigint,
               issues_resolved bigint, issues_open bigint, avg_hours numeric,
               collected_year numeric, spent_year numeric)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from houses where society_id = sid),
    (select count(distinct (block, street)) from houses where society_id = sid),
    (select count(*) from house_owners ho join houses h on h.id = ho.house_id
      where h.society_id = sid and ho.status = 'verified'),
    (select count(*) from welfare_agents where society_id = sid and active),
    (select count(*) from welfare_issues where society_id = sid and status in ('resolved','closed')),
    (select count(*) from welfare_issues where society_id = sid and status in ('open','acknowledged','in_progress','reopened')),
    (select round((avg(extract(epoch from (resolved_at - created_at)) / 3600))::numeric, 0)
       from welfare_issues where society_id = sid and resolved_at is not null),
    (select coalesce(sum(amount), 0) from payments
      where society_id = sid and status = 'verified' and paid_at >= date_trunc('year', now())),
    (select coalesce(sum(amount), 0) from fund_expenses
      where society_id = sid and status = 'approved' and spent_on >= date_trunc('year', now())::date)
$$;
grant execute on function public.society_hub_stats(uuid) to anon, authenticated;

-- Agent names per gali for the public hub (no phone numbers)
create or replace function public.society_hub_agents(sid uuid)
returns table (area text, name text, linked boolean)
language sql stable security definer set search_path = public as $$
  select case when wa.block <> '' then 'Block ' || wa.block || ', ' else '' end || coalesce('Gali ' || wa.street, 'poora block'),
         coalesce(p.full_name, wa.name), wa.user_id is not null
    from welfare_agents wa left join profiles p on p.id = wa.user_id
   where wa.society_id = sid and wa.active
   order by wa.block, length(coalesce(wa.street, '')), wa.street
$$;
grant execute on function public.society_hub_agents(uuid) to anon, authenticated;

-- ------------------------------------------------------------- link on first login (+ chairman, tenants)
create or replace function public.link_phone_records(p_user uuid, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_phone is null then return; end if;
  update house_owners set user_id = p_user where owner_phone = p_phone and user_id is null;

  update welfare_agents set user_id = p_user where phone = p_phone and user_id is null;
  update welfare_issues i set assigned_to = p_user
    from welfare_agents wa
   where wa.user_id = p_user and wa.active and i.assigned_to is null
     and i.society_id = wa.society_id and i.block = wa.block and (wa.street is null or i.street = wa.street)
     and i.status in ('open','acknowledged','in_progress','reopened');

  insert into society_members (society_id, user_id, role)
  select society_id, p_user, role from society_member_invites where phone = p_phone
  on conflict (society_id, user_id) do nothing;
  delete from society_member_invites where phone = p_phone;

  -- the chairman's number → chairman account (and always an admin)
  update societies set chairman_user_id = p_user where chairman_phone = p_phone and chairman_user_id is null;
  insert into society_members (society_id, user_id, role)
  select id, p_user, 'admin' from societies where chairman_user_id = p_user
  on conflict (society_id, user_id) do update set role = 'admin';

  update profiles set full_name = coalesce(full_name,
      (select chairman_name from societies where chairman_user_id = p_user limit 1),
      (select name from welfare_agents where user_id = p_user and name is not null limit 1),
      (select owner_name from house_owners where user_id = p_user and status = 'verified' limit 1))
   where id = p_user and full_name is null;
end $$;
revoke execute on function public.link_phone_records(uuid, text) from public, anon, authenticated;

-- Chairman name + photo for the public hub page
create or replace function public.society_hub_chairman(sid uuid)
returns table (name text, avatar_path text, linked boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(p.full_name, s.chairman_name), p.avatar_path, p.id is not null
    from societies s left join profiles p on p.id = s.chairman_user_id
   where s.id = sid and (s.chairman_name is not null or s.chairman_user_id is not null)
$$;
grant execute on function public.society_hub_chairman(uuid) to anon, authenticated;
