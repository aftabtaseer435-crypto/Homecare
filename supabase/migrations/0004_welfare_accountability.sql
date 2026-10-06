-- =====================================================================
-- Welfare & accountability
--  * Welfare agents: one or more per block, optionally per gali (street)
--  * Masle (issues): residents report with one click; only the reporter,
--    the area's welfare agent and the society admin can see them.
--    Street issues (light, water, gutter…) can be "+1"-ed by neighbours
--    in the same gali without seeing who reported.
--  * Strict status flow done through one RPC so nothing can be faked:
--      open → acknowledged → in_progress → resolved → closed (resident confirms)
--                                     ↘ reopened ↗
--  * Fund ledger: every rupee spent, with receipt, visible to every
--    verified resident. Agent costs come in as "pending" and the admin
--    approves them.
-- =====================================================================

-- ------------------------------------------------------------- agents
create table public.welfare_agents (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  block text not null default '',
  street text,                              -- null = whole block
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index welfare_agents_area_uniq
  on public.welfare_agents (society_id, user_id, block, coalesce(street, ''));
create index welfare_agents_lookup on public.welfare_agents (society_id, block, street) where active;

-- ------------------------------------------------------------- issues
create sequence public.welfare_issue_seq start 1001;

create table public.welfare_issues (
  id uuid primary key default gen_random_uuid(),
  ref_no text unique not null default ('M-' || nextval('public.welfare_issue_seq')),
  society_id uuid not null references public.societies(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  block text not null default '',
  street text not null default '',
  reporter_id uuid references public.profiles(id) on delete set null,
  category text not null check (category in
    ('street_light','water','sewerage','road','cleanliness','security','legal','other')),
  scope text not null default 'street' check (scope in ('street','private')),
  title text not null,
  description text,
  photo_path text,                          -- private-docs bucket
  status text not null default 'open' check (status in
    ('open','acknowledged','in_progress','resolved','closed','reopened')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text,
  resolution_photo_path text,
  cost numeric(12,2),
  closed_at timestamptz,
  rating int check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index welfare_issues_area on public.welfare_issues (society_id, block, street, status);
create index welfare_issues_reporter on public.welfare_issues (reporter_id);

create table public.welfare_issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.welfare_issues(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('created','acknowledged','in_progress','resolved','closed','reopened','note','supported','auto_closed')),
  note text,
  photo_path text,
  created_at timestamptz not null default now()
);
create index welfare_issue_updates_issue on public.welfare_issue_updates (issue_id, created_at);

create table public.welfare_issue_supporters (
  issue_id uuid not null references public.welfare_issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid references public.houses(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);

-- ------------------------------------------------------------- visits (agent checks each house)
create table public.welfare_visits (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  agent_id uuid references public.profiles(id) on delete set null default auth.uid(),
  outcome text not null check (outcome in ('ok','issue_found','not_home')),
  note text,
  created_at timestamptz not null default now()
);
create index welfare_visits_house on public.welfare_visits (house_id, created_at desc);

-- ------------------------------------------------------------- fund ledger
create table public.fund_expenses (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  spent_on date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (category in
    ('street_light','water','sewerage','road','cleaning','security','salary','repair','park','legal','other')),
  description text not null,
  vendor text,
  block text,
  street text,
  receipt_path text,                        -- private-docs bucket
  issue_id uuid references public.welfare_issues(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_by uuid references public.profiles(id) on delete set null default auth.uid(),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now()
);
create index fund_expenses_society on public.fund_expenses (society_id, status, spent_on desc);

-- =====================================================================
-- helpers
-- =====================================================================
create or replace function public.is_society_agent(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from welfare_agents where society_id = sid and user_id = auth.uid() and active)
$$;

create or replace function public.is_agent_for_house(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from welfare_agents wa join houses h on h.society_id = wa.society_id and h.block = wa.block
     where h.id = hid and wa.user_id = auth.uid() and wa.active
       and (wa.street is null or wa.street = h.street))
$$;

create or replace function public.is_agent_for_area(sid uuid, p_block text, p_street text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from welfare_agents wa
     where wa.society_id = sid and wa.user_id = auth.uid() and wa.active
       and wa.block = coalesce(p_block, '') and (wa.street is null or wa.street = p_street))
$$;

-- Street-specific agent wins over a whole-block agent.
create or replace function public.agent_user_for_house(hid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select wa.user_id from welfare_agents wa
    join houses h on h.society_id = wa.society_id and h.block = wa.block
   where h.id = hid and wa.active and (wa.street is null or wa.street = h.street)
   order by (wa.street is null), wa.created_at
   limit 1
$$;

create or replace function public.can_see_issue(iid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from welfare_issues i
     where i.id = iid and (
       i.reporter_id = auth.uid()
       or i.assigned_to = auth.uid()
       or public.is_agent_for_house(i.house_id)
       or public.is_society_admin(i.society_id)
       or (i.scope = 'street' and exists (select 1 from welfare_issue_supporters s where s.issue_id = i.id and s.user_id = auth.uid()))))
$$;

create or replace function public.welfare_sla_hours(cat text) returns int
language sql immutable as $$
  select case cat
    when 'water' then 24 when 'security' then 24
    when 'street_light' then 48 when 'sewerage' then 48 when 'cleanliness' then 48
    when 'road' then 168 when 'legal' then 72 else 72 end
$$;

-- =====================================================================
-- triggers
-- =====================================================================
create or replace function public.welfare_issue_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare h houses;
begin
  select * into h from houses where id = new.house_id;
  if not found then raise exception 'house not found'; end if;
  -- Who may report: verified owner of this house, or the area agent, or admin
  if auth.uid() is not null and not (public.owns_house(new.house_id)
       or public.is_agent_for_house(new.house_id) or public.is_society_admin(h.society_id)) then
    raise exception 'not allowed';
  end if;
  new.society_id := h.society_id;
  new.block := h.block;
  new.street := h.street;
  new.reporter_id := coalesce(auth.uid(), new.reporter_id);
  new.scope := case when new.category in ('legal','other') then 'private' else 'street' end;
  new.status := 'open';
  new.assigned_to := public.agent_user_for_house(new.house_id);
  new.due_at := now() + make_interval(hours => public.welfare_sla_hours(new.category));
  new.acknowledged_at := null; new.resolved_at := null; new.resolved_by := null;
  new.resolution_note := null; new.resolution_photo_path := null; new.cost := null;
  new.closed_at := null; new.rating := null; new.feedback := null;
  return new;
end $$;

create trigger welfare_issue_before_insert
  before insert on public.welfare_issues
  for each row execute function public.welfare_issue_before_insert();

create or replace function public.welfare_issue_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into welfare_issue_updates (issue_id, actor_id, kind, note, photo_path)
  values (new.id, new.reporter_id, 'created', new.description, new.photo_path);
  return null;
end $$;

create trigger welfare_issue_after_insert
  after insert on public.welfare_issues
  for each row execute function public.welfare_issue_after_insert();

-- Expenses: agents can only submit 'pending' for their own area; only admins approve.
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
    if not public.is_agent_for_area(new.society_id, coalesce(new.block, ''), new.street) then
      raise exception 'not allowed';
    end if;
    new.status := 'pending'; new.submitted_by := auth.uid();
    new.approved_by := null; new.approved_at := null;
    return new;
  end if;
  raise exception 'not allowed';
end $$;

create trigger fund_expense_before_write
  before insert or update on public.fund_expenses
  for each row execute function public.fund_expense_before_write();

-- =====================================================================
-- RPC: the only way to change an issue's status
-- =====================================================================
create or replace function public.welfare_transition(
  p_issue uuid, p_action text, p_note text default null, p_photo text default null,
  p_cost numeric default null, p_rating int default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  i welfare_issues;
  is_agent boolean; is_admin boolean; is_reporter boolean;
  exp_cat text;
begin
  select * into i from welfare_issues where id = p_issue for update;
  if not found then raise exception 'issue not found'; end if;
  is_agent := i.assigned_to = auth.uid() or public.is_agent_for_house(i.house_id);
  is_admin := public.is_society_admin(i.society_id);
  is_reporter := i.reporter_id = auth.uid();

  if p_action = 'ack' then
    if not (is_agent or is_admin) then raise exception 'not allowed'; end if;
    if i.status not in ('open','reopened') then raise exception 'invalid status'; end if;
    update welfare_issues set status = 'acknowledged', acknowledged_at = coalesce(acknowledged_at, now()),
      assigned_to = coalesce(assigned_to, auth.uid()), updated_at = now() where id = i.id;

  elsif p_action = 'progress' then
    if not (is_agent or is_admin) then raise exception 'not allowed'; end if;
    if i.status not in ('open','acknowledged','reopened') then raise exception 'invalid status'; end if;
    update welfare_issues set status = 'in_progress', acknowledged_at = coalesce(acknowledged_at, now()),
      assigned_to = coalesce(assigned_to, auth.uid()), updated_at = now() where id = i.id;

  elsif p_action = 'resolve' then
    if not (is_agent or is_admin) then raise exception 'not allowed'; end if;
    if i.status in ('resolved','closed') then raise exception 'invalid status'; end if;
    if coalesce(trim(p_note), '') = '' then raise exception 'note required'; end if;
    update welfare_issues set status = 'resolved', resolved_at = now(), resolved_by = auth.uid(),
      acknowledged_at = coalesce(acknowledged_at, now()), resolution_note = p_note,
      resolution_photo_path = p_photo, cost = nullif(p_cost, 0), updated_at = now() where id = i.id;
    -- the cost becomes a ledger entry (pending until the admin approves)
    if coalesce(p_cost, 0) > 0 then
      exp_cat := case i.category when 'cleanliness' then 'cleaning' when 'other' then 'repair' else i.category end;
      insert into fund_expenses (society_id, amount, category, description, block, street, receipt_path, issue_id, status, submitted_by,
                                 approved_by, approved_at)
      values (i.society_id, p_cost, exp_cat, i.ref_no || ': ' || i.title, i.block, i.street, p_photo, i.id,
              case when is_admin then 'approved' else 'pending' end, auth.uid(),
              case when is_admin then auth.uid() end, case when is_admin then now() end);
    end if;

  elsif p_action = 'confirm' then
    if not (is_reporter or is_admin) then raise exception 'not allowed'; end if;
    if i.status <> 'resolved' then raise exception 'invalid status'; end if;
    update welfare_issues set status = 'closed', closed_at = now(), rating = p_rating,
      feedback = nullif(trim(p_note), ''), updated_at = now() where id = i.id;

  elsif p_action = 'reopen' then
    if not (is_reporter or is_admin) then raise exception 'not allowed'; end if;
    if i.status not in ('resolved','closed') then raise exception 'invalid status'; end if;
    if coalesce(trim(p_note), '') = '' then raise exception 'note required'; end if;
    update welfare_issues set status = 'reopened', resolved_at = null, closed_at = null, rating = null,
      due_at = now() + make_interval(hours => public.welfare_sla_hours(i.category)), updated_at = now() where id = i.id;

  elsif p_action = 'note' then
    if not public.can_see_issue(i.id) then raise exception 'not allowed'; end if;
    if coalesce(trim(p_note), '') = '' and p_photo is null then raise exception 'note required'; end if;
    update welfare_issues set updated_at = now() where id = i.id;

  else
    raise exception 'unknown action';
  end if;

  insert into welfare_issue_updates (issue_id, actor_id, kind, note, photo_path)
  values (i.id, auth.uid(),
          case p_action when 'ack' then 'acknowledged' when 'progress' then 'in_progress' when 'resolve' then 'resolved'
                        when 'confirm' then 'closed' when 'reopen' then 'reopened' else 'note' end,
          case when p_action = 'confirm' and p_rating is not null then coalesce(p_note || ' ', '') || '(' || p_rating || '★)' else p_note end,
          p_photo);
  return (select status from welfare_issues where id = i.id);
end $$;

-- Neighbour "+1" on an open street issue in their own gali (reporter stays anonymous)
create or replace function public.welfare_support(p_issue uuid, p_house uuid)
returns int language plpgsql security definer set search_path = public as $$
declare i welfare_issues; h houses; n int;
begin
  select * into i from welfare_issues where id = p_issue;
  select * into h from houses where id = p_house;
  if i.id is null or h.id is null then raise exception 'not found'; end if;
  if not public.owns_house(p_house) then raise exception 'not allowed'; end if;
  if i.scope <> 'street' or i.status in ('resolved','closed')
     or h.society_id <> i.society_id or h.block <> i.block or h.street <> i.street then
    raise exception 'not allowed';
  end if;
  if i.reporter_id = auth.uid() then raise exception 'already reported'; end if;
  insert into welfare_issue_supporters (issue_id, user_id, house_id) values (p_issue, auth.uid(), p_house)
  on conflict do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    insert into welfare_issue_updates (issue_id, actor_id, kind) values (p_issue, auth.uid(), 'supported');
  end if;
  return (select count(*) from welfare_issue_supporters where issue_id = p_issue);
end $$;

-- Open street issues in the resident's gali (no reporter identity)
create or replace function public.welfare_street_issues(p_house uuid)
returns table (id uuid, ref_no text, category text, title text, status text, created_at timestamptz,
               supporters bigint, mine boolean, supported boolean)
language sql stable security definer set search_path = public as $$
  select i.id, i.ref_no, i.category, i.title, i.status, i.created_at,
         (select count(*) from welfare_issue_supporters s where s.issue_id = i.id),
         i.reporter_id = auth.uid(),
         exists (select 1 from welfare_issue_supporters s where s.issue_id = i.id and s.user_id = auth.uid())
    from welfare_issues i join houses h on h.id = p_house
   where public.owns_house(p_house)
     and i.society_id = h.society_id and i.block = h.block and i.street = h.street
     and i.scope = 'street' and i.status not in ('resolved','closed')
   order by i.created_at desc
$$;

-- The agent(s) a resident should contact for their house
create or replace function public.agents_for_house(p_house uuid)
returns table (user_id uuid, name text, phone text, area text)
language sql stable security definer set search_path = public as $$
  select wa.user_id, p.full_name, p.phone,
         case when wa.block <> '' then 'Block ' || wa.block || ', ' else '' end ||
         coalesce('Gali ' || wa.street, 'poora block')
    from welfare_agents wa join houses h on h.society_id = wa.society_id and h.block = wa.block
    join profiles p on p.id = wa.user_id
   where h.id = p_house and wa.active and (wa.street is null or wa.street = h.street)
     and (public.owns_house(p_house) or public.is_society_staff(h.society_id) or public.is_agent_for_house(p_house))
   order by (wa.street is null), wa.created_at
$$;

-- Public (to residents) performance of every agent — this is the accountability scoreboard
create or replace function public.welfare_agent_stats(sid uuid)
returns table (user_id uuid, name text, area text, total bigint, open bigint, overdue bigint,
               resolved bigint, avg_hours numeric, avg_rating numeric, visits_30d bigint)
language sql stable security definer set search_path = public as $$
  select wa.user_id, p.full_name,
         string_agg(distinct case when wa.block <> '' then 'Block ' || wa.block || ' ' else '' end || coalesce('Gali ' || wa.street, '(poora block)'), ', '),
         count(distinct i.id),
         count(distinct i.id) filter (where i.status in ('open','acknowledged','in_progress','reopened')),
         count(distinct i.id) filter (where i.status in ('open','acknowledged','in_progress','reopened') and i.due_at < now()),
         count(distinct i.id) filter (where i.status in ('resolved','closed')),
         round(avg(extract(epoch from (i.resolved_at - i.created_at)) / 3600) filter (where i.resolved_at is not null)::numeric, 1),
         round(avg(i.rating)::numeric, 1),
         (select count(*) from welfare_visits v where v.agent_id = wa.user_id and v.society_id = sid and v.created_at > now() - interval '30 days')
    from welfare_agents wa
    join profiles p on p.id = wa.user_id
    left join welfare_issues i on i.assigned_to = wa.user_id and i.society_id = sid
   where wa.society_id = sid and wa.active
     and (public.is_society_staff(sid) or public.is_society_resident(sid) or public.is_society_agent(sid))
   group by wa.user_id, p.full_name
   order by p.full_name
$$;

-- Money in vs money out, month by month (for the transparency page)
create or replace function public.society_fund_monthly(sid uuid)
returns table (month text, collected numeric, spent numeric)
language sql stable security definer set search_path = public as $$
  with c as (
    select to_char(paid_at, 'YYYY-MM') m, sum(amount) a from payments
     where society_id = sid and status = 'verified' group by 1),
  s as (
    select to_char(spent_on, 'YYYY-MM') m, sum(amount) a from fund_expenses
     where society_id = sid and status = 'approved' group by 1)
  select coalesce(c.m, s.m), coalesce(c.a, 0), coalesce(s.a, 0)
    from c full outer join s on s.m = c.m
   where public.is_society_staff(sid) or public.is_society_resident(sid) or public.is_society_agent(sid)
   order by 1 desc
$$;

-- Daily: resolved issues the reporter never confirmed close themselves after 7 days
create or replace function public.welfare_autoclose() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with x as (
    update welfare_issues set status = 'closed', closed_at = now(), updated_at = now()
     where status = 'resolved' and resolved_at < now() - interval '7 days'
    returning id)
  insert into welfare_issue_updates (issue_id, kind, note)
  select id, 'auto_closed', '7 din tak confirm nahi hua — khud band' from x;
  get diagnostics n = row_count;
  return n;
end $$;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.welfare_agents enable row level security;
alter table public.welfare_issues enable row level security;
alter table public.welfare_issue_updates enable row level security;
alter table public.welfare_issue_supporters enable row level security;
alter table public.welfare_visits enable row level security;
alter table public.fund_expenses enable row level security;

create policy wa_select on public.welfare_agents for select to authenticated
  using (user_id = auth.uid() or public.is_society_staff(society_id));
create policy wa_write on public.welfare_agents for all to authenticated
  using (public.is_society_admin(society_id)) with check (public.is_society_admin(society_id));

create policy wi_select on public.welfare_issues for select to authenticated
  using (public.can_see_issue(id));
create policy wi_insert on public.welfare_issues for insert to authenticated
  with check (true);  -- real checks in the before-insert trigger
-- no update/delete policies: status only changes through welfare_transition()

create policy wiu_select on public.welfare_issue_updates for select to authenticated
  using (public.can_see_issue(issue_id));

create policy wis_select on public.welfare_issue_supporters for select to authenticated
  using (user_id = auth.uid() or public.can_see_issue(issue_id));

create policy wv_select on public.welfare_visits for select to authenticated
  using (agent_id = auth.uid() or public.is_society_admin(society_id) or public.owns_house(house_id));
create policy wv_insert on public.welfare_visits for insert to authenticated
  with check (agent_id = auth.uid() and public.is_agent_for_house(house_id)
              and society_id = (select society_id from houses where id = house_id));

-- Approved spending is visible to every verified resident, agent and staff of the society
create policy fe_select on public.fund_expenses for select to authenticated
  using (public.is_society_admin(society_id)
         or submitted_by = auth.uid()
         or (status = 'approved' and (public.is_society_staff(society_id) or public.is_society_resident(society_id) or public.is_society_agent(society_id))));
create policy fe_insert on public.fund_expenses for insert to authenticated
  with check (public.is_society_admin(society_id) or public.is_society_agent(society_id));
create policy fe_update on public.fund_expenses for update to authenticated
  using (public.is_society_admin(society_id));
create policy fe_delete on public.fund_expenses for delete to authenticated
  using (public.is_society_admin(society_id) and status <> 'approved');

-- Agents need the owner name / number of houses in their area
create policy owners_agent_select on public.house_owners for select to authenticated
  using (public.is_agent_for_house(house_id));

-- Residents need the society's notices only (already allowed); agents see notices too
create policy notices_agent_select on public.notices for select to authenticated
  using (public.is_society_agent(society_id));

-- ------------------------------------------------------------- grants
revoke execute on function public.welfare_transition(uuid, text, text, text, numeric, int) from public, anon;
revoke execute on function public.welfare_support(uuid, uuid) from public, anon;
revoke execute on function public.welfare_street_issues(uuid) from public, anon;
revoke execute on function public.agents_for_house(uuid) from public, anon;
revoke execute on function public.welfare_agent_stats(uuid) from public, anon;
revoke execute on function public.society_fund_monthly(uuid) from public, anon;
revoke execute on function public.welfare_autoclose() from public, anon, authenticated;
grant execute on function public.welfare_transition(uuid, text, text, text, numeric, int) to authenticated;
grant execute on function public.welfare_support(uuid, uuid) to authenticated;
grant execute on function public.welfare_street_issues(uuid) to authenticated;
grant execute on function public.agents_for_house(uuid) to authenticated;
grant execute on function public.welfare_agent_stats(uuid) to authenticated;
grant execute on function public.society_fund_monthly(uuid) to authenticated;
grant execute on function public.is_society_agent(uuid) to authenticated;
grant execute on function public.can_see_issue(uuid) to authenticated;
