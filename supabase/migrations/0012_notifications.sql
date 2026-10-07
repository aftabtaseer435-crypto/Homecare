-- =====================================================================
-- 0012  Notification center (bell in the header)
-- Every important event writes a row for each person who should know.
-- Rows are created by database triggers, so no screen can forget to notify.
-- Run after 0011. Safe to run more than once.
-- =====================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'info',     -- order, review, notice, welfare, society, provider, payment
  title text not null,
  body text,
  url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread on public.notifications(user_id) where read_at is null;
alter table public.notifications enable row level security;
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notif_delete on public.notifications;
create policy notif_delete on public.notifications for delete to authenticated using (user_id = auth.uid());
-- no insert policy: only the security-definer helpers below write rows

create or replace function public.notify_users(p_users uuid[], p_kind text, p_title text, p_body text, p_url text, p_skip uuid default null)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, title, body, url)
  select distinct u, p_kind, left(p_title, 160), left(p_body, 400), p_url
    from unnest(p_users) u
   where u is not null and u is distinct from p_skip
$$;
revoke execute on function public.notify_users(uuid[], text, text, text, text, uuid) from public, anon, authenticated;

create or replace function public.society_admin_array(sid uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct x), '{}') from (
    select user_id x from society_members where society_id = sid and role = 'admin'
    union select chairman_user_id from societies where id = sid and chairman_user_id is not null) t
$$;

-- ------------------------------------------------------------- orders
create or replace function public.trg_notify_orders() returns trigger
language plpgsql security definer set search_path = public as $$
declare pu uuid; pname text;
begin
  select user_id, display_name into pu, pname from providers where id = new.provider_id;
  pname := coalesce(pname, new.provider_name, 'Provider');
  if tg_op = 'INSERT' then
    perform notify_users(array[pu], 'order', '🔔 Naya order ' || new.ref_no || ' — ' || coalesce(new.customer_name, 'Customer'),
      left(new.details, 120) || coalesce(' · ' || new.when_note, ''), '/provider/dashboard');
  elsif new.status is distinct from old.status then
    if new.status = 'accepted' then
      perform notify_users(array[new.customer_id], 'order', pname || ' ne order ' || new.ref_no || ' qubool kar liya', left(new.details, 120), '/my/orders/' || new.id);
    elsif new.status = 'done' then
      perform notify_users(array[new.customer_id], 'review', '⭐ Order ' || new.ref_no || ' mukammal — review dein',
        pname || ' ka kaam kaisa raha? Stars de kar batayein.', '/my/orders/' || new.id);
      if new.customer_confirmed then
        perform notify_users(array[pu], 'order', coalesce(new.customer_name, 'Customer') || ' ne order ' || new.ref_no || ' mil jane ki tasdeeq ki',
          coalesce('Bill Rs ' || new.amount, ''), '/provider/dashboard?tab=history');
      end if;
    elsif new.status = 'cancelled' then
      if new.cancelled_by = 'customer' then
        perform notify_users(array[pu], 'order', coalesce(new.customer_name, 'Customer') || ' ne order ' || new.ref_no || ' cancel kar diya', new.cancel_reason, '/provider/dashboard?tab=history');
      else
        perform notify_users(array[new.customer_id], 'order', pname || ' ne order ' || new.ref_no || ' cancel kar diya', new.cancel_reason, '/my/orders/' || new.id);
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists notify_orders on public.service_orders;
create trigger notify_orders after insert or update of status on public.service_orders
  for each row execute function public.trg_notify_orders();

-- ------------------------------------------------------------- reviews → provider
create or replace function public.trg_notify_reviews() returns trigger
language plpgsql security definer set search_path = public as $$
declare pu uuid;
begin
  select user_id into pu from providers where id = new.provider_id;
  perform notify_users(array[pu], 'review', '★ Naya review: ' || repeat('★', new.stars), coalesce(left(new.comment, 140), ''), '/provider/dashboard?tab=history', new.user_id);
  return new;
end $$;
drop trigger if exists notify_reviews on public.reviews;
create trigger notify_reviews after insert on public.reviews for each row execute function public.trg_notify_reviews();

-- ------------------------------------------------------------- society notices → everyone in the society
create or replace function public.trg_notify_notices() returns trigger
language plpgsql security definer set search_path = public as $$
declare members uuid[];
begin
  select coalesce(array_agg(distinct u), '{}') into members from (
    select ho.user_id u from house_owners ho join houses h on h.id = ho.house_id
     where h.society_id = new.society_id and ho.status = 'verified' and ho.user_id is not null
    union select user_id from society_members where society_id = new.society_id
    union select user_id from welfare_agents where society_id = new.society_id and active and user_id is not null) t;
  perform notify_users(members, 'notice', '📢 ' || new.title, left(new.body, 160), '/dashboard', new.created_by);
  return new;
end $$;
drop trigger if exists notify_notices on public.notices;
create trigger notify_notices after insert on public.notices for each row execute function public.trg_notify_notices();

