-- =====================================================================
-- Invite by phone number (before the person has ever logged in)
--  * Welfare agents can be created with just a name + mobile. The first
--    time that mobile logs in, the agent row is linked automatically.
--  * Society admins / collectors can be invited the same way.
-- Run after 0004.
-- =====================================================================

-- ------------------------------------------------------------- agents: name + phone
alter table public.welfare_agents alter column user_id drop not null;
alter table public.welfare_agents add column if not exists name text;
alter table public.welfare_agents add column if not exists phone text;
update public.welfare_agents wa set name = coalesce(wa.name, p.full_name), phone = coalesce(wa.phone, p.phone)
  from public.profiles p where p.id = wa.user_id;
drop index if exists public.welfare_agents_area_uniq;
create unique index welfare_agents_area_uniq
  on public.welfare_agents (society_id, coalesce(phone, user_id::text), block, coalesce(street, ''));
create index if not exists welfare_agents_phone on public.welfare_agents (phone) where user_id is null;

-- ------------------------------------------------------------- member invites
create table if not exists public.society_member_invites (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  phone text not null,
  name text,
  role text not null check (role in ('admin','collector')),
  created_at timestamptz not null default now(),
  unique (society_id, phone)
);
alter table public.society_member_invites enable row level security;
drop policy if exists invites_admin on public.society_member_invites;
create policy invites_admin on public.society_member_invites for all to authenticated
  using (public.is_society_admin(society_id)) with check (public.is_society_admin(society_id));

-- ------------------------------------------------------------- link on first login
create or replace function public.link_phone_records(p_user uuid, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_phone is null then return; end if;
  update house_owners set user_id = p_user where owner_phone = p_phone and user_id is null;

  update welfare_agents set user_id = p_user where phone = p_phone and user_id is null;
  -- open masle in their area that had nobody assigned now belong to them
  update welfare_issues i set assigned_to = p_user
    from welfare_agents wa
   where wa.user_id = p_user and wa.active and i.assigned_to is null
     and i.society_id = wa.society_id and i.block = wa.block and (wa.street is null or i.street = wa.street)
     and i.status in ('open','acknowledged','in_progress','reopened');

  insert into society_members (society_id, user_id, role)
  select society_id, p_user, role from society_member_invites where phone = p_phone
  on conflict (society_id, user_id) do nothing;
  delete from society_member_invites where phone = p_phone;

  -- give the profile a name if we already know it (skips the name step)
  update profiles set full_name = coalesce(full_name,
      (select name from welfare_agents where user_id = p_user and name is not null limit 1),
      (select owner_name from house_owners where user_id = p_user and status = 'verified' limit 1))
   where id = p_user and full_name is null;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv_name text;
begin
  select name into inv_name from society_member_invites where phone = new.phone and name is not null limit 1;
  insert into public.profiles (id, phone, full_name) values (new.id, new.phone, inv_name)
  on conflict (id) do nothing;
  perform public.link_phone_records(new.id, new.phone);
  return new;
end $$;

revoke execute on function public.link_phone_records(uuid, text) from public, anon, authenticated;

-- ------------------------------------------------------------- functions that read agents
-- Linked (logged-in) agent first, then gali-specific before block-wide
create or replace function public.agent_user_for_house(hid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select wa.user_id from welfare_agents wa
    join houses h on h.society_id = wa.society_id and h.block = wa.block
   where h.id = hid and wa.active and wa.user_id is not null and (wa.street is null or wa.street = h.street)
   order by (wa.street is null), wa.created_at
   limit 1
$$;

drop function if exists public.agents_for_house(uuid);
create function public.agents_for_house(p_house uuid)
returns table (agent_id uuid, user_id uuid, name text, phone text, area text, linked boolean)
language sql stable security definer set search_path = public as $$
  select wa.id, wa.user_id, coalesce(p.full_name, wa.name), coalesce(p.phone, wa.phone),
         case when wa.block <> '' then 'Block ' || wa.block || ', ' else '' end ||
         coalesce('Gali ' || wa.street, 'poora block'),
         wa.user_id is not null
    from welfare_agents wa join houses h on h.society_id = wa.society_id and h.block = wa.block
    left join profiles p on p.id = wa.user_id
   where h.id = p_house and wa.active and (wa.street is null or wa.street = h.street)
     and (public.owns_house(p_house) or public.is_society_staff(h.society_id) or public.is_agent_for_house(p_house))
   order by (wa.street is null), wa.created_at
$$;

-- One row per agent assignment; issues are counted by AREA so a pending
-- agent's gali still shows its real backlog.
drop function if exists public.welfare_agent_stats(uuid);
create function public.welfare_agent_stats(sid uuid)
returns table (agent_id uuid, user_id uuid, name text, phone text, area text, linked boolean, total bigint, open bigint,
               overdue bigint, resolved bigint, avg_hours numeric, avg_rating numeric, visits_30d bigint)
language sql stable security definer set search_path = public as $$
  select wa.id, wa.user_id, coalesce(p.full_name, wa.name),
         case when public.is_society_staff(sid) then coalesce(p.phone, wa.phone) end,
         case when wa.block <> '' then 'Block ' || wa.block || ', ' else '' end || coalesce('Gali ' || wa.street, 'poora block'),
         wa.user_id is not null,
         count(i.id),
         count(i.id) filter (where i.status in ('open','acknowledged','in_progress','reopened')),
         count(i.id) filter (where i.status in ('open','acknowledged','in_progress','reopened') and i.due_at < now()),
         count(i.id) filter (where i.status in ('resolved','closed')),
         round((avg(extract(epoch from (i.resolved_at - i.created_at)) / 3600) filter (where i.resolved_at is not null))::numeric, 1),
         round(avg(i.rating)::numeric, 1),
         (select count(*) from welfare_visits v where v.agent_id = wa.user_id and v.society_id = sid
            and v.created_at > now() - interval '30 days')
    from welfare_agents wa
    left join profiles p on p.id = wa.user_id
    left join welfare_issues i on i.society_id = wa.society_id and i.block = wa.block
                              and (wa.street is null or i.street = wa.street)
   where wa.society_id = sid and wa.active
     and (public.is_society_staff(sid) or public.is_society_resident(sid) or public.is_society_agent(sid))
   group by wa.id, wa.user_id, p.full_name, wa.name, p.phone, wa.phone, wa.block, wa.street
   order by length(wa.street), wa.street, wa.block
$$;

revoke execute on function public.agents_for_house(uuid) from public, anon;
revoke execute on function public.welfare_agent_stats(uuid) from public, anon;
grant execute on function public.agents_for_house(uuid) to authenticated;
grant execute on function public.welfare_agent_stats(uuid) to authenticated;