-- ------------------------------------------------------------- welfare masle
create or replace function public.trg_notify_welfare() returns trigger
language plpgsql security definer set search_path = public as $$
declare msg text;
begin
  if tg_op = 'INSERT' then
    perform notify_users(array[new.assigned_to], 'welfare', '🛠️ Naya masla ' || new.ref_no || ': ' || new.title,
      'Gali ' || new.street || ' — jaldi dekhein', '/welfare/issues/' || new.id, new.reporter_id);
  elsif new.status is distinct from old.status then
    msg := case new.status
      when 'acknowledged' then 'Agent ne masla dekh liya'
      when 'in_progress' then 'Kaam shuru ho gaya'
      when 'resolved' then 'Masla hal ho gaya — confirm karein'
      when 'closed' then 'Masla band ho gaya'
      when 'reopened' then 'Masla dobara khula'
      else null end;
    if msg is not null then
      perform notify_users(array[new.reporter_id], 'welfare', new.ref_no || ': ' || msg, new.title, '/welfare/issues/' || new.id);
      if new.status = 'reopened' then
        perform notify_users(array[new.assigned_to], 'welfare', new.ref_no || ': resident ne masla dobara khola', new.title, '/welfare/issues/' || new.id);
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists notify_welfare on public.welfare_issues;
create trigger notify_welfare after insert or update of status on public.welfare_issues
  for each row execute function public.trg_notify_welfare();

-- ------------------------------------------------------------- ghar ki requests
create or replace function public.trg_notify_house_owners() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid; label text; sname text;
begin
  select h.society_id, case when h.block <> '' then 'Block ' || h.block || ', ' else '' end || 'Gali ' || h.street || ', Ghar ' || h.house_no, s.name
    into sid, label, sname from houses h join societies s on s.id = h.society_id where h.id = new.house_id;
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform notify_users(society_admin_array(sid), 'society', '🏠 Nayi ghar request: ' || new.owner_name,
      label || ' · ' || case when new.relation = 'tenant' then 'Kirayedar' else 'Malik' end, '/s/' || sid || '/owners', new.user_id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.user_id is not null then
    if new.status = 'verified' then
      perform notify_users(array[new.user_id], 'society', '✓ Aap ka ghar approve ho gaya', sname || ' — ' || label, '/my/houses/' || new.house_id);
    elsif new.status = 'rejected' then
      perform notify_users(array[new.user_id], 'society', 'Ghar ki request reject hui', sname || ' — ' || label || '. Society office se rabta karein.', '/societies/join');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists notify_house_owners on public.house_owners;
create trigger notify_house_owners after insert or update of status on public.house_owners
  for each row execute function public.trg_notify_house_owners();

-- ------------------------------------------------------------- providers
create or replace function public.trg_notify_providers() returns trigger
language plpgsql security definer set search_path = public as $$
declare admins uuid[];
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'verified' then
      perform notify_users(array[new.user_id], 'provider', '✓ Aap ki profile verify ho gayi', 'Ab naam ke sath "Verified" nazar aata hai', '/provider/dashboard');
    elsif new.status = 'suspended' then
      perform notify_users(array[new.user_id], 'provider', 'Aap ki profile band kar di gayi', 'Admin / society office se rabta karein', '/provider/dashboard');
    end if;
  end if;
  if tg_op = 'UPDATE' and new.review_requested_at is distinct from old.review_requested_at then
    select coalesce(array_agg(user_id), '{}') into admins from provider_alert_recipients(new.id);
    perform notify_users(admins, 'provider', '✏️ Profile badli: ' || new.display_name, 'Dobara check kar ke verify karein', '/admin/providers?status=pending', new.user_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_providers on public.providers;
create trigger notify_providers after update on public.providers
  for each row execute function public.trg_notify_providers();

-- a new provider picks societies after the provider row exists → notify on the link
create or replace function public.trg_notify_provider_link() returns trigger
language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where id = new.provider_id;
  if pr.status = 'pending' and pr.created_at > now() - interval '10 minutes' then
    perform notify_users(society_admin_array(new.society_id), 'provider', '🧰 Naya provider: ' || pr.display_name,
      pr.city || ' — check kar ke verify karein', '/s/' || new.society_id || '/providers', pr.user_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_provider_link on public.provider_societies;
create trigger notify_provider_link after insert on public.provider_societies
  for each row execute function public.trg_notify_provider_link();

-- ------------------------------------------------------------- payments
create or replace function public.trg_notify_payments() returns trigger
language plpgsql security definer set search_path = public as $$
declare owners uuid[];
begin
  if new.status = 'verified' and (tg_op = 'INSERT' or old.status is distinct from 'verified') then
    select coalesce(array_agg(user_id), '{}') into owners from house_owners
     where house_id = new.house_id and status = 'verified' and relation = 'owner' and user_id is not null;
    perform notify_users(owners, 'payment', '✓ Payment mil gayi — Rs ' || round(new.amount)::text,
      coalesce('Receipt ' || new.receipt_no, 'Shukriya!'), '/my/houses/' || new.house_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_payments on public.payments;
create trigger notify_payments after insert or update of status on public.payments
  for each row execute function public.trg_notify_payments();

-- ------------------------------------------------------------- housekeeping
create or replace function public.notifications_cleanup() returns int
language sql security definer set search_path = public as $$
  with d as (delete from notifications where created_at < now() - interval '90 days' returning 1) select count(*)::int from d
$$;
revoke execute on function public.notifications_cleanup() from public, anon, authenticated;
grant execute on function public.notifications_cleanup() to service_role;
